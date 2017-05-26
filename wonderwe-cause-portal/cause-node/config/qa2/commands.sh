cd /var/www/html/cause-node
export NODE_CONFIG_DIR=/var/www/html/cause-node/config/qa2
export NODE_ENV=qa2
export LOG4JS_CONFIG=/var/www/html/cause-node/config/qa2/log4jconfig.json
forever stop 0
npm install
db-migrate down -e qa2
db-migrate up -e qa2
forever start -l forever.log -o out.log -e err.log -a ./bin/www
