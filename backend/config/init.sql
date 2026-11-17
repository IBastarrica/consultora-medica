/*
 * @file init.sql
 * @brief Bootstrap de la base de datos consultora_medica_web:
 *        tablas, usuario PoLP, Stored Procedures y datos semilla.
 * @project Consultora Médica
 */

SET NAMES utf8;
SET time_zone = '+00:00';
SET foreign_key_checks = 0;
SET sql_mode = 'NO_AUTO_VALUE_ON_ZERO';

-- 1. Crear base de datos limpia
DROP DATABASE IF EXISTS consultora_medica_web;
CREATE DATABASE consultora_medica_web;
USE consultora_medica_web;

-- 2. Usuario de aplicación (Principio de Menor Privilegio)
CREATE USER IF NOT EXISTS 'consultora_app'@'localhost' IDENTIFIED BY 'consultora_app';
GRANT SELECT, EXECUTE ON consultora_medica_web.* TO 'consultora_app'@'localhost';

-- 3. Tablas maestras y transaccionales
CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(20) NOT NULL UNIQUE
);

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    edad INT NULL,
    nombre VARCHAR(60) NULL,
    apellido VARCHAR(60) NULL,
    ciudad VARCHAR(60) NULL,
    nacionalidad VARCHAR(40) NULL,
    fecha_nacimiento DATE NULL,
    email VARCHAR(120) NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users_roles (
    user_id INT NOT NULL,
    role_id INT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

CREATE TABLE doctores (
    id_doctor INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    nombre VARCHAR(80) NOT NULL,
    especialidad VARCHAR(60) NOT NULL,
    anios_experiencia INT NOT NULL,
    UNIQUE KEY uq_doctor_user (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE turnos (
    id_turno INT AUTO_INCREMENT PRIMARY KEY,
    id_paciente INT NOT NULL,
    id_doctor INT NOT NULL,
    fecha_turno DATE NOT NULL,
    hora_turno TIME NOT NULL,
    estado VARCHAR(20) DEFAULT 'Activo',
    tiempo_estimado_min FLOAT NULL,
    tiempo_atencion_real_min FLOAT NULL,
    notas VARCHAR(255) NULL,
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_paciente) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (id_doctor) REFERENCES doctores(id_doctor) ON DELETE CASCADE
);

CREATE TABLE consultas (
    id_consulta INT AUTO_INCREMENT PRIMARY KEY,
    edad_paciente INT NOT NULL,
    id_doctor INT NOT NULL,
    anios_experiencia_doc INT NOT NULL,
    tiempo_atencion_min FLOAT NOT NULL,
    fecha_consulta DATETIME NOT NULL,
    FOREIGN KEY (id_doctor) REFERENCES doctores(id_doctor) ON DELETE CASCADE
);

-- 4. Roles maestros: admin, medico, analista, paciente
INSERT INTO roles (id, name) VALUES (1, 'admin'), (2, 'medico'), (3, 'analista'), (4, 'paciente');

-- 5. Datos semilla de usuarios (contraseña en texto plano: '123456' para todos)
INSERT INTO users (id, username, password, edad, nombre, apellido, ciudad, nacionalidad, fecha_nacimiento, email) VALUES
(1, 'admin',    '$2b$10$CG97.O31GbElVJZoJMIiUu3Rgm0i68aa5lKL.OMi3qH51Th61EFI.', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(2, 'dr.perez',    '$2b$10$CG97.O31GbElVJZoJMIiUu3Rgm0i68aa5lKL.OMi3qH51Th61EFI.', NULL, 'Santiago', 'Perez', 'Mar del Plata', 'Argentina', '1975-04-12', 'sperez@clinica.com'),
(3, 'dra.gomez',   '$2b$10$CG97.O31GbElVJZoJMIiUu3Rgm0i68aa5lKL.OMi3qH51Th61EFI.', NULL, 'Mariana', 'Gomez', 'Mar del Plata', 'Argentina', '1982-09-30', 'mgomez@clinica.com'),
(4, 'dr.rodriguez','$2b$10$CG97.O31GbElVJZoJMIiUu3Rgm0i68aa5lKL.OMi3qH51Th61EFI.', NULL, 'Roberto', 'Rodriguez', 'Buenos Aires', 'Argentina', '1968-01-25', 'rrodriguez@clinica.com'),
(5, 'dra.blanco',  '$2b$10$CG97.O31GbElVJZoJMIiUu3Rgm0i68aa5lKL.OMi3qH51Th61EFI.', NULL, 'Camila', 'Blanco', 'La Plata', 'Argentina', '1990-06-14', 'cblanco@clinica.com'),
(6, 'dr.martinez', '$2b$10$CG97.O31GbElVJZoJMIiUu3Rgm0i68aa5lKL.OMi3qH51Th61EFI.', NULL, 'Javier', 'Martinez', 'Mar del Plata', 'Argentina', '1978-11-08', 'jmartinez@clinica.com'),
(7, 'analista',    '$2b$10$CG97.O31GbElVJZoJMIiUu3Rgm0i68aa5lKL.OMi3qH51Th61EFI.', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(8, 'pepe',        '$2b$10$CG97.O31GbElVJZoJMIiUu3Rgm0i68aa5lKL.OMi3qH51Th61EFI.', 45, 'Ivan', 'Bastarrica', 'Mar del Plata', 'Argentina', '1981-03-15', 'ibastarrica@clinica.com'),
(9, 'maria',       '$2b$10$CG97.O31GbElVJZoJMIiUu3Rgm0i68aa5lKL.OMi3qH51Th61EFI.', 68, 'Maria', 'Rossi', 'Buenos Aires', 'Argentina', '1958-07-20', 'mrossi@clinica.com'),
(10, 'lmartinez',  '$2b$10$CG97.O31GbElVJZoJMIiUu3Rgm0i68aa5lKL.OMi3qH51Th61EFI.', 34, 'Laura', 'Martinez', 'Mar del Plata', 'Argentina', '1992-05-11', 'lmartinez@clinica.com'),
(11, 'gfernandez', '$2b$10$CG97.O31GbElVJZoJMIiUu3Rgm0i68aa5lKL.OMi3qH51Th61EFI.', 52, 'Gustavo', 'Fernandez', 'Balcarce', 'Argentina', '1974-09-23', 'gfernandez@clinica.com'),
(12, 'rlopez',     '$2b$10$CG97.O31GbElVJZoJMIiUu3Rgm0i68aa5lKL.OMi3qH51Th61EFI.', 27, 'Rocio', 'Lopez', 'Mar del Plata', 'Argentina', '1999-01-30', 'rlopez@clinica.com'),
(13, 'csanchez',   '$2b$10$CG97.O31GbElVJZoJMIiUu3Rgm0i68aa5lKL.OMi3qH51Th61EFI.', 61, 'Carlos', 'Sanchez', 'Miramar', 'Argentina', '1965-06-17', 'csanchez@clinica.com'),
(14, 'dtorres',    '$2b$10$CG97.O31GbElVJZoJMIiUu3Rgm0i68aa5lKL.OMi3qH51Th61EFI.', 41, 'Diego', 'Torres', 'Mar del Plata', 'Argentina', '1985-12-02', 'dtorres@clinica.com'),
(15, 'pvargas',    '$2b$10$CG97.O31GbElVJZoJMIiUu3Rgm0i68aa5lKL.OMi3qH51Th61EFI.', 19, 'Paula', 'Vargas', 'Mar del Plata', 'Argentina', '2007-04-25', 'pvargas@clinica.com'),
(16, 'mfernandez', '$2b$10$CG97.O31GbElVJZoJMIiUu3Rgm0i68aa5lKL.OMi3qH51Th61EFI.', 73, 'Marta', 'Fernandez', 'Necochea', 'Argentina', '1953-10-08', 'mfernandez@clinica.com'),
(17, 'jgonzalez',  '$2b$10$CG97.O31GbElVJZoJMIiUu3Rgm0i68aa5lKL.OMi3qH51Th61EFI.', 36, 'Jorge', 'Gonzalez', 'Mar del Plata', 'Argentina', '1990-02-14', 'jgonzalez@clinica.com'),
(18, 'cruiz',      '$2b$10$CG97.O31GbElVJZoJMIiUu3Rgm0i68aa5lKL.OMi3qH51Th61EFI.', 8, 'Camila', 'Ruiz', 'Mar del Plata', 'Argentina', '2018-08-19', 'cruiz@clinica.com'),
(19, 'aalvarez',   '$2b$10$CG97.O31GbElVJZoJMIiUu3Rgm0i68aa5lKL.OMi3qH51Th61EFI.', 55, 'Ana', 'Alvarez', 'Mar del Plata', 'Argentina', '1971-03-27', 'aalvarez@clinica.com'),
(20, 'hcastro',    '$2b$10$CG97.O31GbElVJZoJMIiUu3Rgm0i68aa5lKL.OMi3qH51Th61EFI.', 47, 'Hernan', 'Castro', 'Tandil', 'Argentina', '1979-11-05', 'hcastro@clinica.com'),
(21, 'bdominguez', '$2b$10$CG97.O31GbElVJZoJMIiUu3Rgm0i68aa5lKL.OMi3qH51Th61EFI.', 29, 'Belen', 'Dominguez', 'Mar del Plata', 'Argentina', '1997-07-09', 'bdominguez@clinica.com'),
(22, 'fsosa',      '$2b$10$CG97.O31GbElVJZoJMIiUu3Rgm0i68aa5lKL.OMi3qH51Th61EFI.', 66, 'Felix', 'Sosa', 'Mar del Plata', 'Argentina', '1960-01-21', 'fsosa@clinica.com'),
(23, 'lmedina',    '$2b$10$CG97.O31GbElVJZoJMIiUu3Rgm0i68aa5lKL.OMi3qH51Th61EFI.', 23, 'Lucia', 'Medina', 'Mar del Plata', 'Argentina', '2003-09-15', 'lmedina@clinica.com'),
(24, 'rsilva',     '$2b$10$CG97.O31GbElVJZoJMIiUu3Rgm0i68aa5lKL.OMi3qH51Th61EFI.', 58, 'Ricardo', 'Silva', 'Mar del Plata', 'Argentina', '1968-05-29', 'rsilva@clinica.com'),
(25, 'mramirez',   '$2b$10$CG97.O31GbElVJZoJMIiUu3Rgm0i68aa5lKL.OMi3qH51Th61EFI.', 31, 'Milagros', 'Ramirez', 'Mar del Plata', 'Argentina', '1995-12-12', 'mramirez@clinica.com'),
(26, 'eflores',    '$2b$10$CG97.O31GbElVJZoJMIiUu3Rgm0i68aa5lKL.OMi3qH51Th61EFI.', 76, 'Estela', 'Flores', 'Mar del Plata', 'Argentina', '1950-06-03', 'eflores@clinica.com'),
(27, 'gnunez',     '$2b$10$CG97.O31GbElVJZoJMIiUu3Rgm0i68aa5lKL.OMi3qH51Th61EFI.', 12, 'Gabriel', 'Nunez', 'Mar del Plata', 'Argentina', '2014-02-27', 'gnunez@clinica.com');

INSERT INTO users_roles (user_id, role_id) VALUES
(1, 1), (2, 2), (3, 2), (4, 2), (5, 2), (6, 2), (7, 3), (8, 4), (9, 4),
(10, 4), (11, 4), (12, 4), (13, 4), (14, 4), (15, 4), (16, 4), (17, 4), (18, 4),
(19, 4), (20, 4), (21, 4), (22, 4), (23, 4), (24, 4), (25, 4), (26, 4), (27, 4);

-- 6. Doctores (mismos 5 profesionales del TP original)
INSERT INTO doctores (id_doctor, user_id, nombre, especialidad, anios_experiencia) VALUES
(1, 2, 'Dr. Santiago Perez',     'Clinica Medica',    18),
(2, 3, 'Dra. Mariana Gomez',     'Pediatria',          8),
(3, 4, 'Dr. Roberto Rodriguez',  'Cardiologia',       24),
(4, 5, 'Dra. Camila Blanco',     'Medicina General',   4),
(5, 6, 'Dr. Javier Martinez',    'Traumatologia',     12);

-- 7. Turnos iniciales: históricos Atendidos (para análisis de espera/demora) y futuros Activos
INSERT INTO turnos (id_paciente, id_doctor, fecha_turno, hora_turno, estado, tiempo_estimado_min, tiempo_atencion_real_min) VALUES
-- Pacientes semilla originales (futuros)
(8, 1, CURDATE() + INTERVAL 1 DAY, '09:00:00', 'Activo', 22.5, NULL),
(8, 3, CURDATE() + INTERVAL 2 DAY, '10:30:00', 'Activo', 32.0, NULL),
(9, 4, CURDATE() + INTERVAL 1 DAY, '11:00:00', 'Activo', 24.0, NULL),
(9, 2, CURDATE() + INTERVAL 3 DAY, '09:30:00', 'Activo', 18.0, NULL),
-- Atendidos (tiempo real cargado por el médico) para el análisis estadístico
(10, 1, CURDATE() - INTERVAL 9 DAY, '09:00:00', 'Atendido', 26.6, 31.0),
(11, 1, CURDATE() - INTERVAL 9 DAY, '09:45:00', 'Atendido', 33.8, 35.0),
(21, 1, CURDATE() - INTERVAL 6 DAY, '08:30:00', 'Atendido', 24.6, 22.0),
(15, 1, CURDATE() - INTERVAL 6 DAY, '09:15:00', 'Atendido', 20.6, 26.0),
(17, 1, CURDATE() - INTERVAL 2 DAY, '11:00:00', 'Atendido', 27.4, 29.5),
(10, 1, CURDATE() - INTERVAL 5 DAY, '09:00:00', 'Atendido', 26.6, 28.0),
(18, 2, CURDATE() - INTERVAL 7 DAY, '08:30:00', 'Atendido', 16.2, 18.0),
(27, 2, CURDATE() - INTERVAL 7 DAY, '09:10:00', 'Atendido', 17.8, 19.5),
(12, 2, CURDATE() - INTERVAL 3 DAY, '10:00:00', 'Atendido', 23.8, 26.0),
(23, 2, CURDATE() - INTERVAL 1 DAY, '09:30:00', 'Atendido', 22.2, 20.0),
(15, 2, CURDATE() - INTERVAL 1 DAY, '10:30:00', 'Atendido', 20.6, 21.0),
(17, 2, CURDATE() - INTERVAL 9 DAY, '09:30:00', 'Atendido', 27.4, 26.0),
(22, 3, CURDATE() - INTERVAL 8 DAY, '10:00:00', 'Atendido', 39.4, 40.0),
(16, 3, CURDATE() - INTERVAL 8 DAY, '10:50:00', 'Atendido', 42.2, 44.0),
(26, 3, CURDATE() - INTERVAL 8 DAY, '11:40:00', 'Atendido', 43.4, 43.0),
(11, 3, CURDATE() - INTERVAL 2 DAY, '10:00:00', 'Atendido', 33.8, 30.5),
(16, 3, CURDATE() - INTERVAL 5 DAY, '11:00:00', 'Atendido', 42.2, 45.0),
(22, 3, CURDATE() - INTERVAL 9 DAY, '08:30:00', 'Atendido', 39.4, 43.0),
(24, 4, CURDATE() - INTERVAL 4 DAY, '09:00:00', 'Atendido', 36.2, 33.0),
(19, 4, CURDATE() - INTERVAL 4 DAY, '09:50:00', 'Atendido', 35.0, 36.5),
(13, 4, CURDATE() - INTERVAL 8 DAY, '11:00:00', 'Atendido', 37.4, 41.0),
(19, 4, CURDATE() - INTERVAL 1 DAY, '11:30:00', 'Atendido', 35.0, 40.0),
(24, 4, CURDATE() - INTERVAL 6 DAY, '08:30:00', 'Atendido', 36.2, 39.5),
(20, 5, CURDATE() - INTERVAL 3 DAY, '10:00:00', 'Atendido', 31.8, 30.0),
(14, 5, CURDATE() - INTERVAL 3 DAY, '10:45:00', 'Atendido', 29.4, 32.0),
(25, 5, CURDATE() - INTERVAL 5 DAY, '09:30:00', 'Atendido', 25.4, 24.0),
(14, 5, CURDATE() - INTERVAL 8 DAY, '08:30:00', 'Atendido', 29.4, 27.0),
(20, 5, CURDATE() - INTERVAL 7 DAY, '11:00:00', 'Atendido', 31.8, 36.0),
-- Futuros Activos
(11, 3, CURDATE() + INTERVAL 1 DAY, '09:30:00', 'Activo', 33.8, NULL),
(21, 1, CURDATE() + INTERVAL 1 DAY, '10:00:00', 'Activo', 24.6, NULL),
(23, 2, CURDATE() + INTERVAL 1 DAY, '11:00:00', 'Activo', 22.2, NULL),
(25, 5, CURDATE() + INTERVAL 2 DAY, '08:30:00', 'Activo', 25.4, NULL),
(13, 4, CURDATE() + INTERVAL 2 DAY, '09:30:00', 'Activo', 37.4, NULL),
(26, 3, CURDATE() + INTERVAL 2 DAY, '10:30:00', 'Activo', 43.4, NULL),
(12, 2, CURDATE() + INTERVAL 3 DAY, '09:00:00', 'Activo', 23.8, NULL),
(14, 5, CURDATE() + INTERVAL 3 DAY, '10:00:00', 'Activo', 29.4, NULL),
(19, 4, CURDATE() + INTERVAL 3 DAY, '11:00:00', 'Activo', 35.0, NULL),
(16, 3, CURDATE() + INTERVAL 3 DAY, '09:30:00', 'Activo', 42.2, NULL),
(17, 1, CURDATE() + INTERVAL 4 DAY, '09:30:00', 'Activo', 27.4, NULL),
(20, 5, CURDATE() + INTERVAL 4 DAY, '10:30:00', 'Activo', 31.8, NULL),
(22, 3, CURDATE() + INTERVAL 4 DAY, '09:00:00', 'Activo', 39.4, NULL),
(24, 4, CURDATE() + INTERVAL 5 DAY, '10:00:00', 'Activo', 36.2, NULL),
(27, 2, CURDATE() + INTERVAL 5 DAY, '11:00:00', 'Activo', 17.8, NULL),
(10, 1, CURDATE() + INTERVAL 5 DAY, '11:30:00', 'Activo', 26.6, NULL),
(18, 2, CURDATE() + INTERVAL 4 DAY, '10:00:00', 'Activo', 16.2, NULL);

-- 8. Muestra estadística: exactamente 100 consultas médicas (n = 100)
INSERT INTO consultas (id_consulta, edad_paciente, id_doctor, anios_experiencia_doc, tiempo_atencion_min, fecha_consulta) VALUES
(1, 18, 4, 4, 15.5, '2026-08-01 08:00:00'),
(2, 65, 3, 24, 34.0, '2026-08-01 08:15:00'),
(3, 42, 1, 18, 22.0, '2026-08-01 08:30:00'),
(4, 9, 2, 8, 18.5, '2026-08-01 08:45:00'),
(5, 55, 5, 12, 26.0, '2026-08-01 09:00:00'),
(6, 23, 4, 4, 16.0, '2026-08-01 09:15:00'),
(7, 71, 3, 24, 38.5, '2026-08-01 09:30:00'),
(8, 38, 1, 18, 20.5, '2026-08-01 09:45:00'),
(9, 6, 2, 8, 19.0, '2026-08-01 10:00:00'),
(10, 48, 5, 12, 24.5, '2026-08-01 10:15:00'),
(11, 29, 4, 4, 17.5, '2026-08-01 10:30:00'),
(12, 78, 3, 24, 41.0, '2026-08-01 10:45:00'),
(13, 50, 1, 18, 25.0, '2026-08-01 11:00:00'),
(14, 4, 2, 8, 21.0, '2026-08-01 11:15:00'),
(15, 60, 5, 12, 28.0, '2026-08-01 11:30:00'),
(16, 22, 4, 4, 15.0, '2026-08-01 11:45:00'),
(17, 68, 3, 24, 36.0, '2026-08-01 12:00:00'),
(18, 45, 1, 18, 23.5, '2026-08-01 12:15:00'),
(19, 11, 2, 8, 17.0, '2026-08-01 12:30:00'),
(20, 34, 5, 12, 21.5, '2026-08-01 12:45:00'),
(21, 25, 4, 4, 18.0, '2026-08-02 08:00:00'),
(22, 74, 3, 24, 39.0, '2026-08-02 08:15:00'),
(23, 52, 1, 18, 26.5, '2026-08-02 08:30:00'),
(24, 8, 2, 8, 18.0, '2026-08-02 08:45:00'),
(25, 63, 5, 12, 29.5, '2026-08-02 09:00:00'),
(26, 19, 4, 4, 14.5, '2026-08-02 09:15:00'),
(27, 82, 3, 24, 43.0, '2026-08-02 09:30:00'),
(28, 41, 1, 18, 21.0, '2026-08-02 09:45:00'),
(29, 5, 2, 8, 20.0, '2026-08-02 10:00:00'),
(30, 56, 5, 12, 27.0, '2026-08-02 10:15:00'),
(31, 31, 4, 4, 19.0, '2026-08-02 10:30:00'),
(32, 69, 3, 24, 37.0, '2026-08-02 10:45:00'),
(33, 47, 1, 18, 24.0, '2026-08-02 11:00:00'),
(34, 7, 2, 8, 17.5, '2026-08-02 11:15:00'),
(35, 39, 5, 12, 22.5, '2026-08-02 11:30:00'),
(36, 27, 4, 4, 16.5, '2026-08-02 11:45:00'),
(37, 72, 3, 24, 38.0, '2026-08-02 12:00:00'),
(38, 54, 1, 18, 27.0, '2026-08-02 12:15:00'),
(39, 12, 2, 8, 16.5, '2026-08-02 12:30:00'),
(40, 67, 5, 12, 31.0, '2026-08-02 12:45:00'),
(41, 20, 4, 4, 15.0, '2026-08-03 08:00:00'),
(42, 79, 3, 24, 42.0, '2026-08-03 08:15:00'),
(43, 44, 1, 18, 22.5, '2026-08-03 08:30:00'),
(44, 10, 2, 8, 18.0, '2026-08-03 08:45:00'),
(45, 58, 5, 12, 27.5, '2026-08-03 09:00:00'),
(46, 28, 4, 4, 17.0, '2026-08-03 09:15:00'),
(47, 66, 3, 24, 35.0, '2026-08-03 09:30:00'),
(48, 49, 1, 18, 25.0, '2026-08-03 09:45:00'),
(49, 3, 2, 8, 22.0, '2026-08-03 10:00:00'),
(50, 43, 5, 12, 23.0, '2026-08-03 10:15:00'),
(51, 35, 4, 4, 20.0, '2026-08-03 10:30:00'),
(52, 75, 3, 24, 40.0, '2026-08-03 10:45:00'),
(53, 53, 1, 18, 26.0, '2026-08-03 11:00:00'),
(54, 13, 2, 8, 16.0, '2026-08-03 11:15:00'),
(55, 62, 5, 12, 29.0, '2026-08-03 11:30:00'),
(56, 24, 4, 4, 16.0, '2026-08-03 11:45:00'),
(57, 70, 3, 24, 37.5, '2026-08-03 12:00:00'),
(58, 46, 1, 18, 23.0, '2026-08-03 12:15:00'),
(59, 6, 2, 8, 19.5, '2026-08-03 12:30:00'),
(60, 50, 5, 12, 25.5, '2026-08-03 12:45:00'),
(61, 33, 4, 4, 18.5, '2026-08-04 08:00:00'),
(62, 81, 3, 24, 42.5, '2026-08-04 08:15:00'),
(63, 57, 1, 18, 28.0, '2026-08-04 08:30:00'),
(64, 4, 2, 8, 20.5, '2026-08-04 08:45:00'),
(65, 65, 5, 12, 30.5, '2026-08-04 09:00:00'),
(66, 21, 4, 4, 15.5, '2026-08-04 09:15:00'),
(67, 73, 3, 24, 38.5, '2026-08-04 09:30:00'),
(68, 40, 1, 18, 21.5, '2026-08-04 09:45:00'),
(69, 9, 2, 8, 18.5, '2026-08-04 10:00:00'),
(70, 51, 5, 12, 26.0, '2026-08-04 10:15:00'),
(71, 30, 4, 4, 17.5, '2026-08-04 10:30:00'),
(72, 77, 3, 24, 40.5, '2026-08-04 10:45:00'),
(73, 48, 1, 18, 24.5, '2026-08-04 11:00:00'),
(74, 5, 2, 8, 19.5, '2026-08-04 11:15:00'),
(75, 59, 5, 12, 28.5, '2026-08-04 11:30:00'),
(76, 26, 4, 4, 16.0, '2026-08-04 11:45:00'),
(77, 67, 3, 24, 36.5, '2026-08-04 12:00:00'),
(78, 51, 1, 18, 25.5, '2026-08-04 12:15:00'),
(79, 11, 2, 8, 17.0, '2026-08-04 12:30:00'),
(80, 37, 5, 12, 22.0, '2026-08-04 12:45:00'),
(81, 22, 4, 4, 15.0, '2026-08-05 08:00:00'),
(82, 84, 3, 24, 44.0, '2026-08-05 08:15:00'),
(83, 43, 1, 18, 22.0, '2026-08-05 08:30:00'),
(84, 7, 2, 8, 18.0, '2026-08-05 08:45:00'),
(85, 64, 5, 12, 30.0, '2026-08-05 09:00:00'),
(86, 32, 4, 4, 18.0, '2026-08-05 09:15:00'),
(87, 76, 3, 24, 39.5, '2026-08-05 09:30:00'),
(88, 55, 1, 18, 27.5, '2026-08-05 09:45:00'),
(89, 8, 2, 8, 18.5, '2026-08-05 10:00:00'),
(90, 46, 5, 12, 24.0, '2026-08-05 10:15:00'),
(91, 19, 4, 4, 14.0, '2026-08-05 10:30:00'),
(92, 70, 3, 24, 37.0, '2026-08-05 10:45:00'),
(93, 36, 1, 18, 20.0, '2026-08-05 11:00:00'),
(94, 14, 2, 8, 16.0, '2026-08-05 11:15:00'),
(95, 61, 5, 12, 28.5, '2026-08-05 11:30:00'),
(96, 25, 4, 4, 16.5, '2026-08-05 11:45:00'),
(97, 80, 3, 24, 41.5, '2026-08-05 12:00:00'),
(98, 45, 1, 18, 52.0, '2026-08-05 12:15:00'),
(99, 72, 4, 4, 8.5, '2026-08-05 12:30:00'),
(100, 58, 5, 12, 26.5, '2026-08-05 12:45:00');

-- 8.5. Historias Clínicas de pacientes (1 a 1)
CREATE TABLE historias_clinicas (
    id_historia INT AUTO_INCREMENT PRIMARY KEY,
    id_paciente INT NOT NULL,
    grupo_sanguineo VARCHAR(5) NULL,
    alergias VARCHAR(255) NULL,
    medicacion_actual VARCHAR(255) NULL,
    antecedentes VARCHAR(255) NULL,
    observaciones VARCHAR(500) NULL,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_historia_paciente (id_paciente),
    FOREIGN KEY (id_paciente) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO historias_clinicas (id_paciente, grupo_sanguineo, alergias, medicacion_actual, antecedentes, observaciones) VALUES
(8, 'A+', 'Penicilina', 'Losartan 50mg', 'Hipertension arterial', 'Paciente en control periodico de presion arterial. Sin otras comorbilidades.'),
(9, 'O-', 'Ninguna', 'Levotiroxina 100mcg', 'Hipotiroidismo', 'Control anual de funcion tiroidea. Valores estables.');

-- 9. Procedimientos Almacenados
DELIMITER //

CREATE PROCEDURE sp_find_user_by_username(IN p_username VARCHAR(50))
BEGIN
    SELECT u.id, u.username, u.password, u.edad, u.nombre, u.apellido, u.ciudad,
           u.nacionalidad, u.fecha_nacimiento, u.email, u.activo, r.name AS role
    FROM users u
    JOIN users_roles ur ON u.id = ur.user_id
    JOIN roles r ON ur.role_id = r.id
    WHERE u.username = p_username
    LIMIT 1;
END //

CREATE PROCEDURE sp_find_user_by_id(IN p_id INT)
BEGIN
    SELECT u.id, u.username, u.edad, u.nombre, u.apellido, u.ciudad,
           u.nacionalidad, u.fecha_nacimiento, u.email, u.activo, r.name AS role
    FROM users u
    JOIN users_roles ur ON u.id = ur.user_id
    JOIN roles r ON ur.role_id = r.id
    WHERE u.id = p_id
    LIMIT 1;
END //

CREATE PROCEDURE sp_create_user(
    IN p_username VARCHAR(50),
    IN p_password VARCHAR(255),
    IN p_role_name VARCHAR(20),
    IN p_edad INT,
    IN p_nombre VARCHAR(60),
    IN p_apellido VARCHAR(60),
    IN p_ciudad VARCHAR(60),
    IN p_nacionalidad VARCHAR(40),
    IN p_fecha_nacimiento DATE,
    IN p_email VARCHAR(120)
)
BEGIN
    DECLARE v_user_id INT;
    DECLARE v_role_id INT;

    INSERT INTO users (username, password, edad, nombre, apellido, ciudad, nacionalidad, fecha_nacimiento, email)
    VALUES (p_username, p_password, p_edad, p_nombre, p_apellido, p_ciudad, p_nacionalidad, p_fecha_nacimiento, p_email);
    SET v_user_id = LAST_INSERT_ID();

    SELECT id INTO v_role_id FROM roles WHERE name = p_role_name;
    INSERT INTO users_roles (user_id, role_id) VALUES (v_user_id, v_role_id);

    SELECT v_user_id AS insertId;
END //

CREATE PROCEDURE sp_find_all_users()
BEGIN
    SELECT u.id, u.username, u.edad, u.nombre, u.apellido, u.ciudad,
           u.nacionalidad, u.fecha_nacimiento, u.email, u.activo, r.name AS role,
           DATE_FORMAT(u.created_at, '%d/%m/%Y %H:%i') AS created_at
    FROM users u
    JOIN users_roles ur ON u.id = ur.user_id
    JOIN roles r ON ur.role_id = r.id
    ORDER BY u.id ASC;
END //

CREATE PROCEDURE sp_update_user_role(IN p_user_id INT, IN p_role_name VARCHAR(20))
BEGIN
    DECLARE v_role_id INT;
    SELECT id INTO v_role_id FROM roles WHERE name = p_role_name;
    UPDATE users_roles SET role_id = v_role_id WHERE user_id = p_user_id;
    SELECT ROW_COUNT() AS affected;
END //

CREATE PROCEDURE sp_update_user_profile(
    IN p_id INT,
    IN p_nombre VARCHAR(60),
    IN p_apellido VARCHAR(60),
    IN p_ciudad VARCHAR(60),
    IN p_nacionalidad VARCHAR(40),
    IN p_fecha_nacimiento DATE,
    IN p_edad INT,
    IN p_email VARCHAR(120)
)
BEGIN
    UPDATE users
    SET nombre = p_nombre, apellido = p_apellido, ciudad = p_ciudad,
        nacionalidad = p_nacionalidad, fecha_nacimiento = p_fecha_nacimiento,
        edad = p_edad, email = p_email
    WHERE id = p_id;
    SELECT ROW_COUNT() AS affected;
END //

CREATE PROCEDURE sp_delete_user(IN p_id INT)
BEGIN
    DELETE FROM users WHERE id = p_id;
END //

CREATE PROCEDURE sp_deactivate_user(IN p_id INT)
BEGIN
    UPDATE users SET activo = 0 WHERE id = p_id;
    SELECT ROW_COUNT() AS affected;
END //

CREATE PROCEDURE sp_activate_user(IN p_id INT)
BEGIN
    UPDATE users SET activo = 1 WHERE id = p_id;
    SELECT ROW_COUNT() AS affected;
END //

CREATE PROCEDURE sp_find_doctores()
BEGIN
    SELECT d.id_doctor, d.nombre, d.especialidad, d.anios_experiencia, d.user_id, u.username
    FROM doctores d
    LEFT JOIN users u ON d.user_id = u.id
    ORDER BY d.id_doctor ASC;
END //

CREATE PROCEDURE sp_find_doctor_by_user(IN p_user_id INT)
BEGIN
    SELECT d.id_doctor, d.nombre, d.especialidad, d.anios_experiencia, d.user_id
    FROM doctores d
    WHERE d.user_id = p_user_id
    LIMIT 1;
END //

CREATE PROCEDURE sp_create_doctor(
    IN p_nombre VARCHAR(80),
    IN p_especialidad VARCHAR(60),
    IN p_anios INT,
    IN p_user_id INT
)
BEGIN
    INSERT INTO doctores (nombre, especialidad, anios_experiencia, user_id)
    VALUES (p_nombre, p_especialidad, p_anios, p_user_id);
    SELECT LAST_INSERT_ID() AS insertId;
END //

CREATE PROCEDURE sp_update_doctor(
    IN p_id INT,
    IN p_nombre VARCHAR(80),
    IN p_especialidad VARCHAR(60),
    IN p_anios INT,
    IN p_user_id INT
)
BEGIN
    UPDATE doctores
    SET nombre = p_nombre, especialidad = p_especialidad,
        anios_experiencia = p_anios, user_id = p_user_id
    WHERE id_doctor = p_id;
    SELECT ROW_COUNT() AS affected;
END //

CREATE PROCEDURE sp_delete_doctor(IN p_id INT)
BEGIN
    DELETE FROM doctores WHERE id_doctor = p_id;
END //

CREATE PROCEDURE sp_create_turno(
    IN p_id_paciente INT,
    IN p_id_doctor INT,
    IN p_fecha DATE,
    IN p_hora TIME,
    IN p_tiempo FLOAT,
    IN p_cooldown FLOAT
)
BEGIN
    DECLARE v_conflicto INT;
    DECLARE v_duracion_activa FLOAT;

    -- Bloqueo por doctor: evita doble reserva concurrente del mismo slot
    SELECT GET_LOCK(CONCAT('turno_doctor_', p_id_doctor), 10) INTO @cm_lock;

    SET v_duracion_activa = COALESCE(p_tiempo, 15) + COALESCE(p_cooldown, 5);

    -- Conflicto si las ventanas [hora, hora + duración + cooldown] se solapan
    SELECT COUNT(*)
    INTO v_conflicto
    FROM turnos t
    WHERE t.id_doctor = p_id_doctor
      AND t.fecha_turno = p_fecha
      AND t.estado IN ('Activo', 'Confirmado')
      AND TIME(p_hora) < ADDTIME(t.hora_turno, SEC_TO_TIME((COALESCE(t.tiempo_estimado_min, 15) + COALESCE(p_cooldown, 5)) * 60))
      AND ADDTIME(TIME(p_hora), SEC_TO_TIME(v_duracion_activa * 60)) > t.hora_turno;

    IF v_conflicto > 0 THEN
        DO RELEASE_LOCK(CONCAT('turno_doctor_', p_id_doctor));
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'SLOT_OCUPADO';
    END IF;

    INSERT INTO turnos (id_paciente, id_doctor, fecha_turno, hora_turno, estado, tiempo_estimado_min)
    VALUES (p_id_paciente, p_id_doctor, p_fecha, p_hora, 'Activo', p_tiempo);

    DO RELEASE_LOCK(CONCAT('turno_doctor_', p_id_doctor));
    SELECT LAST_INSERT_ID() AS insertId;
END //

CREATE PROCEDURE sp_find_turnos_by_patient(IN p_id_paciente INT)
BEGIN
    SELECT t.id_turno, DATE_FORMAT(t.fecha_turno, '%d/%m/%Y') AS fecha_turno, t.hora_turno, t.estado, t.notas,
           d.id_doctor, d.nombre AS medico, d.especialidad
    FROM turnos t
    JOIN doctores d ON t.id_doctor = d.id_doctor
    WHERE t.id_paciente = p_id_paciente
    ORDER BY t.fecha_turno DESC, t.hora_turno DESC;
END //

CREATE PROCEDURE sp_find_turnos_by_doctor(IN p_id_doctor INT, IN p_solo_pendientes INT)
BEGIN
    SELECT t.id_turno, DATE_FORMAT(t.fecha_turno, '%d/%m/%Y') AS fecha_turno, t.hora_turno, t.estado, t.notas,
           u.id AS id_paciente, u.username AS paciente, u.edad, u.nombre, u.apellido, u.email
    FROM turnos t
    JOIN users u ON t.id_paciente = u.id
    WHERE t.id_doctor = p_id_doctor
      AND (p_solo_pendientes = 0 OR (t.estado IN ('Activo', 'Confirmado') AND t.fecha_turno >= CURDATE()))
    ORDER BY t.fecha_turno ASC, t.hora_turno ASC;
END //

CREATE PROCEDURE sp_find_all_turnos()
BEGIN
    SELECT t.id_turno, DATE_FORMAT(t.fecha_turno, '%d/%m/%Y') AS fecha_turno, t.hora_turno, t.estado, t.tiempo_estimado_min, t.notas,
           u.id AS id_paciente, u.username AS paciente, u.edad, u.nombre, u.apellido, u.email,
           d.id_doctor, d.nombre AS medico, d.especialidad
    FROM turnos t
    JOIN users u ON t.id_paciente = u.id
    JOIN doctores d ON t.id_doctor = d.id_doctor
    ORDER BY t.fecha_turno DESC, t.hora_turno DESC;
END //

CREATE PROCEDURE sp_update_turno_medico(
    IN p_id_turno INT,
    IN p_id_doctor INT,
    IN p_estado VARCHAR(20),
    IN p_hora TIME,
    IN p_notas VARCHAR(255),
    IN p_tiempo_real FLOAT
)
BEGIN
    DECLARE v_conflicto INT;
    DECLARE v_tiempo_propio FLOAT;
    DECLARE v_duracion_activa FLOAT;

    SELECT COALESCE(tiempo_estimado_min, 15) INTO v_tiempo_propio
    FROM turnos WHERE id_turno = p_id_turno AND id_doctor = p_id_doctor;

    -- Si el turno queda Activo/Confirmado, validar que no pise otro turno del mismo día
    IF p_estado IN ('Activo', 'Confirmado') THEN
        -- Un turno cuya fecha ya pasó no puede reactivarse
        IF (SELECT fecha_turno FROM turnos WHERE id_turno = p_id_turno) < CURDATE() THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'FECHA_PASADA';
        END IF;

        SET v_duracion_activa = v_tiempo_propio + 5;

        SELECT COUNT(*)
        INTO v_conflicto
        FROM turnos t
        WHERE t.id_doctor = p_id_doctor
          AND t.id_turno <> p_id_turno
          AND t.fecha_turno = (SELECT fecha_turno FROM turnos WHERE id_turno = p_id_turno)
          AND t.estado IN ('Activo', 'Confirmado')
          AND TIME(p_hora) < ADDTIME(t.hora_turno, SEC_TO_TIME((COALESCE(t.tiempo_estimado_min, 15) + 5) * 60))
          AND ADDTIME(TIME(p_hora), SEC_TO_TIME(v_duracion_activa * 60)) > t.hora_turno;

        IF v_conflicto > 0 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'SLOT_OCUPADO';
        END IF;
    END IF;

    UPDATE turnos
    SET estado = p_estado, hora_turno = p_hora, notas = p_notas,
        tiempo_atencion_real_min = p_tiempo_real
    WHERE id_turno = p_id_turno AND id_doctor = p_id_doctor;
    SELECT ROW_COUNT() AS affected;
END //

CREATE PROCEDURE sp_cancel_turno_patient(IN p_id_turno INT, IN p_id_paciente INT)
BEGIN
    UPDATE turnos
    SET estado = 'Cancelado'
    WHERE id_turno = p_id_turno AND id_paciente = p_id_paciente
      AND estado IN ('Activo', 'Confirmado');
    SELECT ROW_COUNT() AS affected;
END //

CREATE PROCEDURE sp_expirar_turnos_viejos()
BEGIN
    UPDATE turnos
    SET estado = 'Vencido'
    WHERE fecha_turno < CURDATE() AND estado IN ('Activo', 'Confirmado');
    SELECT ROW_COUNT() AS expirados;
END //

CREATE PROCEDURE sp_find_historia_para_doctor(IN p_id_paciente INT, IN p_id_doctor INT)
BEGIN
    SELECT u.id AS id_paciente, u.username, u.nombre, u.apellido, u.edad, u.email, u.ciudad, u.nacionalidad,
           DATE_FORMAT(u.fecha_nacimiento, '%d/%m/%Y') AS fecha_nacimiento,
           h.id_historia, h.grupo_sanguineo, h.alergias, h.medicacion_actual, h.antecedentes, h.observaciones,
           DATE_FORMAT(h.fecha_actualizacion, '%d/%m/%Y %H:%i') AS fecha_actualizacion
    FROM users u
    LEFT JOIN historias_clinicas h ON h.id_paciente = u.id
    WHERE u.id = p_id_paciente
      AND EXISTS (SELECT 1 FROM turnos t WHERE t.id_paciente = p_id_paciente AND t.id_doctor = p_id_doctor)
    LIMIT 1;
END //

CREATE PROCEDURE sp_find_turnos_analisis()
BEGIN
    SELECT t.id_turno, DATE_FORMAT(t.fecha_turno, '%d/%m/%Y') AS fecha_turno,
           t.fecha_turno AS fecha_raw, t.hora_turno, t.estado,
           t.tiempo_estimado_min, t.tiempo_atencion_real_min,
           u.id AS id_paciente, u.username AS paciente, u.edad, u.nombre, u.apellido,
           d.id_doctor, d.nombre AS medico, d.especialidad
    FROM turnos t
    JOIN users u ON t.id_paciente = u.id
    JOIN doctores d ON t.id_doctor = d.id_doctor
    ORDER BY t.fecha_turno ASC, t.hora_turno ASC;
END //

CREATE PROCEDURE sp_find_consultas()
BEGIN
    SELECT c.id_consulta, c.edad_paciente, c.anios_experiencia_doc, c.tiempo_atencion_min,
           c.fecha_consulta, c.id_doctor, d.nombre AS medico, d.especialidad
    FROM consultas c
    JOIN doctores d ON c.id_doctor = d.id_doctor
    ORDER BY c.id_consulta ASC;
END //

CREATE PROCEDURE sp_find_consultas_by_doctor(IN p_id_doctor INT)
BEGIN
    SELECT c.id_consulta, c.edad_paciente, c.anios_experiencia_doc, c.tiempo_atencion_min,
           c.fecha_consulta, c.id_doctor, d.nombre AS medico, d.especialidad
    FROM consultas c
    JOIN doctores d ON c.id_doctor = d.id_doctor
    WHERE c.id_doctor = p_id_doctor
    ORDER BY c.id_consulta ASC;
END //

DELIMITER ;
SET foreign_key_checks = 1;

SELECT COUNT(*) AS total_consultas_cargadas FROM consultas;
