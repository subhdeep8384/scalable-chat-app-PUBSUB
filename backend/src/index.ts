import { WebSocketServer, WebSocket, RawData } from "ws";
import { createClient, RedisClientType } from "redis"

// creating a websocket server
const port = 8081 ;
const wss = new WebSocketServer({ port });

// created two seperate client for redis 
const clients : {
    publishClient? : ReturnType<typeof createClient>
    subscribeClient? : ReturnType<typeof createClient>
} = {} ;
async function connectToRedis(){
    const publishClient = createClient() ;
    const subscribeClient = createClient() ;  
    
    await  publishClient.connect() ;
    await subscribeClient.connect()
    return { publishClient , subscribeClient }
};

(async () =>{
    try{
        const { publishClient , subscribeClient } = await connectToRedis() ;
        
        clients.publishClient = publishClient ;
        clients.subscribeClient = subscribeClient ;
        console.log("redis started" , clients)

    }catch(e){}
})() ;

console.log("server started at :",port)

const subscription: {
    [key: string]: {
        ws: WebSocket,
        rooms: string[]
    }
} = {}

wss.on("connection", (ws: WebSocket) => {
    console.log("ws have connected")
    const id = randomId();

    subscription[id] = {
        ws,
        rooms: [],
    }

    ws.on("message", (message: { message: RawData }) => {
        try {
            const userMessage = JSON.parse(message.toString())
            if (userMessage.type?.toLowerCase() === "SUBSCRIBE".toLowerCase()) {
                const {type , roomId} = userMessage ;
                // subscription[id].rooms.push(userMessage.roomId) ;
                // console.log("Subscribe to :", userMessage.roomId);

                clients.subscribeClient?.subscribe(roomId ,(message : string)=>{
                   ws.send(message)
                })

            }

            if(userMessage.type?.toLowerCase() === "INSUBSCRIBE".toLowerCase()){
                subscription[id].rooms = subscription[id].rooms.filter(x => x !== userMessage.roomId)
            }


            if (userMessage.type?.toLowerCase() === "sendMessage".toLowerCase()) {
                const message = userMessage.message;
                const roomId = userMessage.roomId;

                // Object.keys(subscription).forEach((userId) => {
                //     const { ws, rooms } = subscription[userId];
                //     if (rooms.includes(roomId)) {
                //         ws.send(message);
                //     }
                // })
                clients.publishClient?.publish(roomId, JSON.stringify({
                    type : "sendMessage" ,
                    roomId ,
                    message 
                }))
            }
        }catch(e){
            console.log(e)
        }
    })
});


function randomId() {
    return Math.random();
}