import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useSyncExternalStore } from "react";
import { EditorServer } from "@/utils/editor/server";
import {
  Language,
  Locale,
  LocaleExtend,
  standardizeLocale,
} from "@ziziyi/utils";
import { type OfficeTheme, type PluginMode } from "@/utils/editor/types";
function resolveLanguage(language: Language): Locale {
  if (language === LocaleExtend.Auto) {
    const browserLang =
      typeof navigator !== "undefined"
        ? navigator.language || (navigator as any).userLanguage
        : "en";
    return standardizeLocale(browserLang || "en");
  }
  return language as Locale;
}
interface AppState {
  server: EditorServer;
  language: Language;
  theme: OfficeTheme;
  plugins: PluginMode;
  setState: (
    state: Partial<Pick<AppState, "language" | "theme" | "plugins">>,
  ) => void;
}
export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      server: new EditorServer({
        getState: () => get(),
      }),
      language: LocaleExtend.Auto,
      theme: "theme-white",
      plugins: "featured",
      setState: (newState) => set((state) => ({ ...state, ...newState })),
    }),
    {
      name: "office-state",
      partialize: (state) => ({
        language: state.language,
        theme: state.theme,
        plugins: state.plugins,
      }),
    },
  ),
);
export function useHasHydrated(): boolean {
  return useSyncExternalStore(
    (callback) => {
      const unsub = useAppStore.persist.onFinishHydration(callback);
      return unsub;
    },
    () => useAppStore.persist.hasHydrated(),
    () => false,
  );
}
export function useResolvedLanguage(): Locale {
  return useAppStore((state) => resolveLanguage(state.language));
}