using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Tp06.Models;

namespace Tp06.Controllers;

public class HomeController : Controller
{
    public IActionResult Index()
    {
        return View();
    }

    public IActionResult Credits()
    {
        return View();
    }

    [HttpGet]
    public IActionResult Login()
    {
        if (HttpContext.Session.GetInt32("IdJugador") != null)
        {
            return RedirectToAction("Saved", "Game");
        }

        return View();
    }

    [HttpPost]
    public IActionResult Login(string jugador, string password)
    {
        if (string.IsNullOrWhiteSpace(jugador) || string.IsNullOrEmpty(password))
        {
            ViewBag.Error = "Completá el nombre y la contraseña.";
            return View();
        }

        Jugador? user = DB.BuscarJugador(jugador.Trim(), password);

        if (user == null)
        {
            ViewBag.Error = "Jugador o contraseña incorrectos.";
            return View();
        }

        HttpContext.Session.SetInt32("IdJugador", user.Id);
        HttpContext.Session.SetString("Nombre", user.Nombre);

        return RedirectToAction("Saved", "Game");
    }

    [HttpGet]
    public IActionResult Register()
    {
        return View();
    }

    [HttpPost]
    public IActionResult Register(string nombre, string password, string password2)
    {
        if (string.IsNullOrWhiteSpace(nombre) || string.IsNullOrEmpty(password))
        {
            ViewBag.Error = "Completá el nombre y la contraseña.";
            return View();
        }

        if (password != password2)
        {
            ViewBag.Error = "Las contraseñas no coinciden.";
            return View();
        }

        nombre = nombre.Trim();

        if (DB.BuscarJugadorPorNombre(nombre) != null)
        {
            ViewBag.Error = "El nombre de jugador ya está registrado.";
            return View();
        }

        DB.RegistrarJugador(new Jugador { Nombre = nombre, Password = password });

        return RedirectToAction("Login");
    }

    [HttpGet]
    public IActionResult Logout()
    {
        HttpContext.Session.Clear();

        return RedirectToAction("Index");
    }

    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Error()
    {
        return View(new ErrorViewModel
        {
            RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier
        });
    }
}
