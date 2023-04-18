# Definiere das Basisimage, das für den Build-Prozess verwendet werden soll
FROM node:lts-slim as build

# Setze das Arbeitsverzeichnis für den Build-Prozess
WORKDIR /app

# Kopiere die package.json-Datei in den Build-Container
COPY /ch/brueggli/ui/app/package.json /app/

# Installiere die Abhängigkeiten im Build-Container
RUN npm install

# Definiere das Basisimage, das für den finalen Container verwendet werden soll
FROM nginx:stable-alpine-slim

# Kopiere die gebauten Dateien aus dem Build-Container in den finalen Container
COPY --chown=nginx:nginx --from=build /app/node_modules /usr/share/nginx/html/node_modules

# Kopiere das Startup-Skript in den finalen Container
COPY /build/nginx/startup.sh /startup.sh

# Aktualisiere die Paketliste
RUN apk update

# Installiere npm und Node.js
RUN apk add nodejs=18.14.2-r0 npm

# Setze die Besitzerrechte für die kopierten Dateien auf den nginx-Benutzer und die nginx-Gruppe
RUN chown nginx:nginx /usr/share/nginx/html

# Setzt die Zeitzone für den Container
ENV TZ="Europe/Zurich"

# Setze das Arbeitsverzeichnis für den finalen Container
WORKDIR /usr/share/nginx/html

# Definiere den Befehl, der beim Starten des Containers ausgeführt werden soll
CMD ["/bin/sh", "/startup.sh"]