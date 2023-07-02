import {toast} from "react-toastify";

export default function RoomCreated({ roomId, players, onClick }) {
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        toast.success('Room ID Copied');
      })
      .catch((error) => {
        toast.error('Failed copying Room ID')
      });
  };

  return (
    <div className="text-center">
      <p className="mb-4">Room ID:
        <span onClick={() => handleCopy(roomId)} className="text-xl ml-2 cursor-pointer">{roomId}</span>
      </p>
      <button className="bg-gradient-to-r from-green-400 via-green-500 to-green-600 text-white px-4 py-2 rounded mr-2" onClick={onClick}>Start the Game</button>
    </div>
  );
}
