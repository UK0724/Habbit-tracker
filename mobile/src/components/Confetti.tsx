import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, StyleSheet, View, useWindowDimensions } from "react-native";

const PALETTE = ["#FBBF24", "#A78BFA", "#38BDF8", "#34D399", "#F472B6", "#FB923C"];

/** Lightweight native-driver confetti burst (~24 pieces). */
export function Confetti({ run, count = 24, colors = PALETTE }: { run: number; count?: number; colors?: string[] }) {
  const { width, height } = useWindowDimensions();
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, index) => ({
        x: Math.random() * width,
        drift: (Math.random() - 0.5) * 140,
        size: 6 + Math.random() * 6,
        delay: Math.random() * 250,
        duration: 1400 + Math.random() * 900,
        spin: (Math.random() > 0.5 ? 1 : -1) * (180 + Math.random() * 540),
        color: colors[index % colors.length],
        round: index % 3 === 0
      })),
    // New layout for each burst.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [run, count, width]
  );
  const values = useRef<Animated.Value[]>([]).current;
  while (values.length < count) values.push(new Animated.Value(0));

  useEffect(() => {
    if (!run) return;
    const animations = pieces.map((piece, index) => {
      values[index].setValue(0);
      return Animated.timing(values[index], {
        toValue: 1,
        duration: piece.duration,
        delay: piece.delay,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true
      });
    });
    const all = Animated.parallel(animations);
    all.start();
    return () => all.stop();
  }, [run, pieces, values]);

  if (!run) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {pieces.map((piece, index) => {
        const value = values[index];
        return (
          <Animated.View
            key={index}
            style={{
              position: "absolute",
              left: piece.x,
              top: -20,
              width: piece.size,
              height: piece.round ? piece.size : piece.size * 0.45,
              borderRadius: piece.round ? piece.size / 2 : 1,
              backgroundColor: piece.color,
              opacity: value.interpolate({ inputRange: [0, 0.1, 0.8, 1], outputRange: [0, 1, 1, 0] }),
              transform: [
                { translateY: value.interpolate({ inputRange: [0, 1], outputRange: [0, height * 0.75] }) },
                { translateX: value.interpolate({ inputRange: [0, 1], outputRange: [0, piece.drift] }) },
                { rotate: value.interpolate({ inputRange: [0, 1], outputRange: ["0deg", `${piece.spin}deg`] }) }
              ]
            }}
          />
        );
      })}
    </View>
  );
}
