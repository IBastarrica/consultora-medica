/*
 * @file delete.sql
 * @brief Limpieza idempotente de la base de datos consultora_medica_web.
 * @project Consultora Médica
 */

DROP DATABASE IF EXISTS consultora_medica_web;
DROP USER IF EXISTS 'consultora_app'@'localhost';
