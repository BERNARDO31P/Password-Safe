#!/bin/bash

uid=$(id -u 2>/dev/null || echo "1000")
gid=$(id -g 2>/dev/null || echo "1000")

sed "s/\${UID}/${uid}/g; s/\${GID}/${gid}/g" docker-compose.override.yml.template > docker-compose.override.yml