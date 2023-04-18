FROM mariadb:10.11-jammy

ARG HOST_UID
ARG HOST_GID

RUN groupmod -g $HOST_GID mysql && usermod -u $HOST_UID mysql