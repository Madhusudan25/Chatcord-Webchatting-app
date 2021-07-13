const express = require("express");
const socketio = require("socket.io");
const dotenv=require("dotenv");
const http = require("http");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const moment = require("moment");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(express.static(__dirname + "/public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

dotenv.config();
// mongoose connect
mongoose.connect(
  `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.l6ubm.mongodb.net/webchat`,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

// mongoose schema
const userSchema = {
  socketID: String,
  userName: String,
  roomName: String,
};

// mongoose model creation
const User = mongoose.model("User", userSchema);

app.get("/", function (req, res) {
  res.render("index");
});

app.get("/chat/:name/:room", function (req, res) {
  const name = req.params.name;
  const room = req.params.room;
  res.render("chat");
});

io.on("connection", function (socket) {
  // Index.html button listener triggered
  socket.on("requestToJoin", function (UserDetails) {
    const username = UserDetails.username;
    const room = UserDetails.roomname;
    // console.log(username,room);
    User.findOne(
      { userName: username, roomName: room },
      function (err, foundUser) {
        if (err) {
          console.log(err);
        } else {
          if (foundUser != null) {
            socket.emit("UserExists", "/");
          } else {
            socket.emit("UserDoesnotExist", "/chat/" + username + "/" + room);
          }
        }
      }
    );
  });

  // Triggered by join room  from chat.ejs
  socket.on("JoinRoom", function (UserDetails) {
    const username = UserDetails.username;
    const room = UserDetails.roomname;
    // console.log(username,room);
    User.findOne(
      { userName: username, roomName: room },
      function (err, foundUser) {
        if (err) {
          console.log(err);
        } else {
          // console.log(foundUser);
          if (foundUser == null) {
            const newUser = new User({
              socketID: socket.id,
              userName: username,
              roomName: room,
            });
            newUser.save(function (newerr, result) {
              if (newerr) {
                console.log(newerr);
              } else {
                socket.join(room);

                socket.broadcast
                  .to(room)
                  .emit("broadcast", username + " has joined");
                // Sending Users Info
                User.find({ roomName: room }, function (err, foundItems) {
                  if (!err) {
                    if (foundItems) {
                      const users = foundItems;
                      io.to(room).emit("users", users);
                      io.to(room).emit("room", room);
                    }
                  }
                });
              }
            });
          } else {
            socket.emit("UserExists", "/");
          }
        }
      }
    );
  });

  socket.on("chatMessage", function (msg) {
    User.findOne({ socketID: socket.id }, function (err, foundUser) {
      if (!err) {
        if (foundUser != null) {
          const room = foundUser.roomName;
          const user = foundUser.userName;
          socket.broadcast.to(room).emit("message", formatMessage(user, msg));
          socket.emit("selfMessage", formatMessage("You", msg));
        }
      }
    });
  });

  socket.on("disconnect", function () {
    User.findOne({ socketID: socket.id }, function (err, foundItem) {
      if (!err) {
        if (foundItem) {
          const user = foundItem.userName;
          const room = foundItem.roomName;
          socket.broadcast.to(room).emit("broadcast", user + " has left");
          User.deleteOne({ socketID: socket.id }, function (err, result) {
            if (err) {
              console.log(err);
            }
          });
          User.find({ roomName: room }, function (err, foundItems) {
            if (!err) {
              if (foundItems) {
                const users = foundItems;
                io.emit("users", users);
              }
            }
          });
        }
      }
    });
  });
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

server.listen(port, function () {
  console.log("Server has started at port " + port);
});

// Functions

function formatMessage(username, text) {
  return {
    username,
    text,
    time: moment().utcOffset("+05:30").format("h:mm a"),
  };
}

function getAllUsers(room) {
  User.find({ roomName: room }, function (err, foundItems) {
    if (!err) {
      if (foundItems) {
        return foundItems;
      }
    }
  });
}

// https://my-chatcord.herokuapp.com/
