const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Chat = sequelize.define("Chat", {
  id: {
    type: DataTypes.BIGINT,
    unique: true,
    allowNull: false,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  type: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  meta: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
  },
});

sequelize
  .sync({ force: false })
  .then(() => {
    console.log("Table and model synced successfully.");
  })
  .catch((error) => {
    console.error("Error syncing table and model:", error);
  });

module.exports = Chat;
