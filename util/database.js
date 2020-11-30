const mysql = require("mysql2");

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  // these you will set in MySQL workbench
  database: "node-complete",
  password: "test"
});

module.exports = pool.promise();
