import Image from "next/image";
import Link from "next/link";

export function Logo({
  compact = false,
  nameOnly = false,
  withMark = false,
  homeLabel,
  priority = false,
}: {
  compact?: boolean;
  nameOnly?: boolean;
  withMark?: boolean;
  homeLabel?: string;
  priority?: boolean;
}) {
  return (
    <Link href="/" className="logo">
      {withMark && (
        <Image
          className="logo__mark"
          src="/brand/cura-tooth.png"
          alt=""
          width={656}
          height={784}
          sizes="48px"
          priority={priority}
        />
      )}
      <span className="logo__name">CURA</span>
      {!nameOnly && (
        <span className="logo__descriptor">
          {compact ? <><span>TANDARTS</span><span>PRAKTIJK</span></> : "TANDARTS PRAKTIJK"}
        </span>
      )}
      {homeLabel && <span className="sr-only"> — {homeLabel}</span>}
    </Link>
  );
}
