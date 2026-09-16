namespace Tp05.Models;

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
}