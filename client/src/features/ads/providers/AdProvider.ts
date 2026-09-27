export type AdType = "rewarded";

export type AdRequest = {
  id: string;
  type: AdType;
  serverToken: string;
  expiresAt: number;
};

export type AdResult =
  | { status: "completed"; token: string }
  | { status: "skipped" }
  | { status: "failed"; reason: string };

export interface AdProvider {
  readonly name: string;
  isAvailable(): Promise<boolean>;
  requestAd(type: AdType): Promise<AdRequest>;
  showAd(request: AdRequest): Promise<AdResult>;
  destroy(): void;
}
