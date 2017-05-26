ar mysql=require('mysql');
props = require('config').props
pool = mysql.createPool({
  host: props.host,
  user: props.username,
  password: props.password,
  port: props.port,
  database: props.database,
  connectionLimit: props.connectionLimit,
  debug: props.dbdebug,
  connectTimeout: props.connectTimeout
    //  acquireTimeout : 30000
});
