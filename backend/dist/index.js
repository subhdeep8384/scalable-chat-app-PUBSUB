"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
// creating a websocket server
const wss = new ws_1.WebSocketServer({ port: 8080 });
const subscription = {};
wss.on("connection", (ws) => {
    console.log("ws have connected");
    const id = randomId();
    subscription[id] = {
        ws,
        rooms: [],
    };
    ws.on("message", (message) => {
        var _a, _b;
        const userMessage = JSON.parse(message.toString());
        if (((_a = userMessage.type) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === "SUBSCRIBE".toLowerCase()) {
            subscription[id].rooms.push(userMessage.roomId);
            console.log("Subscribe to :", userMessage.roomId);
        }
        if (((_b = userMessage.type) === null || _b === void 0 ? void 0 : _b.toLowerCase()) === "sendMessage".toLowerCase()) {
            const message = userMessage.message;
            const roomId = userMessage.roomId;
            Object.keys(subscription).forEach((userId) => {
                const { ws, rooms } = subscription[userId];
                if (rooms.includes(roomId)) {
                    ws.send(message);
                }
            });
        }
    });
});
function randomId() {
    return Math.random();
}
