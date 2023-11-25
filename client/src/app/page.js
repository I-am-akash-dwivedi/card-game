"use client";

import {useState, useEffect} from 'react';
import io from 'socket.io-client';
import {ToastContainer, toast} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Greeting from './components/greetings';
import RoomCreated from "@/app/components/room_created";
import RoomJoined from "@/app/components/room_joined";

import {
  checkRoundWinner,
  deckOfCards,
  distributeCards,
  generateUniqueId,
  handsToMake,
  shuffleDeck
} from "@/app/utils/utils";
import Card from "@/app/components/card";
import PlayersInRoom from "@/app/components/players-in-room";

const socket_url = process.env.SOCKET_URL || 'https://card-game-server-lxj5.onrender.com';
// const socket = io("http://localhost:4000");
const socket = io(socket_url);

export default function Home() {
  const [name, setName] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [nameSubmitted, setNameSubmitted] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [isRoomCreated, setIsRoomCreated] = useState(false);
  const [isRoomJoined, setIsRoomJoined] = useState(false);
  const [players, setPlayers] = useState([]);
  const [playerDetails, setPlayerDetails] = useState({});
  const [mineDetails, setMineDetails] = useState({});
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [deck, setDeck] = useState([]);
  const [activePlayer, setActivePlayer] = useState('');
  const [thisTurnCards, setThisTurnCards] = useState([]);
  const [thisGameSuit, setThisGameSuit] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [allowCardClick, setAllowCardClick] = useState(true);
  const [msgSeenCount, setMsgSeenCount] = useState(0);

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
    setMsgSeenCount(messages.length);
  };

  const sendMessage = () => {
    const msg_payload = {
      'player_id': playerId,
      'msg': message,
      'name': name
    }
    socket.emit('send-message', roomId, msg_payload)
    setMessage('')
    setMsgSeenCount(msgSeenCount + 1)
  }

  const suits = {
    "♥": "Heart",
    "♦": "Diamond",
    "♣": "Club",
    "♠": "Spade"
  }

  useEffect(() => {
    socket.on('roomCreated', (roomId, hostName) => {
      setIsRoomCreated(true);
      setRoomId(roomId);
      // let updatedPlayers = [...players, hostName]
      // setPlayers(updatedPlayers)
      setPlayers((prevPlayers) => [...prevPlayers, hostName])
      toast.success('Room created!');
    });

    socket.on('roomJoined', (roomId) => {
      setIsRoomJoined(true);
      setRoomId(roomId);
      toast.success('Room joined!');
    });

    socket.on('unknownRoom', () => {
      toast.error('Unknown room. Please check the room ID.');
    });

    socket.on('roomFull', () => {
      toast.error('The room is full. Please join another room.');
    });

    socket.on('playerJoined', (playerName) => {
      setPlayers((prevPlayers) => [...prevPlayers, playerName]);
      toast.info(`${playerName} has joined the room.`);
    });

    socket.on('playerLeft', (playerName) => {
      setPlayers((prevPlayers) => prevPlayers.filter((player) => player !== playerName));
      toast.info(`${playerName} has left the room.`);
    });

    socket.on('playersInRoom', (players) => {
      if (players && players.length > 0) {
        setPlayers(players);
      }
    });

    socket.on('messages', (msg) => {
      setMessages((prevMsgs) => [...prevMsgs, msg])
    })

    socket.on('next-round-started', (res_payload) => {
      const {player_details, active_player} = res_payload
      toast.success("This round is over. Starting next round...")
      setThisGameSuit('')
      setPlayerDetails(player_details)
      setActivePlayer(active_player)
    })

    return () => {
      socket.disconnect();
    };
  }, []);

  const saveStateToLocalStorage = (key, state) => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      // Handle Local Storage errors
      toast.error(`Error saving state '${key}' to Local Storage:`, error);
    }
  };

  const loadStateFromLocalStorage = (key, defaultValue) => {
    try {
      const storedState = localStorage.getItem(key);
      if (storedState) {
        return JSON.parse(storedState);
      }
    } catch (error) {
      toast.error(`Error loading state '${key}' from Local Storage:`, error);
    }
    return defaultValue;
  };


  // useEffect(() => {
  //   name && saveStateToLocalStorage('name', name);
  //   playerId && saveStateToLocalStorage('playerId', playerId);
  //   nameSubmitted && saveStateToLocalStorage('nameSubmitted', nameSubmitted);
  //   roomId && saveStateToLocalStorage('roomId', roomId);
  //   isRoomCreated && saveStateToLocalStorage('isRoomCreated', isRoomCreated);
  //   isRoomJoined && saveStateToLocalStorage('isRoomJoined', isRoomJoined);
  //   players && saveStateToLocalStorage('players', players);
  //   playerDetails && saveStateToLocalStorage('playerDetails', playerDetails);
  //   mineDetails && saveStateToLocalStorage('mineDetails', mineDetails);
  //   isGameStarted && saveStateToLocalStorage('isGameStarted', isGameStarted);
  //   deck && saveStateToLocalStorage('deck', deck);
  //   activePlayer && saveStateToLocalStorage('activePlayer', activePlayer);
  //   thisTurnCards && saveStateToLocalStorage('thisTurnCards', thisTurnCards);
  //   thisGameSuit && saveStateToLocalStorage('thisGameSuit', thisGameSuit);
  //
  //   console.log(localStorage)
  // }, [name, playerId, nameSubmitted, roomId, isRoomCreated, isRoomJoined, players, playerDetails, mineDetails, isGameStarted, deck, activePlayer, thisTurnCards, thisGameSuit]);

  // useEffect(() => {
  //   setName(loadStateFromLocalStorage('name', ''));
  //   setPlayerId(loadStateFromLocalStorage('playerId', ''));
  //   setNameSubmitted(loadStateFromLocalStorage('nameSubmitted', false));
  //   setRoomId(loadStateFromLocalStorage('roomId', ''));
  //   setIsRoomCreated(loadStateFromLocalStorage('isRoomCreated', false));
  //   setIsRoomJoined(loadStateFromLocalStorage('isRoomJoined', false));
  //   setPlayers(loadStateFromLocalStorage('players', []));
  //   setPlayerDetails(loadStateFromLocalStorage('playerDetails', {}));
  //   setMineDetails(loadStateFromLocalStorage('mineDetails', {}));
  //   setIsGameStarted(loadStateFromLocalStorage('isGameStarted', false));
  //   setDeck(loadStateFromLocalStorage('deck', []));
  //   setActivePlayer(loadStateFromLocalStorage('activePlayer', ''));
  //   setThisTurnCards(loadStateFromLocalStorage('thisTurnCards', []));
  //   setThisGameSuit(loadStateFromLocalStorage('thisGameSuit', ''));
  // }, [])

  const handleNameSubmit = (e) => {
    e.preventDefault();
    if (name.trim() === "") {
      toast.error('Name cannot be empty!');
      return;
    }
    socket.emit('setName', name);
    toast.success('Name set!');
    setNameSubmitted(true);
  };

  const handleCreateRoom = () => {
    socket.emit('createRoom', name);
    // setPlayers((prevPlayers) => [...prevPlayers, name]);
    // setPlayers([name])
  };

  const handleJoinRoom = () => {
    if (!roomId) {
      toast.error('Please enter a room ID.');
      return;
    }
    socket.emit('joinRoom', roomId);
  };

  useEffect(() => {
    const temp_deck = deckOfCards()
    setDeck(temp_deck);
  }, []);

  useEffect(() => {
    if (playerId) {
      setMineDetails(playerDetails[playerId])
    }
  }, [playerDetails, playerId])

  socket.on("all-player-details", (all_player_details) => {
    setPlayerDetails(all_player_details)
    let this_player_id = null;
    Object.entries(all_player_details).forEach(([player_id, thisPlayerDetail]) => {
      if (name === thisPlayerDetail.name) {
        this_player_id = player_id
        setPlayerId(player_id)
      }
    })
    setIsGameStarted(true);
    setActivePlayer(Object.keys(all_player_details)[0])
  })

  const startGame = () => {
    const numberOfPlayers = players.length;
    if (numberOfPlayers < 2) {
      toast.error("Atleast 2 players required to start the game.")
      return;
    } else if (numberOfPlayers > 3) {
      toast.error("Number of players cannot be more than 3");
      return;
    }
    const hands_to_make = handsToMake(numberOfPlayers);
    // TODO: we can remove this if condition once the game is ready.
    if (Object.keys(playerDetails).length === 0) {
      for (const [index, player] of players.entries()) {
        let unique_id = generateUniqueId();
        playerDetails[unique_id] = {
          "name": player,
          "cards": [],
          "card_used": [],
          "host": player === name,
          "to_make": hands_to_make[index],
          "made": 0,
          "backlog": 0,
        }
      }
    }
    const shuffledDeck = shuffleDeck(deck);
    distributeCards(shuffledDeck, playerDetails)
    socket.emit("send-player-details", playerDetails, roomId)
  };

  useEffect(() => {
    const nextRound = () => {
      const numberOfPlayers = Object.keys(playerDetails).length;
      const hands_to_make = handsToMake(numberOfPlayers);
      let this_round_active_player = null;
      Object.entries(playerDetails).forEach(([player_id, thisPlayerDetail]) => {
        thisPlayerDetail.card_used = []
        thisPlayerDetail.cards = []
        thisPlayerDetail.backlog += thisPlayerDetail.made - thisPlayerDetail.to_make;
        thisPlayerDetail.made = 0
        const toMakeIndex = hands_to_make.indexOf(thisPlayerDetail.to_make);
        let to_make_for_this_round = hands_to_make[(toMakeIndex + 1) % hands_to_make.length]
        thisPlayerDetail.to_make = to_make_for_this_round
        if (to_make_for_this_round === Math.max(...hands_to_make)) {
          this_round_active_player = player_id;
        }
      })

      const shuffledDeck = shuffleDeck(deckOfCards());
      distributeCards(shuffledDeck, playerDetails)
      let next_round_payload = {
        "room_id": roomId,
        "player_details": playerDetails,
        "active_player": this_round_active_player,
      }
      socket.emit('start-next-round', (next_round_payload))
    }

    const player_ids = Object.keys(playerDetails)
    for (const thisTurnCard of thisTurnCards) {
      let player_id = thisTurnCard.player_id
      playerDetails[player_id].cards = playerDetails[player_id].cards.filter((card) => card !== thisTurnCard)
      playerDetails[player_id].card_used.push(thisTurnCard)
    }
    if (thisTurnCards.length === player_ids.length && thisTurnCards.length !== 0) {
      setAllowCardClick(false)
      let winner = checkRoundWinner(thisGameSuit, thisTurnCards)
      let winner_id = winner.player_id;
      toast.success(`${playerDetails[winner_id].name} won this round!`)
      playerDetails[winner_id].made += 1
      setPlayerDetails(playerDetails)
      setTimeout(() => {
        setThisTurnCards([])
        setActivePlayer(winner_id)
        if (playerDetails[winner_id].cards.length === 0) {
          nextRound()
        }
        setAllowCardClick(true)
      }, 1500)
    }
  }, [playerDetails, playerId, roomId, thisGameSuit, thisTurnCards])

  socket.on('handle_turn_client', (selected_card, current_player) => {
    const player_ids = Object.keys(playerDetails)
    const current_player_index = player_ids.indexOf(activePlayer)
    const next_player_index = (current_player_index + 1) % player_ids.length
    const next_player_id = player_ids[next_player_index]
    setThisTurnCards([...thisTurnCards, selected_card])
    setActivePlayer(next_player_id)
  })

  const handleCardClick = (selectedCard) => {
    if (playerId === activePlayer) {
      if (!isValidCard(selectedCard)) {
        toast.error("Aise cheating nahi kar sakte.")
      } else {
        mineDetails.cards = mineDetails.cards.filter((card) => card.rank !== selectedCard.rank || card.suit !== selectedCard.suit)
        mineDetails.card_used.push(selectedCard)
        socket.emit('handle_turn', selectedCard, activePlayer, roomId)
      }
    }
  };
  
  const thisTurnCardAvailable = () => {
    if (thisTurnCards.length === 0) return true;
    mineDetails.cards.forEach((card) => {
      if (card.suit === thisTurnCards[0].suit || thisGameSuit === card.suit) {
        return true;
      }
    })
    return false;
  }

  const isValidCard = (card_to_check) => {
    let this_turn_card_available = thisTurnCardAvailable();
    
    if (thisTurnCards.length === 0 || !this_turn_card_available){
      return true;
    } else {
      return thisTurnCards[0].suit === card_to_check.suit || thisGameSuit === card_to_check.suit
    }
  }

  socket.on('submitGameSuitClient', (suit) => {
    setThisGameSuit(suit)
  })

  const submitGameSuit = (suit) => {
    socket.emit('submitGameSuit', suit, roomId)
  }

  const clearData = () => {
    localStorage.clear();
    toast.success("Cleared stored data")
    window.location.reload();
  }

  return (
    <div className="bg-blue-100 min-h-screen py-8 px-4">
      {/*<button type="button" className="sticky top-0 left-8 bg-red-600 text-white px-2 py-1 rounded" onClick={clearData}>Clear stored data</button>*/}
      {!nameSubmitted ? (
        <form onSubmit={handleNameSubmit} id="set-name" className="flex items-center justify-center">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            className="border border-gray-300 px-4 py-2 rounded mr-2"
          />
          <button type="submit"
                  className="text-white bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 px-4 py-2 rounded">
            Set Name
          </button>
        </form>
      ) : (
        !isGameStarted && (
          <Greeting name={name}/>
        )
      )}

      {
        thisGameSuit && (
          <div className="flex justify-center">
            <span className='fixed top-2 text-white bg-gradient-to-r from-purple-500 to-pink-500 focus:outline-none font-medium rounded-lg px-5 py-2.5 text-center text-sm animate-pulse cursor-pointer z-50'>{playerDetails[activePlayer].name}&apos;s Turn</span>
          </div>
        )
      }

      {!isGameStarted && isRoomCreated && !isRoomJoined ? (
        <RoomCreated roomId={roomId} players={players} onClick={startGame}/>
      ) : null}

      {!isGameStarted && isRoomJoined ? (
        <RoomJoined roomId={roomId} players={players}/>
      ) : null}

      {nameSubmitted && !isRoomCreated && !isRoomJoined ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 w-full sm:w-1/2 mx-auto mt-4">
          <button onClick={handleCreateRoom}
                  className="bg-gradient-to-r from-green-400 via-green-500 to-green-600 text-white px-4 py-2 rounded m-1">
            Create Room
          </button>
          <input
            type="text"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder="Enter Room ID"
            className="border border-gray-300 px-4 py-2 rounded m-1"
          />
          <button onClick={handleJoinRoom}
                  className="text-white bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 px-4 py-2 rounded m-1">
            Join Room
          </button>
        </div>
      ) : null}

      {players.length > 0 && (
        <PlayersInRoom players={players}/>
      )}

      {isGameStarted && (
        <>
          <div className="text-center">
            {playerDetails && (
              <div className='flex flex-col md:flex-row justify-evenly items-center relative m-8'>
                <table className="text-sm text-left text-gray-500 dark:text-gray-400">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                  <tr>
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Made</th>
                    <th className="px-6 py-3">To Make</th>
                    <th className="px-6 py-3">Backlogs</th>
                  </tr>
                  </thead>
                  <tbody>
                  {
                    Object.entries(playerDetails).map(([player_id, player_detail]) => (
                      <tr key={player_id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                        <td
                          className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{player_detail.name}</td>
                        <td className="px-6 py-4">{player_detail.made}</td>
                        <td className="px-6 py-4">{player_detail.to_make}</td>
                        <td className="px-6 py-4">{player_detail.backlog}</td>
                      </tr>
                    ))
                  }
                  </tbody>
                </table>

                {thisGameSuit && (
                  <div className='flex flex-col text-2xl justify-center items-center max-h-full m-2'>
                    This game suit is:
                    <span className="text-3xl">{suits[thisGameSuit]} ({thisGameSuit})</span>
                  </div>
                )}

              </div>
            )}
            <div className='game-area'>
              {
                thisTurnCards.length > 0 && (
                  <div className="flex justify-center flex-wrap gap-4 mx-4">
                    {
                      thisTurnCards.map((card, index) => (
                        <div key={index} className="w-1/4 sm:w-1/6 md:w-1/12 lg:w-1/12 xl:w-1/12">
                          <div className="bg-white rounded-lg shadow-lg">
                            <Card key={index} card={card} isActive={false}/>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                )
              }
            </div>
          </div>
        </>
      )}

      {(!thisGameSuit && activePlayer === playerId && activePlayer !== '') ? (
        <div className="flex items-center justify-center m-4">
          {Object.keys(suits).map((suit) => (
            <button key={suits[suit]} onClick={() => submitGameSuit(suit)}
                    className="bg-black text-white px-4 py-2 rounded mr-2">
              {suit} {suits[suit]}
            </button>
          ))}
        </div>
      ) : (
        isGameStarted && !thisGameSuit && (
          <div className="flex items-center justify-center m-4">
            Waiting for {playerDetails[activePlayer]?.name} to select suit
          </div>
        )
      )}

      {isGameStarted && Object.keys(mineDetails).length > 0 && (
        <>
          <div className="flex flex-wrap justify-center gap-4 mx-4">
            {
              mineDetails?.cards.map((this_card, index) => (
                <div key={index} className="w-1/4 sm:w-1/6 md:w-1/12 lg:w-1/12 xl:w-1/12">
                  <div className="bg-white rounded-lg shadow-lg">
                    <Card key={index} card={this_card} onCardClick={handleCardClick}
                          isActive={playerId === activePlayer && thisGameSuit && allowCardClick && (isValidCard(this_card)) }/>
                  </div>
                </div>
              ))
            }
          </div>
        </>
      )}

      {isGameStarted && (
        <div style={{'position': 'fixed'}} className="bottom-0 right-0 p-4 flex flex-col-reverse items-end w-full">
          <button onClick={toggleChat}>
            {isChatOpen ? (
              <div className="text-white bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 font-semibold py-2 px-4 rounded-lg">
                Close
              </div>
            ) : (
              <div className="relative">
                <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2">{messages.length - msgSeenCount}</span>
                <div className="text-white bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 font-semibold py-2 px-4 rounded-lg">Open Chat</div>
              </div>
            )}
          </button>

          {isChatOpen && (
            <div className="bg-white shadow-lg rounded-lg p-4 my-4 w-full sm:w-1/2 flex flex-col content-between">
              <div className="text-xl text-center">
                Chat Area
                <hr className="my-2"/>
              </div>
              <div className="chat-area overflow-y-scroll flex flex-col flex-grow h-64">
                {messages.length > 0 && (
                  messages.map((msg, index) => (
                    <div key={index}>
                      {
                        msg.player_id === playerId ? (
                          <div
                            className="max-w-2/3 w-fit py-1 px-4 m-1 flex flex-col ml-auto justify-end rounded text-white bg-gradient-to-r from-cyan-500 to-blue-500">
                            <p className="text-xs italic">{msg?.name}</p>
                            <p>{msg.msg}</p>
                          </div>
                        ) : (
                          <div
                            className="max-w-2/3 w-fit py-1 px-4 m-1 rounded text-white bg-gradient-to-br from-pink-500 to-orange-400">
                            <p className="text-xs italic">{msg?.name}</p>
                            <p>{msg.msg}</p>
                          </div>
                        )
                      }
                    </div>
                  ))
                )}
              </div>
              <div>
                <hr className="my-2"/>
                <div className="flex ">
              <textarea
                rows="1"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter your message here"
                className="border border-gray-600 px-4 py-2 mb-0 rounded mr-2 w-10/12"
              ></textarea>
                  <button type="button" onClick={sendMessage}
                          className="text-white bg-gradient-to-r from-purple-500 to-pink-500 focus:outline-none font-medium rounded-lg px-5 py-2.5 text-center text-sm cursor-pointer'">Send
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <ToastContainer/>
    </div>
  );
}
