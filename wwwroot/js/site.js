// Please see documentation at https://learn.microsoft.com/aspnet/core/client-side/bundling-and-minification
// for details on configuring this project to bundle and minify static web assets.

// Write your JavaScript code.

function mostrarModal(contenido) {

    const modal = document.getElementById("gameModal");
    const contenidoModal = document.getElementById("modalContent");

    if (!modal || !contenidoModal)
        return;

    contenidoModal.innerHTML = contenido;

    modal.classList.remove("hidden");
}


function cerrarModal() {

    const modal = document.getElementById("gameModal");

    if (modal)
        modal.classList.add("hidden");
}


function notificar(mensaje) {

    const notification = document.getElementById("notification");

    if (!notification)
        return;

    notification.textContent = mensaje;

    notification.classList.add("show");

    setTimeout(() => {
        notification.classList.remove("show");
    }, 2500);
}


function irASala(numero) {

    window.location.href = "/Game/Sala" + numero;
}


let sala1CodigoEncontrado = false;

function room1Pista() {

    sala1CodigoEncontrado = true;

    mostrarModal(`
        <h2>Documento encontrado</h2>

        <p>
            Entre los papeles hay una anotación relacionada
            con la entrada principal.
        </p>

        <p>
            <strong>Código: 2013</strong>
        </p>
    `);
}


function room1Puerta() {

    if (!sala1CodigoEncontrado) {

        notificar("La puerta está sellada.");

        return;
    }

    mostrarModal(`
        <h2>Entrada principal</h2>

        <p>Introduce el código para abrir la puerta.</p>

        <input
            type="text"
            id="room1Input"
            maxlength="10"
            placeholder="Código">

        <br><br>

        <button onclick="room1ComprobarCodigo()">
            Confirmar
        </button>
    `);
}


function room1ComprobarCodigo() {

    const input = document.getElementById("room1Input");

    if (!input)
        return;

    const codigo = input.value.trim();

    if (codigo === "2013") {

        cerrarModal();

        notificar("La puerta se abrió.");

        setTimeout(() => {
            irASala(2);
        }, 1000);

    } else {

        notificar("Código incorrecto.");
    }
}


let sala2PacienteEncontrado = false;


function room2Archivo(numero) {

    if (numero === 3) {

        sala2PacienteEncontrado = true;

        mostrarModal(`
            <h2>Expediente encontrado</h2>

            <p>
                El archivo contiene información de un paciente.
            </p>

            <p>
                <strong>Paciente: JON HERMENDOFF</strong>
            </p>

            <p>
                El registro permite utilizar una cuenta
                de usuario del hospital.
            </p>
        `);

        return;
    }

    notificar("Este archivo está demasiado deteriorado para leerlo.");
}


function room2Marylin() {

    mostrarModal(`
        <h2>MARYLIN CROSE</h2>

        <p>
            Desaparecida: 17/04/2013
        </p>
    `);
}


function room2Cadaver() {

    mostrarModal(`
        <h2>Paciente</h2>

        <p>
            El cuerpo está en un estado muy deteriorado.
            La escena resulta perturbadora.
        </p>
    `);
}


function room2Puerta() {

    if (!sala2PacienteEncontrado) {

        notificar("Necesitas encontrar un registro de paciente.");

        return;
    }

    mostrarModal(`
        <h2>Inicio de sesión</h2>

        <p>Introduce el usuario encontrado.</p>

        <input
            type="text"
            id="room2User"
            placeholder="Usuario">

        <br><br>

        <button onclick="room2Login()">
            Ingresar
        </button>
    `);
}


function room2Login() {

    const input = document.getElementById("room2User");

    if (!input)
        return;

    const usuario = input.value.trim().toUpperCase();

    if (usuario === "JON HERMENDOFF") {

        cerrarModal();

        notificar("Acceso concedido.");

        setTimeout(() => {
            irASala(3);
        }, 1000);

    } else {

        notificar("Usuario incorrecto.");
    }
}

let sala3PuertasProbadas = [];

const SALA3_PUERTA_CORRECTA = 6;


