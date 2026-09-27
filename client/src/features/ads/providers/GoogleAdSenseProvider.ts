import type { AdProvider,AdRequest,AdResult,AdType } from "./AdProvider";
import { apiRequest } from "../../../services/api";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
    googletag?: {
      cmd: Array<() => void>;
      defineOutOfPageSlot: (slotName: string, format: unknown) => unknown;
      pubads: () => {
        addEventListener: (event: string, callback: (arg?: unknown) => void) => void;
      };
      enableServices: () => void;
      enums?: {
        OutOfPageFormat?: {
          REWARDED?: unknown;
        };
      };
    };
  }
}

export class GoogleAdSenseProvider implements AdProvider {
  readonly name = "google-adsense";

  private adClient: string;
  private adSlot: string;
  private scriptLoadAttempted = false;
  private scriptLoaded = false;

  constructor(adClient?: string, adSlot?: string) {
    this.adClient =
      adClient ?? import.meta.env.VITE_GOOGLE_AD_CLIENT ?? "";
    this.adSlot =
      adSlot ?? import.meta.env.VITE_GOOGLE_AD_SLOT ?? "";
  }

  /**
   * Attempts to inject the Google AdSense script tag if not already present.
   * Handles script errors gracefully (e.g. ad blockers).
   */
  private async loadScript(): Promise<boolean> {
    if (typeof window === "undefined") return false;
    if (this.scriptLoaded && window.adsbygoogle) return true;
    if (!this.adClient) return false;

    if (this.scriptLoadAttempted) {
      return this.scriptLoaded;
    }

    this.scriptLoadAttempted = true;

    // Check if script already exists in document
    const existing = document.querySelector(
      `script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]`
    );
    if (existing) {
      this.scriptLoaded = Boolean(window.adsbygoogle);
      return this.scriptLoaded;
    }

    return new Promise<boolean>((resolve) => {
      const script = document.createElement("script");
      script.async = true;
      script.crossOrigin = "anonymous";
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(
        this.adClient
      )}`;

      script.onload = () => {
        this.scriptLoaded = true;
        resolve(true);
      };

      script.onerror = () => {
        console.warn(
          "[GoogleAdSenseProvider] Failed to load AdSense script (possibly blocked by ad blocker)."
        );
        this.scriptLoaded = false;
        resolve(false);
      };

      document.head.appendChild(script);
    });
  }

  async isAvailable(): Promise<boolean> {
    if (typeof window === "undefined") return false;
    if (!this.adClient) return false;

    const loaded = await this.loadScript();
    return loaded && Boolean(window.adsbygoogle);
  }

  async requestAd(type: AdType = "rewarded"): Promise<AdRequest> {
    let serverToken = "";

    try {
      const response = await apiRequest<{ adToken: string }>(
        "/gamification/ad-token",
        { method: "POST" }
      );
      serverToken = response.adToken;
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn(
          "[GoogleAdSenseProvider] Backend ad-token endpoint failed; using fallback dev token.",
          err
        );
        serverToken = `mock_dev_token_${Date.now()}`;
      } else {
        throw err;
      }
    }

    return {
      id: `adsense_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      type,
      serverToken,
      expiresAt: Date.now() + 5 * 60 * 1000
    };
  }

  async showAd(request: AdRequest): Promise<AdResult> {
    // Graceful fallback if adsbygoogle is not loaded
    const available = await this.isAvailable();
    if (!available || !window.adsbygoogle) {
      console.warn(
        "[GoogleAdSenseProvider] adsbygoogle is not loaded or was blocked by an ad blocker. Falling back gracefully."
      );
      return {
        status: "failed",
        reason:
          "Google AdSense is not loaded or was blocked by a browser extension."
      };
    }

    return new Promise<AdResult>((resolve) => {
      try {
        let rewarded = false;
        let adClosed = false;

        const onRewardedGranted = () => {
          rewarded = true;
        };

        const onRewardedDismissed = () => {
          adClosed = true;
          cleanup();
          if (rewarded) {
            resolve({
              status: "completed",
              token: request.serverToken
            });
          } else {
            resolve({
              status: "skipped"
            });
          }
        };

        const cleanup = () => {
          window.removeEventListener("adsense-rewarded-granted", onRewardedGranted);
          window.removeEventListener("adsense-rewarded-closed", onRewardedDismissed);
        };

        window.addEventListener("adsense-rewarded-granted", onRewardedGranted);
        window.addEventListener("adsense-rewarded-closed", onRewardedDismissed);

        // Push rewarded ad request to adsbygoogle
        try {
          (window.adsbygoogle = window.adsbygoogle || []).push({
            google_ad_client: this.adClient,
            enable_page_level_ads: true,
            overlays: { bottom: true },
            rewardedSlot: this.adSlot || undefined,
            onReward: onRewardedGranted,
            onDismiss: onRewardedDismissed
          });
        } catch (pushErr) {
          cleanup();
          resolve({
            status: "failed",
            reason:
              pushErr instanceof Error
                ? pushErr.message
                : "Failed to invoke adsbygoogle rewarded ad."
          });
          return;
        }

        // Safety timeout in case ad neither displays nor fires callback
        setTimeout(() => {
          if (!adClosed) {
            cleanup();
            if (rewarded) {
              resolve({
                status: "completed",
                token: request.serverToken
              });
            } else {
              resolve({
                status: "failed",
                reason: "Google AdSense rewarded ad timed out."
              });
            }
          }
        }, 30000);
      } catch (err) {
        resolve({
          status: "failed",
          reason:
            err instanceof Error
              ? err.message
              : "Unexpected error during Google AdSense display."
        });
      }
    });
  }

  destroy(): void {
    this.scriptLoaded = false;
    this.scriptLoadAttempted = false;
  }
}
