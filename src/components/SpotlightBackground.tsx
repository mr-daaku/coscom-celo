"use client";

import { useState, useRef, useEffect } from "react";

const SPOTLIGHT_RADIUS = 250;
// Phones + tablets (everything below Tailwind's `lg` breakpoint) get scroll-reveal
// behaviour — touch devices have no hover. Desktop keeps the cursor spotlight.
const MOBILE_BREAKPOINT = 1024;

export function SpotlightBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isMobileLayout, setIsMobileLayout] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Keep the layout flag in sync while the device is rotated / resized so the
  // background switches between hover-spotlight and scroll-reveal live.
  useEffect(() => {
    const media = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const update = () => setIsMobileLayout(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  // ── Desktop: cursor-following spotlight reveal of the "after" image. ──
  // Track the mouse at the window level instead of on the container itself.
  // The container has `pointer-events: none` so it can never be a pointer-event
  // target — listening on window ensures the spotlight also follows the cursor
  // when it is over the raw background image (not just over the content).
  useEffect(() => {
    if (isMobileLayout) return;

    const el = containerRef.current;
    if (!el) return;

    let rafId: number | null = null;

    const applyPosition = (clientX: number, clientY: number) => {
      const rect = el.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      setMousePos({ x, y });
      setIsHovering(x >= 0 && y >= 0 && x <= rect.width && y <= rect.height);
    };

    const handleMouseMove = (e: MouseEvent) => {
      // Snapshot coordinates now — the event object may be reused by the browser.
      const { clientX, clientY } = e;
      if (rafId !== null) return;

      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        applyPosition(clientX, clientY);
      });
    };

    // Cursor left the browser viewport entirely.
    const handleMouseLeave = () => setIsHovering(false);
    // Tab/app lost focus (e.g. Alt+Tab away) — hide the spotlight.
    const handleBlur = () => setIsHovering(false);

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("blur", handleBlur);
      if (rafId !== null) window.cancelAnimationFrame(rafId);
    };
  }, [isMobileLayout]);

  // ── Phones/tablets: reveal the "after" image as the user scrolls. ──
  // 0% reveal at the top of the page → 100% reveal once the page is scrolled to
  // its end, so every scroll tick "brings" more of the after image in.
  useEffect(() => {
    if (!isMobileLayout) return;

    let rafId: number | null = null;

    const update = () => {
      rafId = null;
      const maxScroll = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      const progress = Math.min(1, Math.max(0, window.scrollY / maxScroll));
      setScrollProgress(progress);
    };

    const onScroll = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafId !== null) window.cancelAnimationFrame(rafId);
    };
  }, [isMobileLayout]);

  // One image, centered, NEVER tiled (the old `background-repeat: repeat` +
  // `background-size: 90%` combo rendered 4 tiles on phones). Phones/tablets
  // stretch a single copy to cover the screen; desktop keeps the original
  // 90% "framed" look.
  const imageSize = isMobileLayout ? "cover" : "90%";
  const revealPct = Math.round(scrollProgress * 100);

  const afterMask = isMobileLayout
    ? `linear-gradient(to top, black ${revealPct}%, rgba(0,0,0,0) ${revealPct}%)`
    : `radial-gradient(circle ${SPOTLIGHT_RADIUS}px at ${mousePos.x}px ${mousePos.y}px, black 0%, transparent 70%)`;

  return (
    <>
      {/* Before Image - fixed backdrop at the very back of the page. The negative
          z-index (inside the page's `isolate` stacking context) keeps it above the
          page background but BELOW all content, so the footer, cards, buttons and
          links always stay visible and clickable on top of it. */}
      <div ref={containerRef} className="pointer-events-none fixed inset-0 -z-20">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'url("/assets/background-befor-img.png")',
            backgroundSize: imageSize,
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        />
      </div>

      {/* After Image - sits just above the before image and is revealed once the
          user interacts: on DESKTOP through a cursor-following spotlight mask, on
          PHONE/TABLET through a vertical wipe driven by scroll progress (bottom →
          top). It lives BEHIND the page content (never above it), so the effect
          keeps running even over a button/link — the control stays visible above
          the background. It is always mounted and faded with opacity so the image
          preloads and the reveal fades smoothly instead of popping in. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 transition-opacity duration-300"
        style={{
          opacity: isMobileLayout || isHovering ? 1 : 0,
          backgroundImage: 'url("/assets/background-after-img.png")',
          backgroundSize: imageSize,
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          maskImage: afterMask,
          WebkitMaskImage: afterMask,
        }}
      />
    </>
  );
}