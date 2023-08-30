const app = require('express')();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
  cors: {
    origin: '*',
  },
});


function getPlayersInRoom(clients) {
  if (!clients) {
    return [];
  }

  const players = [];

  clients.forEach((clientId) => {
    const playerSocket = io.sockets.sockets.get(clientId);
    const playerName = playerSocket.name;
    players.push(playerName);
  });

  return players;
}


io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('setName', (name) => {
    socket.name = name;
    console.log(name)
  });

  socket.on('createRoom', (hostName) => {
    const roomId = Math.random().toString(36).substring(7);
    socket.join(roomId);
    io.to(roomId).emit('roomCreated', roomId, hostName);
    // socket.emit('roomCreated', roomId, hostName);
  });

  socket.on('joinRoom', (roomId) => {
    const room = io.sockets.adapter.rooms.get(roomId);
    const numberOfClients = room ? room.size : 0;

    if (numberOfClients === 0) {
      socket.emit('unknownRoom');
      return;
    } else if (numberOfClients > 2) {
      socket.emit('roomFull');
      return;
    }

    socket.join(roomId);
    socket.emit('roomJoined', roomId);

    const playersInRoom = getPlayersInRoom(room);
    socket.emit('playersInRoom', playersInRoom);
    // socket.to(roomId).emit('playersInRoom', playersInRoom);
    socket.to(roomId).emit('playerJoined', socket.name);
  });

  socket.on('handle_turn', (selected_card, current_player, room_id) => {
    io.to(room_id).emit('handle_turn_client', selected_card, current_player);
  })

  socket.on("send-player-details", (all_player_details, roomId) => {
    io.to(roomId).emit('all-player-details', all_player_details);
  })

  socket.on('submitGameSuit', (gameSuit, roomId) => {
    io.to(roomId).emit('submitGameSuitClient', gameSuit);
  })

  socket.on('send-message', (roomId, msg_payload) => {
    io.to(roomId).emit('messages', msg_payload)
  })

  socket.on('start-next-round', (payload) => {
    const room_id = payload.room_id;
    io.to(room_id).emit('next-round-started', payload)
  })

  socket.on('disconnecting', () => {
    const rooms = Object.keys(socket.rooms);

    rooms.forEach((roomId) => {
      socket.to(roomId).emit('playerLeft', socket.name);
    });
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
})

const PORT = process.env.PORT || 4000;

app.get('/', (req, res) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  res.status(200).json({
    'status': 'success',
    'msg': 'Server started successfully',
    'base_url': baseUrl,
  })
})

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
