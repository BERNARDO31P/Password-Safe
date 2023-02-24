# Definiere das Basisimage für den Build-Prozess
FROM composer:2.5 as build

# Setze das Arbeitsverzeichnis für den Build-Prozess
WORKDIR /app

# Kopiere die composer.json-Datei in den Build-Container
COPY /ch/brueggli/backend/src/composer.json /app/

# Installiere die Abhängigkeiten im Build-Container mit Composer
RUN composer install

# Definiere das Basisimage für den finalen Container
FROM php:8.2-fpm-alpine

# Installiere die pdo_mysql PHP-Erweiterung
RUN docker-php-ext-install pdo_mysql

# Kopiere die Vendor-Dateien aus dem Build-Container in den finalen Container
COPY --chown=www-data:www-data --from=build /app/vendor /usr/src/backend/vendor

# Erstelle im finalen Container ein Verzeichnis für die Logs
RUN mkdir /usr/src/backend/logs

# Setze die Besitzerrechte für die kopierten Dateien und Verzeichnisse auf den www-data Benutzer und die www-data Gruppe
RUN chown -R www-data:www-data /usr/src

# Setze das Arbeitsverzeichnis für den finalen Container
WORKDIR /usr/src/backend