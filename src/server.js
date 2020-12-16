const express = require('express')
const app = express()
const http=  require('http')
const server = http.createServer(app)
const socket = require('socket.io')
const io = socket(server)
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')
app.use('/', express.static(__dirname + '/public'))

io.on('connection', (socket) => {
    console.log('New Websocket connection with socket id', socket.id)
    socket.on('join', (data, callback) => {
        const { error, user } = addUser({ id: socket.id, username : data.username, room : data.room})
        if(error) {
            return callback(error)
        }
        socket.join(user.room)
        socket.emit('message', generateMessage('Welcome!', 'Admin'))
        socket.broadcast.to(user.room).emit('message', generateMessage(`${user.username} has joined`, 'Admin'))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        callback()
    })
    socket.on('msgSent', (data, callback) => {
        const user = getUser(socket.id)
        data.username = user.username
        io.to(user.room).emit('message', data)
        callback('Delivered!')
    })
    socket.on('disconnect', () => {
        const user = removeUser(socket.id)
        if(user) {
            io.to(user.room).emit('message', generateMessage(`${user.username} has left`, 'Admin'))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
    socket.on('sendLocation', (data, callback) => {
        const user = getUser(socket.id)
        io.emit('locationMessage', generateLocationMessage(`https://google.com/maps/?q=${data.latitude},${data.longitude}`, user.username))
        callback()
    })
})
server.listen(1111, () => {
    console.log('server started at http://localhost:1111')
})