"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// How close to the left edge a touch has to start to count as an
// edge-swipe (mirrors the iOS/Android system "swipe in from the left
// edge to go back" gesture) — anywhere further in and it's more likely
// to be a normal tap/scroll/selection inside the page.
const EDGE_ZONE_PX = 32;
// How far the finger has to travel (toward the right) before it counts
// as a deliberate "back" swipe rather than a stray touch.
const TRIGGER_DISTANCE_PX = 70;
// Cancels the gesture once vertical drift is large enough that this
// reads as a scroll, not a swipe.
const MAX_VERTICAL_DRIFT_PX = 60;

/** Renders nothing — just listens for a left-edge swipe-right anywhere on
    the page and navigates to `href` when it sees one. Mounted only on
    pages that also show the header's back button (see Header.tsx's
    `back` prop), so the gesture and the tap target always agree on where
    "back" goes. */
export function EdgeSwipeBack({ href }: { href: string }) {
  const router = useRouter();

  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let tracking = false;

    function onTouchStart(e: TouchEvent) {
      const touch = e.touches[0];
      tracking = !!touch && touch.clientX <= EDGE_ZONE_PX;
      if (tracking && touch) {
        startX = touch.clientX;
        startY = touch.clientY;
      }
    }

    function onTouchMove(e: TouchEvent) {
      if (!tracking) return;
      const touch = e.touches[0];
      if (!touch) return;
      const dx = touch.clientX - startX;
      const dy = Math.abs(touch.clientY - startY);
      if (dy > MAX_VERTICAL_DRIFT_PX) {
        tracking = false;
        return;
      }
      if (dx > TRIGGER_DISTANCE_PX) {
        tracking = false;
        router.push(href);
      }
    }

    function onTouchEnd() {
      tracking = false;
    }

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: true });
    document.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, [href, router]);

  return null;
}