function room3Puerta(numero) {

    if (sala3PuertasProbadas.includes(numero)) {

        notificar("Ya comprobaste esta puerta.");

        return;
    }

    sala3PuertasProbadas.push(numero);


    if (numero === SALA3_PUERTA_CORRECTA) {

        room3Grito();

        return;
    }


    notificar("PUERTA BLOQUEADA");
}


function room3Grito() {

    mostrarModal(`
        <h2>...</h2>

        <p>
            Un grito se escucha desde algún lugar del pasillo.
        </p>

        <p>
            <strong>HELP!</strong>
        </p>

        <button onclick="room3Continuar()">
            Abrir puerta
        </button>
    `);
}


function room3Continuar() {

    cerrarModal();

    irASala(4);
}

let sala4Llave = false;
let sala4Jumpscare = false;


function room4Camilla(numero) {

    if (numero === 2 && !sala4Jumpscare) {

        sala4Jumpscare = true;

        mostrarModal(`
            <h2>...</h2>

            <p>
                Cuando te acercás a la camilla,
                el paciente se mueve repentinamente.
            </p>

            <p>
                El susto te hace retroceder.
            </p>

            <button onclick="room4ObtenerLlave()">
                Continuar
            </button>
        `);

        return;
    }


    notificar("No encontrás nada útil.");
}


function room4ObtenerLlave() {

    sala4Llave = true;

    cerrarModal();

    mostrarModal(`
        <h2>Llave encontrada</h2>

        <p>
            Hay una llave junto a la camilla.
        </p>

        <button onclick="cerrarModal()">
            Guardar llave
        </button>
    `);
}


function room4Puerta() {

    if (!sala4Llave) {

        notificar("La puerta está cerrada con llave.");

        return;
    }

    notificar("La puerta se abrió.");

    setTimeout(() => {
        irASala(5);
    }, 1000);
}

let sala5NotaLeida = false;
let sala5USB = false;


function room5Nota() {

    sala5NotaLeida = true;

    mostrarModal(`
        <h2>Nota</h2>

        <p>
            "Agarra el USB y conectalo a la computadora,
            luego sabrás que hacer."
        </p>
    `);
}


function room5USB() {

    sala5USB = true;

    notificar("Has obtenido el USB.");

    mostrarModal(`
        <h2>USB</h2>

        <p>
            Un pequeño dispositivo de almacenamiento.
        </p>

        <button onclick="cerrarModal()">
            Guardar
        </button>
    `);
}


function room5Computadora() {

    if (!sala5USB) {

        notificar("La computadora está apagada.");

        return;
    }


    mostrarModal(`
        <h2>Computadora</h2>

        <p>
            Conectás el USB.
        </p>

        <p>
            La pantalla comienza a mostrar información
            relacionada con los archivos del hospital.
        </p>

        <button onclick="room5Finalizar()">
            Continuar
        </button>
    `);
}


function room5Finalizar() {

    cerrarModal();

    notificar("Has descubierto algo.");

    setTimeout(() => {
        irASala(6);
    }, 1200);
}

let sala6FotoEncontrada = false;
let sala6FotoVolteada = false;
let sala6Herramienta = false;


function room6Archivo(numero) {

    if (numero !== 2) {

        notificar("Solo hay papeles rotos.");

        return;
    }


    sala6FotoEncontrada = true;

    mostrarModal(`
        <h2>Fotografía</h2>

        <p>
            Encontraste una fotografía de Marylin.
        </p>

        <button onclick="room6VoltearFoto()">
            Dar vuelta
        </button>
    `);
}


function room6VoltearFoto() {

    sala6FotoVolteada = true;

    mostrarModal(`
        <h2>Fotografía</h2>

        <p>
            En la parte posterior hay una palabra escrita
            con tinta roja:
        </p>

        <h1>MUERTA</h1>

        <button onclick="cerrarModal()">
            Cerrar
        </button>
    `);

    notificar("Escuchás una puerta cerrándose a lo lejos.");
}


function room6Herramienta() {

    sala6Herramienta = true;

    notificar("Has obtenido la herramienta.");
}


