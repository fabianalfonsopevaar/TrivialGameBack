const { Game } = require("./database/db");

GameService = {};

GameService.getGame = async (code) => {
  try {
    return await Game.findByPk(code);
  } catch (error) {
    return error;
  }
};

GameService.getGames = async () => {
  try {
    return await Game.findAll();
  } catch (error) {
    return error;
  }
};

module.exports = GameService;
