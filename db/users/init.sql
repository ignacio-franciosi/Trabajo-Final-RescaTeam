-- Crear base de datos si no existe
CREATE DATABASE IF NOT EXISTS usersDB;
USE usersDB;

-- Crear tabla users
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(300) NOT NULL,
    surname VARCHAR(300) NOT NULL,
    dni INT NOT NULL,
    email VARCHAR(500) NOT NULL UNIQUE,
    phone VARCHAR(100),
    password VARCHAR(200) NOT NULL,
    type BOOLEAN NOT NULL,
    suspended BOOLEAN NOT NULL

);