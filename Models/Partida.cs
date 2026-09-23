namespace Tp06.Models
{
    public class Partida
    {
        public int Id { get; set; }
        public int IdJugador { get; set; }
        public int IdSalaActual { get; set; }
        public DateTime FechaInicio { get; set; }
        public DateTime? FechaFin { get; set; }
        public int NumeroPartida { get; set; }

        public bool Completada => FechaFin != null;
    }
}
