# Definiert das Basisimage für den finalen Container
FROM mariadb:latest

# Kopiert die custom_entrypoint.sh-Datei in den Container, damit der Dienst als Root-Benutzer ausgeführt werden kann
COPY --chmod=0755 /build/mariadb/custom_entrypoint.sh /usr/local/bin/custom_entrypoint.sh

# Kopiert das SQL-Template und das Shell-Skript in den Container, damit die Datenbank initialisiert werden kann
# Die Nummerierung der Dateien bestimmt die Reihenfolge, in der die Skripte ausgeführt werden
COPY --chmod=0755 /config/mariadb/script/01_replace_dbname.sh /docker-entrypoint-initdb.d/
COPY /config/mariadb/script/02_init.sql /docker-entrypoint-initdb.d/

# Setzt die Zeitzone für den Container
ENV TZ="Europe/Zurich"