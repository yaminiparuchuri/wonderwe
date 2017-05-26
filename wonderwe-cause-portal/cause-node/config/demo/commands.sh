cd /var/www/html/cause-node
export NODE_CONFIG_DIR=/var/www/html/cause-node/config/demo
export NODE_ENV=demo
export LOG4JS_CONFIG=/var/www/html/cause-node/config/demo/log4jconfig.json
#npm install apidoc -g
#apidoc -i routes/ -o doc/ -t template/
forever stop 0
npm install
db-migrate down -e demo
db-migrate up -e demo
forever start -l forever.log -o out.log -e err.log -a ./bin/www
