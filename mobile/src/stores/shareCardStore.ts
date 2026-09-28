import { create } from "zustand";
import type { ShareContent, ShareProfile } from "../utils/share";

export interface ShareCardData {
  content: ShareContent;
  profile: ShareProfile | null;
  /** Data URL of the profile photo, or null (the initial is shown). */
  avatar: string | null;
  initial: string;
}

interface PendingCapture {
  id: number;
  data: ShareCardData;
}

interface ShareCardState {
  pending: PendingCapture | null;
  /** Called by ShareCardHost with the captured file URI (or null on failure). */
  finish: (id: number, uri: string | null) => void;
}

/** Longest we wait for the offscreen card to render and capture. */
const CAPTURE_TIMEOUT_MS = 6000;

let nextId = 1;
const resolvers = new Map<number, (uri: string | null) => void>();

export const useShareCardStore = create<ShareCardState>((set, get) => ({
  pending: null,
  finish: (id, uri) => {
    const resolve = resolvers.get(id);
    resolvers.delete(id);
    if (get().pending?.id === id) set({ pending: null });
    resolve?.(uri);
  }
}));

/**
 * Asks the mounted ShareCardHost to render and capture a card. Resolves a
 * temporary PNG file URI, or null when capture is unavailable or slow.
 */
export const requestShareCardCapture = (data: ShareCardData): Promise<string | null> => {
  const { pending, finish } = useShareCardStore.getState();
  if (pending) finish(pending.id, null);
  const id = nextId++;
  return new Promise((resolve) => {
    resolvers.set(id, resolve);
    useShareCardStore.setState({ pending: { id, data } });
    setTimeout(() => useShareCardStore.getState().finish(id, null), CAPTURE_TIMEOUT_MS);
  });
};
