namespace Tp06.Models;

using Microsoft.Data.SqlClient;
using Dapper;

public static class DB
{
    private static string _connectionString =
        @"Server=localhost;Database=LogIn2026SQL;User Id=alumno;Password=alumno;TrustServerCertificate=True;";
        
    public static Jugador? BuscarUsuario(string Nombre, string password)
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
                new
                {
                    Nombre = Nombre,
                    Password = password
                }
            );
        }
    }

    public static Jugador? BuscarUsuarioPorNombre(string Nombre)
    {
        using (SqlConnection connection = new SqlConnection(_connectionString))
        {
            string sql = @"
                SELECT *
                FROM Jugador
                WHERE Nombre = @Nombre";

            return connection.QueryFirstOrDefault<Jugador>(
                sql,
                new
                {
                    Nombre = Nombre
                }
            );
        }
    }

    public static void RegistrarUsuario(Jugador usuario)
    {
        using (SqlConnection connection = new SqlConnection(_connectionString))
        {
            string sql = @"
                INSERT INTO Jugador
                (Nombre, Password)
                VALUES
                (@Nombre, @Password)";

            connection.Execute(sql, usuario);
        }
    }

    // BUSCAR GUARDADOS

    public static List<Partida> buscarGuardados(int idJugador)
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
                new
                {
                    IdJugador = idJugador
                }
            ).ToList();
        }
    }


    // BUSCAR PARTIDA

    public static Partida? buscarPartida(int id, int idJugador)
    {
        using (SqlConnection connection = new SqlConnection(_connectionString))
        {
            string sql = @"
                SELECT *
                FROM Partida
                WHERE Id = @Id
                AND IdJugador = @IdJugador";

            return connection.QueryFirstOrDefault<Partida>(
                sql,
                new
                {
                    Id = id,
                    IdJugador = idJugador
                }
            );
        }
    }


    // EXISTE PARTIDA

    public static bool existePartida(
        int idJugador,
        int numeroPartida)
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
                new
                {
                    IdJugador = idJugador,
                    NumeroPartida = numeroPartida
                }
            );

            return cantidad > 0;
        }
    }


    // CREAR PARTIDA

    public static Partida crearPartida(
        int idJugador,
        int numeroPartida,
        int idSala)
    {
        using (SqlConnection connection = new SqlConnection(_connectionString))
        {
            string sql = @"
                INSERT INTO Partida
                (
                    IdJugador,
                    IdSalaActual,
                    FechaInicio,
                    FechaFin,
                    NumeroPartida
                )
                OUTPUT INSERTED.*
                VALUES
                (
                    @IdJugador,
                    @IdSalaActual,
                    GETDATE(),
                    NULL,
                    @NumeroPartida
                )";

            return connection.QuerySingle<Partida>(
                sql,
                new
                {
                    IdJugador = idJugador,
                    IdSalaActual = idSala,
                    NumeroPartida = numeroPartida
                }
            );
        }
    }


    // GUARDAR PARTIDA

    public static void guardarPartida(
        int idPartida,
        int idSala)
    {
        using (SqlConnection connection = new SqlConnection(_connectionString))
        {
            string sql = @"
                UPDATE Partida
                SET IdSalaActual = @IdSala
                WHERE Id = @IdPartida";

            connection.Execute(
                sql,
                new
                {
                    IdPartida = idPartida,
                    IdSala = idSala
                }
            );
        }
    }


    // PARTIDA PERTENECE AL JUGADOR

    public static bool partidaPerteneceAJugador(
        int idPartida,
        int idJugador)
    {
        using (SqlConnection connection = new SqlConnection(_connectionString))
        {
            string sql = @"
                SELECT COUNT(*)
                FROM Partida
                WHERE Id = @IdPartida
                AND IdJugador = @IdJugador";

            int cantidad = connection.ExecuteScalar<int>(
                sql,
                new
                {
                    IdPartida = idPartida,
                    IdJugador = idJugador
                }
            );

            return cantidad > 0;
        }
    }


    // GUARDAR PROGRESO

    public static void guardarProgreso(
        int idPartida,
        string clave,
        string valor)
    {
        using (SqlConnection connection = new SqlConnection(_connectionString))
        {
            string sql = @"
                IF EXISTS
                (
                    SELECT 1
                    FROM Progreso
                    WHERE IdPartida = @IdPartida
                    AND Clave = @Clave
                )
                BEGIN
                    UPDATE Progreso
                    SET Valor = @Valor
                    WHERE IdPartida = @IdPartida
                    AND Clave = @Clave
                END
                ELSE
                BEGIN
                    INSERT INTO Progreso
                    (
                        IdPartida,
                        Clave,
                        Valor
                    )
                    VALUES
                    (
                        @IdPartida,
                        @Clave,
                        @Valor
                    )
                END";

            connection.Execute(
                sql,
                new
                {
                    IdPartida = idPartida,
                    Clave = clave,
                    Valor = valor
                }
            );
        }
    }


    // BUSCAR PROGRESO

    public static string? buscarProgreso(
        int idPartida,
        string clave)
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
                new
                {
                    IdPartida = idPartida,
                    Clave = clave
                }
            );
        }
    }


    // AGREGAR OBJETO AL INVENTARIO

    public static void agregarObjetoInventario(
        int idPartida,
        int idObjeto)
    {
        using (SqlConnection connection = new SqlConnection(_connectionString))
        {
            string sql = @"
                INSERT INTO Inventario
                (
                    IdPartida,
                    IdObjeto
                )
                VALUES
                (
                    @IdPartida,
                    @IdObjeto
                )";

            connection.Execute(
                sql,
                new
                {
                    IdPartida = idPartida,
                    IdObjeto = idObjeto
                }
            );
        }
    }


    // TIENE OBJETO

    public static bool tieneObjeto(
        int idPartida,
        int idObjeto)
    {
        using (SqlConnection connection = new SqlConnection(_connectionString))
        {
            string sql = @"
                SELECT COUNT(*)
                FROM Inventario
                WHERE IdPartida = @IdPartida
                AND IdObjeto = @IdObjeto";

            int cantidad = connection.ExecuteScalar<int>(
                sql,
                new
                {
                    IdPartida = idPartida,
                    IdObjeto = idObjeto
                }
            );

            return cantidad > 0;
        }
    }


    // USAR OBJETO

    public static void usarObjeto(
        int idPartida,
        int idObjeto)
    {
        using (SqlConnection connection = new SqlConnection(_connectionString))
        {
            string sql = @"
                DELETE FROM Inventario
                WHERE IdPartida = @IdPartida
                AND IdObjeto = @IdObjeto";

            connection.Execute(
                sql,
                new
                {
                    IdPartida = idPartida,
                    IdObjeto = idObjeto
                }
            );
        }
    }


    // COMPLETAR PARTIDA

    public static void completarPartida(int idPartida)
    {
        using (SqlConnection connection = new SqlConnection(_connectionString))
        {
            string sql = @"
                UPDATE Partida
                SET FechaFin = GETDATE()
                WHERE Id = @IdPartida";

            connection.Execute(
                sql,
                new
                {
                    IdPartida = idPartida
                }
            );
        }
    }


    // PERDER PARTIDA

    public static void perderPartida(int idPartida)
    {
        using (SqlConnection connection = new SqlConnection(_connectionString))
        {
            string sql = @"
                UPDATE Partida
                SET FechaFin = GETDATE()
                WHERE Id = @IdPartida";

            connection.Execute(
                sql,
                new
                {
                    IdPartida = idPartida
                }
            );
        }
    }


    // BUSCAR SALA

    public static Sala? buscarSala(int numeroSala)
    {
        using (SqlConnection connection = new SqlConnection(_connectionString))
        {
            string sql = @"
                SELECT *
                FROM Sala
                WHERE Numero = @Numero";

            return connection.QueryFirstOrDefault<Sala>(
                sql,
                new
                {
                    Numero = numeroSala
                }
            );
        }
    }


    // BUSCAR INVENTARIO

    public static List<Objeto> buscarInventario(int idPartida)
    {
        using (SqlConnection connection = new SqlConnection(_connectionString))
        {
            string sql = @"
                SELECT Objeto.*
                FROM Inventario
                INNER JOIN Objeto
                    ON Inventario.IdObjeto = Objeto.Id
                WHERE Inventario.IdPartida = @IdPartida";

            return connection.Query<Objeto>(
                sql,
                new
                {
                    IdPartida = idPartida
                }
            ).ToList();
        }
    }
}