require('dotenv').config();

const express = require('express');
const http = require('http');
const setUpRoutes = require('./config/index.routes');
const setUpSocket = require('./config/socket');
const setUpMiddleWare = require('./config/middleWare');
const passport = require("passport");

app.use(passport.initialize());
require("./config/passport")(passport); // chỉnh path theo dự án bạn

const app = express();
const server = http.createServer(app); // Tạo HTTP Server từ Express App

// Middleware
setUpMiddleWare(app);
// Routes
setUpRoutes(app);
//Cấu hình Socket.IO && connect socket
setUpSocket(server, app);


const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại cổng ${PORT}`);
});