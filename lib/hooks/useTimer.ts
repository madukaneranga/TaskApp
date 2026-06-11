"use client";

import { useEffect, useState } from "react";

export function useTimer(baseSeconds: number, running: boolean) {
  const [elapsed, setElapsed] = useState(baseSeconds);

  useEffect(() => {
    setElapsed(baseSeconds);
  }, [baseSeconds]);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setElapsed((e) => e + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [running]);

  return elapsed;
}
