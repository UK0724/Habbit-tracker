import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

/** True when the OS "remove animations / reduce motion" setting is on. */
export const useReduceMotion = () => {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => active && setReduce(value))
      .catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduce);
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);
  return reduce;
};
