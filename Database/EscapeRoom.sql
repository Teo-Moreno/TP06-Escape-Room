-- Base de datos de The Asylum.
-- Crea solo lo que falta: se puede correr sobre una base existente sin perder datos.

IF DB_ID('Escape Room') IS NULL
    CREATE DATABASE [Escape Room];
GO

USE [Escape Room];
GO

IF OBJECT_ID('Jugador') IS NULL
CREATE TABLE Jugador (
    Id       INT IDENTITY(1,1) PRIMARY KEY,
    Nombre   NVARCHAR(50)  NOT NULL UNIQUE,
    Password NVARCHAR(100) NOT NULL
);
GO

IF OBJECT_ID('Partida') IS NULL
CREATE TABLE Partida (
    Id            INT IDENTITY(1,1) PRIMARY KEY,
    IdJugador     INT      NOT NULL REFERENCES Jugador(Id),
    IdSalaActual  INT      NOT NULL DEFAULT 1,
    FechaInicio   DATETIME NOT NULL DEFAULT GETDATE(),
    FechaFin      DATETIME NULL,
    NumeroPartida INT      NOT NULL,
    CONSTRAINT UQ_Partida_Slot UNIQUE (IdJugador, NumeroPartida)
);
GO

-- Arreglos para bases creadas antes: FechaFin tiene que aceptar NULL (partida sin terminar),
-- las fechas guardan también la hora y NumeroPartida es un número.
IF COLUMNPROPERTY(OBJECT_ID('Partida'), 'FechaFin', 'AllowsNull') = 0
    OR EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Partida' AND COLUMN_NAME = 'FechaFin' AND DATA_TYPE <> 'datetime')
    ALTER TABLE Partida ALTER COLUMN FechaFin DATETIME NULL;
GO

IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Partida' AND COLUMN_NAME = 'FechaInicio' AND DATA_TYPE <> 'datetime')
    ALTER TABLE Partida ALTER COLUMN FechaInicio DATETIME NOT NULL;
GO

IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Partida' AND COLUMN_NAME = 'NumeroPartida' AND DATA_TYPE <> 'int')
    ALTER TABLE Partida ALTER COLUMN NumeroPartida INT NOT NULL;
GO

IF OBJECT_ID('Progreso') IS NULL
CREATE TABLE Progreso (
    Id        INT IDENTITY(1,1) PRIMARY KEY,
    IdPartida INT           NOT NULL REFERENCES Partida(Id),
    Clave     NVARCHAR(50)  NOT NULL,
    Valor     NVARCHAR(200) NOT NULL,
    CONSTRAINT UQ_Progreso_Clave UNIQUE (IdPartida, Clave)
);
GO
