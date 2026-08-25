"use client";

import { useLanguage } from "@/components/language-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const copy = {
  fr: {
    label: "Une erreur est survenue",
    title: "Cette page ne peut pas être affichée pour le moment.",
    body: "Vous pouvez réessayer sans perdre votre place.",
    action: "Réessayer",
  },
  nl: {
    label: "Er is iets misgegaan",
    title: "Deze pagina kan momenteel niet worden weergegeven.",
    body: "U kunt opnieuw proberen zonder uw plaats te verliezen.",
    action: "Opnieuw proberen",
  },
} as const;

export default function ErrorState({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const { language } = useLanguage();
  const text = copy[language];

  return (
    <div className="page-paper framework-state-page">
      <SiteHeader />
      <main id="main-content" tabIndex={-1}>
        <section className="content-shell framework-state" role="alert">
        <p className="section-label">{text.label}</p>
        <h1 className="editorial-title">{text.title}</h1>
        <p>{text.body}</p>
        <button className="button-link button-link--green" type="button" onClick={retry}>
          {text.action}
        </button>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
