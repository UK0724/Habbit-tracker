import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet } from "react-native";
import { COLORS } from "../constants/theme";
import { useReduceMotion } from "../hooks/useReduceMotion";

/**
 * "+10 XP" that rises and fades from its parent (position the parent
 * relative). Re-runs whenever `trigger` changes; renders nothing for 0.
 * `onDone` fires once the animation finishes, so the owner can drop the
 * entry and a remount does not replay it.
 */
export function XPFloat({
  xp,
  trigger,
  onDone
}: {
  xp: number;
  trigger: number;
  onDone?: () => void;
}) {
  const progress = useRef(new Animated.Value(1)).current;
  const reduce = useReduceMotion();
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    if (!trigger || !xp) return;
    progress.setValue(0);
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: reduce ? 900 : 1100,
      useNativeDriver: true
    });
    animation.start(({ finished }) => {
      if (finished) done.current?.();
    });
    return () => animation.stop();
  }, [trigger, xp, reduce, progress]);

  if (!trigger || !xp) return null;
  const negative = xp < 0;
  return (
    <Animated.View pointerEvents="none" style={styles.layer}>
    <Animated.Text
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      maxFontSizeMultiplier={1.3}
      style={[
        styles.text,
        negative && styles.negative,
        {
          opacity: progress.interpolate({ inputRange: [0, 0.15, 0.7, 1], outputRange: [0, 1, 1, 0] }),
          transform: reduce
            ? []
            : [
                { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, -46] }) },
                { scale: progress.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0.7, 1.15, 1] }) }
              ]
        }
      ]}
    >
      {negative ? `${xp} XP` : `+${xp} XP`}
    </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject
  },
  text: {
    position: "absolute",
    right: 16,
    top: 8,
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.xpText,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowRadius: 6
  },
  negative: {
    color: COLORS.textMuted
  }
});
