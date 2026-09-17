using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Tp06.Models;

namespace Tp06.Controllers;

public class HomeController : Controller
{
    private readonly ILogger<HomeController> _logger;

    public HomeController(ILogger<HomeController> logger)
    {
        _logger = logger;
    }

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
        return View();
    }

    [HttpPost]
    public IActionResult Login(string jugador, string password)
    {
        Jugador? user = DB.BuscarJugador(jugador, password);

        if (user == null)
        {
            ViewBag.Error = "Jugador o contraseña incorrectos.";
            return View();
        }

        HttpContext.Session.SetString("Username", user.Username);

        return RedirectToAction("Bienvenida");
    }


    [HttpGet]
    public IActionResult Register()
    {
        return View();
    }

    [HttpPost]
    public IActionResult Register(
        string nombre,
        string apellido,
        string jugador,
        string tipoJugador,
        string password,
        string password2)
    {
        if (password != password2)
        {
            ViewBag.Error = "Las contraseñas no coinciden.";
            return View();
        }

        Jugador? jugadorExistente = DB.BuscarJugadorPorUsername(jugador);

        if (jugadorExistente != null)
        {
            ViewBag.Error = "El nombre de jugador ya está registrado.";
            return View();
        }

        Jugador nuevoJugador = new Jugador
        {
            Password = password,
            Nombre = nombre
        };

        DB.RegistrarJugador(nuevoJugador);

        return RedirectToAction("Login");
    }

    [HttpGet]
    public IActionResult Logout()
    {
        HttpContext.Session.Clear();

        return RedirectToAction("Login");
    }


    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Error()
    {
        return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
    }
}
