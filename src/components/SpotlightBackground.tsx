import { useEffect, useRef, useState } from "react";

/**
 * Fixed, non-interactive background with two stacked layers.
 * Desktop: a cursor-following radial mask reveals the "after" layer.
 * Mobile: scroll position drives a vertical wipe instead.
 */
export function SpotlightBackground() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [mask, setMask] = useState(
    "radial-gradient(circle 320px at 50% 30%, black 0%, transparent 70%)",
  );

  useEffect(() => {
    const isTouch = window.matchMedia("(hover: none)").matches;

    const onMove = (e: MouseEvent) => {
      setMask(
        `radial-gradient(circle 360px at ${e.clientX}px ${e.clientY}px, black 0%, rgba(0,0,0,0.6) 45%, transparent 72%)`,
      );
    };

    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight || 1;
      const pct = Math.min(100, Math.max(0, (window.scrollY / max) * 100));
      setMask(
        `linear-gradient(to bottom, black 0%, black ${pct}%, transparent ${Math.min(
          100,
          pct + 18,
        )}%, transparent 100%)`,
      );
    };

    if (isTouch) {
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
      return () => window.removeEventListener("scroll", onScroll);
    }
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div ref={ref} aria-hidden className="pointer-events-none fixed inset-0 -z-10">
      {/* before layer */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(60rem 40rem at 15% -10%, rgba(163,230,53,0.10), transparent 65%), radial-gradient(50rem 35rem at 90% 10%, rgba(56,189,248,0.10), transparent 65%), #0e1111",
        }}
      />
      {/* after layer, revealed through the mask */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(45rem 30rem at 50% 20%, rgba(163,230,53,0.35), transparent 60%), radial-gradient(40rem 28rem at 20% 80%, rgba(56,189,248,0.28), transparent 62%), linear-gradient(160deg, #14201a 0%, #0e1111 55%, #101a1e 100%)",
          maskImage: mask,
          WebkitMaskImage: mask,
        }}
      />
      {/* grid texture */}
      <div
        className="absolute inset-0 opacity-[0.16]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #2e3838 1px, transparent 1px), linear-gradient(to bottom, #2e3838 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(70% 60% at 50% 20%, black, transparent)",
          WebkitMaskImage: "radial-gradient(70% 60% at 50% 20%, black, transparent)",
        }}
      />
    </div>
  );
}

/** Fades in [data-reveal] elements as they scroll into view. */
export function useScrollReveal() {
  useEffect(() => {
    const reveal = (el: Element) => el.classList.add("revealed");
    const inView = (el: Element) => {
      const r = el.getBoundingClientRect();
      return r.top < window.innerHeight && r.bottom > 0;
    };

    let io: IntersectionObserver | null = null;
    const raf = requestAnimationFrame(() => {
      const nodes = Array.from(document.querySelectorAll("[data-reveal]"));
      nodes.forEach((n) => {
        if (inView(n)) reveal(n);
      });
      io = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              reveal(entry.target);
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0, rootMargin: "0px 0px -10% 0px" },
      );
      nodes.forEach((n) => {
        if (!n.classList.contains("revealed")) io?.observe(n);
      });
    });

    return () => {
      cancelAnimationFrame(raf);
      io?.disconnect();
    };
  }, []);
}

