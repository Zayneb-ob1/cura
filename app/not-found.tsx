import type { Metadata } from "next";
import { ButtonLink } from "@/components/buttons";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Page introuvable",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="page-paper framework-state-page">
      <SiteHeader />
      <main id="main-content" tabIndex={-1}>
        <section className="content-shell framework-state">
        <p className="section-label">404 · Page introuvable / Pagina niet gevonden</p>
        <h1 className="editorial-title">Cette page n’existe pas.</h1>
        <p>La page demandée a été déplacée ou supprimée. / De gevraagde pagina is verplaatst of verwijderd.</p>
        <ButtonLink href="/">Retour à l’accueil / Terug naar start</ButtonLink>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
