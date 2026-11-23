"use client";

import { useAdminLanguage } from "../admin-i18n";
import { ContentEditor } from "./content-editor";

export default function ContentPage() {
  const { t } = useAdminLanguage();
  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 20px" }}>
      <h1 style={{ margin: "0 0 16px", fontSize: 28 }}>{t("Contenu du site", "Inhoud van de website")}</h1>
      <ContentEditor />
    </main>
  );
}
