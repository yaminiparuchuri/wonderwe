cd /var/www/html/cause-node
export NODE_CONFIG_DIR=/var/www/html/cause-node/config/qa
export NODE_ENV=qa
export LOG4JS_CONFIG=/var/www/html/cause-node/config/qa/log4jconfig.json
forever stop 0
npm install
db-migrate down -e qa
db-migrate up -e qa
forever start -l forever.log -o out.log -e err.log -a ./bin/www
