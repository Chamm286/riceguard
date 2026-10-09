const app = require("./app");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();
const { startLogReader } = require("./services/logReader");

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Socket.io cho phép mọi origin
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: false,
  },
  path: "/socket.io",
  transports: ["websocket", "polling"],
  allowEIO3: true,
});

app.set("io", io);
global.io = io;

io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id);

  socket.on("join", (userId) => {
    socket.join(`user_${userId}`);
  });

  socket.on("join_alerts", () => {
    socket.join("alerts");
    console.log("📢 Joined alerts room");
  });

  socket.on("disconnect", () => {
    console.log("🔌 Client disconnected:", socket.id);
  });
});

global.emitNewAlert = (alert) => {
  if (io) io.to("alerts").emit("new_alert", alert);
};

global.emitNewVisitor = (visitor) => {
  if (io) io.to("alerts").emit("new_visitor", visitor);
};

server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server chạy tại http://0.0.0.0:${PORT}`);
  console.log(`🌐 Truy cập từ LAN: http://192.168.40.101:${PORT}`);
  console.log(`🔌 Socket.io ready at ws://0.0.0.0:${PORT}/socket.io`);
  startLogReader();
});
