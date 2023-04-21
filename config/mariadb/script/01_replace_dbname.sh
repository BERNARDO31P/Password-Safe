#!/bin/bash

# Ersetzt die Platzhalter in der SQL-Init Datei durch den tatsächlichen Wert
sed -i "s/\${MYSQL_DB}/${MYSQL_DB}/g" /docker-entrypoint-initdb.d/02_init.sql
