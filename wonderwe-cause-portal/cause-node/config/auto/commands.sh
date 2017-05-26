cd /var/www/html/cause-node
export NODE_CONFIG_DIR=/var/www/html/cause-node/config/auto
export NODE_ENV=auto
export LOG4JS_CONFIG=/var/www/html/cause-node/config/auto/log4jconfig.json
#npm install apidoc -g
#apidoc -i routes/ -o doc/ -t template/
forever stop 0
npm install
forever start -l forever.log -o out.log -e err.log -a ./bin/www
