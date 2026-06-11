"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const startProgress = useCallback(() => {
    clearTimers();
    setVisible(true);
    setProgress(15);
    timers.current.push(setTimeout(() => setProgress(45), 80));
    timers.current.push(setTimeout(() => setProgress(70), 200));
    timers.current.push(setTimeout(() => setProgress(85), 400));
  }, [clearTimers]);

  const completeProgress = useCallback(() => {
    clearTimers();
    setProgress(100);
    timers.current.push(
      setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 200)
    );
  }, [clearTimers]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor?.href) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const url = new URL(anchor.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === pathname && url.search === window.location.search) return;
      startProgress();
    }

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [pathname, startProgress]);

  useEffect(() => {
    completeProgress();
    return clearTimers;
  }, [pathname, searchParams, completeProgress, clearTimers]);

  if (!visible) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5 bg-transparent"
      role="progressbar"
      aria-hidden="true"
    >
      <div
        className="h-full bg-brand-blue shadow-[0_0_8px_rgba(37,99,235,0.5)] transition-[width] duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
