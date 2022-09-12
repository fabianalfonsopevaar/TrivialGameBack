const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  return sequelize.define("Game", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    room_number: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    numberOfPlayers: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    startQuestion: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    endQuestion: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    questions: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    maxScore: {
      type: DataTypes.INTEGER,
      allowNull: true,
    }
  });
};
