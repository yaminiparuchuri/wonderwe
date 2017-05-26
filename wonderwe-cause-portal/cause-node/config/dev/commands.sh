cd /var/www/html/cause-node;
nvm use system;
export NODE_CONFIG_DIR=/var/www/html/cause-node/config/dev
export NODE_ENV=dev
export LOG4JS_CONFIG=/var/www/html/cause-node/config/dev/log4jconfig.json
#npm install apidoc -g
#apidoc -i routes/ -o doc/ -t template/
forever stop 0
npm install
db-migrate down -e dev
db-migrate up -e dev
forever start -l forever.log -o out.log -e err.log -a ./bin/www
