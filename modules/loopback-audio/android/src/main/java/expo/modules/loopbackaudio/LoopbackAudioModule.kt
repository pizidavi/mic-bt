package expo.modules.loopbackaudio

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class LoopbackAudioModule : Module() {
  private val engine = AudioLoopbackEngine()

  override fun definition() = ModuleDefinition {
    Name("LoopbackAudio")

    AsyncFunction("start") {
      engine.start()
    }

    AsyncFunction("stop") {
      engine.stop()
    }

    OnDestroy {
      engine.stop()
    }
  }
}
