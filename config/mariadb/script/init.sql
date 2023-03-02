CREATE DATABASE IF NOT EXISTS ipa DEFAULT CHARACTER SET UTF8 DEFAULT COLLATE utf8_bin;
USE ipa;

CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(256) NOT NULL,
    password VARCHAR(512) NOT NULL,
    first_name VARCHAR(128),
    last_name VARCHAR(128),
    is_admin BOOLEAN DEFAULT FALSE NOT NULL,
    is_suspended BOOLEAN DEFAULT FALSE NOT NULL,
    last_login INTEGER,
    public_key VARCHAR(1024),
    private_key VARCHAR(4096),
    salt VARCHAR(32)
);

CREATE TABLE IF NOT EXISTS organizations (
    org_id INTEGER PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(128),
    description VARCHAR(512)
);

CREATE TABLE IF NOT EXISTS secret_keys (
    secret_id INTEGER PRIMARY KEY AUTO_INCREMENT,

    user_id INTEGER NOT NULL,
    org_id INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (org_id) REFERENCES organizations(org_id)
);

CREATE TABLE IF NOT EXISTS passwords (
    pass_id INTEGER PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(128),
    description VARCHAR(512),
    url VARCHAR(2048),
    data LONGTEXT,

    org_id INTEGER NOT NULL,
    FOREIGN KEY (org_id) REFERENCES organizations(org_id)
);

CREATE TABLE IF NOT EXISTS members (
    entry_id INTEGER PRIMARY KEY AUTO_INCREMENT,

    user_id INTEGER NOT NULL,
    org_id INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (org_id) REFERENCES organizations(org_id)
);

INSERT INTO users
VALUES (null,
        'root@brueggli.ch',
        'Sonne-123!!',
        'root',
        '',
        true,
        false,
        null,
        null,
        null,
        null),
       (null,
        'bernardo@bernardo.fm',
        'Sonne-123!!',
        'Bernardo',
        'de Oliveira',
        true,
        false,
        null,
        null,
        null,
        null);

CREATE USER IF NOT EXISTS admin@'10.0.2.3' IDENTIFIED BY 's8IXoKZspp;y';
GRANT ALL PRIVILEGES ON ipa.* TO admin@'10.0.2.3' IDENTIFIED BY 's8IXoKZspp;y';

FLUSH PRIVILEGES;
