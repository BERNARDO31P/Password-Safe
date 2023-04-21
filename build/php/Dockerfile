# Definiert das Basisimage für den Build-Prozess
FROM composer:lts as build

# Setzt das Arbeitsverzeichnis für den Build-Prozess
WORKDIR /app

# Kopiert die composer.json-Datei in den Build-Container
COPY /ch/brueggli/backend/src/composer.json /app/

# Installiert die Abhängigkeiten im Build-Container mit Composer
RUN composer install

# Definiert das Basisimage für den finalen Container
FROM php:fpm-alpine

# Installiert die pdo_mysql PHP-Erweiterung
RUN docker-php-ext-install pdo_mysql

# Kopiert die Vendor-Dateien aus dem Build-Container in den finalen Container
COPY --chown=root:root --from=build /app/vendor /usr/src/backend/vendor

# Erstellt im finalen Container ein Verzeichnis für die Logs
RUN mkdir /usr/src/backend/logs

# Lädt die Konfigurationsdatei für PHP-FPM in den Container
COPY /config/php/zzz-docker.conf /usr/local/etc/php-fpm.d/zzz-docker.conf

# Setzt die Besitzerrechte für die kopierten Dateien und Verzeichnisse auf den root Benutzer und die root Gruppe
RUN chown -R root:root /usr/src

# Setzt die Zeitzone für den Container
RUN apk add --no-cache tzdata
ENV TZ="Europe/Zurich"

# Setzt das Arbeitsverzeichnis für den finalen Container
WORKDIR /usr/src/backend