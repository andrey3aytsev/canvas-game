var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 8081;

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.use('/static', express.static('static'));

var rooms = [];

io.on('connection', function(socket) {

	socket.on('get rooms', function() {
		socket.emit('send rooms', rooms);
	});

	socket.on('create room', function(room, user) {
		var roomObj = {
			name: room,
			users: [user]
		};
		rooms.push(roomObj);
		socket.join(room);
		socket.emit('send users', roomObj.users);
	});

	socket.on('join to room', function(room, user) {
		var roomUsers = null;
		rooms.forEach(function(roomItem) {
			if (roomItem.name === room) {
				roomItem.users.push(user);
				roomUsers = roomItem.users;
			};
		})
		socket.join(room);
		socket.to(room).emit('add user', user);
		socket.emit('send users', roomUsers);
	});

	socket.on('send coord', function(user) {
		socket.to(user.room).emit('send coord', user);
	});

	socket.on('disconnect', function() {
		rooms.forEach(function(room) {
			room.users.forEach(function(user, index) {
				if (user.id === socket.id) {
					room.users.splice(index, 1);
					socket.to(room.name).emit('delete user', user);
				}
			})
		});
	});
});

server.listen(port, function () {
    console.log(`App listening on port ${port}`);
});