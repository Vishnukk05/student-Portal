import React, { useState, useEffect, useRef } from "react";

export function DashboardSlideshow({ slides = [], autoPlayInterval = 5500 }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef(null);
  const progressTimerRef = useRef(null);

  const total = slides.length;

  useEffect(() => {
    if (total <= 1 || isPaused) {
      return;
    }

    timerRef.current = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % total);
    }, autoPlayInterval);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentIndex, isPaused, total, autoPlayInterval]);

  const handlePrev = (e) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + total) % total);
    setProgress(0);
  };

  const handleNext = (e) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % total);
    setProgress(0);
  };

  const goToSlide = (idx) => {
    setCurrentIndex(idx);
    setProgress(0);
  };

  if (!slides || slides.length === 0) return null;

  return (
    <div
      className="dashboard-hero-slideshow"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") handlePrev();
        if (e.key === "ArrowRight") handleNext();
      }}
      aria-label="Dashboard highlights slideshow"
    >
      {/* Slides Slider Track */}
      <div
        className="slideshow-track"
        style={{
          transform: `translateX(-${currentIndex * 100}%)`,
        }}
      >
        {slides.map((slide, idx) => (
          <div
            key={slide.id || idx}
            className={`slideshow-slide slide-theme-${slide.theme || "indigo"}`}
          >
            {/* Background Decorative Mesh & Auras */}
            <div className="slide-mesh-blur mesh-1"></div>
            <div className="slide-mesh-blur mesh-2"></div>
            <div className="slide-mesh-blur mesh-3"></div>

            {/* Slide Content Left */}
            <div className="slide-content-left">
              {slide.badge && (
                <div className="slide-badge">
                  {slide.badgeIcon && <span className="slide-badge-icon">{slide.badgeIcon}</span>}
                  <span>{slide.badge}</span>
                  {slide.badgeExtra && <span className="slide-badge-pill">{slide.badgeExtra}</span>}
                </div>
              )}

              <h2 className="slide-title">{slide.title}</h2>

              {slide.description && (
                <p className="slide-description">{slide.description}</p>
              )}

              {/* Tags / Meta Chips */}
              {slide.tags && slide.tags.length > 0 && (
                <div className="slide-tags-row">
                  {slide.tags.map((tag, tIdx) => (
                    <span key={tIdx} className="slide-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="slide-actions">
                {slide.primaryBtn && (
                  <button
                    type="button"
                    className="slide-btn slide-btn-primary"
                    onClick={slide.primaryBtn.action}
                  >
                    <span>{slide.primaryBtn.label}</span>
                    {slide.primaryBtn.icon || (
                      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    )}
                  </button>
                )}
                {slide.secondaryBtn && (
                  <button
                    type="button"
                    className="slide-btn slide-btn-secondary"
                    onClick={slide.secondaryBtn.action}
                  >
                    <span>{slide.secondaryBtn.label}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Slide Graphic / Card Preview Right */}
            {slide.cardRight && (
              <div className="slide-content-right">
                {slide.cardRight}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      {total > 1 && (
        <>
          <button
            type="button"
            className="slideshow-arrow arrow-left"
            onClick={handlePrev}
            aria-label="Previous slide"
            title="Previous slide"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            className="slideshow-arrow arrow-right"
            onClick={handleNext}
            aria-label="Next slide"
            title="Next slide"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}


    </div>
  );
}

