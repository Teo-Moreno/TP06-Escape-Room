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

  const audio = { ctx: null, master: null, activo: true, ambiente: false };

  function contexto() {
    if (!audio.ctx) {
      const Contexto = window.AudioContext || window.webkitAudioContext;
      if (!Contexto) {
        return null;
      }
      audio.ctx = new Contexto();
      audio.master = audio.ctx.createGain();
      audio.master.gain.value = audio.activo ? 1 : 0;
      audio.master.connect(audio.ctx.destination);
    }
    if (audio.ctx.state === "suspended") {
      audio.ctx.resume();
    }
    return audio.ctx;
  }

  function bufferRuido(ctx, segundos) {
    const largo = Math.floor(ctx.sampleRate * segundos);
    const buffer = ctx.createBuffer(1, largo, ctx.sampleRate);
    const datos = buffer.getChannelData(0);
    for (let i = 0; i < largo; i++) {
      datos[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  // Ruido filtrado con un volumen que sube rápido y cae exponencialmente.
  function ruido(ctx, t, { duracion, volumen, filtro = "lowpass", frecuencia = 1000, q = 1 }) {
    const fuente = ctx.createBufferSource();
    fuente.buffer = bufferRuido(ctx, duracion);
    const f = ctx.createBiquadFilter();
    f.type = filtro;
    f.frequency.value = frecuencia;
    f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(volumen, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duracion);
    fuente.connect(f).connect(g).connect(audio.master);
    fuente.start(t);
    fuente.stop(t + duracion);
  }

  function tono(ctx, t, { tipo = "sine", desde, hasta = desde, duracion, volumen }) {
    const osc = ctx.createOscillator();
    osc.type = tipo;
    osc.frequency.setValueAtTime(desde, t);
    osc.frequency.exponentialRampToValueAtTime(hasta, t + duracion);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(volumen, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duracion);
    osc.connect(g).connect(audio.master);
    osc.start(t);
    osc.stop(t + duracion + 0.05);
  }

  function grito(ctx, t, frecuencia) {
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(frecuencia, t);
    osc.frequency.linearRampToValueAtTime(frecuencia * 1.25, t + 0.3);
    osc.frequency.exponentialRampToValueAtTime(frecuencia * 0.45, t + 1.6);

    const vibrato = ctx.createOscillator();
    vibrato.frequency.value = 6 + Math.random() * 3;
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

    osc.connect(f).connect(g).connect(audio.master);
    osc.start(t);
    vibrato.start(t);
    osc.stop(t + 1.8);
    vibrato.stop(t + 1.8);
  }

  const SONIDOS = {
    golpe(ctx, t) {
      ruido(ctx, t, { duracion: 0.7, volumen: 0.9, frecuencia: 260 });
      tono(ctx, t, { desde: 90, hasta: 35, duracion: 0.6, volumen: 0.6 });
    },
    ruido(ctx, t) {
      // Un chirrido metálico lejano, como una puerta que se mueve sola.
      tono(ctx, t, { tipo: "sawtooth", desde: 140, hasta: 70, duracion: 1.4, volumen: 0.05 });
      ruido(ctx, t, { duracion: 1.2, volumen: 0.25, filtro: "bandpass", frecuencia: 900, q: 6 });
      ruido(ctx, t + 0.9, { duracion: 0.5, volumen: 0.6, frecuencia: 300 });
    },
    gritos(ctx, t) {
      [0, 0.35, 0.8, 1.2, 1.9, 2.4].forEach((retraso, i) => {
        grito(ctx, t + retraso, 420 + ((i * 137) % 400));
      });
      ruido(ctx, t, { duracion: 3.5, volumen: 0.08, filtro: "bandpass", frecuencia: 1800, q: 0.7 });
    },
    disparo(ctx, t) {
      ruido(ctx, t, { duracion: 0.45, volumen: 1, filtro: "lowpass", frecuencia: 3500 });
      tono(ctx, t, { desde: 160, hasta: 40, duracion: 0.35, volumen: 0.8 });
      ruido(ctx, t + 0.05, { duracion: 1.8, volumen: 0.12, frecuencia: 500 });
    },
    estatica(ctx, t) {
      ruido(ctx, t, { duracion: 1.4, volumen: 0.18, filtro: "bandpass", frecuencia: 3200, q: 0.6 });
    },
    susurro(ctx, t) {
      ruido(ctx, t, { duracion: 1.6, volumen: 0.15, filtro: "bandpass", frecuencia: 2600, q: 4 });
    },
    latido(ctx, t) {
      tono(ctx, t, { desde: 60, hasta: 40, duracion: 0.18, volumen: 0.7 });
      tono(ctx, t + 0.28, { desde: 55, hasta: 38, duracion: 0.2, volumen: 0.55 });
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

  // Zumbido grave de fondo que arranca con el primer click del jugador.
  function iniciarAmbiente() {
    const ctx = contexto();
    if (!ctx || audio.ambiente) {
      return;
    }
    audio.ambiente = true;

    const g = ctx.createGain();
    g.gain.value = 0.05;
    const f = ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = 180;
    f.connect(g).connect(audio.master);

    [55, 55.7, 82.4].forEach((frecuencia) => {
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.value = frecuencia;
      osc.connect(f);
      osc.start();
    });
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
    const destino = enNegro ? el.blackText : el.text;

    if (quien) {
      nombre.textContent = quien;
      nombre.classList.toggle("es-otro", quien !== "Jon");
      nombre.hidden = false;
    }

    destino.classList.toggle("es-narrador", !quien);
    tipear(destino, texto);
  }

  function tipear(destino, texto) {
    let i = 0;
    destino.textContent = "";
    const id = setInterval(function () {
      i++;
      destino.textContent = texto.slice(0, i);
      if (i >= texto.length) {
        terminarTipeo();
      }
    }, 22);
    estado.tipeo = { id: id, destino: destino, texto: texto };
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

  // Pantalla negra con una pregunta y un campo de texto.
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
      input.placeholder = paso.placeholder || "Respuesta";
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
    candado: puzzleCandado,
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
