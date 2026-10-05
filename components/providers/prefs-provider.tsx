"use client";

import { createContext, useContext, useState, useTransition } from "react";
import { setHidePref, setMotionPref, setThemePref } from "@/lib/actions/prefs";

interface PrefsContextValue {
  hide: boolean;
  toggleHide: () => void;
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
  motion: "on" | "off";
  setMotion: (motion: "on" | "off") => void;
  pending: boolean;
}

const PrefsContext = createContext<PrefsContextValue | null>(null);

export function PrefsProvider({
  initialHide,
  initialTheme,
  initialMotion,
  children,
}: {
  initialHide: boolean;
  initialTheme: "light" | "dark";
  initialMotion: "on" | "off";
  children: React.ReactNode;
}) {
  const [hide, setHide] = useState(initialHide);
  const [theme, setThemeState] = useState(initialTheme);
  const [motion, setMotionState] = useState(initialMotion);
  const [pending, startTransition] = useTransition();

  const toggleHide = () => {
    const next = !hide;
    setHide(next);
    startTransition(() => {
      setHidePref(next);
    });
  };

  const setTheme = (next: "light" | "dark") => {
    setThemeState(next);
    document.documentElement.dataset.theme = next;
    startTransition(() => {
      setThemePref(next);
    });
  };

  const setMotion = (next: "on" | "off") => {
    setMotionState(next);
    document.documentElement.dataset.motion = next;
    startTransition(() => {
      setMotionPref(next);
    });
  };

  return (
    <PrefsContext.Provider value={{ hide, toggleHide, theme, setTheme, motion, setMotion, pending }}>
      {children}
    </PrefsContext.Provider>
  );
}

export function usePrefs() {
  const ctx = useContext(PrefsContext);
  if (!ctx) throw new Error("usePrefs must be used within PrefsProvider");
  return ctx;
}
