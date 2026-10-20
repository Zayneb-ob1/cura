"use client";

import { useEffect, useState } from "react";
import { SectionLabel } from "@/components/buttons";
import { useLanguage } from "@/components/language-provider";

type PublicReview = {
  id: string;
  name: string;
  quote: string;
  translation?: string | null;
  rating: number;
  language?: "fr" | "nl";
};

type ReviewsMessages = {
  noReviews: string;
  loadingReviews: string;
  reviewsError: string;
};

/** Published reviews only: they come from the site admin, never from static copy. */
export function ReviewsSection({ label, title, messages }: { label: string; title: string; messages: ReviewsMessages }) {
  const { language } = useLanguage();
  const [managedReviews, setManagedReviews] = useState<PublicReview[] | null>(null);
  const [reviewsState, setReviewsState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const loadingTask = window.setTimeout(() => {
      if (active) {
        setManagedReviews(null);
        setReviewsState("loading");
      }
    }, 0);

    fetch("/api/reviews", { cache: "no-store", signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load reviews");
        return response.json() as Promise<{ items: PublicReview[] }>;
      })
      .then(({ items }) => {
        window.clearTimeout(loadingTask);
        if (active) {
          setManagedReviews(items);
          setReviewsState("ready");
        }
      })
      .catch(() => {
        window.clearTimeout(loadingTask);
        if (active && !controller.signal.aborted) {
          setManagedReviews(null);
          setReviewsState("error");
        }
      });

    return () => {
      active = false;
      window.clearTimeout(loadingTask);
      controller.abort();
    };
  }, [language]);

  const visibleReviews = (managedReviews ?? []).slice(0, 6)
    .map((review) => ({
        id: review.id,
        rating: review.rating,
        stars: "\u2605".repeat(Math.max(1, Math.min(5, review.rating))),
        // Show the translation when the review was written in the other site language.
        quote: review.language && review.language !== language && review.translation ? review.translation : review.quote,
        name: review.name,
      }));
  return (
    <section className="home-reviews" id="avis">
      <div className="content-shell">
        <SectionLabel>{label}</SectionLabel>
        <h2 className="editorial-title">{title}</h2>
        {reviewsState === "loading" ? (
          <p role="status" aria-live="polite">{messages.loadingReviews}</p>
        ) : reviewsState === "error" ? (
          <p role="alert">{messages.reviewsError}</p>
        ) : visibleReviews.length > 0 ? (
          <div className="home-reviews__grid">
            {visibleReviews.map((review) => <article key={review.id}><span className="home-reviews__stars" aria-label={`${review.rating} / 5`}>{review.stars}</span><blockquote>{review.quote}</blockquote><p>{review.name}</p></article>)}
          </div>
        ) : <p>{messages.noReviews}</p>}
      </div>
    </section>
  );
}
