"use client";

import { useAdminLanguage } from "../admin-i18n";
import { AdminPage, AdminPageHeader } from "../admin-shell";
import { ContentEditor } from "./content-editor";

function ContentPageBody() {
  const { t } = useAdminLanguage();
  return (
    <>
      <AdminPageHeader
        eyebrow={t("Site", "Website")}
        title={t("Contenu du site", "Inhoud van de website")}
        description={t("Les textes des pages publiques, en français et en néerlandais.", "De teksten van de publieke pagina’s, in het Frans en het Nederlands.")}
      />
      <ContentEditor />
    </>
  );
}

export default function ContentPage() {
  return <AdminPage active="contenu">{() => <ContentPageBody />}</AdminPage>;
}
