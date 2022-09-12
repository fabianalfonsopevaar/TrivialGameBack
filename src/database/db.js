const Sequelize = require("sequelize");
const sequelize = new Sequelize("sqlite::memory:",{logging: false}); // Example for sqlite

const GameModel = require("../models/GameModel");
const UsersByRoomModel = require("../models/UsersByRoomModel");

const Game = GameModel(sequelize);
const UsersByRoom = UsersByRoomModel(sequelize);

const connect = async () => {
  try {
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
};

const initDatabase = async () => {
  var resetDb = { force: false };
  await sequelize
    .sync(resetDb)
    .then(async () => {
      console.log("Connection has been established successfully.");
    })
    .catch((err) => {
      console.error("Unable to connect to the database:", err);
    });
};

module.exports = { sequelize, connect, initDatabase, Game, UsersByRoom };
