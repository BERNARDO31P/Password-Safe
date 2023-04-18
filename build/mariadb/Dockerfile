# Definiere das Basisimage für den finalen Container
FROM mariadb:10.11-jammy

# Kopiere die custom_entrypoint.sh-Datei in den Container, damit der Dienst als Root-Benutzer ausgeführt werden kann
COPY --chmod=0755 /build/mariadb/custom_entrypoint.sh /usr/local/bin/custom_entrypoint.sh

# Setzt die Zeitzone für den Container
ENV TZ="Europe/Zurich"