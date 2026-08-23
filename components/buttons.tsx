import Link from "next/link";
import type { ReactNode } from "react";

export function ButtonLink({
  href,
  children,
  tone = "green",
}: {
  href: string;
  children: ReactNode;
  tone?: "green" | "outline";
}) {
  return (
    <Link className={`button-link button-link--${tone}`} href={href}>
      {children}
    </Link>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="section-label">{children}</p>;
}
