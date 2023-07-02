export default function RoomJoined({ roomId, players }) {
  return (
    <div className="text-center">
      <p className="mb-4">Room ID: {roomId}</p>
      <p className="my-2">Waiting for the host to start the game...</p>
    </div>
  );
}