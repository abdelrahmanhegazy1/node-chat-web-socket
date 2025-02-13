const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const {generateMessage,generateLocationMessage} = require('./utils/messages')
const {addUser, removeUser, getUser, getUsersInRoom} = require('./utils/users')
const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname,'../public')

app.use(express.static(publicDirectoryPath))

io.on('connection',(socket)=>{
    console.log('new websocket connection')


    socket.on('join',(options,callback)=>{
        const {error, user } =addUser({id:socket.id , ...options})

        if(error) {
            return callback(error)
        }
        console.log('the user is ',user)
        socket.join(user.room)
        socket.emit('message',generateMessage('Admin','Welcome'))

        socket.broadcast.to(user.room).emit('message',generateMessage('Admin',`${user.username} has joined`))
        io.to(user.room).emit('roomData',{
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()
    })
    socket.on('sendMessage',(messageData, callback)=>{
        const filter = new Filter()
        const user = getUser(socket.id)
        if(filter.isProfane(messageData)) { 
            return callback('Porfanity is nt allowed!')
        }
        io.to(user.room).emit('message',generateMessage(user.username,messageData))
        callback()
    })

    socket.on('sendLocation',(location ,callback)=>{
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage',generateLocationMessage(user.username,`https://google.com/maps?q=${location.longitude},${location.latitude}`))
        callback()
    })

    socket.on('disconnect',()=>{
        const user = removeUser(socket.id)
        
        if(user)
        {
            io.to(user.room).emit('message',generateMessage('Admin',`${user.username} has left!`))
            io.to(user.room).emit('roomData',{
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }

    })
})


server.listen(port,()=>{
    console.log('running on port 3000')
})

