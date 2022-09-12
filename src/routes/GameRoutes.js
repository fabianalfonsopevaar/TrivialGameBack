const router = require("express").Router();
const { Game } = require("../database/db");

router.get("/:id", async (req, res) => {
  const id = req.params.id;
  const game = await Game.findByPk(id);
  if (game) {
    return res.status(200).send({
      response: game,
    });
  }
  return res.status(404).send({
    error: "Not found",
  });
});

router.get("", async (req, res) => {
  const games = await Game.findAll();
  if (games && games.length > 0) {
    return res.status(200).send({
      response: games,
    });
  }
  return res.status(404).send({
    error: "Not found",
  });
});
module.exports = router;
