# Definiere das Basisimage für den Build-Prozess
FROM composer:lts as build

# Setze das Arbeitsverzeichnis für den Build-Prozess
WORKDIR /app

# Kopiere die composer.json-Datei in den Build-Container
COPY /ch/brueggli/backend/src/composer.json /app/

# Installiere die Abhängigkeiten im Build-Container mit Composer
RUN composer install

# Definiere das Basisimage für den finalen Container
FROM php:fpm-alpine

# Installiere die pdo_mysql PHP-Erweiterung
RUN docker-php-ext-install pdo_mysql

# Kopiere die Vendor-Dateien aus dem Build-Container in den finalen Container
COPY --chown=root:root --from=build /app/vendor /usr/src/backend/vendor

# Erstelle im finalen Container ein Verzeichnis für die Logs
RUN mkdir /usr/src/backend/logs

# Lade die Konfigurationsdatei für PHP-FPM in den Container
COPY /config/php/zzz-docker.conf /usr/local/etc/php-fpm.d/zzz-docker.conf

# Setze die Besitzerrechte für die kopierten Dateien und Verzeichnisse auf den www-data Benutzer und die www-data Gruppe
RUN chown -R root:root /usr/src

# Setzt die Zeitzone für den Container
RUN apk add --no-cache tzdata
ENV TZ="Europe/Zurich"

# Setze das Arbeitsverzeichnis für den finalen Container
WORKDIR /usr/src/backend