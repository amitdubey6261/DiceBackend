import express, { Application } from 'express' ; 
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import path from 'path' ; 
import cors from 'cors' ; 

class SocketServer{
    httpServer : any ; 
    private app!: Application ; 
    roomData : any ; 
    constructor(){
        this.setunCaughtException();
        this.setMiddleWares();
        this.createSocketServer();
    }

    setunCaughtException(){
        process.on('uncaughtException', (e) => {
            console.log(e.message);
            console.log(`Shutting down server due to uncaught exception error`);
            process.exit(1);
        })
    }

    setMiddleWares(){
        dotenv.config({ path: './src/config/config.env' });
    }

    createSocketServer(){
        this.app = express() ; 
        this.app.use(express.json());
        this.app.use(cors());

        this.httpServer = createServer(this.app); 

        const io = new Server( this.httpServer , { cors : {} , maxHttpBufferSize : 1e8 } ); 

        this.roomData = {};

        io.on('connection' , (socket)=>{
            console.log(`Connected SocketID:${socket.id}`);

            socket.on('create_room' , (roomID:string)=>{
                const users = [ socket.id ];
                this.roomData[roomID] = { users };
                socket.join(roomID);
                socket.emit('created_room', roomID);

                f(roomID);
            });

            socket.on('join_room', (roomId) => {
                if (!io.sockets.adapter.rooms.has(roomId)) {
                    socket.emit('Error', "Not Found Room ");
                }
                else {
                    const size = io.sockets.adapter.rooms.get(roomId)?.size ?? 0;
                    if ( size > 3  ) {
                        console.log('ROOOM LIMIT REACH');
                        socket.emit('Error', 'room in maximum limit');
                    }
                    else {
                        const userValue = this.roomData[roomId]
                        socket.join(roomId);
                        socket.emit('joined_room', roomId);
                        const size2 = io.sockets.adapter.rooms.get(roomId)?.size ?? 0 ; 
                        console.log('andar ' , size2 ); 
                        if ( size2 === 2) {
                            console.log(`4 users joined in a ${roomId}`);
                            console.log('start');

                            const data = { userTurn: 0 }

                            this.roomData[roomId] = data;
                        }
                    }
                }
            })

            socket.on('dice_data', (data) => {
                console.log(data); //data.room
                socket.broadcast.to(data.room).emit('dice_update', data);
            })

            socket.on('user_change', (data) => {
                //e room id , user turn 
                const newUser = data;
                socket.broadcast.to(data.room).emit('user_update', newUser);
            })
        })
        const f = (roomid:string) => {
            setInterval(() => {
                console.log(io.sockets.adapter.rooms)
            }, 1000);
        }
        this.httpServer.listen(process.env.PORT, () => {
            console.log(`App started listening on port ${process.env.PORT}`);
        })

        this.app.get('/' , ( req , res )=>{
            res.send(`socket server connected successfully on ${req.protocol}://${req.hostname}:${process.env.PORT}`);
        })
    }
}

const server = new SocketServer(); 

