export function ToothArt({ variant = 0 }: { variant?: number }) {
  const paths = [
    "M31 25c-10-7-19 1-17 13 2 16 6 24 11 24 6 0 6-17 12-17 M61 58a15 15 0 1 0 30 0 15 15 0 1 0-30 0 M86 69l12 10",
    "M52 24c-16-8-31 5-27 23 4 22 10 34 16 34 8 0 7-24 15-24s8 24 16 24c7 0 12-12 16-34 4-18-11-31-27-23-3 2-6 4-9 0Z M44 40l8 10 8-10",
    "M30 63c11-31 25-41 38-32 M73 26l-9 48 M57 52l22 8",
  ];

  return (
    <div className={`tooth-art tooth-art--${variant}`} aria-hidden="true">
      <span className="tooth-art__orb tooth-art__orb--one" />
      <span className="tooth-art__orb tooth-art__orb--two" />
      <svg viewBox="0 0 110 100" role="presentation">
        <path d={paths[variant % paths.length]} />
      </svg>
      <svg className="tooth-art__waves" viewBox="0 0 320 80" preserveAspectRatio="none">
        <path d="M0 20C55 2 82 38 132 22s77-4 111 8 54-2 77-15" />
        <path d="M0 39c55-18 82 18 132 2s77-4 111 8 54-2 77-15" />
        <path d="M0 58c55-18 82 18 132 2s77-4 111 8 54-2 77-15" />
      </svg>
    </div>
  );
}
