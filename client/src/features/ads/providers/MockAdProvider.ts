import { createElement } from "react";
import { createRoot,type Root } from "react-dom/client";
import type { AdProvider,AdRequest,AdResult,AdType } from "./AdProvider";
import { apiRequest } from "../../../services/api";
import { useMockAdStore } from "../stores/mockAdStore";
import { MockAdModal } from "../components/MockAdModal";

let dynamicRoot: Root | null = null;

function ensureModalMounted(): void {
  if (typeof document === "undefined") return;
  if (useMockAdStore.getState().isRegistered) return;

  let container = document.getElementById("mock-ad-modal-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "mock-ad-modal-container";
    document.body.appendChild(container);
  }

  if (!dynamicRoot) {
    dynamicRoot = createRoot(container);
    dynamicRoot.render(createElement(MockAdModal));
  }
}

export class MockAdProvider implements AdProvider {
  readonly name = "mock";

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async requestAd(type: AdType = "rewarded"): Promise<AdRequest> {
    let serverToken = "";

    try {
      // Calls POST /api/gamification/ad-token
      const response = await apiRequest<{ adToken: string }>(
        "/gamification/ad-token",
        {
          method: "POST"
        }
      );
      serverToken = response.adToken;
    } catch (err) {
      // If in development mode and backend is offline/unauthenticated, fallback gracefully
      if (import.meta.env.DEV) {
        console.warn(
          "[MockAdProvider] Backend ad-token endpoint failed; using fallback dev token for mock ad preview.",
          err
        );
        serverToken = `mock_dev_token_${Date.now()}`;
      } else {
        throw err;
      }
    }

    return {
      id: `mock_ad_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      type,
      serverToken,
      expiresAt: Date.now() + 5 * 60 * 1000 // 5-minute expiry
    };
  }

  async showAd(request: AdRequest): Promise<AdResult> {
    ensureModalMounted();
    return useMockAdStore.getState().openAd(request, 5);
  }

  destroy(): void {
    useMockAdStore.getState().closeAd();
    if (dynamicRoot) {
      dynamicRoot.unmount();
      dynamicRoot = null;
      const container = document.getElementById("mock-ad-modal-container");
      container?.remove();
    }
  }
}