function room6Paciente() {

    mostrarModal(`
        <h2>Paciente</h2>

        <p>
            La figura está inmóvil.
        </p>

        <p>
            Antes de desaparecer, escuchás unas palabras:
        </p>

        <p>
            <strong>
                "Marylin no pudo escapar, ni ninguno de nosotros.
                Recuerda la fecha del 17/04/2013."
            </strong>
        </p>
    `);
}


function room6Puerta() {

    if (!sala6Herramienta) {

        notificar("La puerta está bloqueada.");

        return;
    }


    mostrarModal(`
        <h2>Puerta</h2>

        <p>
            La puerta de madera está bloqueando el camino.
        </p>

        <button onclick="room6RomperPuerta()">
            Romper puerta
        </button>
    `);
}


function room6RomperPuerta() {

    cerrarModal();

    notificar("La puerta se abrió.");

    setTimeout(() => {
        irASala(7);
    }, 1000);
}

let sala7Timer = 30;
let sala7TimerInterval = null;
let sala7Comenzo = false;


function room7MirarAtras() {

    mostrarModal(`
        <h2>Pasillo</h2>

        <p>
            Cuando mirás hacia atrás, el pasillo parece
            extenderse mucho más de lo que debería.
        </p>

        <p>
            A lo lejos hay una figura observándote.
        </p>

        <button onclick="room7Volver()">
            Volver
        </button>
    `);
}


function room7Volver() {

    cerrarModal();

    if (!sala7Comenzo) {

        sala7Comenzo = true;

        iniciarContador();
    }
}


function iniciarContador() {

    const timer = document.getElementById("finalTimer");

    if (!timer)
        return;

    timer.classList.remove("hidden");

    sala7Timer = 30;

    timer.textContent = sala7Timer;


    sala7TimerInterval = setInterval(() => {

        sala7Timer--;

        timer.textContent = sala7Timer;


        if (sala7Timer <= 0) {

            clearInterval(sala7TimerInterval);

            room7TiempoAgotado();
        }

    }, 1000);
}


function room7Nota() {

    if (!sala7Comenzo) {

        notificar("Todavía no hay nada que hacer.");

        return;
    }


    mostrarModal(`
        <h2>Nota</h2>

        <p>
            El código es la suma de todos los números
            de la fecha de desaparición de Marylin.
        </p>

        <p>
            17/04/2013
        </p>

        <input
            type="text"
            id="room7Codigo"
            maxlength="10"
            placeholder="Código">

        <br><br>

        <button onclick="room7ComprobarCodigo()">
            Escapar
        </button>
    `);
}


function room7Puerta() {

    if (!sala7Comenzo) {

        iniciarContador();

        return;
    }

    room7Nota();
}


function room7ComprobarCodigo() {

    const input = document.getElementById("room7Codigo");

    if (!input)
        return;


    const codigo = input.value.trim();

    if (codigo === "18" ||
        codigo === "018" ||
        codigo === "0018") {

        clearInterval(sala7TimerInterval);

        room7Victoria();

    } else {

        notificar("Código incorrecto.");
    }
}


function room7Victoria() {

    cerrarModal();

    const timer = document.getElementById("finalTimer");

    if (timer)
        timer.classList.add("hidden");


    mostrarModal(`
        <h1>MARYLIN...</h1>

        <p>
            Jon.
        </p>

        <p>
            Yo nunca desaparecí.
        </p>

        <br>

        <p>
            BLACKWOOD PSYCHIATRIC HOSPITAL
        </p>

        <p>
            CERRADO DESDE 2013
        </p>

        <p>
            PACIENTE: JON HERMENDOFF
        </p>

        <p>
            ESTADO: INTERNADO
        </p>

        <h2>
            Jon nunca salió del hospital.
        </h2>
    `);
}


function room7TiempoAgotado() {

    mostrarModal(`
        <h1>...</h1>

        <p>
            El tiempo se agotó.
        </p>

        <p>
            La realidad comienza a cambiar.
        </p>

        <button onclick="room7Victoria()">
            Continuar
        </button>
    `);
}

document.addEventListener("click", function (event) {

    const modal = document.getElementById("gameModal");

    if (!modal)
        return;

    if (event.target === modal) {

        cerrarModal();
    }

});