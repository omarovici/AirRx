"use client";
import { create } from "zustand";

export type TimeIndex = -1 | 0 | 1;
export type LayerId = "smoke" | "no2" | "fires";

type State = {
  timeIndex: TimeIndex; // -1h, now, +1h
  activeLayer: LayerId; // for legend/tooltip
  enabledLayers: Record<LayerId, boolean>;
  panelOpen: boolean;

  setTimeIndex: (t: TimeIndex) => void;
  setActiveLayer: (l: LayerId) => void;
  toggleLayer: (l: LayerId) => void;
  setPanelOpen: (b: boolean) => void;
};

export const useAppStore = create<State>((set) => ({
  timeIndex: 0,
  activeLayer: "smoke",
  enabledLayers: { smoke: true, no2: false, fires: false },
  panelOpen: false,

  setTimeIndex: (t) => set({ timeIndex: t }),
  setActiveLayer: (l) => set({ activeLayer: l }),
  toggleLayer: (l) =>
    set((s) => ({
      enabledLayers: { ...s.enabledLayers, [l]: !s.enabledLayers[l] },
    })),
  setPanelOpen: (b) => set({ panelOpen: b }),
}));
