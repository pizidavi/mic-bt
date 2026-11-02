package expo.modules.loopbackaudio

import androidx.core.os.bundleOf
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class LoopbackAudioModule : Module() {
  private val engine = AudioLoopbackEngine()

  override fun definition() = ModuleDefinition {
    Name("LoopbackAudio")

    Events("onLevel")

    OnCreate {
      engine.onLevel = { levelDb ->
        sendEvent("onLevel", bundleOf("levelDb" to levelDb))
      }
    }

    AsyncFunction("start") {
      engine.start()
    }

    AsyncFunction("stop") {
      engine.stop()
    }

    AsyncFunction("setGain") { value: Double ->
      engine.setGain(value)
    }

    AsyncFunction("setMuted") { value: Boolean ->
      engine.setMuted(value)
    }

    OnDestroy {
      engine.stop()
    }
  }
}
