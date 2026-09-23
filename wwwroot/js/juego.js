// Motor de novela visual de The Asylum.
// La historia (qué imagen se ve, quién habla y qué puzzles hay) está en historia.js.
(function () {
  "use strict";

  const root = document.getElementById("game");
  if (!root) {
    return;
  }

  const $ = (id) => document.getElementById(id);

  const el = {
    screen: $("vnScreen"),
    blur: $("vnBlur"),
    img: $("vnImg"),
    black: $("vnBlack"),
    blackName: $("vnBlackName"),
    blackText: $("vnBlackText"),
    puzzle: $("vnPuzzle"),
    toast: $("vnToast"),
    fade: $("vnFade"),
    dialog: $("vnDialog"),
    name: $("vnName"),
    text: $("vnText"),
    next: $("vnNext"),
    inventory: $("vnInventory"),
    itemLlave: $("itemLlave"),
    btnSonido: $("btnSonido"),
  };

  const partida = Number(root.dataset.partida);
  const sala = Number(root.dataset.sala);
  const inventario = new Set(root.dataset.llave === "1" ? ["llave"] : []);

  const estado = {
    pasos: [],
    indice: -1,
    ocupado: false,
    tipeo: null,
    usar: null,
    teclasPuzzle: null,
    toastTimer: null,
  };

  const dormir = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const azar = (min, max) => min + Math.random() * (max - min);
  const elegir = (lista) => lista[Math.floor(Math.random() * lista.length)];

  function rutaImagen(ruta) {
    return "/img/" + ruta.split("/").map(encodeURIComponent).join("/");
  }

  // ---------------------------------------------------------------- Servidor

  async function post(url, datos) {
    try {
      const respuesta = await fetch(url, {
        method: "POST",
        body: new URLSearchParams(datos),
      });
      return respuesta.ok;
    } catch (error) {
      console.error("Error al llamar a " + url, error);
      return false;
    }
  }

  function guardarProgreso(clave, valor) {
    return post("/Game/GuardarProgreso", { idPartida: partida, clave: clave, valor: valor });
  }

  // ------------------------------------------------------------------ Sonido
  // Todos los sonidos se generan con Web Audio, así no hacen falta archivos de audio.
  // Todo pasa por una reverb larga para que suene a pasillos vacíos de hormigón.

  const audio = { ctx: null, master: null, bus: null, activo: true, ambiente: false };

  function respuestaReverb(ctx, segundos, caida) {
    const largo = Math.floor(ctx.sampleRate * segundos);
    const buffer = ctx.createBuffer(2, largo, ctx.sampleRate);
    for (let canal = 0; canal < 2; canal++) {
      const datos = buffer.getChannelData(canal);
      for (let i = 0; i < largo; i++) {
        datos[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / largo, caida);
      }
    }
    return buffer;
  }

  function contexto() {
    if (!audio.ctx) {
      const Contexto = window.AudioContext || window.webkitAudioContext;
      if (!Contexto) {
        return null;
      }
      const ctx = new Contexto();
      audio.ctx = ctx;

      // Compresor al final para que los golpes y el disparo no saturen.
      const compresor = ctx.createDynamicsCompressor();
      compresor.connect(ctx.destination);

      audio.master = ctx.createGain();
      audio.master.gain.value = audio.activo ? 1 : 0;
      audio.master.connect(compresor);

      audio.bus = ctx.createGain();
      audio.bus.connect(audio.master);

      const reverb = ctx.createConvolver();
      reverb.buffer = respuestaReverb(ctx, 4, 2.2);
      const humedo = ctx.createGain();
      humedo.gain.value = 0.45;
      audio.bus.connect(reverb).connect(humedo).connect(audio.master);
    }
    if (audio.ctx.state === "suspended") {
      audio.ctx.resume();
    }
    return audio.ctx;
  }

  function bufferRuido(ctx, segundos, marron) {
    const largo = Math.floor(ctx.sampleRate * segundos);
    const buffer = ctx.createBuffer(1, largo, ctx.sampleRate);
    const datos = buffer.getChannelData(0);
    let ultimo = 0;
    for (let i = 0; i < largo; i++) {
      const blanco = Math.random() * 2 - 1;
      if (marron) {
        ultimo = (ultimo + 0.02 * blanco) / 1.02;
        datos[i] = ultimo * 3.5;
      } else {
        datos[i] = blanco;
      }
    }
    return buffer;
  }

  // Si se pide un paneo, el sonido pasa por un StereoPanner antes de salir.
  function destino(ctx, pan) {
    if (!pan || !ctx.createStereoPanner) {
      return audio.bus;
    }
    const panner = ctx.createStereoPanner();
    panner.pan.value = pan;
    panner.connect(audio.bus);
    return panner;
  }

  // Ruido filtrado con un volumen que sube rápido y cae exponencialmente.
  function ruido(ctx, t, { duracion, volumen, filtro = "lowpass", frecuencia = 1000, q = 1, ataque = 0.01, pan = 0 }) {
    const fuente = ctx.createBufferSource();
    fuente.buffer = bufferRuido(ctx, duracion);
    const f = ctx.createBiquadFilter();
    f.type = filtro;
    f.frequency.value = frecuencia;
    f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(volumen, t + ataque);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duracion);
    fuente.connect(f).connect(g).connect(destino(ctx, pan));
    fuente.start(t);
    fuente.stop(t + duracion);
    return f;
  }

  function tono(ctx, t, { tipo = "sine", desde, hasta = desde, duracion, volumen, ataque = 0.02, pan = 0 }) {
    const osc = ctx.createOscillator();
    osc.type = tipo;
    osc.frequency.setValueAtTime(desde, t);
    osc.frequency.exponentialRampToValueAtTime(hasta, t + duracion);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(volumen, t + ataque);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duracion);
    osc.connect(g).connect(destino(ctx, pan));
    osc.start(t);
    osc.stop(t + duracion + 0.05);
  }

  function grito(ctx, t, frecuencia, pan) {
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(frecuencia, t);
    osc.frequency.linearRampToValueAtTime(frecuencia * 1.25, t + 0.3);
    osc.frequency.exponentialRampToValueAtTime(frecuencia * 0.45, t + 1.6);

    const vibrato = ctx.createOscillator();
    vibrato.frequency.value = azar(6, 9);
    const profundidad = ctx.createGain();
    profundidad.gain.value = frecuencia * 0.06;
    vibrato.connect(profundidad).connect(osc.frequency);

    const f = ctx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = 1400;
    f.Q.value = 0.8;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.12, t + 0.12);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.7);

    osc.connect(f).connect(g).connect(destino(ctx, pan));
    osc.start(t);
    vibrato.start(t);
    osc.stop(t + 1.8);
    vibrato.stop(t + 1.8);
  }

  // Ruido con "sílabas": un susurro que parece que dice algo.
  function susurro(ctx, t, duracion, volumen, pan) {
    const fuente = ctx.createBufferSource();
    fuente.buffer = bufferRuido(ctx, duracion);
    const f = ctx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = azar(1800, 3200);
    f.Q.value = 3;
    const g = ctx.createGain();
    g.gain.value = 0;
    const silabas = ctx.createOscillator();
    silabas.frequency.value = azar(4, 7);
    const profundidad = ctx.createGain();
    profundidad.gain.value = volumen;
    silabas.connect(profundidad).connect(g.gain);
    const envolvente = ctx.createGain();
    envolvente.gain.setValueAtTime(0.0001, t);
    envolvente.gain.exponentialRampToValueAtTime(1, t + 0.2);
    envolvente.gain.exponentialRampToValueAtTime(0.0001, t + duracion);
    fuente.connect(f).connect(g).connect(envolvente).connect(destino(ctx, pan));
    fuente.start(t);
    silabas.start(t);
    fuente.stop(t + duracion);
    silabas.stop(t + duracion);
  }

  const SONIDOS = {
    golpe(ctx, t) {
      ruido(ctx, t, { duracion: 0.7, volumen: 0.9, frecuencia: 260 });
      tono(ctx, t, { desde: 90, hasta: 35, duracion: 0.6, volumen: 0.6 });
    },
    golpeLejano(ctx, t) {
      const pan = azar(-0.8, 0.8);
      [0, 0.55, 1.4].forEach(function (retraso) {
        ruido(ctx, t + retraso, { duracion: 0.5, volumen: 0.35, frecuencia: 180, pan: pan });
      });
    },
    // Chirrido de bisagra oxidada: un tren de pulsos graves filtrado.
    crujido(ctx, t) {
      const osc = ctx.createOscillator();
      osc.type = "square";
      osc.frequency.setValueAtTime(azar(14, 20), t);
      osc.frequency.linearRampToValueAtTime(azar(30, 45), t + 1.6);
      const f = ctx.createBiquadFilter();
      f.type = "bandpass";
      f.frequency.setValueAtTime(700, t);
      f.frequency.linearRampToValueAtTime(1300, t + 1.6);
      f.Q.value = 9;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.25, t + 0.2);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);
      osc.connect(f).connect(g).connect(destino(ctx, azar(-0.7, 0.7)));
      osc.start(t);
      osc.stop(t + 1.9);
    },
    ruido(ctx, t) {
      SONIDOS.crujido(ctx, t);
      ruido(ctx, t + 1.2, { duracion: 0.6, volumen: 0.6, frecuencia: 300 });
    },
    puerta(ctx, t) {
      SONIDOS.crujido(ctx, t);
      SONIDOS.crujido(ctx, t + 0.9);
      ruido(ctx, t + 2.2, { duracion: 0.9, volumen: 0.8, frecuencia: 220 });
      tono(ctx, t + 2.2, { desde: 70, hasta: 40, duracion: 0.8, volumen: 0.5 });
    },
    gritos(ctx, t) {
      [0, 0.35, 0.8, 1.2, 1.9, 2.4, 2.9].forEach(function (retraso, i) {
        grito(ctx, t + retraso, 420 + ((i * 137) % 400), azar(-0.9, 0.9));
      });
      ruido(ctx, t, { duracion: 3.8, volumen: 0.1, filtro: "bandpass", frecuencia: 1800, q: 0.7 });
    },
    disparo(ctx, t) {
      ruido(ctx, t, { duracion: 0.45, volumen: 1, filtro: "lowpass", frecuencia: 3500 });
      tono(ctx, t, { desde: 160, hasta: 40, duracion: 0.35, volumen: 0.8 });
      ruido(ctx, t + 0.05, { duracion: 2.5, volumen: 0.15, frecuencia: 500 });
      tono(ctx, t + 0.3, { desde: 3800, duracion: 3, volumen: 0.015, ataque: 0.3 });
    },
    // Golpe de tensión para los sustos: un acorde disonante que aparece de golpe.
    susto(ctx, t) {
      [311, 330, 466, 494, 698, 740].forEach(function (frecuencia) {
        tono(ctx, t, { tipo: "sawtooth", desde: frecuencia, hasta: frecuencia * 0.97, duracion: 2.6, volumen: 0.045, ataque: 0.03, pan: azar(-0.5, 0.5) });
      });
      ruido(ctx, t, { duracion: 0.9, volumen: 0.5, filtro: "highpass", frecuencia: 2500 });
      tono(ctx, t, { desde: 55, hasta: 30, duracion: 2, volumen: 0.6 });
    },
    estatica(ctx, t) {
      ruido(ctx, t, { duracion: 1.4, volumen: 0.18, filtro: "bandpass", frecuencia: 3200, q: 0.6 });
    },
    zumbido(ctx, t) {
      tono(ctx, t, { tipo: "square", desde: 120, duracion: 2.5, volumen: 0.02, ataque: 0.3 });
      tono(ctx, t, { tipo: "sawtooth", desde: 240, duracion: 2.5, volumen: 0.01, ataque: 0.3 });
    },
    susurro(ctx, t) {
      susurro(ctx, t, 1.8, 0.35, 0);
    },
    susurros(ctx, t) {
      for (let i = 0; i < 4; i++) {
        susurro(ctx, t + i * 0.45, azar(1.2, 2.2), 0.25, azar(-1, 1));
      }
    },
    latido(ctx, t) {
      tono(ctx, t, { desde: 60, hasta: 40, duracion: 0.18, volumen: 0.7 });
      tono(ctx, t + 0.28, { desde: 55, hasta: 38, duracion: 0.2, volumen: 0.55 });
    },
    // Una caja de música desafinada, lejos.
    cajaMusica(ctx, t) {
      const notas = [659, 784, 740, 587, 622, 494, 523, 494];
      const pan = azar(-0.6, 0.6);
      notas.forEach(function (frecuencia, i) {
        const desafinada = frecuencia * Math.pow(2, azar(-25, 25) / 1200);
        tono(ctx, t + i * 0.42 + azar(0, 0.06), { tipo: "triangle", desde: desafinada, duracion: 1.1, volumen: 0.05, ataque: 0.005, pan: pan });
      });
    },
    telefono(ctx, t) {
      [0, 0.45].forEach(function (retraso) {
        tono(ctx, t + retraso, { tipo: "square", desde: 440, duracion: 0.35, volumen: 0.03, ataque: 0.01 });
        tono(ctx, t + retraso, { tipo: "square", desde: 480, duracion: 0.35, volumen: 0.03, ataque: 0.01 });
      });
    },
    fosforo(ctx, t) {
      ruido(ctx, t, { duracion: 0.12, volumen: 0.5, filtro: "highpass", frecuencia: 3000 });
      ruido(ctx, t + 0.05, { duracion: 0.35, volumen: 0.2, filtro: "bandpass", frecuencia: 900, ataque: 0.05 });
    },
    llama(ctx, t) {
      ruido(ctx, t, { duracion: 1.6, volumen: 0.4, filtro: "lowpass", frecuencia: 700, ataque: 0.3 });
    },
    tecla(ctx, t) {
      tono(ctx, t, { desde: 1250, duracion: 0.08, volumen: 0.06, ataque: 0.005 });
    },
    error(ctx, t) {
      tono(ctx, t, { tipo: "square", desde: 110, duracion: 0.3, volumen: 0.07 });
    },
    correcto(ctx, t) {
      tono(ctx, t, { desde: 520, duracion: 0.15, volumen: 0.1 });
      tono(ctx, t + 0.13, { desde: 780, duracion: 0.25, volumen: 0.1 });
    },
    click(ctx, t) {
      ruido(ctx, t, { duracion: 0.05, volumen: 0.4, filtro: "highpass", frecuencia: 2000 });
    },
    candado(ctx, t) {
      ruido(ctx, t, { duracion: 0.08, volumen: 0.6, filtro: "highpass", frecuencia: 1500 });
      ruido(ctx, t + 0.15, { duracion: 0.5, volumen: 0.5, filtro: "bandpass", frecuencia: 700, q: 3 });
    },
  };

  function sonar(nombre) {
    const ctx = contexto();
    if (!ctx || !SONIDOS[nombre]) {
      return;
    }
    try {
      SONIDOS[nombre](ctx, ctx.currentTime + 0.02);
    } catch (error) {
      console.error("No se pudo reproducir el sonido " + nombre, error);
    }
  }

  // Banda sonora de fondo: un drone grave y disonante que "respira", un retumbar
  // del edificio y un pitido agudo casi inaudible. Cuanto más avanza Jon, más fuerte.
  function iniciarAmbiente() {
    const ctx = contexto();
    if (!ctx || audio.ambiente) {
      return;
    }
    audio.ambiente = true;

    const t = ctx.currentTime;
    const intensidad = Math.min(Math.max(sala, 1), 5);

    const salida = ctx.createGain();
    salida.gain.setValueAtTime(0.0001, t);
    salida.gain.exponentialRampToValueAtTime(1, t + 5);
    salida.connect(audio.bus);

    // Drone: la, si bemol (una segunda menor, muy tensa) y mi, con el filtro abriéndose y cerrándose.
    const filtro = ctx.createBiquadFilter();
    filtro.type = "lowpass";
    filtro.frequency.value = 260;
    filtro.Q.value = 5;
    const respiracion = ctx.createOscillator();
    respiracion.frequency.value = 0.05;
    const profundidadFiltro = ctx.createGain();
    profundidadFiltro.gain.value = 170;
    respiracion.connect(profundidadFiltro).connect(filtro.frequency);
    respiracion.start();

    const drone = ctx.createGain();
    drone.gain.value = 0.022 + intensidad * 0.006;
    filtro.connect(drone).connect(salida);

    [55, 58.27, 82.41, 116.54].forEach(function (frecuencia) {
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.value = frecuencia;
      osc.detune.value = azar(-8, 8);
      osc.connect(filtro);
      osc.start();
    });

    // Retumbar grave, como si el edificio entero estuviera vivo.
    const retumbar = ctx.createBufferSource();
    retumbar.buffer = bufferRuido(ctx, 6, true);
    retumbar.loop = true;
    const filtroRetumbar = ctx.createBiquadFilter();
    filtroRetumbar.type = "lowpass";
    filtroRetumbar.frequency.value = 110;
    const volumenRetumbar = ctx.createGain();
    volumenRetumbar.gain.value = 0.25;
    retumbar.connect(filtroRetumbar).connect(volumenRetumbar).connect(salida);
    retumbar.start();

    // Pitido agudo con batido, que crece y se apaga muy lento.
    const agudo = ctx.createGain();
    agudo.gain.value = 0.002 * intensidad;
    const vaiven = ctx.createOscillator();
    vaiven.frequency.value = 0.07;
    const profundidadAgudo = ctx.createGain();
    profundidadAgudo.gain.value = 0.002 * intensidad;
    vaiven.connect(profundidadAgudo).connect(agudo.gain);
    vaiven.start();
    agudo.connect(salida);
    [1661, 1664.5].forEach(function (frecuencia) {
      const osc = ctx.createOscillator();
      osc.frequency.value = frecuencia;
      osc.connect(agudo);
      osc.start();
    });

    programarEventos();
  }

  // Cada tanto suena algo en el edificio: pasos, susurros, una caja de música...
  function programarEventos() {
    const espera = azar(9000, 22000) - sala * 900;
    setTimeout(function () {
      if (audio.activo && !document.hidden) {
        sonar(elegir(["crujido", "golpeLejano", "susurros", "cajaMusica", "latido", "crujido", "golpeLejano"]));
      }
      programarEventos();
    }, espera);
  }

  function alternarSonido() {
    audio.activo = !audio.activo;
    el.btnSonido.textContent = audio.activo ? "SONIDO: SÍ" : "SONIDO: NO";
    if (audio.master) {
      audio.master.gain.value = audio.activo ? 1 : 0;
    }
    try {
      localStorage.setItem("asylum-sonido", audio.activo ? "1" : "0");
    } catch (error) {
      // Sin localStorage el sonido vuelve a arrancar activado; no es grave.
    }
  }

  // ------------------------------------------------------------- Escenario

  function reiniciarAnimacion(elemento, clase) {
    elemento.classList.remove(clase);
    void elemento.offsetWidth;
    elemento.classList.add(clase);
  }

  function mostrarImagen(ruta) {
    const src = rutaImagen(ruta);
    el.black.hidden = true;
    el.dialog.classList.remove("vn-dialog--negro");

    if (el.img.dataset.ruta !== ruta) {
      el.img.dataset.ruta = ruta;
      el.img.src = src;
      el.blur.style.backgroundImage = 'url("' + src + '")';
      reiniciarAnimacion(el.img, "vn-aparecer");
    }

    el.img.hidden = false;
    el.blur.hidden = false;
  }

  function mostrarNegro() {
    el.img.hidden = true;
    el.blur.hidden = true;
    delete el.img.dataset.ruta;
    el.black.hidden = false;
    el.dialog.classList.add("vn-dialog--negro");
    reiniciarAnimacion(el.black, "vn-aparecer");
  }

  function temblar() {
    reiniciarAnimacion(el.screen, "vn-temblor");
  }

  function limpiarTexto() {
    terminarTipeo();
    el.name.hidden = true;
    el.blackName.hidden = true;
    el.text.textContent = "";
    el.blackText.textContent = "";
    el.next.hidden = true;
  }

  // Muestra quién habla y lo que dice. Sobre una imagen va en la caja de abajo;
  // en pantalla negra va centrado.
  function escribir(quien, texto) {
    limpiarTexto();

    const enNegro = !el.black.hidden;
    const nombre = enNegro ? el.blackName : el.name;
    const destinoTexto = enNegro ? el.blackText : el.text;

    if (quien) {
      nombre.textContent = quien;
      nombre.classList.toggle("es-otro", quien !== "Jon");
      nombre.hidden = false;
    }

    destinoTexto.classList.toggle("es-narrador", !quien);
    tipear(destinoTexto, texto);
  }

  function tipear(destinoTexto, texto) {
    let i = 0;
    destinoTexto.textContent = "";
    const id = setInterval(function () {
      i++;
      destinoTexto.textContent = texto.slice(0, i);
      if (i >= texto.length) {
        terminarTipeo();
      }
    }, 22);
    estado.tipeo = { id: id, destino: destinoTexto, texto: texto };
  }

  function terminarTipeo() {
    if (!estado.tipeo) {
      return;
    }
    clearInterval(estado.tipeo.id);
    estado.tipeo.destino.textContent = estado.tipeo.texto;
    estado.tipeo = null;
    el.next.hidden = estado.ocupado;
  }

  function mostrarAviso(texto) {
    el.toast.textContent = texto;
    el.toast.hidden = false;
    reiniciarAnimacion(el.toast, "vn-aparecer");
    clearTimeout(estado.toastTimer);
    estado.toastTimer = setTimeout(function () {
      el.toast.hidden = true;
    }, 2800);
  }

  // -------------------------------------------------------------- Inventario

  function dibujarInventario() {
    el.itemLlave.hidden = !inventario.has("llave");
  }

  async function darObjeto(objeto) {
    inventario.add(objeto.id);
    dibujarInventario();
    reiniciarAnimacion(el.itemLlave, "vn-item--nuevo");
    mostrarAviso("Obtuviste: " + objeto.nombre);
    await guardarProgreso(objeto.id, "1");
  }

  function esperarObjeto(id) {
    // Por si el progreso no se pudo leer del servidor: el jugador no puede quedar trabado.
    if (!inventario.has(id)) {
      inventario.add(id);
      dibujarInventario();
    }

    return new Promise(function (resolve) {
      estado.usar = { id: id, resolve: resolve };
      el.inventory.classList.add("vn-inventory--usar");
    });
  }

  function usarObjeto(id) {
    if (!estado.usar || estado.usar.id !== id) {
      mostrarAviso("Ahora no tiene sentido usar esto.");
      return;
    }
    const resolve = estado.usar.resolve;
    estado.usar = null;
    el.inventory.classList.remove("vn-inventory--usar");
    resolve();
  }

  // ----------------------------------------------------------------- Puzzles

  function abrirPuzzle(html) {
    el.puzzle.innerHTML = '<div class="pz">' + html + "</div>";
    el.puzzle.hidden = false;
    el.next.hidden = true;
    reiniciarAnimacion(el.puzzle, "vn-aparecer");
    return el.puzzle.firstElementChild;
  }

  function cerrarPuzzle() {
    el.puzzle.hidden = true;
    el.puzzle.innerHTML = "";
    estado.teclasPuzzle = null;
  }

  function fallo(panel, error, mensaje) {
    sonar("error");
    error.textContent = mensaje;
    reiniciarAnimacion(panel, "vn-temblor");
  }

  // Pantalla negra con un texto y un campo para escribir.
  function puzzleTexto(paso) {
    return new Promise(function (resolve) {
      const panel = abrirPuzzle(
        '<p class="pz-prompt"></p>' +
          '<form class="pz-form">' +
          '<input class="pz-input" type="text" autocomplete="off" spellcheck="false" />' +
          '<button class="btn btn--primary" type="submit">CONFIRMAR</button>' +
          "</form>" +
          '<p class="pz-error" aria-live="polite"></p>' +
          '<p class="pz-hint" hidden></p>',
      );
      const input = panel.querySelector(".pz-input");
      const error = panel.querySelector(".pz-error");
      const pista = panel.querySelector(".pz-hint");
      let intentos = 0;

      panel.querySelector(".pz-prompt").textContent = paso.pregunta;
      input.placeholder = paso.placeholder || "";
      if (paso.teclado) {
        input.inputMode = paso.teclado;
      }

      panel.querySelector(".pz-form").addEventListener("submit", function (evento) {
        evento.preventDefault();
        const valor = input.value.trim();
        if (!valor) {
          return;
        }

        if (paso.validar(valor)) {
          sonar("correcto");
          if (paso.guardar) {
            guardarProgreso(paso.guardar, valor);
          }
          cerrarPuzzle();
          resolve();
          return;
        }

        intentos++;
        fallo(panel, error, paso.error);
        if (paso.pista && intentos >= 3) {
          pista.textContent = "Pista: " + paso.pista;
          pista.hidden = false;
        }
        input.select();
      });

      setTimeout(function () {
        input.focus();
      }, 60);
    });
  }

  // Teclado numérico de una puerta.
  function puzzleTeclado(paso) {
    return new Promise(function (resolve) {
      let teclas = "";
      ["1", "2", "3", "4", "5", "6", "7", "8", "9", "BORRAR", "0", "ENTER"].forEach(function (tecla) {
        const clase = tecla.length > 1 ? "kp-key kp-key--accion" : "kp-key";
        teclas += '<button type="button" class="' + clase + '" data-tecla="' + tecla + '">' + tecla + "</button>";
      });

      const panel = abrirPuzzle(
        '<p class="pz-prompt"></p>' +
          '<div class="kp">' +
          '<div class="kp-display" aria-live="polite">_ _ _</div>' +
          '<div class="kp-grid">' +
          teclas +
          "</div></div>" +
          '<p class="pz-error" aria-live="polite"></p>' +
          '<p class="pz-hint" hidden></p>',
      );
      const pantalla = panel.querySelector(".kp-display");
      const error = panel.querySelector(".pz-error");
      const pista = panel.querySelector(".pz-hint");
      let valor = "";
      let intentos = 0;
      let bloqueado = false;

      panel.querySelector(".pz-prompt").textContent = paso.pregunta;

      function dibujar() {
        pantalla.classList.remove("kp-display--ok", "kp-display--mal");
        pantalla.textContent = valor || "_ _ _";
      }

      function presionar(tecla) {
        if (bloqueado) {
          return;
        }
        sonar("tecla");
        if (tecla === "BORRAR") {
          valor = "";
        } else if (tecla === "ENTER") {
          probar();
          return;
        } else if (valor.length < 6) {
          valor += tecla;
        }
        error.textContent = "";
        dibujar();
      }

      function probar() {
        if (valor === paso.codigo) {
          bloqueado = true;
          pantalla.textContent = "ABIERTO";
          pantalla.classList.add("kp-display--ok");
          sonar("correcto");
          setTimeout(function () {
            cerrarPuzzle();
            resolve();
          }, 900);
          return;
        }

        intentos++;
        valor = "";
        pantalla.textContent = "ERROR";
        pantalla.classList.add("kp-display--mal");
        fallo(panel, error, paso.error);
        if (paso.pista && intentos >= 3) {
          pista.textContent = "Pista: " + paso.pista;
          pista.hidden = false;
        }
      }

      panel.addEventListener("click", function (evento) {
        const boton = evento.target.closest("[data-tecla]");
        if (boton) {
          presionar(boton.dataset.tecla);
        }
      });

      estado.teclasPuzzle = function (evento) {
        if (/^[0-9]$/.test(evento.key)) {
          presionar(evento.key);
        } else if (evento.key === "Backspace" || evento.key === "Delete") {
          presionar("BORRAR");
        } else if (evento.key === "Enter") {
          presionar("ENTER");
        } else {
          return;
        }
        evento.preventDefault();
      };
    });
  }

  // Candado de rueda: hay que girar a la derecha (R) y a la izquierda (L) en el orden de la nota.
  function puzzleCandado(paso) {
    return new Promise(function (resolve) {
      let numeros = "";
      for (let n = 1; n <= 12; n++) {
        numeros += '<span class="dial-num" style="--a:' + n * 30 + 'deg">' + n + "</span>";
      }

      const panel = abrirPuzzle(
        '<p class="pz-prompt"></p>' +
          '<div class="dial"><div class="dial-face">' +
          numeros +
          '<div class="dial-hand"></div><div class="dial-center"></div>' +
          "</div></div>" +
          '<p class="dial-seq">Combinación: <strong>—</strong></p>' +
          '<div class="pz-row">' +
          '<button type="button" class="btn" data-dir="L">⟲ L · izquierda</button>' +
          '<button type="button" class="btn" data-dir="R">derecha · R ⟳</button>' +
          "</div>" +
          '<div class="pz-row">' +
          '<button type="button" class="btn btn--ghost" data-accion="reiniciar">Reiniciar</button>' +
          '<button type="button" class="btn btn--primary" data-accion="abrir">Tirar del candado</button>' +
          "</div>" +
          '<p class="pz-error" aria-live="polite"></p>' +
          '<p class="pz-hint">También podés usar las flechas ← y →.</p>',
      );
      const aguja = panel.querySelector(".dial-hand");
      const secuencia = panel.querySelector(".dial-seq strong");
      const error = panel.querySelector(".pz-error");
      let angulo = 0;
      let segmentos = [];

      panel.querySelector(".pz-prompt").textContent = paso.pregunta;

      function texto() {
        return segmentos
          .map(function (s) {
            return s.dir + (s.valor === 0 ? 12 : s.valor);
          })
          .join(" - ");
      }

      function dibujar() {
        aguja.style.transform = "rotate(" + angulo + "deg)";
        secuencia.textContent = segmentos.length ? texto() : "—";
      }

      function girar(dir) {
        angulo += dir === "R" ? 30 : -30;
        const valor = (((angulo / 30) % 12) + 12) % 12;
        const ultimo = segmentos[segmentos.length - 1];
        if (ultimo && ultimo.dir === dir) {
          ultimo.valor = valor;
        } else {
          segmentos.push({ dir: dir, valor: valor });
        }
        error.textContent = "";
        sonar("click");
        dibujar();
      }

      function reiniciar() {
        angulo = 0;
        segmentos = [];
        dibujar();
      }

      function abrir() {
        if (texto() === paso.combinacion) {
          sonar("candado");
          cerrarPuzzle();
          resolve();
          return;
        }
        fallo(panel, error, paso.error);
        reiniciar();
      }

      panel.addEventListener("click", function (evento) {
        const boton = evento.target.closest("button");
        if (!boton) {
          return;
        }
        if (boton.dataset.dir) {
          girar(boton.dataset.dir);
        } else if (boton.dataset.accion === "reiniciar") {
          reiniciar();
        } else if (boton.dataset.accion === "abrir") {
          abrir();
        }
      });

      estado.teclasPuzzle = function (evento) {
        if (evento.key === "ArrowRight") {
          girar("R");
        } else if (evento.key === "ArrowLeft") {
          girar("L");
        } else {
          return;
        }
        evento.preventDefault();
      };
    });
  }

  const SVG_ANTORCHA =
    '<svg viewBox="0 0 40 80" aria-hidden="true">' +
    '<path class="torch-llama" d="M20 4 C30 16 30 24 26 30 C24 34 16 34 14 30 C10 24 12 14 20 4 Z" />' +
    '<path class="torch-nucleo" d="M20 14 C25 21 25 26 22 29 C20 31 18 30 17 28 C15 24 16 19 20 14 Z" />' +
    '<rect class="torch-tela" x="12" y="30" width="16" height="10" rx="3" />' +
    '<rect class="torch-palo" x="16" y="38" width="8" height="40" rx="2" />' +
    "</svg>";

  const SVG_OJOS =
    '<svg viewBox="0 0 60 24" aria-hidden="true">' +
    '<ellipse cx="14" cy="12" rx="8" ry="4" /><ellipse cx="46" cy="12" rx="8" ry="4" />' +
    "</svg>";

  // Minijuego de las antorchas: van apareciendo antorchas por la pantalla negra y
  // duran muy poco. Hay que encender la meta antes de que se acabe el tiempo; si no, se reinicia.
  // Cada antorcha encendida suma medio segundo de tiempo. A veces aparecen ojos en la
  // oscuridad: si los tocás, perdés un segundo entero.
  function puzzleAntorchas(paso) {
    const meta = paso.meta || 10;
    const tiempo = paso.tiempo || 6000;

    return new Promise(function (resolve) {
      const panel = abrirPuzzle(
        '<p class="pz-prompt"></p>' +
          '<div class="torch-hud">' +
          '<span class="torch-count">0 / ' + meta + "</span>" +
          '<div class="bar torch-bar"><div class="bar-fill"></div></div>' +
          '<span class="torch-time">' + (tiempo / 1000).toFixed(1) + "s</span>" +
          "</div>" +
          '<div class="torch-area">' +
          '<div class="torch-luz"></div>' +
          '<button type="button" class="btn btn--primary torch-start">ENCENDER</button>' +
          "</div>" +
          '<p class="pz-error" aria-live="polite"></p>' +
          '<p class="pz-hint">Cuidado con lo que te mira desde la oscuridad.</p>',
      );
      panel.classList.add("pz--ancho");

      const area = panel.querySelector(".torch-area");
      const luz = panel.querySelector(".torch-luz");
      const inicio = panel.querySelector(".torch-start");
      const contador = panel.querySelector(".torch-count");
      const barra = panel.querySelector(".torch-bar .bar-fill");
      const reloj = panel.querySelector(".torch-time");
      const error = panel.querySelector(".pz-error");

      let encendidas = 0;
      let comienzo = 0;
      let limite = tiempo;
      let activo = false;
      let aparecer = null;
      let cuadro = null;

      panel.querySelector(".pz-prompt").textContent = paso.pregunta;

      function dibujar(restante) {
        contador.textContent = encendidas + " / " + meta;
        barra.style.width = Math.min(100, Math.max(0, (restante / tiempo) * 100)) + "%";
        reloj.textContent = Math.max(0, restante / 1000).toFixed(1) + "s";
        luz.style.opacity = String(Math.min(1, encendidas / meta));
      }

      function limpiar() {
        clearInterval(aparecer);
        clearInterval(cuadro);
        area.querySelectorAll(".torch, .torch-ojos").forEach(function (objeto) {
          objeto.remove();
        });
      }

      function colocar(objeto, ancho, alto) {
        const caja = area.getBoundingClientRect();
        objeto.style.left = azar(8, Math.max(9, caja.width - ancho - 8)) + "px";
        objeto.style.top = azar(8, Math.max(9, caja.height - alto - 8)) + "px";
      }

      function crearAntorcha() {
        const antorcha = document.createElement("button");
        antorcha.type = "button";
        antorcha.className = "torch";
        antorcha.setAttribute("aria-label", "Antorcha");
        antorcha.innerHTML = SVG_ANTORCHA;
        colocar(antorcha, 40, 72);
        area.appendChild(antorcha);

        antorcha.addEventListener("pointerdown", function (evento) {
          evento.preventDefault();
          if (!activo || antorcha.classList.contains("torch--encendida")) {
            return;
          }
          encendidas++;
          limite += 500;
          sonar("fosforo");
          antorcha.classList.add("torch--encendida");
          setTimeout(function () {
            antorcha.remove();
          }, 350);
          if (encendidas >= meta) {
            ganar();
          }
        });

        // Cada vez duran menos: cuanto más cerca de la meta, más difícil.
        const vida = Math.max(480, 900 - encendidas * 45) + 200;
        setTimeout(function () {
          if (!antorcha.classList.contains("torch--encendida")) {
            antorcha.classList.add("torch--apagandose");
            setTimeout(function () {
              antorcha.remove();
            }, 150);
          }
        }, vida);
      }

      function crearOjos() {
        const ojos = document.createElement("button");
        ojos.type = "button";
        ojos.className = "torch-ojos";
        ojos.setAttribute("aria-label", "Ojos en la oscuridad");
        ojos.innerHTML = SVG_OJOS;
        colocar(ojos, 60, 24);
        area.appendChild(ojos);

        ojos.addEventListener("pointerdown", function (evento) {
          evento.preventDefault();
          if (!activo) {
            return;
          }
          limite -= 1000;
          sonar("susto");
          reiniciarAnimacion(panel, "vn-temblor");
          ojos.remove();
        });

        setTimeout(function () {
          ojos.remove();
        }, 1100);
      }

      function generar() {
        if (area.querySelectorAll(".torch:not(.torch--encendida)").length >= 3) {
          return;
        }
        if (Math.random() < 0.22) {
          crearOjos();
        } else {
          crearAntorcha();
        }
      }

      function empezar() {
        limpiar();
        contexto();
        encendidas = 0;
        limite = tiempo;
        comienzo = performance.now();
        activo = true;
        inicio.hidden = true;
        error.textContent = "";
        dibujar(tiempo);
        crearAntorcha();
        aparecer = setInterval(generar, 360);
        cuadro = setInterval(function () {
          const restante = limite - (performance.now() - comienzo);
          dibujar(restante);
          if (restante <= 0 && activo) {
            perder();
          }
        }, 50);
      }

      function perder() {
        activo = false;
        limpiar();
        sonar("error");
        fallo(panel, error, paso.error || "Las llamas se apagan. Otra vez.");
        dibujar(0);
        // Se reinicia solo después de un momento.
        setTimeout(empezar, 1800);
      }

      function ganar() {
        activo = false;
        limpiar();
        dibujar(limite - (performance.now() - comienzo));
        luz.style.opacity = "1";
        sonar("llama");
        setTimeout(function () {
          cerrarPuzzle();
          resolve();
        }, 1100);
      }

      inicio.addEventListener("click", empezar);
    });
  }

  // Minijuego de clicks: la llave está oxidada y hay que forzarla antes de que vuelva a trabarse.
  function puzzleLlave(paso) {
    return new Promise(function (resolve) {
      const panel = abrirPuzzle(
        '<p class="pz-prompt"></p>' +
          '<button type="button" class="lock" aria-label="Girar la llave">' +
          '<svg viewBox="0 0 120 140" aria-hidden="true">' +
          '<path class="lock-arco" d="M32 64 V42 a28 28 0 0 1 56 0 V64" />' +
          '<rect class="lock-cuerpo" x="14" y="62" width="92" height="70" rx="8" />' +
          '<g class="lock-llave"><circle cx="60" cy="97" r="11" /><rect x="56" y="104" width="8" height="22" rx="2" /></g>' +
          "</svg>" +
          "</button>" +
          '<div class="bar"><div class="bar-fill"></div></div>' +
          '<p class="pz-hint">Hacé click sobre el candado lo más rápido que puedas.</p>',
      );
      const boton = panel.querySelector(".lock");
      const arco = panel.querySelector(".lock-arco");
      const llave = panel.querySelector(".lock-llave");
      const barra = panel.querySelector(".bar-fill");
      let progreso = 0;
      let terminado = false;

      panel.querySelector(".pz-prompt").textContent = paso.pregunta;

      function dibujar() {
        barra.style.width = progreso + "%";
        llave.setAttribute("transform", "rotate(" + progreso * 0.9 + " 60 97)");
      }

      // Si el jugador deja de clickear, la llave vuelve a su lugar.
      const intervalo = setInterval(function () {
        progreso = Math.max(0, progreso - 0.7);
        dibujar();
      }, 50);

      boton.addEventListener("click", function () {
        if (terminado) {
          return;
        }
        progreso = Math.min(100, progreso + 7);
        sonar("click");
        reiniciarAnimacion(boton, "lock--golpe");
        dibujar();

        if (progreso >= 100) {
          terminado = true;
          clearInterval(intervalo);
          arco.setAttribute("transform", "translate(0 -14)");
          sonar("candado");
          setTimeout(function () {
            cerrarPuzzle();
            resolve();
          }, 900);
        }
      });
    });
  }

  const PUZZLES = {
    texto: puzzleTexto,
    teclado: puzzleTeclado,
    candado: puzzleCandado,
    antorchas: puzzleAntorchas,
    llave: puzzleLlave,
  };

  // ------------------------------------------------------------ Navegación

  async function irASala(numero) {
    el.fade.classList.add("on");
    const ok = await post("/Game/AvanzarSala", { idPartida: partida, sala: numero });

    if (!ok) {
      el.fade.classList.remove("on");
      mostrarNegro();
      escribir(null, "No se pudo guardar el progreso. Hacé click para intentar de nuevo.");
      estado.indice--;
      return;
    }

    await dormir(700);
    window.location.href = "/Game/Jugar?idPartida=" + encodeURIComponent(partida);
  }

  async function terminarJuego() {
    await post("/Game/CompletarPartida", { idPartida: partida });
    el.next.hidden = true;

    const panel = abrirPuzzle(
      '<div class="fin">' +
        "<h2>FIN</h2>" +
        "<p>Marylin no desapareció. Jon, por fin, recuerda.</p>" +
        '<div class="pz-row">' +
        '<a class="btn btn--primary" href="/Game/Saved">VOLVER A PARTIDAS</a>' +
        '<a class="btn" href="/">INICIO</a>' +
        "</div></div>",
    );
    panel.classList.add("pz--fin");
  }

  // ------------------------------------------------------ Ejecutar la historia

  // Cada paso puede tener: imagen | negro, apagon (ms), sonido, temblor, objeto,
  // quien + texto, usar (id de objeto), puzzle, espera (ms), sala (n) o fin.
  // Devuelve true si hay que pasar solo al siguiente paso.
  async function ejecutar(paso) {
    if (paso.sonido) {
      sonar(paso.sonido);
    }
    if (paso.apagon) {
      el.fade.classList.add("on");
      await dormir(paso.apagon);
    }
    if (paso.imagen) {
      mostrarImagen(paso.imagen);
    }
    if (paso.negro) {
      mostrarNegro();
    }
    if (paso.apagon) {
      el.fade.classList.remove("on");
    }
    if (paso.temblor) {
      temblar();
    }
    if (paso.objeto) {
      await darObjeto(paso.objeto);
    }

    if (paso.sala) {
      await irASala(paso.sala);
      return false;
    }
    if (paso.fin) {
      limpiarTexto();
      await terminarJuego();
      return false;
    }
    if (paso.puzzle) {
      limpiarTexto();
      await PUZZLES[paso.puzzle](paso);
      return true;
    }

    if (paso.texto) {
      escribir(paso.quien, paso.texto);
    } else {
      limpiarTexto();
    }

    if (paso.usar) {
      await esperarObjeto(paso.usar);
      return true;
    }
    if (paso.texto) {
      return false;
    }
    if (paso.espera) {
      await dormir(paso.espera);
    }
    return true;
  }

  async function siguientePaso() {
    let seguir = true;

    while (seguir) {
      estado.indice++;
      const paso = estado.pasos[estado.indice];
      if (!paso) {
        return;
      }

      estado.ocupado = true;
      el.next.hidden = true;
      try {
        seguir = await ejecutar(paso);
      } catch (error) {
        console.error("Error en el paso " + estado.indice, error);
        seguir = false;
      }
      estado.ocupado = false;
    }

    if (!estado.tipeo) {
      el.next.hidden = false;
    }
  }

  function avanzar() {
    contexto();
    iniciarAmbiente();

    if (estado.tipeo) {
      terminarTipeo();
      return;
    }
    if (estado.usar) {
      reiniciarAnimacion(el.inventory, "vn-temblor");
      mostrarAviso("Usá un objeto del inventario (arriba).");
      return;
    }
    if (estado.ocupado || !el.puzzle.hidden) {
      return;
    }
    siguientePaso();
  }

  // ---------------------------------------------------------------- Eventos

  root.addEventListener("click", function (evento) {
    if (evento.target.closest(".vn-hud, .vn-puzzle")) {
      // Un click en un puzzle también cuenta como gesto para arrancar el audio.
      contexto();
      iniciarAmbiente();
      return;
    }
    avanzar();
  });

  document.addEventListener("keydown", function (evento) {
    if (!el.puzzle.hidden) {
      if (estado.teclasPuzzle) {
        estado.teclasPuzzle(evento);
      }
      return;
    }
    if (evento.key === " " || evento.key === "Enter") {
      evento.preventDefault();
      avanzar();
    }
  });

  el.itemLlave.addEventListener("click", function () {
    contexto();
    usarObjeto("llave");
  });

  el.btnSonido.addEventListener("click", alternarSonido);

  try {
    if (localStorage.getItem("asylum-sonido") === "0") {
      alternarSonido();
    }
  } catch (error) {
    // Sin localStorage: se queda con el sonido activado.
  }

  window.Juego = {
    iniciar: function (historia) {
      estado.pasos = historia[sala] || [];
      dibujarInventario();
      el.fade.classList.add("on");
      siguientePaso();
      setTimeout(function () {
        el.fade.classList.remove("on");
      }, 150);
    },
  };
})();
