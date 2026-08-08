import { isRed, SUIT_NAMES } from "./Card";

/**
 * The signature element: trump lands as a stamped seal rather than a label.
 * "Hukum" is what the call is actually named at the table — it rides on the
 * seal as an artifact, while the surrounding interface stays plain English.
 */
export default function TrumpStamp({ suit, size = 96, animate = true }) {
  if (!suit) return null;
  const tint = isRed(suit) ? "#C8322F" : "#F2A93B";

  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={animate ? "anim-stamp" : ""}
      style={{ transform: "rotate(-9deg)" }}
      role="img"
      aria-label={`Trump suit: ${SUIT_NAMES[suit]}`}
    >
      <defs>
        <path id="hukum-arc-top" d="M 26,62 A 34,34 0 0 1 94,62" fill="none" />
        <path id="hukum-arc-bottom" d="M 30,60 A 30,30 0 0 0 90,60" fill="none" />
      </defs>

      <circle cx="60" cy="60" r="54" fill="none" stroke={tint} strokeWidth="3" opacity="0.9" />
      <circle
        cx="60"
        cy="60"
        r="47"
        fill="none"
        stroke={tint}
        strokeWidth="1"
        strokeDasharray="2 4"
        opacity="0.7"
      />

      <text
        fill={tint}
        fontSize="13"
        fontWeight="700"
        letterSpacing="4.5"
        opacity="0.95"
      >
        <textPath href="#hukum-arc-top" startOffset="50%" textAnchor="middle">
          HUKUM
        </textPath>
      </text>

      <text fill={tint} fontSize="9" letterSpacing="3" opacity="0.75">
        <textPath href="#hukum-arc-bottom" startOffset="50%" textAnchor="middle">
          TRUMP
        </textPath>
      </text>

      <text
        x="60"
        y="60"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="42"
        fill={tint}
      >
        {suit}
      </text>
    </svg>
  );
}
