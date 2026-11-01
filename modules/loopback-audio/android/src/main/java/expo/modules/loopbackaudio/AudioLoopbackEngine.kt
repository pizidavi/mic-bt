package expo.modules.loopbackaudio

import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.AudioTrack
import android.media.MediaRecorder
import android.media.audiofx.AcousticEchoCanceler
import android.media.audiofx.NoiseSuppressor
import java.util.concurrent.ArrayBlockingQueue
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean

class AudioLoopbackEngine {
  companion object {
    private const val SAMPLE_RATE = 16000
    private const val ENCODING = AudioFormat.ENCODING_PCM_16BIT
    private const val CHANNEL_IN = AudioFormat.CHANNEL_IN_MONO
    private const val CHANNEL_OUT = AudioFormat.CHANNEL_OUT_MONO
    private const val CHUNK_MS = 20L
    private const val CHUNK_SAMPLES = (SAMPLE_RATE * CHUNK_MS / 1000).toInt()
    private const val DOUBLE_BUFFER_COUNT = 2
    private const val QUEUE_CAPACITY = 25
    private const val PLAYBACK_POLL_TIMEOUT_MS = 100L
    private const val THREAD_JOIN_TIMEOUT_MS = 500L
  }

  private val lock = Any()
  private val running = AtomicBoolean(false)
  private val queue = ArrayBlockingQueue<ShortArray>(QUEUE_CAPACITY)
  private var audioRecord: AudioRecord? = null
  private var audioTrack: AudioTrack? = null
  private var echoCanceler: AcousticEchoCanceler? = null
  private var noiseSuppressor: NoiseSuppressor? = null
  private var captureThread: Thread? = null
  private var playbackThread: Thread? = null

  fun start(): Boolean = synchronized(lock) {
    if (running.get()) return true

    val record = createAudioRecord() ?: return false
    val track = createAudioTrack() ?: run {
      record.release()
      return false
    }

    try {
      track.play()
      record.startRecording()
    } catch (e: Exception) {
      record.release()
      track.release()
      return false
    }

    queue.clear()
    attachEchoEffects(record)
    running.set(true)
    audioRecord = record
    audioTrack = track
    captureThread = Thread({ captureLoop(record) }, "LoopbackCapture").apply { start() }
    playbackThread = Thread({ playbackLoop(track) }, "LoopbackPlayback").apply { start() }
    return true
  }

  fun stop(): Boolean = synchronized(lock) {
    if (!running.getAndSet(false)) return true

    val record = audioRecord
    val track = audioTrack
    val capture = captureThread
    val playback = playbackThread

    try {
      record?.stop()
    } catch (_: Exception) {}
    try {
      track?.pause()
      track?.flush()
    } catch (_: Exception) {}

    joinThread(capture)
    joinThread(playback)
    queue.clear()

    try {
      record?.release()
    } catch (_: Exception) {}
    try {
      track?.release()
    } catch (_: Exception) {}
    releaseEchoEffects()

    audioRecord = null
    audioTrack = null
    captureThread = null
    playbackThread = null
    return true
  }

  private fun createAudioRecord(): AudioRecord? {
    val minBufferBytes = AudioRecord.getMinBufferSize(SAMPLE_RATE, CHANNEL_IN, ENCODING)
    if (minBufferBytes <= 0) return null
    val bufferBytes = maxOf(minBufferBytes, CHUNK_SAMPLES * DOUBLE_BUFFER_COUNT * 2)
    return try {
      AudioRecord.Builder()
        .setAudioSource(MediaRecorder.AudioSource.VOICE_COMMUNICATION)
        .setAudioFormat(
          AudioFormat.Builder()
            .setSampleRate(SAMPLE_RATE)
            .setEncoding(ENCODING)
            .setChannelMask(CHANNEL_IN)
            .build()
        )
        .setBufferSizeInBytes(bufferBytes)
        .build()
    } catch (e: Exception) {
      null
    }?.takeIf { it.state == AudioRecord.STATE_INITIALIZED }
  }

  private fun createAudioTrack(): AudioTrack? {
    val minBufferBytes = AudioTrack.getMinBufferSize(SAMPLE_RATE, CHANNEL_OUT, ENCODING)
    if (minBufferBytes <= 0) return null
    val bufferBytes = maxOf(minBufferBytes, CHUNK_SAMPLES * DOUBLE_BUFFER_COUNT * 2)
    return try {
      AudioTrack.Builder()
        .setAudioAttributes(
          AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_VOICE_COMMUNICATION)
            .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
            .build()
        )
        .setAudioFormat(
          AudioFormat.Builder()
            .setSampleRate(SAMPLE_RATE)
            .setEncoding(ENCODING)
            .setChannelMask(CHANNEL_OUT)
            .build()
        )
        .setTransferMode(AudioTrack.MODE_STREAM)
        .setPerformanceMode(AudioTrack.PERFORMANCE_MODE_LOW_LATENCY)
        .setBufferSizeInBytes(bufferBytes)
        .build()
    } catch (e: Exception) {
      null
    }?.takeIf { it.state == AudioTrack.STATE_INITIALIZED }
  }

  private fun attachEchoEffects(record: AudioRecord) {
    echoCanceler = AcousticEchoCanceler.create(record.audioSessionId)?.also { it.setEnabled(true) }
    noiseSuppressor = NoiseSuppressor.create(record.audioSessionId)?.also { it.setEnabled(true) }
  }

  private fun releaseEchoEffects() {
    echoCanceler?.release()
    echoCanceler = null
    noiseSuppressor?.release()
    noiseSuppressor = null
  }

  private fun captureLoop(record: AudioRecord) {
    val buffers = Array(DOUBLE_BUFFER_COUNT) { ShortArray(CHUNK_SAMPLES) }
    var index = 0
    while (running.get()) {
      val buffer = buffers[index % DOUBLE_BUFFER_COUNT]
      index++
      val read = record.read(buffer, 0, CHUNK_SAMPLES)
      if (read <= 0) break
      val chunk = buffer.copyOf(read)
      if (!queue.offer(chunk)) {
        queue.poll()
        queue.offer(chunk)
      }
    }
  }

  private fun playbackLoop(track: AudioTrack) {
    while (running.get() || queue.isNotEmpty()) {
      val chunk = queue.poll(PLAYBACK_POLL_TIMEOUT_MS, TimeUnit.MILLISECONDS) ?: continue
      if (track.write(chunk, 0, chunk.size) <= 0) break
    }
  }

  private fun joinThread(thread: Thread?) {
    if (thread == null) return
    try {
      thread.join(THREAD_JOIN_TIMEOUT_MS)
    } catch (_: InterruptedException) {
      Thread.currentThread().interrupt()
    }
  }
}
