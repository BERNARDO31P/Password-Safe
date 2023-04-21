# Definiere das Basisimage für den finalen Container
FROM mariadb:10.11-jammy

# Kopiere die custom_entrypoint.sh-Datei in den Container, damit der Dienst als Root-Benutzer ausgeführt werden kann
COPY --chmod=0755 /build/mariadb/custom_entrypoint.sh /usr/local/bin/custom_entrypoint.sh

# Copy the SQL template and the shell script with numeric prefixes
COPY --chmod=0755 /config/mariadb/script/01_replace_dbname.sh /docker-entrypoint-initdb.d/
COPY /config/mariadb/script/02_init.sql /docker-entrypoint-initdb.d/

# Setzt die Zeitzone für den Container
ENV TZ="Europe/Zurich"