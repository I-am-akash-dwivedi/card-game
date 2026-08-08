import Link from "next/link";

export const metadata = {
  title: "How to play — Teen Do Paanch",
  description:
    "Rules for 3-2-5 (teen do paanch) and its two-player variant 7-8: targets, trump, following suit, and how tricks are scored.",
};

function Section({ eyebrow, title, children }) {
  return (
    <section className="panel p-5 sm:p-7">
      <p className="font-display text-[11px] uppercase tracking-[0.3em] text-brass">
        {eyebrow}
      </p>
      <h2 className="mt-2 font-display text-2xl font-extrabold tracking-tight">
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-chalk-dim">
        {children}
      </div>
    </section>
  );
}

export default function HowToPlay() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          How to play
        </h1>
        <Link href="/" className="btn btn-ghost px-3.5 py-2 text-sm">
          Back to the table
        </Link>
      </div>

      <p className="mt-3 text-[15px] text-chalk-dim">
        Teen Do Paanch (3-2-5) is a trick-taking game for three. With two
        players you play the 7-8 variant, where the targets are 8 and 7 instead.
      </p>

      <div className="rule-brass my-8" />

      <div className="space-y-5">
        <Section eyebrow="The point" title="Win exactly your number">
          <p>
            Every player is given a target: <strong className="text-chalk">5</strong>,{" "}
            <strong className="text-chalk">2</strong>, and{" "}
            <strong className="text-chalk">3</strong> tricks for three players,
            or <strong className="text-chalk">8</strong> and{" "}
            <strong className="text-chalk">7</strong> for two. Ten tricks are
            played per round with three at the table, fifteen with two.
          </p>
          <p>
            Finish above your target and the surplus is banked. Finish below and
            the shortfall is deducted. After six rounds, the highest total wins
            the match.
          </p>
        </Section>

        <Section eyebrow="Before the cards" title="Calling trump">
          <p>
            The player holding the largest target calls trump for the round — 5
            with three players, 8 with two. That suit beats every other suit
            until the round ends.
          </p>
          <p>
            Whoever calls trump also leads the first trick. Look at what you
            hold before you decide: length in a suit matters more than a single
            high card.
          </p>
        </Section>

        <Section eyebrow="Each trick" title="Following suit">
          <p>
            The leader plays any card. Everyone else must play the same suit if
            they hold one. If you are void in that suit, you may play anything —
            including a trump.
          </p>
          <p>
            The highest trump takes the trick. If no trump was played, the
            highest card of the led suit takes it. The winner leads the next
            trick.
          </p>
          <p className="rounded-lg border border-ink-line bg-ink/50 p-3.5 text-sm">
            <span className="text-chalk">For example:</span> hearts are trump.
            The lead is A♠, then 8♥, then 7♠. The 8♥ takes the trick — the
            lowest trump still beats the highest card of another suit.
          </p>
        </Section>

        <Section eyebrow="Between rounds" title="The targets rotate">
          <p>
            Targets move on each round: 2 becomes 3, 3 becomes 5, and 5 becomes
            2. With two players, 8 and 7 simply swap. Everyone spends equal time
            in the hardest seat.
          </p>
        </Section>

        <Section eyebrow="Playing better" title="Four things worth knowing">
          <p>
            <strong className="text-chalk">Lead high early.</strong> Leading with
            A or K forces trumps out of other hands while you still hold enough
            cards to profit from it.
          </p>
          <p>
            <strong className="text-chalk">Choose trump for length.</strong>{" "}
            Six small cards in a suit will win more tricks than an ace and a
            two.
          </p>
          <p>
            <strong className="text-chalk">Overshoot deliberately.</strong>{" "}
            Tricks above your target carry into your total, so take extras when
            they are cheap.
          </p>
          <p>
            <strong className="text-chalk">Count what has gone.</strong> Once the
            A♥ has been played, your K♥ is the best heart left. Games are won on
            this.
          </p>
        </Section>
      </div>

      <div className="mt-9 text-center">
        <Link href="/" className="btn btn-primary px-5 py-2.5">
          Back to the table
        </Link>
      </div>
    </div>
  );
}
