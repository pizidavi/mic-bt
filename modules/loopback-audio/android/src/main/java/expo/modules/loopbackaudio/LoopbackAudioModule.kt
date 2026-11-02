package expo.modules.loopbackaudio

import android.content.Context
import android.media.AudioManager
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class LoopbackAudioModule : Module() {
  private var engine: AudioLoopbackEngine? = null

  override fun definition() = ModuleDefinition {
    Name("LoopbackAudio")

    Events("onStateChanged")

    OnCreate {
      val context = appContext.reactContext ?: return@OnCreate
      val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as? AudioManager ?: return@OnCreate
      engine = AudioLoopbackEngine(audioManager) { state ->
        sendEvent("onStateChanged", mapOf("state" to state))
      }
    }

    AsyncFunction("start") {
      engine?.start() ?: false
    }

    AsyncFunction("stop") {
      engine?.stop() ?: true
    }

    OnDestroy {
      engine?.stop()
      engine = null
    }
  }
}
