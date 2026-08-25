import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function Loading() {
  return (
    <div className="page-paper framework-state-page">
      <SiteHeader />
      <main id="main-content" tabIndex={-1}>
        <section className="content-shell framework-state" aria-live="polite" aria-busy="true">
        <p className="section-label">CURA</p>
        <div className="framework-state__skeleton" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <p className="framework-state__status">Chargement… / Laden…</p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
