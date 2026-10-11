import Image from "next/image";
import type { ReactNode } from "react";
import { ButtonLink, SectionLabel } from "@/components/buttons";

/** Dark page header from the Figma frames: tooth mark on the right, or a full-bleed photo. */
export function PageHero({
  label,
  title,
  accent,
  text,
  action,
  photo,
  visual = "tooth",
}: {
  label?: string;
  title: ReactNode;
  accent?: ReactNode;
  text?: string;
  action?: { href: string; label: string };
  photo?: string;
  visual?: "tooth" | "none";
}) {
  return (
    <section className={photo ? "page-hero page-hero--photo" : "page-hero"} id="main-content" tabIndex={-1}>
      {photo && <Image className="page-hero__photo" src={photo} alt="" fill priority sizes="100vw" />}
      <div className="content-shell page-hero__grid">
        <div className="page-hero__content">
          {label && <SectionLabel>{label}</SectionLabel>}
          <h1>{title}{accent && <span>{accent}</span>}</h1>
          {text && <p>{text}</p>}
          {action && <ButtonLink href={action.href}>{action.label}</ButtonLink>}
        </div>
        {!photo && visual === "tooth" && (
          <div className="page-hero__visual" aria-hidden="true">
            <Image src="/brand/cura-tooth.png" alt="" width={656} height={784} sizes="(max-width: 720px) 40vw, 30vw" priority />
          </div>
        )}
      </div>
    </section>
  );
}

export function PageCta({ title, text, action }: { title: ReactNode; text: string; action: { href: string; label: string } }) {
  return (
    <section className="home-cta">
      <h2 className="editorial-title">{title}</h2>
      <p>{text}</p>
      <ButtonLink href={action.href}>{action.label}</ButtonLink>
    </section>
  );
}
