cd /var/www/html/cause-node
export NODE_CONFIG_DIR=/var/www/html/cause-node/config/prod
export NODE_ENV=production
export LOG4JS_CONFIG=/var/www/html/cause-node/config/prod/log4jconfig.json
#npm install apidoc -g
#apidoc -i routes/ -o doc/ -t template/
forever stop 0
npm install
db-migrate down -e prod
db-migrate up -e prod
forever start -l forever.log -o out.log -e err.log -a ./bin/www
