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
    secret_key VARCHAR(1024) NOT NULL,

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
        '',
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
        '+n7avjR7dAknBCxBO6mGOJZ28MsQoju72B3XObXI5zC7nz7JZtYyJYdKz++kySQEHpbXJTi6SDFEjLif6jI/bQ==',
        'Bernardo',
        'de Oliveira',
        true,
        false,
        null,
        '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',
        'yQNSrtP8yqm3hIErcf7uzg==');

CREATE USER IF NOT EXISTS admin@'10.0.2.3' IDENTIFIED BY 's8IXoKZspp;y';
GRANT ALL PRIVILEGES ON ipa.* TO admin@'10.0.2.3' IDENTIFIED BY 's8IXoKZspp;y';

FLUSH PRIVILEGES;
