// --- Sequelize ---
// Sequelize approach that connects to MySQL pool on the background
const Sequelize = require("sequelize");

const sequelize = new Sequelize("node-complete", "root", "test", {
  dialect: "mysql",
  host: "localhost"
});

module.exports = sequelize;
