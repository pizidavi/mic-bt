package expo.modules.loopbackaudio

import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.AudioTrack
import android.media.MediaRecorder
import android.media.audiofx.AcousticEchoCanceler
import android.media.audiofx.NoiseSuppressor
import android.os.SystemClock
import java.util.concurrent.ArrayBlockingQueue
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean
import kotlin.math.abs
import kotlin.math.log10
import kotlin.math.pow

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
    private const val GAIN_MIN_DB = -6.0
    private const val GAIN_MAX_DB = 24.0
    private const val LEVEL_MIN_DB = -60.0
    private const val LEVEL_EVENT_INTERVAL_MS = 40L
    private const val PEAK_FULL_SCALE = 32767.0
  }

  private val lock = Any()
  private val running = AtomicBoolean(false)
  @Volatile private var gainDb = 0.0
  @Volatile private var muted = false
  private var lastLevelEmitMs = 0L
  var onLevel: ((Double) -> Unit)? = null
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

  fun setGain(value: Double): Double {
    gainDb = value.coerceIn(GAIN_MIN_DB, GAIN_MAX_DB)
    return gainDb
  }

  fun setMuted(value: Boolean): Boolean {
    muted = value
    return muted
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
      maybeEmitLevel(chunk)
      applyGain(chunk)
      if (track.write(chunk, 0, chunk.size) <= 0) break
    }
  }

  private fun applyGain(chunk: ShortArray) {
    if (muted) {
      chunk.fill(0)
      return
    }
    val linear = 10.0.pow(gainDb / 20.0)
    if (linear == 1.0) return
    for (i in chunk.indices) {
      val amplified = chunk[i] * linear
      chunk[i] = amplified.toInt().coerceIn(Short.MIN_VALUE.toInt(), Short.MAX_VALUE.toInt()).toShort()
    }
  }

  private fun maybeEmitLevel(chunk: ShortArray) {
    val callback = onLevel ?: return
    val now = SystemClock.elapsedRealtime()
    if (now - lastLevelEmitMs < LEVEL_EVENT_INTERVAL_MS) return
    lastLevelEmitMs = now
    var peak = 0.0
    for (sample in chunk) {
      val magnitude = abs(sample.toInt()).toDouble()
      if (magnitude > peak) peak = magnitude
    }
    val levelDb = if (peak <= 0.0) LEVEL_MIN_DB else (20.0 * log10(peak / PEAK_FULL_SCALE)).coerceIn(LEVEL_MIN_DB, 0.0)
    callback(levelDb)
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
