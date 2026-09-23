using Microsoft.AspNetCore.Mvc;
using Tp06.Models;

namespace Tp06.Controllers;

public class GameController : Controller
{
    public const int CantidadSalas = 5;
    private const int CantidadSlots = 3;

    private static readonly string[] NombresSalas =
    {
        "Las afueras",
        "Recepción",
        "Los pasillos",
        "Sala de pacientes",
        "El sótano"
    };

    public IActionResult Saved()
    {
        int idJugador = ObtenerJugadorLogueado();

        if (idJugador == 0)
        {
            return RedirectToAction("Login", "Home");
        }

        Partida?[] slots = new Partida?[CantidadSlots];

        foreach (Partida partida in DB.BuscarPartidas(idJugador))
        {
            if (partida.NumeroPartida >= 1 && partida.NumeroPartida <= CantidadSlots)
            {
                slots[partida.NumeroPartida - 1] = partida;
            }
        }

        ViewBag.Slots = slots;
        ViewBag.NombresSalas = NombresSalas;

        return View();
    }

    public IActionResult NuevaPartida(int numeroPartida)
    {
        int idJugador = ObtenerJugadorLogueado();

        if (idJugador == 0)
        {
            return RedirectToAction("Login", "Home");
        }

        if (numeroPartida < 1 || numeroPartida > CantidadSlots || DB.ExistePartida(idJugador, numeroPartida))
        {
            return RedirectToAction("Saved");
        }

        Partida partida = DB.CrearPartida(idJugador, numeroPartida);

        return RedirectToAction("Jugar", new { idPartida = partida.Id });
    }

    public IActionResult Cargar(int id)
    {
        return RedirectToAction("Jugar", new { idPartida = id });
    }

    public IActionResult Jugar(int idPartida)
    {
        int idJugador = ObtenerJugadorLogueado();

        if (idJugador == 0)
        {
            return RedirectToAction("Login", "Home");
        }

        Partida? partida = DB.BuscarPartida(idPartida, idJugador);

        if (partida == null || partida.Completada)
        {
            return RedirectToAction("Saved");
        }

        int sala = Math.Clamp(partida.IdSalaActual, 1, CantidadSalas);

        ViewBag.IdPartida = partida.Id;
        ViewBag.Sala = sala;
        ViewBag.NombreSala = NombresSalas[sala - 1];
        ViewBag.TieneLlave = DB.BuscarProgreso(partida.Id, "llave") == "1";

        return View("Sala");
    }

    [HttpPost]
    public IActionResult AvanzarSala(int idPartida, int sala)
    {
        Partida? partida = DB.BuscarPartida(idPartida, ObtenerJugadorLogueado());

        if (partida == null || partida.Completada)
        {
            return BadRequest();
        }

        // Solo se puede avanzar de a una sala: no se pueden saltear salas desde la URL.
        if (sala == partida.IdSalaActual + 1 && sala <= CantidadSalas)
        {
            DB.ActualizarSala(idPartida, sala);
        }

        return Ok();
    }

    [HttpPost]
    public IActionResult CompletarPartida(int idPartida)
    {
        Partida? partida = DB.BuscarPartida(idPartida, ObtenerJugadorLogueado());

        if (partida == null || partida.IdSalaActual != CantidadSalas)
        {
            return BadRequest();
        }

        DB.CompletarPartida(idPartida);

        return Ok();
    }

    [HttpPost]
    public IActionResult BorrarPartida(int idPartida)
    {
        Partida? partida = DB.BuscarPartida(idPartida, ObtenerJugadorLogueado());

        if (partida != null)
        {
            DB.BorrarPartida(idPartida);
        }

        return RedirectToAction("Saved");
    }

    [HttpPost]
    public IActionResult GuardarProgreso(int idPartida, string clave, string valor)
    {
        Partida? partida = DB.BuscarPartida(idPartida, ObtenerJugadorLogueado());

        if (partida == null || string.IsNullOrWhiteSpace(clave))
        {
            return BadRequest();
        }

        DB.GuardarProgreso(idPartida, clave, valor ?? "");

        return Ok();
    }

    [HttpGet]
    public IActionResult ObtenerProgreso(int idPartida, string clave)
    {
        Partida? partida = DB.BuscarPartida(idPartida, ObtenerJugadorLogueado());

        if (partida == null)
        {
            return BadRequest();
        }

        return Json(DB.BuscarProgreso(idPartida, clave));
    }

    private int ObtenerJugadorLogueado()
    {
        return HttpContext.Session.GetInt32("IdJugador") ?? 0;
    }
}
