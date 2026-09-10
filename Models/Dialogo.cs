namespace EscapeRoom.Models
{
    public class Dialogo
    {
        public int IdDialogo { get; set; }
        public int IdSala { get; set; }
        public string Personaje { get; set; }
        public string Texto { get; set; }
        public int Orden { get; set; }
    }
}