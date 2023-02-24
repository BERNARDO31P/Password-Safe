CREATE DATABASE IF NOT EXISTS ipa DEFAULT CHARACTER SET UTF8 DEFAULT COLLATE utf8_bin;
USE ipa;

CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(256) NOT NULL,
    password VARCHAR(512) NOT NULL,
    first_name VARCHAR(256),
    last_name VARCHAR(256),
    is_admin BOOLEAN DEFAULT FALSE NOT NULL,
    is_suspended BOOLEAN DEFAULT FALSE NOT NULL,
    last_login INTEGER
);

INSERT INTO users
VALUES (null,
        'root@brueggli.ch',
        'Sonne-123!!',
        'root',
        '',
        true,
        false,
        null),
       (null,
        'bernardo@bernardo.fm',
        'Sonne-123!!',
        'Bernardo',
        'de Oliveira',
        true,
        false,
        null);

CREATE USER IF NOT EXISTS admin@'10.0.2.3' IDENTIFIED BY 's8IXoKZspp;y';
GRANT ALL PRIVILEGES ON ipa.* TO admin@'10.0.2.3' IDENTIFIED BY 's8IXoKZspp;y';

FLUSH PRIVILEGES;
