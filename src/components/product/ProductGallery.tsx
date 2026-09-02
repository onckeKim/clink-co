"use client";

import * as React from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Maximize2, Play, X, ZoomIn, ZoomOut } from "lucide-react";
import { useMounted } from "@/lib/hooks/use-mounted";
import { cn } from "@/lib/utils";

type Slide = { type: "image"; src: string; alt: string } | { type: "video"; src: string; poster?: string };

/**
 * The PDP media gallery: a main image with hover-zoom and swipe navigation,
 * a thumbnail rail (images + an optional video slide), a full-screen
 * lightbox with its own zoom toggle, and keyboard/touch support throughout.
 * `images` should already be resolved for the current variant selection by
 * the caller (falls back to the base product images when a variant has no
 * override) — the gallery itself is variant-agnostic.
 */
export function ProductGallery({
  images,
  videoUrl,
  productName,
}: {
  images: string[];
  videoUrl?: string;
  productName: string;
}) {
  const mounted = useMounted();
  const slides: Slide[] = React.useMemo(() => {
    const imageSlides: Slide[] = images.map((src, i) => ({
      type: "image",
      src,
      alt: i === 0 ? productName : `${productName} — alternate view ${i + 1}`,
    }));
    return videoUrl ? [...imageSlides, { type: "video", src: videoUrl }] : imageSlides;
  }, [images, videoUrl, productName]);

  const [activeIndex, setActiveIndex] = React.useState(0);

  // Reset to the first slide whenever the resolved image set changes (e.g.
  // a new variant was selected) — adjusted during render, not an effect,
  // per React's "resetting state when a prop changes" pattern.
  const [lastImages, setLastImages] = React.useState(images);
  if (images !== lastImages) {
    setLastImages(images);
    setActiveIndex(0);
  }

  const [lightboxOpen, setLightboxOpen] = React.useState(false);
  const [zoomActive, setZoomActive] = React.useState(false);
  const [zoomOrigin, setZoomOrigin] = React.useState({ x: 50, y: 50 });

  const goTo = React.useCallback(
    (index: number) => setActiveIndex((index + slides.length) % slides.length),
    [slides.length],
  );
  const goNext = React.useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);
  const goPrev = React.useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);

  const activeSlide = slides[activeIndex];

  return (
    <div className="flex flex-col gap-3">
      <div
        className="group relative aspect-square overflow-hidden rounded-3xl bg-sand/40"
        onMouseEnter={() => activeSlide?.type === "image" && setZoomActive(true)}
        onMouseLeave={() => setZoomActive(false)}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          setZoomOrigin({
            x: ((e.clientX - rect.left) / rect.width) * 100,
            y: ((e.clientY - rect.top) / rect.height) * 100,
          });
        }}
      >
        <motion.div
          key={activeIndex}
          drag={slides.length > 1 ? "x" : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.6}
          onDragEnd={(_e, info) => {
            if (info.offset.x < -60) goNext();
            else if (info.offset.x > 60) goPrev();
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="relative h-full w-full touch-pan-y"
        >
          {activeSlide?.type === "video" ? (
            <video
              src={activeSlide.src}
              controls
              loop
              muted
              playsInline
              className="h-full w-full object-cover"
              aria-label={`${productName} product video`}
            />
          ) : (
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              aria-label={`View full-screen image of ${productName}`}
              className="focus-ring relative block h-full w-full cursor-zoom-in"
            >
              <Image
                src={activeSlide?.src ?? images[0]}
                alt={activeSlide?.type === "image" ? activeSlide.alt : productName}
                fill
                priority={activeIndex === 0}
                sizes="(min-width: 1024px) 45vw, 90vw"
                className="object-cover transition-transform duration-200 ease-out"
                style={
                  zoomActive
                    ? { transform: "scale(1.8)", transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%` }
                    : undefined
                }
              />
            </button>
          )}
        </motion.div>

        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          aria-label="Open full-screen gallery"
          className="focus-ring absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-warm-white/90 text-charcoal opacity-0 backdrop-blur transition-opacity duration-200 group-hover:opacity-100 sm:opacity-100"
        >
          <Maximize2 className="h-4 w-4" />
        </button>

        {slides.length > 1 && (
          <>
            <button
              type="button"
              onClick={goPrev}
              aria-label="Previous image"
              className="focus-ring absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-warm-white/90 text-charcoal opacity-0 backdrop-blur transition-opacity duration-200 group-hover:opacity-100 sm:opacity-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="Next image"
              className="focus-ring absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-warm-white/90 text-charcoal opacity-0 backdrop-blur transition-opacity duration-200 group-hover:opacity-100 sm:opacity-100"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      {slides.length > 1 && (
        <div
          className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label={`${productName} media thumbnails`}
        >
          {slides.map((slide, i) => (
            <button
              key={slide.src + i}
              type="button"
              role="tab"
              aria-selected={activeIndex === i}
              onClick={() => setActiveIndex(i)}
              aria-label={
                slide.type === "video" ? `Play ${productName} video` : `Show image ${i + 1} of ${productName}`
              }
              className={cn(
                "focus-ring relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 bg-sand/40 transition-colors",
                activeIndex === i ? "border-charcoal" : "border-transparent",
              )}
            >
              {slide.type === "video" ? (
                <>
                  <Image
                    src={slide.poster ?? images[0]}
                    alt=""
                    aria-hidden
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                  <span className="absolute inset-0 flex items-center justify-center bg-charcoal/30">
                    <Play className="h-5 w-5 fill-warm-white text-warm-white" />
                  </span>
                </>
              ) : (
                <Image src={slide.src} alt="" fill sizes="80px" className="object-cover" />
              )}
            </button>
          ))}
        </div>
      )}

      {mounted &&
        createPortal(
          <Lightbox
            open={lightboxOpen}
            slides={slides}
            activeIndex={activeIndex}
            productName={productName}
            onIndexChange={setActiveIndex}
            onClose={() => setLightboxOpen(false)}
          />,
          document.body,
        )}
    </div>
  );
}

function Lightbox({
  open,
  slides,
  activeIndex,
  productName,
  onIndexChange,
  onClose,
}: {
  open: boolean;
  slides: Slide[];
  activeIndex: number;
  productName: string;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}) {
  const [zoomed, setZoomed] = React.useState(false);
  const slide = slides[activeIndex];

  // Reset zoom each time the lightbox opens — adjusted during render (not
  // an effect) per React's "resetting state when a prop changes" pattern.
  const [wasOpen, setWasOpen] = React.useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setZoomed(false);
  }

  React.useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onIndexChange((activeIndex + 1) % slides.length);
      if (e.key === "ArrowLeft") onIndexChange((activeIndex - 1 + slides.length) % slides.length);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, activeIndex, slides.length, onClose, onIndexChange]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[70] flex flex-col bg-charcoal"
          role="dialog"
          aria-modal="true"
          aria-label={`${productName} full-screen gallery`}
        >
          <div className="flex items-center justify-between px-5 py-4">
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-warm-white/60">
              {activeIndex + 1} / {slides.length}
            </span>
            <div className="flex items-center gap-2">
              {slide?.type === "image" && (
                <button
                  type="button"
                  onClick={() => setZoomed((z) => !z)}
                  aria-label={zoomed ? "Zoom out" : "Zoom in"}
                  className="focus-ring flex h-10 w-10 items-center justify-center rounded-full text-warm-white hover:bg-warm-white/10"
                >
                  {zoomed ? <ZoomOut className="h-5 w-5" /> : <ZoomIn className="h-5 w-5" />}
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close full-screen gallery"
                className="focus-ring flex h-10 w-10 items-center justify-center rounded-full text-warm-white hover:bg-warm-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="relative flex-1 overflow-hidden">
            {slide?.type === "video" ? (
              <video
                src={slide.src}
                controls
                autoPlay
                loop
                muted
                playsInline
                className="h-full w-full object-contain"
              />
            ) : (
              <button
                type="button"
                onClick={() => setZoomed((z) => !z)}
                aria-label={zoomed ? "Zoom out" : "Zoom in"}
                className={cn(
                  "relative block h-full w-full",
                  zoomed ? "cursor-zoom-out" : "cursor-zoom-in",
                )}
              >
                <Image
                  src={slide?.src ?? ""}
                  alt={slide?.type === "image" ? slide.alt : productName}
                  fill
                  sizes="100vw"
                  className={cn(
                    "object-contain transition-transform duration-300 ease-out",
                    zoomed && "scale-150",
                  )}
                />
              </button>
            )}

            {slides.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => onIndexChange((activeIndex - 1 + slides.length) % slides.length)}
                  aria-label="Previous image"
                  className="focus-ring absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-warm-white/10 text-warm-white backdrop-blur hover:bg-warm-white/20"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => onIndexChange((activeIndex + 1) % slides.length)}
                  aria-label="Next image"
                  className="focus-ring absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-warm-white/10 text-warm-white backdrop-blur hover:bg-warm-white/20"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>

          {slides.length > 1 && (
            <div className="flex justify-center gap-2 px-5 py-4">
              {slides.map((s, i) => (
                <button
                  key={s.src + i}
                  type="button"
                  onClick={() => onIndexChange(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  aria-current={i === activeIndex}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    i === activeIndex ? "w-6 bg-warm-white" : "w-1.5 bg-warm-white/40",
                  )}
                />
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
