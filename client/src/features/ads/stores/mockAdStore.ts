import { create } from "zustand";
import type { AdRequest,AdResult } from "../providers/AdProvider";

interface MockAdStoreState {
  isOpen: boolean;
  request: AdRequest | null;
  duration: number;
  resolver: ((result: AdResult) => void) | null;
  isRegistered: boolean;
  setRegistered: (registered: boolean) => void;
  openAd: (request: AdRequest, duration?: number) => Promise<AdResult>;
  completeAd: () => void;
  skipAd: (afterCompletion?: boolean) => void;
  failAd: (reason: string) => void;
  closeAd: () => void;
}

export const useMockAdStore = create<MockAdStoreState>()((set, get) => ({
  isOpen: false,
  request: null,
  duration: 5,
  resolver: null,
  isRegistered: false,

  setRegistered: (registered: boolean) => set({ isRegistered: registered }),

  openAd: (request: AdRequest, duration = 5) => {
    return new Promise<AdResult>((resolve) => {
      // If there's already an active ad, resolve it as skipped
      const currentResolver = get().resolver;
      if (currentResolver) {
        currentResolver({ status: "skipped" });
      }

      set({
        isOpen: true,
        request,
        duration,
        resolver: resolve
      });
    });
  },

  completeAd: () => {
    const { resolver, request } = get();
    if (resolver && request) {
      resolver({
        status: "completed",
        token: request.serverToken
      });
    }
    set({
      isOpen: false,
      request: null,
      resolver: null
    });
  },

  skipAd: (afterCompletion = false) => {
    const { resolver, request } = get();
    if (resolver) {
      if (afterCompletion && request) {
        resolver({
          status: "completed",
          token: request.serverToken
        });
      } else {
        resolver({ status: "skipped" });
      }
    }
    set({
      isOpen: false,
      request: null,
      resolver: null
    });
  },

  failAd: (reason: string) => {
    const { resolver } = get();
    if (resolver) {
      resolver({ status: "failed", reason });
    }
    set({
      isOpen: false,
      request: null,
      resolver: null
    });
  },

  closeAd: () => {
    const { resolver } = get();
    if (resolver) {
      resolver({ status: "skipped" });
    }
    set({
      isOpen: false,
      request: null,
      resolver: null
    });
  }
}));
