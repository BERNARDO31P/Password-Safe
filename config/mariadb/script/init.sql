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
    secret_key VARCHAR(512) NOT NULL,

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

INSERT INTO users VALUES
(null,'root@brueggli.ch',
 'DGUWiLpmubST1C3N+e7+KKu2J5D1qLRD8CjRqbV0Y7gR7fNA7S3OXaFHI69FXF8iEzKQZXOUTRgk8bQfWiAzbw==',
 'root','', true, false, null,
 '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',
 'ZnpXYkkyxZ7AA62BcfeFuA=='),

(null, 'bernardo@bernardo.fm',
 'QX0qVCnV1+l6J1xKkm1BuSznoYvRbvY7Anr6bbQvgyZz2iQAyTCX7uZ3ElhKBpiA7uxNYPXNCaPyt8IkkTJnBg==',
 'Bernardo','de Oliveira', true, false, null,
 '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',
 '8sdecl7jAyqLTQxF3JWNdA=='),

(null,'corsin@brueggli.ch',
 '0x4ygjRHJsqO57N1/ZgrOoKy7R1OZdmLUz2wgwJErzLmfYAw5YzE42m8/ff6n8CjTTwXOh3tQ7YzFG9oYMFtHw==',
 'Corsin','Hemminger', false, false, null,
 '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',
 'NhD4DBx6OScRcayQz8qgIg=='),

(null,'gabriel@brueggli.ch',
 'wLFC9Y/PAWF0gt1cWLuAriOfh21+SsI8P+4ZgxpymzWSrVQGg89vDvbNBRyavXvxKCxyWhOwwGYPX5Ym8kMqEg==',
 'Gabriel','Guillet', false, false, null,
 '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',
 '5GO0P+lcgsXif5wg0Dkqiw=='),

(null,'manuel@brueggli.ch',
 'C39zRqoZKwQ5VEXNytEKnT4K5rofLPWo7VTS7T6IsoEmryr1Koud7G08bRrJKTqXHnrBX8CojYmM/+PlNo0Trg==',
 'Manuel','Gashi', false, false, null,
 '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',
 '29XELAZuIoW1oe6fuiBH6g=='),

(null,'stephan.hoese@brueggli.ch',
 'yYk+r1a6niMpmU2cNVNf2YhRAkUga6qKGOm70P8WQUZ0yVyfkn7jVk2J3KUHq5YDnXa998czeNzpqgOsDEbhrQ==',
 'Stephan','Hoese', false, false, null,
 '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',
 'N9JNwD34prI6Z3YqifNKUw==');

CREATE USER IF NOT EXISTS admin@'10.0.2.3' IDENTIFIED BY 's8IXoKZspp;y';
GRANT ALL PRIVILEGES ON ipa.* TO admin@'10.0.2.3' IDENTIFIED BY 's8IXoKZspp;y';

FLUSH PRIVILEGES;
