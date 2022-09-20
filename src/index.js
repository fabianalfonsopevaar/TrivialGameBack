const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const { initDatabase, Game, UsersByRoom } = require("./database/db");
initDatabase();

const port = process.env.PORT || 4001;

const questions = require("./questions");

// const app = express();

// //Cors configuration
// const config = {
//   application: {
//     cors: {
//       server: [
//         {
//           origin: "*",
//           credentials: true,
//         },
//       ],
//     },
//   },
// };
// app.use(cors(config.application.cors.server));

// app.use(express.urlencoded({ extended: false, limit: "50mb" }));
// app.use(express.json({ limit: "50mb" }));
// app.use(express.static("public"));

// const GameRoutes = require("./routes/GameRoutes");
// Routes
// app.use("/api/game", GameRoutes);

// app.listen(port, () => {
//   console.log("Server on port: " + port);
// });

const socket = require("socket.io");
const Constants = require("./constantEvents");
const httpServer = require("http").createServer();
const io = socket(httpServer, {
  cors: {
    origin: "*",
  },
});

httpServer.listen(port, () => console.log("Sockets on port " + port));

const getData = async (room_number, io) => {
  const dbData = await UsersByRoom.findAll({
    where: {
      room_number: room_number,
    },
    order: [["score", "DESC"]],
  });

  const dbGameData = await Game.findOne({
    where: {
      room_number: room_number,
    },
  });
  io.emit(Constants.GET_GAME, dbData);
  io.emit(Constants.GET_GAME_DATA, dbGameData);
};

const getMaxScore = (questions) => {
  let rta = 0;
  if (questions) {
    questions.forEach((question) => {
      let score = Math.max(...question.answers.map((a) => a.score));
      rta += score;
    });
  }
  return rta;
};

io.on("connection", async (socket) => {
  console.log("User connected ", socket.id);
  try {
    socket.on(Constants.CREATE_ROOM, async (data) => {
      let game = await Game.findOne({
        where: { room_number: data.room_number },
      });
      if (!game) {
        await Game.create({
          room_number: data.room_number,
          numberOfPlayers: 0,
          status: "STARTING",
          startQuestion: 1,
          endQuestion: 20,
          questions: JSON.stringify(questions),
          maxScore: getMaxScore(questions),
        });
        socket.emit(Constants.ROOM_CREATED, data);
        getData(data.room_number, io);
      } else {
        socket.emit(Constants.ERROR, { error: "This room already exist" });
      }
    });

    socket.on(Constants.JOIN_ROOM, async (data) => {
      //Validate if user and room exists
      let user = await UsersByRoom.findOne({
        where: { username: data.username },
      });
      let room = await Game.findOne({
        where: { room_number: data.room_number },
      });
      if (user) {
        socket.emit(Constants.ERROR, {
          error: "This user is already connected to that room",
        });
        return;
      }
      if (!room) {
        socket.emit(Constants.ERROR, { error: "This room doesn't exist" });
        return;
      }

      await UsersByRoom.create({
        username: data.username,
        room_number: data.room_number,
        socketId: socket.id,
        score: 0, //Math.floor(Math.random() * 100),
      });

      getData(data.room_number, io);
      socket.emit(Constants.USER_CONNECTED, data);
    });
    socket.on(Constants.DEFAULT_QUESTIONS, async (data) => {
      try {
        let room = await Game.findOne({
          where: { room_number: data.room_number },
        });

        if (!room) {
          socket.emit(Constants.ERROR, { error: "This room doesn't exist" });
          return;
        }
        room.questions = JSON.stringify(questions);
        room.maxScore = getMaxScore(questions);
        await room.save();
      } catch (error) {
        socket.emit(Constants.ERROR, {
          error: "There was an error updating the questions",
        });
      }
      getData(data.room_number, io);
    });
    socket.on(Constants.UPDATE_QUESTIONS, async (data) => {
      try {
        let room = await Game.findOne({
          where: { room_number: data.room_number },
        });

        if (!room) {
          socket.emit(Constants.ERROR, { error: "This room doesn't exist" });
          return;
        }
        room.questions = JSON.stringify(JSON.parse(data.questions));
        room.maxScore = getMaxScore(JSON.parse(data.questions));
        await room.save();
      } catch (error) {
        socket.emit(Constants.ERROR, {
          error: "There was an error updating the questions",
        });
      }
      getData(data.room_number, io);
    });

    socket.on(Constants.SEND_SCORE, async (data) => {
      let user = await UsersByRoom.findOne({
        where: { username: data.username },
      });
      if (user) {
        user.score = user.score + data.score;
        await user.save();
      }
      getData(data.room_number, io);
    });

    socket.on(Constants.USER_FINISHED, async (data) => {
      let user = await UsersByRoom.findOne({
        where: { username: data.username },
      });
      if (user) {
        user.finished = true;
        user.finishedDate = new Date(Date.now()).toLocaleString();
        await user.save();
      }
      getData(data.room_number, io);
    });

    socket.on(Constants.RESET_GAME, async (data) => {
      const dbGameData = await Game.findOne({
        where: {
          room_number: data.room_number,
        },
      });
      if (dbGameData) {
        UsersByRoom.update(
          { score: 0 },
          { where: { room_number: data.room_number } }
        );

        dbGameData.status = "STARTING";
        await dbGameData.save();
        getData(data.room_number, io);
      }
      io.emit(Constants.RESET_GAME_ALL);
    });

    socket.on(Constants.ASK_DATA, async (data) => {
      getData(data.room_number, io);
    });

    socket.on(Constants.GET_USERS, async (data) => {
      const dbData = await UsersByRoom.findAll();
      socket.emit(Constants.GET_USERS_DATA, dbData);
    });

    socket.on(Constants.CHANGE_STATUS, async (data) => {
      const dbGameData = await Game.findOne({
        where: {
          room_number: data.room_number,
        },
      });
      if (dbGameData) {
        dbGameData.status = data.status;
        await dbGameData.save();
        getData(data.room_number, io);
      }
    });

    socket.on(Constants.RESET_ALL_INSTANCES, async (data) => {
      await Game.destroy({
        where: {},
      });
      await UsersByRoom.destroy({
        where: {},
      });
      io.emit(Constants.RESET_ALL_INSTANCES_REDIRECT);
    });

    socket.on("disconnect", async () => {
      let user = await UsersByRoom.findOne({
        where: { socketId: socket.id },
      });
      if (user) {
        await UsersByRoom.destroy({
          where: {
            socketId: socket.id,
          },
        });
        getData(user.room_number, io);
      }
    });
  } catch (error) {
    socket.emit(Constants.ERROR, {
      error: "There was an unhandled error in the server",
    });
  }
});
