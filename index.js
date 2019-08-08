const axios = require("axios");
const volleyball = require('volleyball');
const cors = require('cors');
const qs = require('qs');
const express = require("express"),
  app = express(),
  server = require("http").createServer(app),
  io = require("socket.io").listen(server);
require("dotenv").config();

users = [];
connections = [];
app.use(cors({}))
app.use(volleyball);
app.use(express.json());
const port = process.env.PORT || 5000;
server.listen(port, () => {
  console.log("Listening on port " + port);
});

app.get("/", (req, res) => {
  // res.sendFile(__dirname + "/index.html");
  res.json({ message: "good morning" });
});

app.get('/provinsi',(req,res)=>{
  axios.get('https://api.rajaongkir.com/starter/province',{
    params:{
      id:req.query.id
    },
    headers:{
      key:'f659ec25ee417c255469b0960f60f6c2'
    }
  })
  .then(ress=>{
    res.json(ress.data)
  }).catch(error=>{
    res.status(error.response.status);
    res.json(error);
  })
});

app.get('/kota',(req,res)=>{
  axios.get('https://api.rajaongkir.com/starter/city',{
    params:{
      id:req.query.id
    },
    headers:{
      key:'f659ec25ee417c255469b0960f60f6c2'
    }
  })
  .then(ress=>{
    res.json(ress.data)
  }).catch(error=>{
    res.status(error.response.status);
    res.json(error);
  })
});

app.post('/cost',(req,res)=>{
  const body = {
    origin: req.body.origin,
    destination: req.body.destination,
    weight: req.body.weight,
    courier: req.body.courier 
  }
  axios.post('https://api.rajaongkir.com/starter/cost',qs.stringify(body),{
    headers:{
      key:'f659ec25ee417c255469b0960f60f6c2',
      "content-type": "application/x-www-form-urlencoded"
    }
  })
  .then(ress=>{
    res.json(ress.data)
  }).catch(error=>{
    res.status(error.response.status);
    res.json(error);
  })
});


/* socket here */
io.sockets.on("connection", socket => {
  // console.log(socket);
  connections.push(socket);
  console.log("Connected: %s sockets connected", connections.length);
  io.sockets.emit("get users", users);
  //dc
  socket.on("disconnect", data => {
    if (socket.username === undefined) return;
    users.splice(users.indexOf(socket.username), 1);
    console.log("halo1");
    updateUser();
    connections.splice(connections.indexOf(socket), 1);
    console.log("Disconnected: %s sockets connected", connections.length);
  });

  socket.on("send message", data => {
    console.log("halo2");
    console.log(data);
    io.sockets.emit("new message", { msg: data });
    // socket.broadcast.to(data.id).emit("new message", { msg: data.msg })
    // socket.to(data.id).emit("new message", { msg: data.msg })
  });

  socket.on("subscribe", function(room) {
    try {
      console.log("[socket]", "join room :", room, socket.id);
      socket.join(room);
      updateUser();
      socket.to(room).emit("user joined", room);
    } catch (e) {
      console.log("[error]", "join room :", e);
      socket.emit("error", "couldnt perform requested action");
    }
  });

  socket.on("unsubscribe", function(room) {
    try {
      console.log("[socket]", "leave room :", room);
      socket.leave(room);
      socket.to(room).emit("user left", socket.id);
    } catch (e) {
      console.log("[error]", "leave room :", e);
      socket.emit("error", "couldnt perform requested action");
    }
  });

  socket.on("new user", data => {
    console.log("new User");
    console.log("Data: " + data);
    socket.username = data;
    console.log(socket.conn.id);
    users.push({ id: socket.conn.id, username: socket.username });
    updateUser();
  });

  updateUser = () => {
    console.log("halo3");
    console.log(users);
    io.sockets.emit("get users", users);
  };
});
