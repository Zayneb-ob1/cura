const sparkle = "M0 -9 C1 -2 2 -1 9 0 C2 1 1 2 0 9 C-1 2 -2 1 -9 0 C-2 -1 -1 -2 0 -9 Z";

const icons = [
  // Tooth with sparkle
  <g key="tooth">
    <path d="M18 14c-6 0-10 5-10 12 0 6 2 10 3 16 1 7 2 16 6 16 4 0 4-10 7-14 1-2 3-2 4 0 3 4 3 14 7 14 4 0 5-9 6-16 1-6 3-10 3-16 0-7-4-12-10-12-4 0-6 2-8 2s-4-2-8-2Z" />
    <path d="M20 22c-3 1-5 3-5 6" />
    <path d={sparkle} transform="translate(52 12)" />
  </g>,
  // Practitioner (cap, mask) with sparkle
  <g key="practitioner">
    <path d="M18 22c0-6 5-10 12-10s12 4 12 10" />
    <path d="M16 22h28v5H16z" />
    <path d="M30 14v6M27 17h6" />
    <path d="M19 27c0 8 5 13 11 13s11-5 11-13" />
    <path d="M21 31h18c0 4-4 7-9 7s-9-3-9-7Z" />
    <path d="M12 60c0-10 8-16 18-16s18 6 18 16" />
    <path d="M24 45l6 8 6-8" />
    <path d={sparkle} transform="translate(52 12) scale(.8)" />
    <path d={sparkle} transform="translate(8 40) scale(.5)" />
  </g>,
  // Dental chair with lamp
  <g key="chair">
    <path d="M14 22l8 20h22" />
    <path d="M10 18l4 4" />
    <path d="M22 42l-4 8h28l2-8" />
    <path d="M32 50v6M22 58h20" />
    <path d="M44 42l6-10h6" />
    <path d="M40 8h8v26" />
    <path d="M40 8c-4 0-6 3-6 6h-4" />
    <path d="M26 12h8v5h-8z" />
  </g>,
  // Caduceus with wings
  <g key="caduceus">
    <path d="M32 6v54" />
    <circle cx="32" cy="9" r="3" />
    <path d="M32 18c-14 0-22-4-26-8 6 2 14 3 26 3s20-1 26-3c-4 4-12 8-26 8Z" />
    <path d="M10 20c6 2 14 3 22 3s16-1 22-3" />
    <path d="M38 26c0 4-12 4-12 9s12 5 12 10-12 5-12 9" />
    <path d="M26 26c0 4 12 4 12 9s-12 5-12 10 12 5 12 9" />
  </g>,
];

export function ValueIcon({ index }: { index: number }) {
  return (
    <svg
      className="value-icon"
      viewBox="0 0 64 64"
      width="64"
      height="64"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {icons[index % icons.length]}
    </svg>
  );
}
