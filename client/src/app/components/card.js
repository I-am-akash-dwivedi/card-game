import React from 'react';

const Card = ({card, onCardClick, isActive}) => {
  const {rank, suit, player_id} = card;
  const handleCardClick = () => {
    onCardClick({
      rank,
      suit,
      player_id
    });
  };

  return (
    // <div onClick={handleCardClick}
    //      className={`m-1 card flex flex-col items-center justify-center bg-white border border-gray-300 rounded-lg p-4 ${isActive ? 'cursor-pointer hover:scale-110 hover:shadow-md' : 'opacity-70 cursor-not-allowed pointer-events-none'}`}>
    //   <div className="card-value text-3xl font-bold">{rank}</div>
    //   <div className="card-suit text-3xl">{suit}</div>
    // </div>
    <div onClick={handleCardClick} className={`bg-white rounded-lg shadow-lg p-6 ${isActive ? 'cursor-pointer hover:scale-110 hover:shadow-md' : 'opacity-70 cursor-not-allowed pointer-events-none'}`}>
      <div className={`flex flex-col items-center justify-center mx-auto mb-4 ${["♥", "♦"].includes(suit) ? 'text-red-600' : 'text-black'}`}>
        <span className="text-3xl">{rank}</span>
        <h4 className="text-4xl font-semibold text-center">{suit}</h4>
      </div>
    </div>
  );
};

export default Card;
