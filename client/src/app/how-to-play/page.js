import Link from "next/link";

export default function About() {
  return (
    <div className="bg-blue-100 min-h-screen">
      <div className="max-w-7xl mx-auto p-6">
        
        <div className="flex justify-between mb-8">
          <span className="text-3xl text-center font-bold">How to play</span>
          <Link href={"/"} className="text-white bg-black px-3 py-2 rounded-md">Back to game</Link>
        </div>
        
        <div className="flex flex-col gap-6 items-center justify-center">
          <div className="bg-white w-full sm:w-3/4 p-6 rounded-md">
            <h3 className="text-2xl text-center mb-3">Trump suit</h3>
            <p>
              <span className="text-red-600">Note:</span>
              <span className="italic"> The trump suit logic is a bit different from the real game.</span>
            </p>
            <p>
              The player who host the room will be the first to choose the trump suit.
            </p>
          </div>
          
          <div className="bg-white w-full sm:w-3/4 p-6 rounded-md">
            <h3 className="text-2xl text-center mb-3">Gameplay</h3>
            <p className="mb-3">
              Once the trump suit has also been announced, the player who chose the trump suit is given leads the first
              trick. The player can lead the first trick with any card, and the other players
              follow suit. If a player doesn&apos;t have a card of the same suit, they can either choose to play a trump
              card or any other card of another suit.
            </p>
            <p className="mb-3">
              The player who plays the highest trump card, or if no trump is used, then the highest card of the same
              suit, wins the trick. The winner of each trick then leads the subsequent trick in a similar way. However,
              in the next round, the player who was assigned 2 tricks is assigned 3 tricks, the player who was assigned
              3 tricks is assigned 5 tricks, and the 5-trick player is assigned 2 tricks.
            </p>
            <p className="mb-3">
              For instance, if a player leads the trick with A of Spades, the second player plays 8 of Hearts, and the
              third player plays 7 of Spades. Assuming that Hearts is the trump. The player who plays the 8 of Hearts
              will win the trick.
            </p>
          </div>
          
          <div className="bg-white w-full sm:w-3/4 p-6 rounded-md">
            <h3 className="text-2xl text-center mb-3">7 8 Card Game (It is a variant of 3 2 5)</h3>
            <p>
              The 7 8 card game is quite similar to the 3 2 5 card game. Only two players can play this game. One of the
              players becomes the dealer, and another player cuts the deck. The game is played for 15 hands, and the
              dealer has to win over 7 tricks while the other player has to win 8 or more hands to win the match.
            </p>
          </div>
          
          <div className="bg-white w-full sm:w-3/4 p-6 rounded-md">
            <h3 className="text-2xl text-center mb-3">Strategies To Win The Game</h3>
            <p className="mb-3">
              <span className="font-semibold">Use trump cards wisely</span> - If you use the trump cards wisely, you can win
              more tricks. Try using the high-ranking trump cards such as A, K, Q when you are leading, so that your
              opponents are forced to play their trump card. You can take advantage of the lower-ranking trump cards to
              win a trick when you don&apos;t have cards from the lead suit.
            </p>
            <p className="mb-3">
              <span className="font-semibold">Choosing the trump card</span> - The 5-card player is always in a difficult
              position, but they also get to choose the trump card. If you are the 5-card player, make sure you choose
              the trump wisely. If you have more of one suit cards, it may be better to pick that suit for trump. If you
              have an Ace and another low-value card of the same suit, it may be good to choose that suit for trump as
              well.
            </p>
            <p className="mb-3">
              <span className="font-semibold">Make additional tricks</span> - Irrespective of the number of tricks you have
              to win, you should always try to win extra tricks using your strategies. Winning additional tricks gives
              you the upper hand in the following round.
            </p>
            <p className="mb-3">
              <span className="font-semibold">Keep an eye on the cards being played</span> - If you can remember the cards
              that have already been played, you can take advantage of the cards in your hand. For instance, if you have
              a K of Hearts and the A of Hearts has already been played previously, you can play the K of Hearts and win
              the trick in the early stages of the round.
            </p>
          </div>
        
        </div>
      </div>
    </div>
  )
}
