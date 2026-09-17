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

        List<Partida> partidas = bd.buscarGuardados(idJugador);

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
        List<Objeto> objetos = bd.buscarInventario(idPartida);

        ViewBag.Objetos = objetos;
        ViewBag.IdPartida = idPartida;

        return View();
    }
    public IActionResult Cargar(int id)
    {
        int idJugador = ObtenerJugadorLogueado();

        Partida partida = bd.buscarPartida(id, idJugador);

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

        return IrASala(partida.IdSalaActual, partida.IdPartida);
    }

    public IActionResult NuevaPartida(int numeroPartida)
    {
        int idJugador = ObtenerJugadorLogueado();

        bool existePartida = bd.existePartida(idJugador, numeroPartida);

        if (existePartida)
        {
            return RedirectToAction("Saved");
        }

        Partida partida = bd.crearPartida(
            idJugador,
            numeroPartida,
            1
        );

        return RedirectToAction(
            "Sala1",
            new { idPartida = partida.IdPartida }
        );
    }

    [HttpPost]
    public IActionResult Guardar(int idPartida, int idSala)
    {
        int idJugador = ObtenerJugadorLogueado();

        bool perteneceAlJugador = bd.partidaPerteneceAJugador(
            idPartida,
            idJugador
        );

        if (!perteneceAlJugador)
        {
            return RedirectToAction("Saved");
        }

        bd.guardarPartida(
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

        bool perteneceAlJugador = bd.partidaPerteneceAJugador(
            idPartida,
            idJugador
        );

        if (!perteneceAlJugador)
        {
            return BadRequest();
        }

        bd.guardarProgreso(
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

        bool perteneceAlJugador = bd.partidaPerteneceAJugador(
            idPartida,
            idJugador
        );

        if (!perteneceAlJugador)
        {
            return BadRequest();
        }

        string valor = bd.buscarProgreso(
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

        bool perteneceAlJugador = bd.partidaPerteneceAJugador(
            idPartida,
            idJugador
        );

        if (!perteneceAlJugador)
        {
            return BadRequest();
        }

        bd.agregarObjetoInventario(
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

        bool perteneceAlJugador = bd.partidaPerteneceAJugador(
            idPartida,
            idJugador
        );

        if (!perteneceAlJugador)
        {
            return BadRequest();
        }

        bool tieneObjeto = bd.tieneObjeto(
            idPartida,
            idObjeto
        );

        if (!tieneObjeto)
        {
            return BadRequest();
        }

        bd.usarObjeto(
            idPartida,
            idObjeto
        );

        return Ok();
    }

    [HttpPost]
    public IActionResult CompletarPartida(int idPartida)
    {
        int idJugador = ObtenerJugadorLogueado();

        bool perteneceAlJugador = bd.partidaPerteneceAJugador(
            idPartida,
            idJugador
        );

        if (!perteneceAlJugador)
        {
            return RedirectToAction("Saved");
        }

        bd.completarPartida(idPartida);

        return RedirectToAction("Sala7", new { idPartida = idPartida });
    }
    [HttpPost]
    public IActionResult PerderPartida(int idPartida)
    {
        int idJugador = ObtenerJugadorLogueado();

        bool perteneceAlJugador = bd.partidaPerteneceAJugador(
            idPartida,
            idJugador
        );

        if (!perteneceAlJugador)
        {
            return RedirectToAction("Saved");
        }

        bd.perderPartida(idPartida);

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

        bool perteneceAlJugador = bd.partidaPerteneceAJugador(
            idPartida,
            idJugador
        );

        if (!perteneceAlJugador)
        {
            return;
        }

        Partida partida = bd.buscarPartida(
            idPartida,
            idJugador
        );

        Sala sala = bd.buscarSala(numeroSala);

        List<Objeto> objetos = bd.buscarInventario(idPartida);

        ViewBag.Partida = partida;
        ViewBag.Sala = sala;
        ViewBag.Objetos = objetos;
        ViewBag.IdPartida = idPartida;
    }

    private IActionResult IrASala(
        int idSala,
        int idPartida)
    {
        switch (idSala)
        {
            case 1:
                return RedirectToAction(
                    "Sala1",
                    new { idPartida = idPartida }
                );

            case 2:
                return RedirectToAction(
                    "Sala2",
                    new { idPartida = idPartida }
                );

            case 3:
                return RedirectToAction(
                    "Sala3",
                    new { idPartida = idPartida }
                );

            case 4:
                return RedirectToAction(
                    "Sala4",
                    new { idPartida = idPartida }
                );

            case 5:
                return RedirectToAction(
                    "Sala5",
                    new { idPartida = idPartida }
                );

            case 6:
                return RedirectToAction(
                    "Sala6",
                    new { idPartida = idPartida }
                );

            case 7:
                return RedirectToAction(
                    "Sala7",
                    new { idPartida = idPartida }
                );

            default:
                return RedirectToAction("Saved");
        }
    }
}