import Image from "next/image";
import Link from "next/link";

export function Logo({
  compact = false,
  nameOnly = false,
  withMark = false,
}: {
  compact?: boolean;
  nameOnly?: boolean;
  withMark?: boolean;
}) {
  return (
    <Link href="/" className="logo" aria-label="CURA Tandarts Praktijk, accueil">
      {withMark && (
        <Image
          className="logo__mark"
          src="/brand/cura-tooth.png"
          alt=""
          width={656}
          height={784}
          priority
        />
      )}
      <span className="logo__name">CURA</span>
      {!nameOnly && (
        <span className="logo__descriptor">
          {compact ? <><span>TANDARTS</span><span>PRAKTIJK</span></> : "TANDARTS PRAKTIJK"}
        </span>
      )}
      {!compact && <span className="sr-only">CURA Tandarts Praktijk</span>}
    </Link>
  );
}
