#!/bin/bash

# Replace placeholders in the SQL template with actual values and save the output to the final SQL file
sed -i "s/\${MYSQL_DB}/${MYSQL_DB}/g" /docker-entrypoint-initdb.d/02_init.sql
