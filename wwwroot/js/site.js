(function () {
  "use strict";

  const roomRoot = document.querySelector(".asylum-room");

  const state = {
    partida: Number(roomRoot ? roomRoot.dataset.partida : 0),
    room: Number(roomRoot ? roomRoot.dataset.room : 0),
    progress: {},
    audioContext: null,
  };

  function getAntiForgeryToken() {
    const element = document.querySelector(
      'input[name="__RequestVerificationToken"]',
    );
    return element ? element.value : "";
  }

  async function saveProgress(key, value) {
    if (!state.partida) {
      return;
    }

    state.progress[key] = value;

    const body = new URLSearchParams();
    body.append("idPartida", state.partida.toString());
    body.append("clave", key);
    body.append("valor", value);

    const token = getAntiForgeryToken();
    const headers = {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    };

    if (token) {
      headers["RequestVerificationToken"] = token;
    }

    try {
      await fetch("/Game/GuardarProgreso", {
        method: "POST",
        headers: headers,
        body: body,
      });
    } catch (error) {
      console.error("No se pudo guardar el progreso.", error);
    }
  }

  async function loadProgress(key) {
    if (!state.partida) {
      return null;
    }

    try {
      const response = await fetch(
        "/Game/ObtenerProgreso?idPartida=" +
          encodeURIComponent(state.partida) +
          "&clave=" +
          encodeURIComponent(key),
      );

      if (!response.ok) {
        return null;
      }

      const value = await response.json();
      state.progress[key] = value;
      return value;
    } catch (error) {
      console.error("No se pudo cargar el progreso.", error);
      return null;
    }
  }

  function show(element) {
    if (element) {
      element.classList.remove("hidden");
    }
  }

  function hide(element) {
    if (element) {
      element.classList.add("hidden");
    }
  }

  function showScene(id) {
    const scenes = document.querySelectorAll(".asylum-scene");
    scenes.forEach(function (scene) {
      scene.classList.remove("active");
    });

    const target = document.getElementById(id);
    if (target) {
      target.classList.add("active");
    }
  }

  function showText(text, nextCallback) {
    const overlay = document.getElementById("textOverlay");
    const content = document.getElementById("textOverlayText");
    const button = document.getElementById("textOverlayButton");

    if (!overlay || !content || !button) {
      return;
    }

    content.textContent = text;
    overlay.classList.remove("hidden");
    button.onclick = function () {
      overlay.classList.add("hidden");
      if (nextCallback) {
        nextCallback();
      }
    };
  }

  function showBlackScreen(text, inputPlaceholder, callback) {
    const overlay = document.getElementById("blackPuzzle");
    const textElement = document.getElementById("blackPuzzleText");
    const input = document.getElementById("blackPuzzleInput");
    const button = document.getElementById("blackPuzzleButton");
    const error = document.getElementById("blackPuzzleError");

    if (!overlay || !textElement || !input || !button) {
      return;
    }

    textElement.textContent = text;
    input.value = "";
    input.placeholder = inputPlaceholder || "Respuesta";
    if (error) {
      error.textContent = "";
    }

    overlay.classList.remove("hidden");
    input.focus();

    button.onclick = function () {
      callback(input.value.trim(), function (message) {
        if (error) {
          error.textContent = message;
        }
      });
    };

    input.onkeydown = function (event) {
      if (event.key === "Enter") {
        button.click();
      }
    };
  }

  function closeBlackScreen() {
    const overlay = document.getElementById("blackPuzzle");
    if (overlay) {
      overlay.classList.add("hidden");
    }
  }

  function createAudioContext() {
    if (!state.audioContext) {
      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        state.audioContext = new AudioContextClass();
      }
    }

    return state.audioContext;
  }

  function playNoise(duration, volume) {
    const context = createAudioContext();
    if (!context) {
      return;
    }

    const bufferSize = context.sampleRate * duration;
    const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
    const data = buffer.getChannelData(0);

    for (let index = 0; index < bufferSize; index++) {
      data[index] = (Math.random() * 2 - 1) * volume;
    }

    const source = context.createBufferSource();
    const gain = context.createGain();
    source.buffer = buffer;
    gain.gain.setValueAtTime(volume, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      context.currentTime + duration,
    );
    source.connect(gain);
    gain.connect(context.destination);
    source.start();
  }

  function playScream() {
    const context = createAudioContext();
    if (!context) {
      return;
    }

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sawtooth";
    oscillator.frequency.setValueAtTime(650, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(
      120,
      context.currentTime + 1.1,
    );
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.16, context.currentTime + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 1.1);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 1.15);

    setTimeout(function () {
      playNoise(0.65, 0.08);
    }, 100);
  }

  function flashBlack(duration) {
    const flash = document.getElementById("flashBlack");
    if (!flash) {
      return;
    }

    flash.classList.remove("hidden");
    setTimeout(function () {
      flash.classList.add("hidden");
    }, duration);
  }

  async function navigateToRoom(number) {
    if (state.partida) {
      const body = new URLSearchParams();
      body.append("idPartida", state.partida.toString());
      body.append("idSala", number.toString());

      try {
        await fetch("/Game/Guardar", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          },
          body: body,
        });
      } catch (error) {
        console.error("No se pudo actualizar la sala guardada.", error);
      }
    }

    const url =
      "/Game/Sala" + number + "?idPartida=" + encodeURIComponent(state.partida);
    window.location.href = url;
  }

  function markScene(key) {
    return saveProgress(key, "1");
  }

  window.Asylum = {
    state: state,
    show: show,
    hide: hide,
    showScene: showScene,
    showText: showText,
    showBlackScreen: showBlackScreen,
    closeBlackScreen: closeBlackScreen,
    saveProgress: saveProgress,
    loadProgress: loadProgress,
    playNoise: playNoise,
    playScream: playScream,
    flashBlack: flashBlack,
    navigateToRoom: navigateToRoom,
    markScene: markScene,
  };
})();
