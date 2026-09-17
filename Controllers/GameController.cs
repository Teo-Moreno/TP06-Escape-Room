using Microsoft.AspNetCore.Mvc;
using Tp06.Models;

namespace Tp06.Controllers;

public class GameController : Controller
{
    private readonly ILogger<GameController> _logger;

    public GameController(ILogger<GameController> logger)
    {
        _logger = logger;
    }

    public IActionResult Saved()
    {
        int idJugador = ObtenerJugadorLogueado();

        List<Partida> partidas = DB.buscarGuardados(idJugador);

        ViewBag.SaveSlots = partidas;

        return View();
    }

    public IActionResult Sala1(int idPartida)
    {
        CargarDatosSala(idPartida, 1);

        return View();
    }

    public IActionResult Sala2(int idPartida)
    {
        CargarDatosSala(idPartida, 2);

        return View();
    }

    public IActionResult Sala3(int idPartida)
    {
        CargarDatosSala(idPartida, 3);

        return View();
    }

    public IActionResult Sala4(int idPartida)
    {
        CargarDatosSala(idPartida, 4);

        return View();
    }

    public IActionResult Sala5(int idPartida)
    {
        CargarDatosSala(idPartida, 5);

        return View();
    }

    public IActionResult Sala6(int idPartida)
    {
        CargarDatosSala(idPartida, 6);

        return View();
    }

    public IActionResult Sala7(int idPartida)
    {
        CargarDatosSala(idPartida, 7);

        return View();
    }

    public IActionResult Inventory(int idPartida)
    {
        List<Objeto> objetos = DB.buscarInventario(idPartida);

        ViewBag.Objetos = objetos;
        ViewBag.IdPartida = idPartida;

        return View();
    }
    public IActionResult Cargar(int id)
    {
        int idJugador = ObtenerJugadorLogueado();

        Partida partida = DB.buscarPartida(id, idJugador);

        if (partida == null)
        {
            return RedirectToAction("Saved");
        }

        if (partida.Estado == "COMPLETADA")
        {
            return RedirectToAction("Saved");
        }

        if (partida.Estado == "PERDIDA")
        {
            return RedirectToAction("Saved");
        }

        return IrASala(partida.IdSalaActual, partida.Id);
    }

    public IActionResult NuevaPartida(int numeroPartida)
    {
        int idJugador = ObtenerJugadorLogueado();

        bool existePartida = DB.existePartida(idJugador, numeroPartida);

        if (existePartida)
        {
            return RedirectToAction("Saved");
        }

        Partida partida = DB.crearPartida(
            idJugador,
            numeroPartida,
            1
        );

        return RedirectToAction(
            "Sala1",
            new { idPartida = partida.Id }
        );
    }

    [HttpPost]
    public IActionResult Guardar(int idPartida, int idSala)
    {
        int idJugador = ObtenerJugadorLogueado();

        bool perteneceAlJugador = DB.partidaPerteneceAJugador(
            idPartida,
            idJugador
        );

        if (!perteneceAlJugador)
        {
            return RedirectToAction("Saved");
        }

        DB.guardarPartida(
            idPartida,
            idSala
        );

        return RedirectToAction("Saved");
    }

    [HttpPost]
    public IActionResult GuardarProgreso(
        int idPartida,
        string clave,
        string valor)
    {
        int idJugador = ObtenerJugadorLogueado();

        bool perteneceAlJugador = DB.partidaPerteneceAJugador(
            idPartida,
            idJugador
        );

        if (!perteneceAlJugador)
        {
            return BadRequest();
        }

        DB.guardarProgreso(
            idPartida,
            clave,
            valor
        );

        return Ok();
    }

    [HttpGet]
    public IActionResult ObtenerProgreso(
        int idPartida,
        string clave)
    {
        int idJugador = ObtenerJugadorLogueado();

        bool perteneceAlJugador = DB.partidaPerteneceAJugador(
            idPartida,
            idJugador
        );

        if (!perteneceAlJugador)
        {
            return BadRequest();
        }

        string valor = DB.buscarProgreso(
            idPartida,
            clave
        );

        return Json(valor);
    }

    [HttpPost]
    public IActionResult AgregarObjeto(
        int idPartida,
        int idObjeto)
    {
        int idJugador = ObtenerJugadorLogueado();

        bool perteneceAlJugador = DB.partidaPerteneceAJugador(
            idPartida,
            idJugador
        );

        if (!perteneceAlJugador)
        {
            return BadRequest();
        }

        DB.agregarObjetoInventario(
            idPartida,
            idObjeto
        );

        return Ok();
    }

    [HttpPost]
    public IActionResult UsarObjeto(
        int idPartida,
        int idObjeto)
    {
        int idJugador = ObtenerJugadorLogueado();

        bool perteneceAlJugador = DB.partidaPerteneceAJugador(
            idPartida,
            idJugador
        );

        if (!perteneceAlJugador)
        {
            return BadRequest();
        }

        bool tieneObjeto = DB.tieneObjeto(
            idPartida,
            idObjeto
        );

        if (!tieneObjeto)
        {
            return BadRequest();
        }

        DB.usarObjeto(
            idPartida,
            idObjeto
        );

        return Ok();
    }

    [HttpPost]
    public IActionResult CompletarPartida(int idPartida)
    {
        int idJugador = ObtenerJugadorLogueado();

        bool perteneceAlJugador = DB.partidaPerteneceAJugador(
            idPartida,
            idJugador
        );

        if (!perteneceAlJugador)
        {
            return RedirectToAction("Saved");
        }

        DB.completarPartida(idPartida);

        return RedirectToAction("Sala7", new { idPartida = idPartida });
    }
    [HttpPost]
    public IActionResult PerderPartida(int idPartida)
    {
        int idJugador = ObtenerJugadorLogueado();

        bool perteneceAlJugador = DB.partidaPerteneceAJugador(
            idPartida,
            idJugador
        );

        if (!perteneceAlJugador)
        {
            return RedirectToAction("Saved");
        }

        DB.perderPartida(idPartida);

        return RedirectToAction("Saved");
    }

    private int ObtenerJugadorLogueado()
    {
        int idJugador = HttpContext.Session.GetInt32("IdJugador") ?? 0;

        return idJugador;
    }

    private void CargarDatosSala(
        int idPartida,
        int numeroSala)
    {
        int idJugador = ObtenerJugadorLogueado();

        bool perteneceAlJugador = DB.partidaPerteneceAJugador(
            idPartida,
            idJugador
        );

        if (!perteneceAlJugador)
        {
            return;
        }

        Partida partida = DB.buscarPartida(
            idPartida,
            idJugador
        );

        Sala sala = DB.buscarSala(numeroSala);

        List<Objeto> objetos = DB.buscarInventario(idPartida);

        ViewBag.Partida = partida;
        ViewBag.Sala = sala;
        ViewBag.Objetos = objetos;
        ViewBag.IdPartida = idPartida;
    }

    private IActionResult IrASala(
        int idSala,
        int idPartida)
    {
        if (idSala <= 7){
            return RedirectToAction(
                    "Sala" + idSala.ToString(),
                    new { idPartida = idPartida }
                );
        }
        return RedirectToAction("Saved");
    }
}