import type { AdProvider,AdRequest,AdResult,AdType } from "./providers/AdProvider";
import { MockAdProvider } from "./providers/MockAdProvider";
import { GoogleAdSenseProvider } from "./providers/GoogleAdSenseProvider";

export type AdProviderType = "mock" | "google" | "adsense";

/**
 * Factory function to instantiate the configured AdProvider.
 * Checks `import.meta.env.VITE_AD_PROVIDER ?? "mock"`.
 */
export function createAdProvider(providerType?: string): AdProvider {
  const selected = (providerType ?? import.meta.env.VITE_AD_PROVIDER ?? "mock")
    .toLowerCase()
    .trim();

  if (selected === "google" || selected === "adsense" || selected === "google-adsense") {
    return new GoogleAdSenseProvider();
  }

  return new MockAdProvider();
}

/**
 * Factory singleton managing the active AdProvider instance.
 */
class AdServiceClass implements AdProvider {
  private provider: AdProvider;

  constructor() {
    this.provider = createAdProvider();
  }

  get name(): string {
    return this.provider.name;
  }

  /**
   * Returns the underlying active AdProvider (MockAdProvider or GoogleAdSenseProvider).
   */
  getProvider(): AdProvider {
    return this.provider;
  }

  /**
   * Allows dynamically swapping the ad provider (useful for testing or switching networks).
   */
  setProvider(provider: AdProvider): void {
    this.provider.destroy();
    this.provider = provider;
  }

  /**
   * Reinitializes the provider using current environment configuration.
   */
  resetProvider(): void {
    this.provider.destroy();
    this.provider = createAdProvider();
  }

  async isAvailable(): Promise<boolean> {
    return this.provider.isAvailable();
  }

  async requestAd(type: AdType = "rewarded"): Promise<AdRequest> {
    return this.provider.requestAd(type);
  }

  async showAd(request: AdRequest): Promise<AdResult> {
    return this.provider.showAd(request);
  }

  destroy(): void {
    this.provider.destroy();
  }
}

export const AdService = new AdServiceClass();
