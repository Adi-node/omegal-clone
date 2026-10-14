import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { UserManager } from "./managers/UserManager.js";
import type { Socket } from "socket.io";

const app = express();

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

const userManager = new UserManager();

io.on("connection", (socket:Socket) => {
  console.log("User connected");

  userManager.addUser("randomUser",socket);

  socket.on("disconnect", () => {
    userManager.removeUser(socket.id);
    console.log("User disconnected");
  });
});

httpServer.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});