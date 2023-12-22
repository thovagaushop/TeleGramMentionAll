const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Chat = sequelize.define("Chat", {
  id: {
    type: DataTypes.BIGINT,
    unique: true,
    allowNull: false,
    primaryKey: true,
  },
  typePeer: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  namePeerID: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
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
