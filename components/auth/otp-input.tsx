"use client";

import { useRef, useState, KeyboardEvent, ClipboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function OtpInput({ value, onChange, disabled }: OtpInputProps) {
  const digits = value.padEnd(6, " ").split("").slice(0, 6);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const [focused, setFocused] = useState(0);

  function updateDigit(index: number, digit: string) {
    const arr = value.padEnd(6, " ").split("").slice(0, 6);
    arr[index] = digit;
    const next = arr.join("").replace(/ /g, "").slice(0, 6);
    onChange(next);
    if (digit && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index]?.trim() && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(pasted);
    const focusIndex = Math.min(pasted.length, 5);
    inputsRef.current[focusIndex]?.focus();
  }

  return (
    <div className="flex justify-center gap-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <Input
          key={i}
          ref={(el) => {
            inputsRef.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          disabled={disabled}
          value={digits[i]?.trim() || ""}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "").slice(-1);
            updateDigit(i, v);
          }}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={() => setFocused(i)}
          className={cn(
            "h-12 w-12 text-center text-lg font-semibold",
            focused === i && "ring-2 ring-brand-blue"
          )}
          aria-label={`Digit ${i + 1}`}
        />
      ))}
    </div>
  );
}
