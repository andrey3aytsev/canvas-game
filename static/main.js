
	
	var app = {
		id: null,
		circles: {},
		room: null,
		socket: io.connect(),
		stage: new createjs.Stage('canvas'),
		canvas: $('#canvas')[0],
		createRoom: function(room) {
			app.socket.emit('create room', room, app.generateUser(room));
			app.initStage();
		},
		joinTo: function(room) {
			app.socket.emit('join to room', room, app.generateUser(room));
			app.initStage();
		},
		initStage: function() {
			$('.start-screen').remove();
			createjs.Touch.enable(app.stage);
			app.canvas.width = $(window).width();
			app.canvas.height = $(window).height();
			app.createStars(100);
		},
		createStars: function(count) {
			for (var i = 0; i < count; i++) {
				var shape = new createjs.Shape();
				shape.radius = Math.random() * 2;
				shape.x = Math.random()*canvas.width;
				shape.y = Math.random()*canvas.height;
				shape.graphics.beginFill('#F1F1A0');
				shape.graphics.drawCircle(0, 0, shape.radius);
				app.stage.addChild(shape); 
			}
		},
		generateUser: function(room) {
			app.room = room;
			var data = {
				id: app.id,
				color: "#" + Math.floor(Math.random()*0xFFFFFF).toString(16),
				radius: 10 + Math.random() * 30,
				room: room
			};
			data.x = app.canvas.width/2 - data.radius/2;
			data.y = app.canvas.height/2 - data.radius/2;
			return data;
		},
		drawUser: function(user) {
			app.circles[user.id] = new createjs.Shape();
			app.circles[user.id].color = user.color;
			app.circles[user.id].radius = user.radius;
			app.circles[user.id].graphics.beginFill(app.circles[user.id].color);
			app.circles[user.id].graphics.drawCircle(0, 0, app.circles[user.id].radius);
			app.circles[user.id].name = user.id;
			app.stage.addChild(app.circles[user.id]);
			app.circles[user.id].x = user.x;
			app.circles[user.id].y = user.y;
		},
		follow: function(event) {
			var difX = app.stage.mouseX - app.circles[app.id].x;
			var difY = app.stage.mouseY - app.circles[app.id].y;
			app.circles[app.id].x += difX/10;
			app.circles[app.id].y += difY/10;
			app.stage.update();
		}
	};

	app.socket.on('connect', function() {
		app.id = app.socket.id;
		app.socket.emit('get rooms');
	});

	app.socket.on('send coord', function(user) {
		app.circles[user.id].x = user.x;
		app.circles[user.id].y = user.y;
	});

	app.socket.on('send rooms', function(rooms) {
		if (!rooms.length) {
			return;
		} else {
			$('<p>').text('Или войдите в существующие').appendTo('.start-screen');
			rooms.forEach(function(room) {
				var button = $('<button>').text(room.name).appendTo('.start-screen');
				button.on('click', function() {
					app.joinTo(room.name);
				})
			});
		};
	});

	app.socket.on('send users', function(users) {
		users.forEach(function(user) {
			app.drawUser(user);
			createjs.Ticker.addEventListener('tick', app.follow);
			createjs.Ticker.setFPS(60);
			setInterval(function() {
				app.socket.emit('send coord', {
					id: app.id,
					room: app.room,
					x: app.circles[app.id].x,
					y: app.circles[app.id].y
				});
			}, 50);
		})
	});

	app.socket.on('add user', function(user) {
		app.drawUser(user);
	})

	app.socket.on('delete user', function(user) {
		delete app.circles[user.id];
		var child = app.stage.getChildByName(user.id);
		app.stage.removeChild(child);
	})

	$('.create-form').on('submit', function(event) {
		event.preventDefault();
		var room = $(this).find('input[name="name"]').val();
		app.createRoom(room);
	})




