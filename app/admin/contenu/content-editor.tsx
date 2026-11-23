"use client";

import { useCallback, useEffect, useState } from "react";
import { contentCatalog, type ContentGroup, type ContentOverrides } from "@/lib/content-catalog";
import { useAdminLanguage } from "../admin-i18n";
import styles from "./content-editor.module.css";

type Status = { kind: "idle" | "saving" | "saved" | "error"; message?: string };

/** Edits the texts of the public site, page by page, in French and Dutch. */
export function ContentEditor() {
  const { t, language } = useAdminLanguage();
  const [state, setState] = useState<"loading" | "ready" | "unauthorized" | "error">("loading");
  const [values, setValues] = useState<ContentOverrides>({});
  const [openGroup, setOpenGroup] = useState(contentCatalog[0].id);
  const [status, setStatus] = useState<Record<string, Status>>({});

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/content", { cache: "no-store" });
      if (response.status === 401) return setState("unauthorized");
      if (!response.ok) throw new Error();
      const data = (await response.json()) as { overrides: ContentOverrides };
      setValues(data.overrides ?? {});
      setState("ready");
    } catch {
      setState("error");
    }
  }, []);

  useEffect(() => {
    const task = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(task);
  }, [load]);

  const fieldValue = (key: string, lang: "fr" | "nl") => values[key]?.[lang] ?? "";
  const setField = (key: string, lang: "fr" | "nl", value: string) => {
    setValues((current) => ({ ...current, [key]: { fr: current[key]?.fr ?? "", nl: current[key]?.nl ?? "", [lang]: value } }));
  };

  async function saveGroup(group: ContentGroup) {
    setStatus((current) => ({ ...current, [group.id]: { kind: "saving" } }));
    const overrides: ContentOverrides = {};
    for (const field of group.fields) overrides[field.key] = { fr: fieldValue(field.key, "fr"), nl: fieldValue(field.key, "nl") };
    try {
      const response = await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ overrides }),
      });
      if (!response.ok) throw new Error();
      const data = (await response.json()) as { overrides: ContentOverrides };
      setValues(data.overrides ?? {});
      setStatus((current) => ({ ...current, [group.id]: { kind: "saved" } }));
    } catch {
      setStatus((current) => ({ ...current, [group.id]: { kind: "error" } }));
    }
  }

  if (state === "loading") return <p className={styles.note}>{t("Chargement…", "Laden…")}</p>;
  if (state === "unauthorized") {
    return <p className={styles.note}>{t("Votre session a expiré.", "Uw sessie is verlopen.")} <a href="/admin">{t("Se connecter", "Aanmelden")}</a></p>;
  }
  if (state === "error") return <p className={styles.error}>{t("Le contenu ne peut pas être chargé pour le moment.", "De inhoud kan momenteel niet worden geladen.")}</p>;

  return (
    <div className={styles.editor}>
      <p className={styles.intro}>
        {t(
          "Modifiez les textes du site en français et en néerlandais. Un champ laissé vide affiche le texte d’origine (indiqué en gris). Les changements sont visibles sur le site dès l’enregistrement.",
          "Wijzig de teksten van de website in het Frans en het Nederlands. Een leeg veld toont de oorspronkelijke tekst (in het grijs). Wijzigingen zijn zichtbaar op de website zodra ze zijn opgeslagen.",
        )}
      </p>
      <div className={styles.tabs} role="tablist">
        {contentCatalog.map((group) => (
          <button key={group.id} type="button" role="tab" aria-selected={openGroup === group.id} onClick={() => setOpenGroup(group.id)}>
            {group.title[language]}
          </button>
        ))}
      </div>
      {contentCatalog.filter((group) => group.id === openGroup).map((group) => {
        const groupStatus = status[group.id]?.kind ?? "idle";
        return (
          <section key={group.id} className={styles.group}>
            <header className={styles.groupHeader}>
              <h2>{group.title[language]}</h2>
              <a href={`${group.path}?lang=${language}`} target="_blank" rel="noreferrer">{t("Voir la page ↗", "Pagina bekijken ↗")}</a>
            </header>
            {group.fields.map((field) => (
              <div key={field.key} className={styles.field}>
                <p className={styles.label}>{field.label[language]}</p>
                <div className={styles.pair}>
                  {(["fr", "nl"] as const).map((lang) => {
                    const id = `${field.key}-${lang}`;
                    const props = {
                      id,
                      value: fieldValue(field.key, lang),
                      placeholder: field.defaults[lang],
                      onChange: (event: { target: { value: string } }) => setField(field.key, lang, event.target.value),
                    };
                    return (
                      <label key={lang} htmlFor={id} className={styles.input}>
                        <span>{lang.toUpperCase()}</span>
                        {field.multiline ? <textarea rows={3} {...props} /> : <input {...props} />}
                        {fieldValue(field.key, lang) && (
                          <button type="button" className={styles.reset} onClick={() => setField(field.key, lang, "")}>
                            {t("Rétablir le texte d’origine", "Oorspronkelijke tekst herstellen")}
                          </button>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
            <div className={styles.actions}>
              <button type="button" className={styles.save} onClick={() => void saveGroup(group)} disabled={groupStatus === "saving"}>
                {groupStatus === "saving" ? t("Enregistrement…", "Opslaan…") : t("Enregistrer cette page", "Deze pagina opslaan")}
              </button>
              <span role="status" aria-live="polite" className={groupStatus === "error" ? styles.error : styles.note}>
                {groupStatus === "saved" && t("Enregistré — visible sur le site.", "Opgeslagen — zichtbaar op de website.")}
                {groupStatus === "error" && t("L’enregistrement a échoué. Réessayez.", "Opslaan mislukt. Probeer opnieuw.")}
              </span>
            </div>
          </section>
        );
      })}
    </div>
  );
}
