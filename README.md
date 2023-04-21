# Passwort Tresor
## Installation
Repository klonen
```shell
git clone https://github.com/brueggli/passwort-tresor.git
cd passwort-tresor
```

Anmeldedaten definieren
```shell
nano .env
```

Beispiel vom Inhalt
```ini
MYSQL_ROOT_PW=SEHR SICHERES PASSWORT    # Root Passwort für die Datenbank
MYSQL_PW=SEHR SICHERES PASSWORT         # Passwort für den Benutzer/PHP

MYSQL_HOST=mysql                        # Die IP/Hostname vom Datenbank Container
MYSQL_DB_NAME=tresor                    # Der Name der Datenbank
MYSQL_USER=admin                        # Der Benutzername für die Datenbank/PHP
```

Docker Container starten
```shell
docker compose up -d
```

## Datenbank/Backup
Die Daten werden im `data` Ordner gespeichert und bleiben auch nach einem Neustart oder Neuinstallation erhalten.
Es muss lediglich dieser Ordner gesichert werden.

Andersherum, muss dieser Ordner gelöscht werden, um den Tresor zurückzusetzen.

## Updates
Um die neuste Version der Pakete zu installieren, müssen die Container neu erstellt werden.
```shell
docker compose up -d --build --force-recreate
```
Aus Gründen der sicherheit und stabilität sollte dies regelmässig gemacht werden.
Major-Releases werden nicht berücksichtigt, da diese das Projekt grundlegend verändern können. 

Hierfür kann man jedoch in der `package.json` und in der `composer.json` die Versionen anpassen und im sicheren Umfeld testen.