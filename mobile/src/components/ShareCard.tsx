import React, { forwardRef, useCallback, useEffect, useRef } from "react";
import { Image, Platform, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, RadialGradient, Rect, Stop } from "react-native-svg";
import type * as ViewShotModule from "react-native-view-shot";
import { COLORS } from "../constants/theme";
import { useShareCardStore, type ShareCardData } from "../stores/shareCardStore";
import { buildShareHeadline, buildShareStats, buildShareSubline, SHARE_FOOTER } from "../utils/share";

/** Card size in dp (4:5, captured at 1080×1350 on Android). */
export const SHARE_CARD_WIDTH = 360;
export const SHARE_CARD_HEIGHT = 450;
/** If an image never reports load/error, capture anyway after this. */
const IMAGE_WAIT_MS = 1500;

const logo = require("../../assets/icon.png");

interface ShareCardProps {
  data: ShareCardData;
  /** Called once the card is laid out and its images have settled. */
  onReady?: () => void;
}

/**
 * The branded progress card. Text ignores the system font scale so the
 * captured image always has the same layout.
 */
export const ShareCard = forwardRef<View, ShareCardProps>(function ShareCard({ data, onReady }, ref) {
  const { content, profile, avatar, initial } = data;
  const headline = buildShareHeadline(content, profile);
  const subline = buildShareSubline(content, profile);
  const stats = buildShareStats(content, profile);

  // Ready = laid out + every image loaded or failed (or a short timeout).
  const waiting = useRef({ layout: true, images: avatar ? 2 : 1, fired: false });
  const fire = useCallback(() => {
    const state = waiting.current;
    if (state.fired || state.layout || state.images > 0) return;
    state.fired = true;
    onReady?.();
  }, [onReady]);
  const imageSettled = useCallback(() => {
    waiting.current.images = Math.max(0, waiting.current.images - 1);
    fire();
  }, [fire]);
  useEffect(() => {
    const timer = setTimeout(() => {
      waiting.current.images = 0;
      fire();
    }, IMAGE_WAIT_MS);
    return () => clearTimeout(timer);
  }, [fire]);

  return (
    <View
      ref={ref}
      // Required on Android: a collapsed (flattened) view can't be captured.
      collapsable={false}
      style={styles.card}
      onLayout={() => {
        waiting.current.layout = false;
        fire();
      }}
    >
      <Svg width={SHARE_CARD_WIDTH} height={SHARE_CARD_HEIGHT} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="pulseBg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={COLORS.background} />
            <Stop offset="0.55" stopColor={COLORS.primaryHover} />
            <Stop offset="1" stopColor={COLORS.xp} />
          </LinearGradient>
          <RadialGradient id="pulseGlow" cx="0.5" cy="0.35" r="0.55">
            <Stop offset="0" stopColor={COLORS.gold} stopOpacity="0.28" />
            <Stop offset="1" stopColor={COLORS.gold} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width={SHARE_CARD_WIDTH} height={SHARE_CARD_HEIGHT} fill="url(#pulseBg)" />
        <Rect x="0" y="0" width={SHARE_CARD_WIDTH} height={SHARE_CARD_HEIGHT} fill="url(#pulseGlow)" />
        <Circle cx={SHARE_CARD_WIDTH - 20} cy={40} r={110} fill={COLORS.white} fillOpacity={0.06} />
        <Circle cx={10} cy={SHARE_CARD_HEIGHT - 10} r={130} fill={COLORS.white} fillOpacity={0.05} />
      </Svg>

      <View style={styles.brandRow}>
        <Image source={logo} style={styles.logo} onLoad={imageSettled} onError={imageSettled} fadeDuration={0} />
        <Text style={styles.brand} allowFontScaling={false}>
          Pulse
        </Text>
      </View>

      <View style={styles.center}>
        <View style={styles.avatarRing}>
          {avatar ? (
            <Image
              source={{ uri: avatar }}
              style={styles.avatar}
              onLoad={imageSettled}
              onError={imageSettled}
              fadeDuration={0}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.initial} allowFontScaling={false}>
                {initial}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.headline} numberOfLines={2} allowFontScaling={false}>
          {headline}
        </Text>
        <Text style={styles.subline} numberOfLines={2} allowFontScaling={false}>
          {subline}
        </Text>
      </View>

      <View style={styles.stats}>
        {stats.map((stat) => (
          <View key={stat.label} style={styles.stat}>
            <Text style={styles.statValue} numberOfLines={1} allowFontScaling={false}>
              {stat.value}
            </Text>
            <Text style={styles.statLabel} numberOfLines={1} allowFontScaling={false}>
              {stat.label}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText} numberOfLines={1} allowFontScaling={false}>
          {SHARE_FOOTER}
        </Text>
      </View>
    </View>
  );
});

const loadViewShot = () => {
  try {
    return require("react-native-view-shot") as typeof ViewShotModule;
  } catch (error) {
    console.error("[share] react-native-view-shot unavailable", error);
    return null;
  }
};

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/**
 * Renders a requested share card out of sight and captures it. Mount once,
 * BEFORE the navigator in the root layout: the screens paint over it, so it
 * is fully rendered (images load) but never visible.
 */
export function ShareCardHost() {
  const pending = useShareCardStore((state) => state.pending);
  const finish = useShareCardStore((state) => state.finish);
  const cardRef = useRef<View>(null);

  const capture = useCallback(
    async (id: number) => {
      const viewShot = loadViewShot();
      if (!viewShot?.captureRef) {
        finish(id, null);
        return;
      }
      try {
        // Let the native side commit the last layout/image before drawing.
        await nextFrame();
        await nextFrame();
        if (!cardRef.current) throw new Error("Share card is not mounted");
        const uri = await viewShot.captureRef(cardRef, {
          format: "png",
          quality: 1,
          result: "tmpfile",
          fileName: "pulse-progress",
          ...(Platform.OS === "android" ? { width: 1080, height: 1350 } : {})
        });
        finish(id, uri || null);
      } catch (error) {
        console.error("[share] Could not capture the share card", error);
        finish(id, null);
      }
    },
    [finish]
  );

  if (!pending) return null;
  return (
    <View
      pointerEvents="none"
      style={styles.host}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <ShareCard
        key={pending.id}
        ref={cardRef}
        data={pending.data}
        onReady={() => void capture(pending.id)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: "absolute",
    top: 0,
    left: 0,
    width: SHARE_CARD_WIDTH,
    height: SHARE_CARD_HEIGHT
  },
  card: {
    width: SHARE_CARD_WIDTH,
    height: SHARE_CARD_HEIGHT,
    backgroundColor: COLORS.background,
    overflow: "hidden",
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 20,
    justifyContent: "space-between"
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  logo: { width: 34, height: 34, borderRadius: 9 },
  brand: { color: COLORS.white, fontSize: 22, fontWeight: "800", letterSpacing: 0.5 },
  center: { alignItems: "center" },
  avatarRing: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 3,
    borderColor: COLORS.gold,
    padding: 3,
    marginBottom: 14,
    backgroundColor: "rgba(255, 255, 255, 0.12)"
  },
  avatar: { width: 92, height: 92, borderRadius: 46 },
  avatarFallback: {
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center"
  },
  initial: { color: COLORS.white, fontSize: 40, fontWeight: "800" },
  headline: {
    color: COLORS.white,
    fontSize: 25,
    lineHeight: 31,
    fontWeight: "800",
    textAlign: "center"
  },
  subline: {
    color: "rgba(255, 255, 255, 0.82)",
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "500",
    textAlign: "center",
    marginTop: 6
  },
  stats: { flexDirection: "row", gap: 8 },
  stat: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(11, 15, 25, 0.35)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.14)"
  },
  statValue: { color: COLORS.white, fontSize: 15, fontWeight: "800" },
  statLabel: {
    color: "rgba(255, 255, 255, 0.72)",
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 2
  },
  footer: {
    alignSelf: "center",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(11, 15, 25, 0.4)"
  },
  footerText: { color: COLORS.white, fontSize: 13, fontWeight: "700" }
});
