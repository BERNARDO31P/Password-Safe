# Passwort Tresor
## Installation
Repository klonen
```shell
git clone https://github.com/bruggli/passwort-tresor.git
cd passwort-tresor
```

Anmeldedaten definieren
```
nano .env

# Beispiel vom Inhalt
MYSQL_ROOT_PW=SEHR SICHERES PASSWORT
MYSQL_PW=SEHR SICHERES PASSWORT

MYSQL_HOST=mysql
MYSQL_DB_NAME=ipa
MYSQL_USER=admin
```

Rechte konfigurieren
```shell
chmod +x set_permissions.sh
./set_permissions.sh
```

Docker Container starten
```shell
docker-compose up -d
```

## Datenbank/Backup
Die Daten werden im `data` Ordner gespeichert und bleiben auch nach einem Neustart oder Neuinstallation erhalten.
Es muss lediglich dieser Ordner gesichert werden.

## Updates
Um die neuste Version der Pakete zu installieren, müssen die Container neu erstellt werden.
```shell
docker-compose up -d --build --force-recreate
```
Aus Gründen der sicherheit und stabilität sollte dies regelmässig gemacht werden.
Major-Releases werden nicht berücksichtigt, da diese das Projekt grundlegend verändern können. 

Hierfür kann man jedoch in der `package.json` und in der `composer.json` die Versionen anpassen und im sicheren Umfeld testen.