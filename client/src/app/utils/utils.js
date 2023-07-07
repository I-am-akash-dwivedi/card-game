export function generateUniqueId() {
  const timestamp = new Date().getTime();
  const randomNum = Math.floor(Math.random() * 1000000);
  return `${timestamp}${randomNum}`;
}

export function deckOfCards() {
  // const suits = ["Hearts", "Diamonds", "Clubs", "Spades"];
  const suits = ["♥", "♦", "♣", "♠"];
  const ranks = [2, 3, 4, 5, 6, 7, 8, 9, 10, 'J', 'Q', 'K', 'A'];
  const deck = [];
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ suit, rank });
    }
  }
  return deck;
}

export function shuffleDeck(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

const cardValueOrder = {
  J: 11,
  Q: 12,
  K: 13,
  A: 14,
};

const arrangeCards = (cards) => {
  // Group the cards by their suits
  const groupedCards = cards.reduce((groups, card) => {
    if (!groups[card.suit]) {
      groups[card.suit] = [];
    }
    groups[card.suit].push(card);
    return groups;
  }, {});

  // Sort and arrange each group of cards
  Object.values(groupedCards).forEach((group) => {
    group.sort((a, b) => {
      const aValue = cardValueOrder[a.rank] || parseInt(a.rank, 10);
      const bValue = cardValueOrder[b.rank] || parseInt(b.rank, 10);
      return aValue - bValue;
    });
  });

  // Concatenate the groups into a single array
  return Object.values(groupedCards).flatMap((group) => group);
};

export const handsToMake = (numberOfPlayers) => {
  let hands_to_make = [];
  if (numberOfPlayers === 2) {
    hands_to_make = [8, 7]
  } else if (numberOfPlayers === 3) {
    hands_to_make = [5, 2, 3]
  } else if (numberOfPlayers === 4) {
    hands_to_make = []
  }
  return hands_to_make;
}

export const distributeCards = (deck, playerDetails) => {
  const number_of_players = Object.keys(playerDetails).length;
  let cardsPerPlayer = handsToMake(number_of_players);
  for (const cardPerPlayer of cardsPerPlayer) {
    Object.entries(playerDetails).forEach(([player_id, playerDetail]) => {
      let this_loop_cards = []
      for(let i = 0; i < cardPerPlayer; i++) {
        const card = deck.pop();
        card.player_id = player_id;
        this_loop_cards.push(card);
      }
      playerDetail.cards.push(...this_loop_cards)
    });
  }

  Object.entries(playerDetails).forEach(([player_id, playerDetail]) => {
    const cards = playerDetail.cards;
    playerDetail.cards = arrangeCards(cards);
  })
}

export function checkRoundWinner(suit, cards) {
  if (cards.length === 0) {
    return;
  }
  let winner = null;
  let highestCard = null;
  let this_suit = cards[0].suit;
  let has_color = false;
  for (const card of cards) {
    let value = cardValueOrder[card.rank] || parseInt(card.rank, 10);
    card.value = value;
    if (card.suit === suit) {
      has_color = true;
      if (highestCard === null) {
        highestCard = card;
        winner = card;
      } else if (value > highestCard.value || suit !== highestCard.suit) {
        highestCard = card;
        winner = card;
      }
    } else if (card.suit === this_suit && has_color === false) {
      if (highestCard === null) {
        highestCard = card;
        winner = card;
      } else if (value > highestCard.value) {
        highestCard = card;
        winner = card;
      }
    }
  }
  return winner;
}

