// Guion de The Asylum. Cada sala es una lista de pasos que se muestran en orden.
//
//   imagen: "Carpeta/archivo.png"  -> muestra esa imagen (con el texto abajo)
//   negro: true                    -> pantalla negra (el texto aparece centrado)
//   quien: "Jon"                   -> nombre de quien habla (sin quien = narrador)
//   texto: "..."                   -> lo que se dice; se espera un click para seguir
//   sonido: "golpe" | "ruido" | "gritos" | "disparo" | "estatica" | "susurro" | "latido"
//   apagon: 600                    -> se corta la luz esos milisegundos antes del paso
//   temblor: true                  -> sacude la pantalla
//   espera: 900                    -> sin texto: pasa solo después de esos milisegundos
//   objeto: { id, nombre }         -> el jugador recibe un objeto
//   usar: "llave"                  -> hay que hacer click en ese objeto del inventario
//   puzzle: "texto" | "candado" | "llave"
//   sala: 3                        -> guarda y pasa a esa sala
//   fin: true                      -> termina la partida
(function () {
  "use strict";

  const H1 = "Habitacion 1/";
  const H2 = "Habitacion 2/";
  const H3 = "Habitacion 3/";
  const H4 = "Habitacion 4/";
  const H5 = "habitacion 5/foto ";

  const soloDigitos = (valor) => valor.replace(/\D/g, "");

  const HISTORIA = {
    // ------------------------------------------------------------------
    // SALA 1 · Las afueras
    // ------------------------------------------------------------------
    1: [
      { imagen: H1 + "1.png", quien: "Jon", texto: "Llegué." },
      { quien: "Jon", texto: "Blackwood Psychiatric Hospital. Después de tanto tiempo... sigue en pie." },

      { negro: true, texto: "17 de abril de 2013. Marylin Crose, la esposa de Jon Hermendoff, desapareció sin dejar rastro." },
      { texto: "La policía la buscó durante meses. Después dejó de buscarla. Todos dejaron de buscarla." },
      { texto: "Todos menos Jon." },
      { texto: "Trece años más tarde, una carta sin remitente le dio una sola pista: Blackwood. El último lugar donde alguien dijo haberla visto." },

      { imagen: H1 + "2.png", texto: "El viejo hospital psiquiátrico lleva años abandonado. El bosque se lo está tragando de a poco." },
      { quien: "Jon", texto: "Si estás acá adentro, Marylin... te voy a encontrar." },
      { quien: "Jon", texto: "La entrada principal está encadenada. Hay algo pegado en la pared, al lado de la puerta." },

      { imagen: H1 + "3.png", texto: "Una nota vieja, escrita a mano: «R4 - L2 - R9. Clockwise from the 12. Don't forget the order!»" },
      { quien: "Jon", texto: "R4, L2, R9... Derecha, izquierda, derecha. Empezando desde el 12." },
      { quien: "Jon", texto: "Es la combinación de un candado." },

      { imagen: H1 + "4.png", texto: "La cadena de la puerta principal está cerrada con un candado de rueda." },
      {
        puzzle: "candado",
        pregunta: "Girá la rueda del candado en el orden de la nota.",
        combinacion: "R4 - L2 - R9",
        error: "El candado no cede. La rueda vuelve al 12.",
      },

      { imagen: H1 + "4.png", sonido: "golpe", temblor: true, texto: "El candado se abre con un chasquido metálico. La cadena cae al piso." },
      { quien: "Jon", texto: "Ya está. Adentro." },
      { sala: 2 },
    ],

    // ------------------------------------------------------------------
    // SALA 2 · Recepción y archivo
    // ------------------------------------------------------------------
    2: [
      { imagen: H2 + "5.png", texto: "La recepción. El mostrador está cubierto de papeles rotos y carpetas abiertas." },
      { quien: "Jon", texto: "Alguien revolvió todo esto... como si estuviera buscando algo." },

      { sonido: "golpe", temblor: true, texto: "Un golpe seco retumba en algún lugar del edificio." },
      { quien: "Jon", texto: "¿Hola? ¿Hay alguien?" },
      { texto: "Silencio. Detrás del mostrador, una computadora vieja se enciende sola." },

      { imagen: H2 + "6.png", sonido: "estatica", texto: "ERROR." },
      { quien: "Jon", texto: "Esta cosa no debería tener corriente. Este lugar está abandonado hace años." },

      { imagen: H2 + "7.png", texto: "Detrás de la recepción está la sala de archivadores. Cientos de expedientes tirados por el piso." },
      { quien: "Jon", texto: "Si Marylin estuvo acá, tiene que haber un registro." },

      { imagen: H2 + "8.png", quien: "Jon", texto: "Marylin Crose... Es ella." },
      { texto: "«DESAPARECIDA: 17/04/2013». Un sello rojo cruza la hoja: ARCHIVADO." },
      { quien: "Jon", texto: "¿Por qué tendría un expediente en un psiquiátrico?" },

      { imagen: H2 + "11.png", quien: "Jon", texto: "Y este otro... tiene mi nombre." },
      { texto: "«JON HERMENDOFF. Caso N.º 4412-B. ...el paciente afirma oír voces que salen de las paredes.» El resto está tachado." },
      { quien: "Jon", texto: "Esto no tiene sentido. Yo nunca estuve internado acá." },

      { sonido: "ruido", temblor: true, texto: "Otro ruido. Más cerca esta vez." },
      { imagen: H2 + "9.png", sonido: "estatica", texto: "La pantalla vuelve a encenderse: ARCHIVO NO DISPONIBLE." },
      { quien: "Jon", texto: "Alguien está jugando conmigo." },

      { imagen: H2 + "10.png", apagon: 500, sonido: "latido", texto: "Al darse vuelta, Jon casi tropieza con un cadáver apoyado contra la pared." },
      { quien: "Jon", texto: "Dios mío..." },
      { sonido: "susurro", quien: "Cadáver", texto: "Recuerda..." },
      { quien: "Cadáver", texto: "No te dejes ganar. Recuerda los sucesos." },
      { quien: "Jon", texto: "¿Qué...? ¿Quién dijo eso?" },
      { texto: "El cadáver no vuelve a moverse. Nunca se movió." },

      { negro: true, quien: "Jon", texto: "Para avanzar, primero debo recordar cuál era la fecha de desaparición de Marylin." },
      {
        puzzle: "texto",
        pregunta: "¿Cuál era la fecha de desaparición de Marylin?",
        placeholder: "DD/MM/AAAA",
        validar: (valor) => ["17042013", "1742013"].includes(soloDigitos(valor)),
        error: "No... esa no es. Pensá, Jon.",
        pista: "Estaba escrita en el expediente de Marylin.",
        guardar: "fecha_marylin",
      },
      { negro: true, quien: "Jon", texto: "17 de abril de 2013. Nunca voy a olvidar ese día." },
      { sala: 3 },
    ],

    // ------------------------------------------------------------------
    // SALA 3 · Los pasillos
    // ------------------------------------------------------------------
    3: [
      { imagen: H3 + "12.png", texto: "Un pasillo largo, apenas iluminado. Una silla de ruedas abandonada. Una camilla vacía." },
      { quien: "Jon", texto: "Habitación 412..." },

      { imagen: H3 + "16.png", sonido: "latido", espera: 900 },
      { imagen: H3 + "12.png", temblor: true, quien: "Jon", texto: "¿Qué fue eso?" },
      { quien: "Jon", texto: "Había alguien. Al fondo del pasillo. Una mujer." },
      { texto: "El pasillo está vacío." },

      { imagen: H3 + "14.png", texto: "Jon entra a una de las habitaciones. Bajo la única lámpara, una chica está sentada de espaldas." },
      { quien: "Jon", texto: "¿Marylin?" },
      { sonido: "susurro", quien: "Voz", texto: "Jon... llegaste tarde." },
      { quien: "Jon", texto: "¡Marylin! Soy yo, soy Jon. Vine a buscarte—" },

      { imagen: H3 + "15.png", apagon: 700, texto: "La silla está vacía. Nunca hubo nadie ahí." },
      { quien: "Jon", texto: "No... No. La vi. Estaba acá." },

      { imagen: H3 + "13.png", texto: "Otra habitación. Solo cajas, papeles húmedos y una luz que zumbaba." },
      { quien: "Jon", texto: "Acá no hay nada. Me tengo que ir." },

      { imagen: H3 + "17.png", texto: "Al final de otro pasillo hay una puerta abierta. Del otro lado se escapa una luz blanca." },
      { quien: "Jon", texto: "Esa luz... viene de ahí." },

      { negro: true, texto: "A mitad del pasillo, la antorcha se apaga." },
      { sonido: "gritos", temblor: true, texto: "Gritos. Decenas de gritos, desde todas las paredes al mismo tiempo." },
      { quien: "Jon", texto: "¡BASTA! ¡Cállense!" },
      { sala: 4 },
    ],

    // ------------------------------------------------------------------
    // SALA 4 · Sala de pacientes
    // ------------------------------------------------------------------
    4: [
      { imagen: H4 + "18.png", texto: "Los gritos se cortan de golpe. Jon está en la sala de pacientes: hileras de camillas oxidadas." },
      { quien: "Jon", texto: "Pabellón 3B... Acá dormían los internos." },

      { imagen: H4 + "19.png", apagon: 400, texto: "En una de las camillas hay alguien. Un paciente, inmóvil, con los ojos entreabiertos." },
      { quien: "Jon", texto: "¿Está... vivo?" },
      { sonido: "susurro", quien: "Paciente", texto: "Vos también te vas a quedar, Jon. Todos se quedan." },

      { imagen: H4 + "18.png", apagon: 600, texto: "Jon parpadea. La camilla está vacía. Las sábanas no se movieron en años." },
      { quien: "Jon", texto: "Otra vez. Este lugar me está volviendo loco." },

      { imagen: H4 + "20.png", texto: "Sobre una bandeja metálica, al lado de la camilla, brilla algo." },
      { quien: "Jon", texto: "Una llave. «Ward B - Isolation». Puede servirme más adelante." },
      { objeto: { id: "llave", nombre: "Llave (Ward B - Isolation)" }, texto: "Jon guarda la llave." },

      { imagen: H4 + "21.png", sonido: "latido", texto: "Al darse vuelta, Jon ve su reflejo en el vidrio de una puerta. Por un segundo, tiene puesta ropa de paciente." },
      { quien: "Jon", texto: "Estoy cansado. Es eso. Solo estoy cansado." },

      { imagen: H5 + "22.png", texto: "La salida de la sala tiene un teclado numérico. Alguien escribió algo en la puerta." },
      { quien: "Jon", texto: "«Los huesos del ser humano son... exquisitos». ¿Qué clase de enfermo escribe esto?" },

      { negro: true, texto: "Los huesos del ser humano son...... exquisitos." },
      {
        puzzle: "texto",
        pregunta: "Los huesos del ser humano son...... exquisitos. ¿Cuántos son?",
        placeholder: "Cantidad de huesos",
        teclado: "numeric",
        validar: (valor) => soloDigitos(valor) === "206",
        error: "El teclado pita. Número incorrecto.",
        pista: "Un adulto tiene un poco más de doscientos.",
        guardar: "huesos",
      },
      { negro: true, sonido: "golpe", texto: "El teclado emite un pitido largo. La cerradura se abre." },
      { quien: "Jon", texto: "Doscientos seis. Ni uno más, ni uno menos." },
      { sala: 5 },
    ],

    // ------------------------------------------------------------------
    // SALA 5 · El sótano y el final
    // ------------------------------------------------------------------
    5: [
      { imagen: H5 + "23.png", texto: "Detrás de la puerta, una escalera baja hacia la oscuridad." },
      { quien: "Jon", texto: "El sótano... Si está en algún lado, está ahí abajo." },

      { imagen: H5 + "24.png", apagon: 500, texto: "El sótano huele a humedad y a óxido. Hay un baúl abierto y un papel tirado en el piso." },
      { sonido: "latido", texto: "Y al fondo, entre las sombras, la silueta de una mujer." },
      { quien: "Jon", texto: "¿Marylin? ¿Sos vos?" },
      { texto: "No responde. Cuando Jon levanta la linterna, ya no está." },

      { imagen: H5 + "25.png", texto: "Más adelante, sobre una mesa, hay una caja de madera cerrada con candado." },
      { quien: "Jon", texto: "Ward B... Aislamiento. La llave de la sala de pacientes tiene que ser de esta caja." },
      { quien: "Jon", texto: "Tengo que usar la llave. (Hacé click en la llave de tu inventario, arriba)", usar: "llave" },

      { negro: true, texto: "La llave entra, pero el óxido no la deja girar." },
      {
        puzzle: "llave",
        pregunta: "¡Forzá la llave antes de que vuelva a trabarse!",
      },

      { imagen: H5 + "26.png", texto: "Con un último esfuerzo, la llave gira. El candado se abre." },
      { imagen: H5 + "27.png", texto: "Adentro hay una nota: «Despierta, no creas que es real, no te dejes ganar»." },
      { quien: "Jon", texto: "Lo mismo que dijo el cadáver... ¿Quién me está dejando estos mensajes?" },

      { negro: true, quien: "Jon", texto: "No importa. Tengo que seguir avanzando. Ella está acá abajo, lo sé." },
      { sonido: "ruido", temblor: true, texto: "Un ruido a sus espaldas." },

      { imagen: H5 + "28.png", sonido: "latido", temblor: true, texto: "Al final del pasillo, la mujer. Lo está apuntando con un arma." },

      { negro: true, quien: "???", texto: "Me dejaste sola, Jon." },
      { quien: "Jon", texto: "¿Marylin? Esperá... ¡No! ¡Por favor, no me dispares!" },
      { quien: "???", texto: "Despertá." },

      { negro: true, sonido: "disparo", temblor: true, espera: 1400 },
      { imagen: H5 + "29.png", texto: "Jon cae al piso. La sangre le cubre la mano." },
      { quien: "Jon", texto: "Mary... lin..." },
      { negro: true, espera: 2200 },

      { imagen: H5 + "30.png", apagon: 400, texto: "Jon abre los ojos. Una habitación blanca. Una camilla. Luces fluorescentes." },

      { negro: true, quien: "Jon", texto: "¿Qué hago acá?" },
      { quien: "Jon", texto: "¿Dónde estoy? ¿Dónde está el hospital? ¿El sótano? ¿Marylin?" },
      { quien: "Jon", texto: "Me dispararon. Yo... yo me estaba muriendo." },
      { texto: "No tiene ninguna herida. Nunca la tuvo." },

      { imagen: H5 + "30.png", sonido: "estatica", texto: "La pantalla frente a la camilla parpadea. Del otro lado de los vidrios, alguien lo observa." },

      { imagen: H5 + "31.png", texto: "NEWS 24: «Hoy se cumplen 2 años de la muerte de la esposa del gran conocido Jon Hermendoff»." },
      { quien: "Jon", texto: "¿Muerte...? No. No, no, no. Marylin desapareció. Yo la estaba buscando..." },
      { texto: "El expediente. Las voces en las paredes. La habitación 412. Todo vuelve de golpe." },
      { texto: "Marylin nunca desapareció." },

      { imagen: H5 + "32.png", sonido: "latido", temblor: true, quien: "Jon", texto: "¿Qué... qué hice?" },
      { fin: true },
    ],
  };

  window.Juego.iniciar(HISTORIA);
})();
