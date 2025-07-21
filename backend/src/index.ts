import {WebSocketServer , WebSocket , RawData } from "ws" ;
import {createClient } from "redis"

// creating a websocket server
const wss = new WebSocketServer({port : 8080}) ;
 
const subscription : {[key : string ]: {
    ws : WebSocket ,
    rooms : string[] 
}}= {}

wss.on("connection" , (ws : WebSocket )=> {
    console.log("ws have connected")
    const id = randomId() ;

    subscription[id] = {
        ws ,
        rooms : [] ,
    } 

    ws.on("message" , (message : {message : RawData })=>{
       const userMessage = JSON.parse(message.toString())
       if(userMessage.type?.toLowerCase() ==="SUBSCRIBE".toLowerCase()){
        subscription[id].rooms.push(userMessage.roomId) ;
        console.log("Subscribe to :" , userMessage.roomId)
       }


       if(userMessage.type?.toLowerCase() === "sendMessage".toLowerCase()){
        const message = userMessage.message ;
        const roomId = userMessage.roomId ;

        Object.keys(subscription).forEach((userId)=>{
            const {ws , rooms} = subscription[userId] ;
            if(rooms.includes(roomId)){
                ws.send(message) ;
            }
        });
    }  
    })
}) ;


function randomId(){
    return Math.random() ;
}