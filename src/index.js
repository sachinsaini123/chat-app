const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const Filter = require('bad-words');
const {generateMessage, generateLocationMessage} = require('../src/utils/messages');
const {addUser, getUsersInRoom, getUser, removeUser} = require('../src/utils/users');


const app = express();
const server = http.createServer(app);
const io = socketio(server);


const port = process.env.PORT || 3000
console.log(__dirname);
const publicDirPath = path.join(__dirname, '../public');
app.use(express.static(publicDirPath));

// let count = 0;
io.on('connection', (socket) => {
    console.log('New WebSocket connection');
    // socket.emit('countUpdated', count);

    socket.on('join', (options, callback) => {
        const {error, user} = addUser({ id: socket.id, ...options });
        if(error){
            return callback(error);
        }
        socket.join(user.room);
        socket.emit('message', generateMessage('Admin', 'Welcome!'));
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined!`));
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        callback();
    })

    socket.on('sendMessage', (msg, callback) => {
        const user = getUser(socket.id);
        const filter = new Filter();

        if(filter.isProfane(msg)){
            return callback('Profanity is not allowed!');
        }
        // count++;
        // socket.emit('countUpdated', count);
        io.to(user.room).emit('message', generateMessage(user.username, msg));
        callback();
    })

    socket.on('sendLocation', (coords, callback) => {
        const user = getUser(socket.id);
        io.to(user.room).emit('sendLocation', generateLocationMessage(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`));
        callback('Location shared!');
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id);
        if(user) {
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left the room`));
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
})

server.listen(port, () => {
    console.log('Server is listening on port ',port);
}) 