const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const User = sequelize.define("User", {
  id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    unique: true,
    primaryKey: true,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  tagname: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

module.exports = User;
