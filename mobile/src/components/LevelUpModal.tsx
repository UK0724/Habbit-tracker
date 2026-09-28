import React, { useEffect, useRef } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Modal,
  StyleSheet,
  Text,
  View,
  useWindowDimensions
} from "react-native";
import Svg, { Defs, Path, RadialGradient, Stop, Circle } from "react-native-svg";
import { Share2 } from "lucide-react-native";
import { BORDER_RADIUS, COLORS, SPACING, TYPOGRAPHY, TIER_COLORS, levelTier } from "../constants/theme";
import type { LevelUpCelebration } from "../stores/achievementStore";
import { hapticSuccess } from "../utils/haptics";
import { useReduceMotion } from "../hooks/useReduceMotion";
import { Button } from "./Button";
import { Confetti } from "./Confetti";

const RAYS = 16;

function Sunburst({ size, color }: { size: number; color: string }) {
  const center = size / 2;
  const radius = size / 2;
  const half = Math.PI / RAYS / 2;
  const rays = Array.from({ length: RAYS }, (_, index) => {
    const angle = (index / RAYS) * Math.PI * 2;
    const x1 = center + radius * Math.cos(angle - half);
    const y1 = center + radius * Math.sin(angle - half);
    const x2 = center + radius * Math.cos(angle + half);
    const y2 = center + radius * Math.sin(angle + half);
    return `M${center},${center} L${x1.toFixed(1)},${y1.toFixed(1)} L${x2.toFixed(1)},${y2.toFixed(1)} Z`;
  });
  return (
    <Svg width={size} height={size}>
      <Defs>
        <RadialGradient id="fade" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={color} stopOpacity="0.55" />
          <Stop offset="1" stopColor={color} stopOpacity="0" />
        </RadialGradient>
      </Defs>
      {rays.map((d, index) => (
        <Path key={index} d={d} fill="url(#fade)" />
      ))}
      <Circle cx={center} cy={center} r={size * 0.2} fill={color} opacity={0.18} />
    </Svg>
  );
}

export function LevelUpModal({
  celebration,
  onDismiss,
  onShare,
  sharing = false
}: {
  celebration: LevelUpCelebration | null;
  onDismiss: () => void;
  onShare: (celebration: LevelUpCelebration) => void;
  /** A share is being prepared (image card capture / share sheet). */
  sharing?: boolean;
}) {
  const { width } = useWindowDimensions();
  const reduceMotion = useReduceMotion();
  const spin = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!celebration) return;
    void hapticSuccess();
    AccessibilityInfo.announceForAccessibility(
      `Level up! You reached level ${celebration.level}${celebration.title ? `, ${celebration.title}` : ""}.`
    );
    fade.setValue(0);
    pop.setValue(reduceMotion ? 1 : 0);
    Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    if (reduceMotion) return;
    Animated.spring(pop, { toValue: 1, friction: 4, tension: 70, delay: 150, useNativeDriver: true }).start();
    spin.setValue(0);
    const loop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 14000, easing: Easing.linear, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [celebration?.id, reduceMotion]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!celebration) return null;
  const tier = TIER_COLORS[levelTier(celebration.level)];
  const burstSize = Math.min(width * 0.9, 360);

  return (
    <Modal transparent visible animationType="none" statusBarTranslucent onRequestClose={onDismiss}>
      <Animated.View style={[styles.overlay, { opacity: fade }]}>
        {!reduceMotion && <Confetti run={celebration.id} count={24} />}
        <View accessibilityViewIsModal style={styles.content}>
          <View style={[styles.burstArea, { width: burstSize, height: burstSize }]}>
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                {
                  transform: [
                    { rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] }) }
                  ]
                }
              ]}
            >
              <Sunburst size={burstSize} color={tier.fg} />
            </Animated.View>
            <Animated.View
              style={[
                styles.levelCircle,
                { borderColor: tier.border, backgroundColor: tier.bg },
                { transform: [{ scale: pop }] }
              ]}
            >
              <Text style={styles.levelLabel}>LEVEL</Text>
              <Text style={[styles.levelNumber, { color: tier.fg }]} maxFontSizeMultiplier={1.2}>
                {celebration.level}
              </Text>
            </Animated.View>
          </View>
          <Text style={styles.heading} accessibilityRole="header">
            Level up!
          </Text>
          {celebration.title ? <Text style={[styles.title, { color: tier.fg }]}>{celebration.title}</Text> : null}
          <Text style={styles.body}>Every quest you finish keeps the momentum going.</Text>
          <View style={styles.actions}>
            <Button
              title="Share"
              variant="secondary"
              icon={<Share2 size={16} color={COLORS.text} />}
              onPress={() => onShare(celebration)}
              loading={sharing}
              style={styles.action}
            />
            <Button title="Continue" onPress={onDismiss} style={styles.action} />
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.lg
  },
  content: {
    alignItems: "center",
    width: "100%",
    maxWidth: 420
  },
  burstArea: {
    alignItems: "center",
    justifyContent: "center"
  },
  levelCircle: {
    width: 132,
    height: 132,
    borderRadius: 66,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center"
  },
  levelLabel: {
    ...TYPOGRAPHY.label,
    letterSpacing: 2
  },
  levelNumber: {
    fontSize: 54,
    fontWeight: "900",
    lineHeight: 60
  },
  heading: {
    ...TYPOGRAPHY.hero,
    marginTop: -SPACING.lg
  },
  title: {
    ...TYPOGRAPHY.title2,
    marginTop: SPACING.xs
  },
  body: {
    ...TYPOGRAPHY.bodySecondary,
    textAlign: "center",
    marginTop: SPACING.sm,
    marginBottom: SPACING.xl
  },
  actions: {
    flexDirection: "row",
    gap: SPACING.sm,
    alignSelf: "stretch",
    borderRadius: BORDER_RADIUS.lg
  },
  action: {
    flex: 1
  }
});
