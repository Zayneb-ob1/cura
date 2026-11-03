"use client";

import { useEffect, useRef, useState } from "react";
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
  // Carousel: three reviews visible on desktop (one on phones); arrows move one review at a time.
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [positions, setPositions] = useState(1);
  const cardStep = () => {
    const track = trackRef.current;
    const card = track?.querySelector("article");
    return track && card ? card.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || "0") : 0;
  };
  const scrollReviews = (direction: 1 | -1) => trackRef.current?.scrollBy({ left: direction * cardStep(), behavior: "smooth" });
  const updateActiveIndex = () => {
    const step = cardStep();
    const track = trackRef.current;
    if (!step || !track) return;
    setActiveIndex(Math.round(track.scrollLeft / step));
    setPositions(Math.max(1, Math.round((track.scrollWidth - track.clientWidth) / step) + 1));
  };

  // Recount the reachable positions once the reviews are shown and when the window is resized.
  useEffect(() => {
    if (reviewsState !== "ready") return;
    const task = window.setTimeout(updateActiveIndex, 0);
    window.addEventListener("resize", updateActiveIndex);
    return () => {
      window.clearTimeout(task);
      window.removeEventListener("resize", updateActiveIndex);
    };
  });

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
          <div className="reviews-carousel">
            <button type="button" className="reviews-carousel__arrow reviews-carousel__arrow--prev" aria-label={language === "nl" ? "Vorige beoordelingen" : "Avis précédents"} onClick={() => scrollReviews(-1)} disabled={activeIndex === 0}>‹</button>
            <div className="home-reviews__grid reviews-carousel__track" ref={trackRef} onScroll={updateActiveIndex}>
              {visibleReviews.map((review) => <article key={review.id}><span className="home-reviews__stars" aria-label={`${review.rating} / 5`}>{review.stars}</span><blockquote>{review.quote}</blockquote><p>{review.name}</p></article>)}
            </div>
            <button type="button" className="reviews-carousel__arrow reviews-carousel__arrow--next" aria-label={language === "nl" ? "Volgende beoordelingen" : "Avis suivants"} onClick={() => scrollReviews(1)} disabled={activeIndex >= positions - 1}>›</button>
            <div className="reviews-carousel__dots" aria-hidden="true">
              {Array.from({ length: positions }, (_, index) => <span key={index} className={index === activeIndex ? "is-active" : undefined} />)}
            </div>
          </div>
        ) : <p>{messages.noReviews}</p>}
      </div>
    </section>
  );
}
