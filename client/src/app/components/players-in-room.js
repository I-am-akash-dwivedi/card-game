export default function PlayersInRoom({players}) {
  return (
    <div className="text-center m-4">
      <span className="text-2xl mr-1">Players in the room:</span>
      <div>
        {players.map((player, index) => (
          <button type={"button"} key={index} className="px-4 py-2 m-1 text-white bg-gradient-to-br from-purple-600 to-blue-500 focus:outline-none font-medium rounded-lg text-sm text-center">{player}</button>
        ))}
      </div>
    </div>
  );
}
