-- Create database and user
CREATE DATABASE IF NOT EXISTS peaqbodycare CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create a dedicated user (recommended for security)
CREATE USER IF NOT EXISTS 'peaquser'@'localhost' IDENTIFIED BY 'secure_password_123';
GRANT ALL PRIVILEGES ON peaqbodycare.* TO 'peaquser'@'localhost';
FLUSH PRIVILEGES;

-- Use the database
USE peaqbodycare;