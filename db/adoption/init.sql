-- Crear base de datos si no existe
CREATE DATABASE IF NOT EXISTS adoptionPost;
USE adoptionPost;

-- Crear tabla adoption_posts
CREATE TABLE IF NOT EXISTS adoption_posts (
    adoption_post_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(250) NOT NULL,
    species VARCHAR(250) NOT NULL,
    age INT NOT NULL,
    breed VARCHAR(250) NOT NULL,
    color VARCHAR(250) NOT NULL,
    size VARCHAR(250) NOT NULL,
    sex VARCHAR(250) NOT NULL,
    description VARCHAR(1000) NOT NULL,
    neutered BOOLEAN NOT NULL,
    complete_vaccines BOOLEAN NOT NULL,
    adoption_status BOOLEAN NOT NULL,
    date VARCHAR(16) NOT NULL,
    zone VARCHAR(250) NOT NULL
);

-- Crear tabla adoption_images
CREATE TABLE IF NOT EXISTS adoption_images (
    image_id INT AUTO_INCREMENT PRIMARY KEY,
    adoption_post_id INT NOT NULL,
    file_path VARCHAR(250) NOT NULL,
    FOREIGN KEY (adoption_post_id) REFERENCES adoption_posts(adoption_post_id) ON DELETE CASCADE
);
