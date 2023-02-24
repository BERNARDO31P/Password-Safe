cd /usr/share/nginx/html || exit

rm -rf node_modules/.ngcc_lock_file
npm start &
nginx -g 'daemon off;'