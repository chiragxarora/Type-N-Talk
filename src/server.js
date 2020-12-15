const express = require('express')
const app = express()
const http=  require('http')
const server = http.createServer(app)
const socket = require('socket.io')
const io = socket(server)
const { generateMessage, generateLocationMessage } = require('./utils/messages')
app.use('/', express.static(__dirname + '/public'))

let count = 0

io.on('connection', (socket) => {
    console.log('New Websocket connection with socket id', socket.id)
    socket.emit('message', generateMessage('Welcome!'))
    socket.broadcast.emit('message', generateMessage('A new user has joined'))
    socket.on('msgSent', (data, callback) => {
        io.emit('message', data)
        callback('Delivered!')
    })
    socket.on('disconnect', () => {
        io.emit('message', generateMessage('A user has left'))
    })
    socket.on('sendLocation', (data, callback) => {
        io.emit('locationMessage', generateLocationMessage(`https://google.com/maps/?q=${data.latitude},${data.longitude}`))
        callback()
    })
})
server.listen(1111, () => {
    console.log('server started at http://localhost:1111')
})