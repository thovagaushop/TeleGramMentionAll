const { Sequelize } = require("sequelize");
const pg = require("pg");
require("dotenv").config();

const sequelize = new Sequelize(process.env.DB_URI, {
  dialectModule: pg,
});

const connection = async () => {
  try {
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
};

module.exports = {
  sequelize,
  connection,
};
