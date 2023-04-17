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

