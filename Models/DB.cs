namespace Tp06.Models;

using Microsoft.Data.SqlClient;
using Dapper;

public static class DB
{
    private static string _connectionString =
        @"Server=localhost;Database=Escape Room;User Id=alumno;Password=alumno;TrustServerCertificate=True;";

    // JUGADORES

    public static Jugador? BuscarJugador(string nombre, string password)
    {
        using (SqlConnection connection = new SqlConnection(_connectionString))
        {
            string sql = @"
                SELECT *
                FROM Jugador
                WHERE Nombre = @Nombre
                AND Password = @Password";

            return connection.QueryFirstOrDefault<Jugador>(
                sql,
                new { Nombre = nombre, Password = password }
            );
        }
    }

    public static Jugador? BuscarJugadorPorNombre(string nombre)
    {
        using (SqlConnection connection = new SqlConnection(_connectionString))
        {
            string sql = @"
                SELECT *
                FROM Jugador
                WHERE Nombre = @Nombre";

            return connection.QueryFirstOrDefault<Jugador>(
                sql,
                new { Nombre = nombre }
            );
        }
    }

    public static void RegistrarJugador(Jugador jugador)
    {
        using (SqlConnection connection = new SqlConnection(_connectionString))
        {
            string sql = @"
                INSERT INTO Jugador (Nombre, Password)
                VALUES (@Nombre, @Password)";

            connection.Execute(
                sql,
                new { jugador.Nombre, jugador.Password }
            );
        }
    }

    // PARTIDAS

    public static List<Partida> BuscarPartidas(int idJugador)
    {
        using (SqlConnection connection = new SqlConnection(_connectionString))
        {
            string sql = @"
                SELECT *
                FROM Partida
                WHERE IdJugador = @IdJugador
                ORDER BY NumeroPartida";

            return connection.Query<Partida>(
                sql,
                new { IdJugador = idJugador }
            ).ToList();
        }
    }

    public static Partida? BuscarPartida(int idPartida, int idJugador)
    {
        using (SqlConnection connection = new SqlConnection(_connectionString))
        {
            string sql = @"
                SELECT *
                FROM Partida
                WHERE Id = @IdPartida
                AND IdJugador = @IdJugador";

            return connection.QueryFirstOrDefault<Partida>(
                sql,
                new { IdPartida = idPartida, IdJugador = idJugador }
            );
        }
    }

    public static bool ExistePartida(int idJugador, int numeroPartida)
    {
        using (SqlConnection connection = new SqlConnection(_connectionString))
        {
            string sql = @"
                SELECT COUNT(*)
                FROM Partida
                WHERE IdJugador = @IdJugador
                AND NumeroPartida = @NumeroPartida";

            int cantidad = connection.ExecuteScalar<int>(
                sql,
                new { IdJugador = idJugador, NumeroPartida = numeroPartida }
            );

            return cantidad > 0;
        }
    }

    public static Partida CrearPartida(int idJugador, int numeroPartida)
    {
        using (SqlConnection connection = new SqlConnection(_connectionString))
        {
            string sql = @"
                INSERT INTO Partida (IdJugador, IdSalaActual, FechaInicio, FechaFin, NumeroPartida)
                OUTPUT INSERTED.*
                VALUES (@IdJugador, 1, GETDATE(), NULL, @NumeroPartida)";

            return connection.QuerySingle<Partida>(
                sql,
                new { IdJugador = idJugador, NumeroPartida = numeroPartida }
            );
        }
    }

    public static void ActualizarSala(int idPartida, int idSala)
    {
        using (SqlConnection connection = new SqlConnection(_connectionString))
        {
            string sql = @"
                UPDATE Partida
                SET IdSalaActual = @IdSala
                WHERE Id = @IdPartida";

            connection.Execute(
                sql,
                new { IdPartida = idPartida, IdSala = idSala }
            );
        }
    }

    public static void CompletarPartida(int idPartida)
    {
        using (SqlConnection connection = new SqlConnection(_connectionString))
        {
            string sql = @"
                UPDATE Partida
                SET FechaFin = GETDATE()
                WHERE Id = @IdPartida
                AND FechaFin IS NULL";

            connection.Execute(sql, new { IdPartida = idPartida });
        }
    }

    public static void BorrarPartida(int idPartida)
    {
        using (SqlConnection connection = new SqlConnection(_connectionString))
        {
            string sql = @"
                DELETE FROM Progreso WHERE IdPartida = @IdPartida;

                IF OBJECT_ID('Inventario') IS NOT NULL
                    DELETE FROM Inventario WHERE IdPartida = @IdPartida;

                DELETE FROM Partida WHERE Id = @IdPartida;";

            connection.Execute(sql, new { IdPartida = idPartida });
        }
    }

    // PROGRESO (pistas, objetos y escenas vistas dentro de una partida)

    public static void GuardarProgreso(int idPartida, string clave, string valor)
    {
        using (SqlConnection connection = new SqlConnection(_connectionString))
        {
            string sql = @"
                IF EXISTS (SELECT 1 FROM Progreso WHERE IdPartida = @IdPartida AND Clave = @Clave)
                    UPDATE Progreso
                    SET Valor = @Valor
                    WHERE IdPartida = @IdPartida
                    AND Clave = @Clave
                ELSE
                    INSERT INTO Progreso (IdPartida, Clave, Valor)
                    VALUES (@IdPartida, @Clave, @Valor)";

            connection.Execute(
                sql,
                new { IdPartida = idPartida, Clave = clave, Valor = valor }
            );
        }
    }

    public static string? BuscarProgreso(int idPartida, string clave)
    {
        using (SqlConnection connection = new SqlConnection(_connectionString))
        {
            string sql = @"
                SELECT Valor
                FROM Progreso
                WHERE IdPartida = @IdPartida
                AND Clave = @Clave";

            return connection.QueryFirstOrDefault<string>(
                sql,
                new { IdPartida = idPartida, Clave = clave }
            );
        }
    }
}
