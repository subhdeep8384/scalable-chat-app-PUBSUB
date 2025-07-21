"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const redis_1 = require("redis");
// creating a websocket server
const port = 8081;
const wss = new ws_1.WebSocketServer({ port });
// created two seperate client for redis 
const clients = {};
function connectToRedis() {
    return __awaiter(this, void 0, void 0, function* () {
        const publishClient = (0, redis_1.createClient)();
        const subscribeClient = (0, redis_1.createClient)();
        yield publishClient.connect();
        yield subscribeClient.connect();
        return { publishClient, subscribeClient };
    });
}
;
(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { publishClient, subscribeClient } = yield connectToRedis();
        clients.publishClient = publishClient;
        clients.subscribeClient = subscribeClient;
        console.log("redis started", clients);
    }
    catch (e) { }
}))();
console.log("server started at :", port);
const subscription = {};
wss.on("connection", (ws) => {
    console.log("ws have connected");
    const id = randomId();
    subscription[id] = {
        ws,
        rooms: [],
    };
    ws.on("message", (message) => {
        var _a, _b, _c, _d, _e;
        try {
            const userMessage = JSON.parse(message.toString());
            if (((_a = userMessage.type) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === "SUBSCRIBE".toLowerCase()) {
                const { type, roomId } = userMessage;
                // subscription[id].rooms.push(userMessage.roomId) ;
                // console.log("Subscribe to :", userMessage.roomId);
                (_b = clients.subscribeClient) === null || _b === void 0 ? void 0 : _b.subscribe(roomId, (message) => {
                    ws.send(message);
                });
            }
            if (((_c = userMessage.type) === null || _c === void 0 ? void 0 : _c.toLowerCase()) === "INSUBSCRIBE".toLowerCase()) {
                subscription[id].rooms = subscription[id].rooms.filter(x => x !== userMessage.roomId);
            }
            if (((_d = userMessage.type) === null || _d === void 0 ? void 0 : _d.toLowerCase()) === "sendMessage".toLowerCase()) {
                const message = userMessage.message;
                const roomId = userMessage.roomId;
                // Object.keys(subscription).forEach((userId) => {
                //     const { ws, rooms } = subscription[userId];
                //     if (rooms.includes(roomId)) {
                //         ws.send(message);
                //     }
                // })
                (_e = clients.publishClient) === null || _e === void 0 ? void 0 : _e.publish(roomId, JSON.stringify({
                    type: "sendMessage",
                    roomId,
                    message
                }));
            }
        }
        catch (e) {
            console.log(e);
        }
    });
});
function randomId() {
    return Math.random();
}
