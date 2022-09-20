const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  return sequelize.define("UsersByRoom", {
    username: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    socketId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    room_number: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    score: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    finished: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    finishedDate: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  });
};
