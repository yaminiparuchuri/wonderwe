## NodeJS Project Installation

* npm install
* export NODE_CONFIG_DIR=<PATH TO LOCAl CONFIG> ```current directory and the config/local```
or
* SET NODE_CONFIG_DIR=<PATH TO LOCAl CONFIG>
* nodemon

### To Generate API Documentation
* ```npm install apidoc -g```
* ```apidoc -i routes/ -o doc/ -t template/```


## db-migrate steps(commands) 

* GOTO cause-node   directory    
* "db-migrate create test" run this command ##test is the filename that is your wish but filename is meaningfull.
* cd migrations   ---> press ENTER
* ls  --->press ENTER  
* you will see sql test-up.sql and test-donw.sql files and test.js file with what name did you give when create db-migrate.
* if you want create/alter/update table, Please goto up.sql file and write sql query what you want create/alter.
* if you want drop/delete table, Please goto down.sql file and write sql query what you want drop/delete.
* After do you want run the queries follow this commands
  first check your current directory was cause-node or not. if cause-node OK other wise you should change to cause-node directory.
       db-migrate up -e dev   (for up(create/alter), dev(dbname dev/qa/prod/demo)
       db-migrate down -e dev  (for down(drop/delete), dev(dbname dev/qa/prod/demo)