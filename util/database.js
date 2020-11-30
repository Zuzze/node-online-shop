// -- Pure MySQL approach without Sequelize ---
/*const mysql = require("mysql2");


// a connection pool is a cache of database connections maintained so that the connections can be reused when future requests to the database are required.
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  // these you will set in MySQL workbench
  database: "node-complete",
  password: "test"
});

module.exports = pool.promise();*/

// --- Sequelize ---
// Sequelize approach that connects to MySQL pool on the background
const Sequelize = require("sequelize");

const sequelize = new Sequelize("node-complete", "root", "test", {
  dialect: "mysql",
  host: "localhost"
});

module.exports = sequelize;
