// Guion de The Asylum. Cada sala es una lista de pasos que se muestran en orden.
//
//   imagen: "Carpeta/archivo.png"  -> muestra esa imagen (con el texto abajo)
//   negro: true                    -> pantalla negra (el texto aparece centrado)
//   quien: "Jon"                   -> nombre de quien habla (sin quien = narrador)
//   texto: "..."                   -> lo que se dice; se espera un click para seguir
//   sonido: "golpe" | "golpeLejano" | "ruido" | "crujido" | "puerta" | "gritos" | "disparo"
//           | "susto" | "estatica" | "zumbido" | "susurro" | "susurros" | "latido"
//           | "cajaMusica" | "telefono" | "llama"
//   apagon: 600                    -> se corta la luz esos milisegundos antes del paso
//   temblor: true                  -> sacude la pantalla
//   espera: 900                    -> sin texto: pasa solo después de esos milisegundos
//   objeto: { id, nombre }         -> el jugador recibe un objeto
//   usar: "llave"                  -> hay que hacer click en ese objeto del inventario
//   puzzle: "texto" | "teclado" | "candado" | "antorchas" | "llave"
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
  const normalizar = (valor) =>
    valor
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const HISTORIA = {
    // ------------------------------------------------------------------
    // SALA 1 · Las afueras
    // ------------------------------------------------------------------
    1: [
      { imagen: H1 + "1.png", quien: "Jon", texto: "Llegué." },
      { quien: "Jon", texto: "Blackwood Psychiatric Hospital. Fundado en 1888... Después de tanto tiempo, sigue en pie." },

      { negro: true, texto: "17 de abril de 2013. Marylin Crose, la esposa de Jon Hermendoff, salió a comprar flores para su aniversario." },
      { texto: "Nunca volvió." },
      { texto: "La policía la buscó durante meses. Después dejó de buscarla. Todos dejaron de buscarla." },
      { texto: "Todos menos Jon. Él siguió pegando carteles, llamando a hospitales, durmiendo con el teléfono en la mano." },
      { texto: "Trece años más tarde, llegó una carta sin remitente. Una sola línea, escrita a mano:" },
      { sonido: "susurro", quien: "Carta", texto: "«Ella está en Blackwood. Vení solo.»" },
      { texto: "Blackwood: el viejo hospital psiquiátrico a las afueras de la ciudad. Cerrado hace años, después de un incendio del que nadie quiere hablar." },

      { imagen: H1 + "2.png", sonido: "crujido", texto: "El hospital lleva años abandonado. El bosque se lo está tragando de a poco." },
      { quien: "Jon", texto: "Marylin odiaba este lugar. Cada vez que pasábamos por la ruta decía que las ventanas parecían ojos." },
      { quien: "Jon", texto: "Tenía razón. Se siente como si alguien me estuviera mirando." },
      { quien: "Jon", texto: "Si estás acá adentro... te voy a encontrar." },
      { sonido: "golpeLejano", texto: "Algo golpea tres veces, adentro del edificio. Después, silencio." },
      { quien: "Jon", texto: "La entrada principal está encadenada. Hay algo pegado en la pared, al lado de la puerta." },

      { imagen: H1 + "3.png", texto: "Una nota vieja, escrita a mano: «R4 - L2 - R9. Clockwise from the 12. Don't forget the order!»" },
      { quien: "Jon", texto: "Esta letra... se parece a la de Marylin. No. No puede ser." },
      { quien: "Jon", texto: "R4, L2, R9... Derecha, izquierda, derecha. Empezando desde el 12." },
      { quien: "Jon", texto: "Es la combinación de un candado. Alguien quería que yo entrara." },

      { imagen: H1 + "4.png", texto: "La cadena de la puerta principal está cerrada con un candado de rueda." },
      {
        puzzle: "candado",
        pregunta: "Girá la rueda del candado en el orden de la nota.",
        combinacion: "R4 - L2 - R9",
        error: "El candado no cede. La rueda vuelve al 12.",
      },

      { imagen: H1 + "4.png", sonido: "puerta", temblor: true, texto: "El candado se abre con un chasquido metálico. La cadena cae al piso y la puerta se abre sola, apenas." },
      { quien: "Jon", texto: "Ya está. No hay vuelta atrás." },
      { sala: 2 },
    ],

    // ------------------------------------------------------------------
    // SALA 2 · Recepción y archivo
    // ------------------------------------------------------------------
    2: [
      { imagen: H2 + "5.png", sonido: "zumbido", texto: "La recepción. El mostrador está cubierto de papeles rotos y carpetas abiertas." },
      { quien: "Jon", texto: "Alguien revolvió todo esto... como si estuviera buscando algo." },
      { texto: "Sobre el mostrador hay un libro de ingresos abierto. La última página está arrancada a la mitad." },
      { quien: "Jon", texto: "«...Hermendoff, J. — Ingreso: invol...». El resto está roto." },
      { quien: "Jon", texto: "Hermendoff. Mi apellido. Tiene que ser una coincidencia. Tiene que serlo." },

      { sonido: "golpe", temblor: true, texto: "Un golpe seco retumba en algún lugar del edificio." },
      { quien: "Jon", texto: "¿Hola? ¿Hay alguien?" },
      { sonido: "telefono", texto: "En otra sala suena un teléfono. Una vez. Dos. Después se corta." },
      { texto: "Detrás del mostrador, una computadora vieja se enciende sola." },

      { imagen: H2 + "6.png", sonido: "estatica", texto: "ERROR." },
      { quien: "Jon", texto: "Esta cosa no debería tener corriente. Este lugar está abandonado hace años." },

      { imagen: H2 + "7.png", texto: "Detrás de la recepción está la sala de archivadores. Cientos de expedientes tirados por el piso." },
      { quien: "Jon", texto: "Si Marylin estuvo acá, tiene que haber un registro." },
      { texto: "Jon revisa cajón por cajón. Los nombres no le dicen nada. Hasta que uno sí." },

      { imagen: H2 + "8.png", quien: "Jon", texto: "Marylin Crose... Es ella." },
      { texto: "«DESAPARECIDA: 17/04/2013». Un sello rojo cruza la hoja: ARCHIVADO." },
      { quien: "Jon", texto: "¿Por qué tendría un expediente en un psiquiátrico? Ella nunca estuvo enferma." },
      { quien: "Jon", texto: "Diecisiete de abril. El día que salió a comprar flores." },

      { imagen: H2 + "11.png", quien: "Jon", texto: "Y este otro... tiene mi nombre." },
      { texto: "«JON HERMENDOFF. Caso N.º 4412-B. ...el paciente afirma oír voces que salen de las paredes.» El resto está tachado." },
      { quien: "Jon", texto: "Esto no tiene sentido. Yo nunca estuve internado acá." },
      { quien: "Jon", texto: "¿Nunca...?" },

      { sonido: "ruido", temblor: true, texto: "Otro ruido. Más cerca esta vez." },
      { imagen: H2 + "9.png", sonido: "estatica", texto: "La pantalla vuelve a encenderse: ARCHIVO NO DISPONIBLE." },
      { quien: "Jon", texto: "Alguien está jugando conmigo." },

      { imagen: H2 + "10.png", apagon: 500, sonido: "susto", texto: "Al darse vuelta, Jon casi tropieza con un cadáver apoyado contra la pared." },
      { quien: "Jon", texto: "Dios mío..." },
      { texto: "Tiene puesto un pijama de paciente. Lleva ahí muchísimo tiempo." },
      { sonido: "susurro", quien: "Cadáver", texto: "Recuerda..." },
      { quien: "Cadáver", texto: "No te dejes ganar. Recuerda los sucesos." },
      { quien: "Jon", texto: "¿Qué sucesos? ¿De qué estás hablando?" },
      { sonido: "susurros", quien: "Cadáver", texto: "La fecha, Jon. Todo empieza con la fecha." },
      { texto: "El cadáver no vuelve a moverse. Nunca se movió." },

      { negro: true, texto: "La puerta hacia los pasillos tiene una cerradura electrónica. Espera una fecha." },
      { quien: "Jon", texto: "Para avanzar, primero debo recordar cuál era la fecha de desaparición de Marylin." },
      {
        puzzle: "texto",
        pregunta: "¿Cuál era la fecha de desaparición de Marylin?",
        placeholder: "DD/MM/AAAA",
        validar: (valor) => ["17042013", "1742013"].includes(soloDigitos(valor)),
        error: "No... esa no es. Pensá, Jon.",
        pista: "Estaba escrita en el expediente de Marylin.",
        guardar: "fecha_marylin",
      },
      { negro: true, sonido: "puerta", quien: "Jon", texto: "17 de abril de 2013. Nunca voy a olvidar ese día." },
      { texto: "¿O sí?" },
      { sala: 3 },
    ],

    // ------------------------------------------------------------------
    // SALA 3 · Los pasillos
    // ------------------------------------------------------------------
    3: [
      { imagen: H3 + "12.png", sonido: "zumbido", texto: "Un pasillo largo, apenas iluminado. Una silla de ruedas abandonada. Una camilla vacía." },
      { quien: "Jon", texto: "Habitación 412..." },
      { quien: "Jon", texto: "Las luces todavía funcionan. ¿Quién paga la electricidad de un lugar abandonado?" },

      { imagen: H3 + "16.png", sonido: "susto", espera: 900 },
      { imagen: H3 + "12.png", temblor: true, quien: "Jon", texto: "¿Qué fue eso?" },
      { quien: "Jon", texto: "Había alguien. Al fondo del pasillo. Una mujer." },
      { texto: "El pasillo está vacío. Solo queda el zumbido de los tubos fluorescentes." },
      { quien: "Jon", texto: "Marylin tenía el pelo así. Largo, oscuro..." },
      { sonido: "cajaMusica", texto: "Desde una de las habitaciones llega una melodía. Una caja de música, desafinada." },

      { imagen: H3 + "14.png", texto: "Jon entra. Bajo la única lámpara, una chica está sentada de espaldas, inmóvil." },
      { quien: "Jon", texto: "¿Marylin?" },
      { sonido: "susurro", quien: "Voz", texto: "Jon... llegaste tarde." },
      { quien: "Jon", texto: "¡Marylin! Soy yo. Vine a buscarte. Te busqué durante trece años—" },
      { quien: "Voz", texto: "¿Trece años? Jon... ¿de verdad creés eso?" },
      { quien: "Jon", texto: "¿Qué...? ¿De qué hablás?" },
      { quien: "Voz", texto: "No me puedo quedar. Ellos no me dejan. Pero vas a necesitar abrir una puerta." },
      { sonido: "susurros", quien: "Voz", texto: "Jon, te ayudaré. Acuérdate del número 666." },
      { quien: "Jon", texto: "¿666? ¿Qué significa? ¡Esperá, no te vayas!" },

      { imagen: H3 + "15.png", apagon: 700, texto: "La silla está vacía. Nunca hubo nadie ahí." },
      { quien: "Jon", texto: "No... la vi. Estaba acá. Me habló." },
      { quien: "Jon", texto: "666. Seis, seis, seis. No me lo puedo olvidar." },

      { imagen: H3 + "13.png", sonido: "crujido", texto: "Otra habitación. Cajas, papeles húmedos y una luz que parpadea." },
      { quien: "Jon", texto: "Acá no hay nada. Me tengo que ir." },

      { negro: true, sonido: "zumbido", texto: "Jon sale al pasillo. Las luces se apagan una por una, hasta que no queda nada." },
      { sonido: "latido", texto: "Oscuridad total. Solo se escucha su propia respiración." },
      { quien: "Jon", texto: "No veo nada. Necesito encender esto que me traje de casualidad." },
      { texto: "Jon saca de la mochila una antorcha vieja y una caja de fósforos húmedos. Cada fósforo dura un segundo." },
      {
        puzzle: "antorchas",
        pregunta: "Encendé 10 antorchas en menos de 6 segundos.",
        meta: 10,
        tiempo: 6000,
        error: "Las llamas se apagan. La oscuridad vuelve. Otra vez...",
      },

      { imagen: H3 + "17.png", sonido: "llama", texto: "La antorcha por fin se enciende. Al final del pasillo hay una puerta abierta." },
      { quien: "Jon", texto: "Esa luz blanca... viene de ahí." },
      { quien: "Jon", texto: "Marylin, si esto es un juego... ya no me está gustando." },

      { negro: true, sonido: "susurros", texto: "A mitad del pasillo, la antorcha se apaga sola. Como si alguien la hubiera soplado." },
      { sonido: "gritos", temblor: true, texto: "Gritos. Decenas de gritos, desde todas las paredes al mismo tiempo." },
      { quien: "Jon", texto: "¡BASTA! ¡Cállense!" },
      { sala: 4 },
    ],

    // ------------------------------------------------------------------
    // SALA 4 · Sala de pacientes
    // ------------------------------------------------------------------
    4: [
      { imagen: H4 + "extra(puerta-sala-pacientes).png", apagon: 600, texto: "Los gritos se cortan de golpe. Jon está frente a una puerta de metal con un teclado numérico." },
      { quien: "Jon", texto: "«Sala 206». La sala de pacientes." },
      { sonido: "golpeLejano", texto: "Del otro lado de la puerta se escucha algo. Como si alguien arrastrara una camilla." },
      { quien: "Jon", texto: "Está cerrada. Necesito un código..." },
      { quien: "Jon", texto: "El número que me dijo la chica de la silla." },
      {
        puzzle: "teclado",
        pregunta: "Ingresá el código de la puerta.",
        codigo: "666",
        error: "El teclado pita. Código incorrecto.",
        pista: "La chica de la silla te dijo un número.",
      },
      { imagen: H4 + "extra(puerta-sala-pacientes).png", sonido: "puerta", texto: "La cerradura se destraba. La puerta se abre con un chirrido largo." },

      { imagen: H4 + "18.png", texto: "Adentro, hileras de camillas oxidadas. Huele a desinfectante viejo y a algo peor." },
      { quien: "Jon", texto: "Pabellón 3B... Acá dormían los internos." },
      { texto: "En la pared hay marcas de uñas. Cientos. Como si alguien hubiera contado los días." },

      { imagen: H4 + "19.png", apagon: 400, sonido: "latido", texto: "En una de las camillas hay alguien. Un paciente, inmóvil, con los ojos entreabiertos." },
      { quien: "Jon", texto: "¿Está... vivo?" },
      { sonido: "susurro", quien: "Paciente", texto: "Tengo 206 huesos, como todo ser humano, pero parezco vacío. No siento nada." },
      { quien: "Jon", texto: "¿Qué le hicieron?" },
      { quien: "Paciente", texto: "Vos también te vas a quedar, Jon. Todos se quedan." },
      { quien: "Paciente", texto: "Ella también está acá. Siempre estuvo acá. Vos la trajiste." },

      { imagen: H4 + "18.png", apagon: 600, sonido: "susto", texto: "Jon parpadea. La camilla está vacía. Las sábanas no se movieron en años." },
      { quien: "Jon", texto: "Otra vez. Este lugar me está volviendo loco." },

      { imagen: H4 + "20.png", texto: "Sobre una bandeja metálica, al lado de la camilla, brilla algo." },
      { quien: "Jon", texto: "Una llave. «Ward B - Isolation». Aislamiento. Puede servirme más adelante." },
      { objeto: { id: "llave", nombre: "Llave (Ward B - Isolation)" }, texto: "Jon guarda la llave." },

      { imagen: H4 + "21.png", sonido: "latido", texto: "Al darse vuelta, Jon ve su reflejo en el vidrio de una puerta. Por un segundo, tiene puesta ropa de paciente." },
      { quien: "Jon", texto: "Estoy cansado. Es eso. Solo estoy cansado." },
      { texto: "Pero la ropa del reflejo tiene un número bordado: 4412-B. El mismo número del expediente." },

      { imagen: H5 + "22.png", texto: "La salida de la sala tiene otro teclado. Alguien escribió algo en la puerta." },
      { quien: "Jon", texto: "«Los huesos del ser humano son... exquisitos». ¿Qué clase de enfermo escribe esto?" },
      { quien: "Jon", texto: "Otro teclado. Otro código." },

      { negro: true, sonido: "susurros", texto: "Los huesos del ser humano son...... exquisitos." },
      {
        puzzle: "texto",
        pregunta: "Los huesos del ser humano son...... exquisitos.",
        teclado: "numeric",
        validar: (valor) => soloDigitos(valor) === "206" || normalizar(valor) === "doscientos seis",
        error: "El teclado pita. Nada.",
        pista: "¿Qué te dijo el paciente de la camilla?",
        guardar: "huesos",
      },
      { negro: true, sonido: "puerta", texto: "El teclado emite un pitido largo. La cerradura se abre." },
      { quien: "Jon", texto: "Doscientos seis. Ni uno más, ni uno menos." },
      { sala: 5 },
    ],

    // ------------------------------------------------------------------
    // SALA 5 · El sótano y el final
    // ------------------------------------------------------------------
    5: [
      { imagen: H5 + "23.png", sonido: "crujido", texto: "Detrás de la puerta, una escalera baja hacia la oscuridad." },
      { quien: "Jon", texto: "El sótano... Si está en algún lado, está ahí abajo." },
      { texto: "Cada escalón cruje. Abajo hace más frío. Mucho más frío." },

      { imagen: H5 + "24.png", apagon: 500, texto: "El sótano huele a humedad y a óxido. Hay un baúl abierto y un papel tirado en el piso." },
      { sonido: "susto", texto: "Y al fondo, entre las sombras, la silueta de una mujer." },
      { quien: "Jon", texto: "¿Marylin? ¿Sos vos?" },
      { texto: "No responde. Cuando Jon levanta la linterna, ya no está." },
      { sonido: "cajaMusica", quien: "Jon", texto: "Esa melodía otra vez. Es la canción que sonaba en nuestro casamiento." },

      { imagen: H5 + "25.png", texto: "Más adelante, sobre una mesa, hay una caja de madera cerrada con candado." },
      { quien: "Jon", texto: "Ward B... Aislamiento. La llave de la sala de pacientes tiene que ser de esta caja." },
      { quien: "Jon", texto: "Tengo que usar la llave. (Hacé click en la llave de tu inventario, arriba)", usar: "llave" },

      { negro: true, texto: "La llave entra, pero el óxido no la deja girar." },
      {
        puzzle: "llave",
        pregunta: "¡Forzá la llave antes de que vuelva a trabarse!",
      },

      { imagen: H5 + "26.png", sonido: "candado", texto: "Con un último esfuerzo, la llave gira. El candado se abre." },
      { imagen: H5 + "27.png", texto: "Adentro hay una nota: «Despierta, no creas que es real, no te dejes ganar»." },
      { quien: "Jon", texto: "Lo mismo que dijo el cadáver... ¿Quién me está dejando estos mensajes?" },
      { quien: "Jon", texto: "La letra es la misma que la de la nota de la entrada." },
      { texto: "Es la letra de Jon." },

      { negro: true, quien: "Jon", texto: "No importa. Tengo que seguir avanzando. Ella está acá abajo, lo sé." },
      { sonido: "ruido", temblor: true, texto: "Un ruido a sus espaldas." },

      { imagen: H5 + "28.png", sonido: "susto", temblor: true, texto: "Al final del pasillo, la mujer. Lo está apuntando con un arma." },

      { negro: true, quien: "???", texto: "Me dejaste sola, Jon." },
      { quien: "Jon", texto: "¿Marylin? Esperá... ¡No! ¡Por favor, no me dispares!" },
      { quien: "???", texto: "Yo también te pedí eso. ¿Te acordás?" },
      { quien: "???", texto: "Despertá." },

      { negro: true, sonido: "disparo", temblor: true, espera: 1400 },
      { imagen: H5 + "29.png", texto: "Jon cae al piso. La sangre le cubre la mano." },
      { quien: "Jon", texto: "Mary... lin..." },
      { negro: true, sonido: "latido", espera: 2200 },

      { imagen: H5 + "30.png", apagon: 400, sonido: "zumbido", texto: "Jon abre los ojos. Una habitación blanca. Una camilla. Luces fluorescentes." },

      { negro: true, quien: "Jon", texto: "¿Qué hago acá?" },
      { quien: "Jon", texto: "¿Dónde estoy? ¿Dónde está el hospital? ¿El sótano? ¿Marylin?" },
      { quien: "Jon", texto: "Me dispararon. Yo... yo me estaba muriendo." },
      { texto: "No tiene ninguna herida. Nunca la tuvo." },
      { quien: "Jon", texto: "¡Ayuda! ¡Que alguien me diga qué está pasando!" },

      { imagen: H5 + "30.png", sonido: "estatica", texto: "La pantalla frente a la camilla parpadea. Del otro lado de los vidrios, alguien lo observa." },

      { imagen: H5 + "31.png", texto: "NEWS 24: «Hoy se cumplen 2 años de la muerte de la esposa del gran conocido Jon Hermendoff»." },
      { quien: "Jon", texto: "¿Muerte...? No. No, no, no. Marylin desapareció. Yo la estaba buscando..." },
      { sonido: "puerta", texto: "La puerta se abre. Entra una enfermera. No lo mira a los ojos." },
      { quien: "Enfermera", texto: "Otra vez despierto, Hermendoff. Todas las noches lo mismo: busca a su esposa por los pasillos." },
      { quien: "Enfermera", texto: "Ella no va a venir, Jon. Usted sabe por qué." },
      { texto: "El expediente. Las voces en las paredes. El número 4412-B. Todo vuelve de golpe." },
      { texto: "Marylin nunca desapareció." },

      { imagen: H5 + "32.png", sonido: "susto", temblor: true, quien: "Jon", texto: "¿Qué... qué hice?" },
      { fin: true },
    ],
  };

  window.Juego.iniciar(HISTORIA);
})();
