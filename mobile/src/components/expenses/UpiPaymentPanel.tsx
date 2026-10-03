import React, { useEffect, useRef, useState } from "react";
import {
  AppState,
  Keyboard,
  Linking,
  Platform,
  StyleSheet,
  Text,
  View
} from "react-native";
import { Camera, CameraView } from "expo-camera";
import {
  COLORS,
  SPACING,
  BORDER_RADIUS,
  TYPOGRAPHY
} from "../../constants/theme";
import { Button } from "../Button";
import { Input } from "../Input";
import {
  buildUpiUri,
  makeUpiPayment,
  parseUpiQr,
  paymentMatchesDraft,
  type UpiPaymentRequest,
  type UpiPaymentState,
  type UpiRecipient
} from "../../utils/upi";
export type { UpiPaymentRequest, UpiPaymentState } from "../../utils/upi";

type Stage = "idle" | "entry" | "review" | "opening" | "awaiting" | "confirmed";
const scannerTrace = (event: string, details: Record<string, unknown> = {}) => {
  // QA diagnostics contain lifecycle/permission flags only, never QR/payment data.
  if (typeof process !== "undefined" && process.env.EXPO_PUBLIC_QA_SCANNER_TRACE === "true")
    console.info(`[PulseScanner] ${event}`, JSON.stringify(details));
};
const DRAFT_CHANGED_MESSAGE =
  "Amount, note or payment method changed. Check your payment history before paying again. Return to manual entry to record an already-completed payment.";
export interface UpiPaymentPanelProps {
  visible: boolean;
  amount: string;
  note: string;
  disabled?: boolean;
  /** Parent invalidates synchronously when any payment-related form field changes. */
  paymentState?: UpiPaymentState;
  onDraftChange: (change: { amount?: string; note?: string }) => void;
  /** Never a bank-verified result. Parent must gate Save on an unchanged confirmed draft. */
  onPaymentStateChange: (
    state: UpiPaymentState,
    payment?: UpiPaymentRequest
  ) => void;
}

/** Optional Android handoff only. No network, mutation, result callback or receipt verification. */
export function UpiPaymentPanel({
  visible,
  amount,
  note,
  disabled = false,
  paymentState,
  onDraftChange,
  onPaymentStateChange
}: UpiPaymentPanelProps) {
  const [stage, setStage] = useState<Stage>("idle");
  const [recipient, setRecipient] = useState<UpiRecipient>({
    upiId: "",
    name: ""
  });
  const [payment, setPayment] = useState<UpiPaymentRequest>();
  const [error, setError] = useState<string>();
  const [scanning, setScanning] = useState(false);
  const [requestingCamera, setRequestingCamera] = useState(false);
  const stageRef = useRef<Stage>("idle");
  const launchLock = useRef(false);
  const scanLock = useRef(false);
  const cameraPending = useRef(false);
  const epoch = useRef(0);
  const cameraEpoch = useRef(0);
  const mounted = useRef(true);
  const appActive = useRef(
    AppState.currentState == null || AppState.currentState === "active"
  );
  const [foreground, setForeground] = useState(appActive.current);
  const callbacks = useRef({ onDraftChange, onPaymentStateChange });
  callbacks.current = { onDraftChange, onPaymentStateChange };
  const changeStage = (next: Stage) => {
    stageRef.current = next;
    setStage(next);
  };
  const stopCamera = () => {
    scannerTrace("stop", { epoch: cameraEpoch.current, pending: cameraPending.current });
    cameraEpoch.current += 1;
    cameraPending.current = false;
    scanLock.current = true;
    setScanning(false);
    setRequestingCamera(false);
  };

  useEffect(() => {
    mounted.current = true;
    const subscription = AppState.addEventListener("change", (state) => {
      scannerTrace("app-state", { state, pending: cameraPending.current });
      appActive.current = state === "active";
      setForeground(state === "active");
      // The permission dialog can briefly be inactive. Preserve that request,
      // but cancel it on a real background transition or form dismissal.
      if (
        state === "background" ||
        (state === "inactive" && !cameraPending.current)
      )
        stopCamera();
      // Resuming, receiving no result, or cancelling another app never confirms payment.
    });
    return () => {
      mounted.current = false;
      epoch.current += 1;
      cameraEpoch.current += 1;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    epoch.current += 1;
    launchLock.current = false;
    stopCamera();
    changeStage("idle");
    setRecipient({ upiId: "", name: "" });
    setPayment(undefined);
    setError(undefined);
    // Visibility alone must not clear the parent's payment gate. The whole form
    // owns its new-expense reset; hiding this panel on method changes is not success.
  }, [visible]);

  useEffect(() => {
    if (payment && !paymentMatchesDraft(payment, amount, note)) {
      callbacks.current.onPaymentStateChange("unconfirmed");
      if (stageRef.current !== "opening") changeStage("entry");
      setError(DRAFT_CHANGED_MESSAGE);
    }
  }, [amount, note, payment]);

  useEffect(() => {
    // Method-only edits and edit-then-restore in one frame can invalidate the
    // parent's gate without changing the final amount/note props. Reflect that
    // invalidation instead of leaving a stale confirmed message on screen.
    if (paymentState === "unconfirmed" && stageRef.current === "confirmed") {
      changeStage("entry");
      setError(DRAFT_CHANGED_MESSAGE);
    }
  }, [paymentState]);

  const resetToManual = () => {
    if (disabled || launchLock.current) return;
    epoch.current += 1;
    stopCamera();
    setPayment(undefined);
    setError(undefined);
    changeStage("idle");
    callbacks.current.onPaymentStateChange("idle");
  };

  const startScanner = async () => {
    if (
      disabled ||
      !appActive.current ||
      cameraPending.current ||
      launchLock.current
    )
      return;
    Keyboard.dismiss();
    cameraPending.current = true;
    const token = ++cameraEpoch.current;
    setRequestingCamera(true);
    setError(undefined);
    try {
      // Request access only in response to the explicit Scan UPI QR button.
      scannerTrace("request-start", { token });
      // Expo asks Android again even for an existing grant. Read it first so a
      // redundant permission activity cannot interrupt a scanner already allowed.
      let permission = await Camera.getCameraPermissionsAsync();
      scannerTrace("permission-read", { granted: permission.granted, token, epoch: cameraEpoch.current });
      if (!mounted.current || token !== cameraEpoch.current || !visible) return;
      if (!permission.granted) permission = await Camera.requestCameraPermissionsAsync();
      scannerTrace("permission-result", { granted: permission.granted, token, epoch: cameraEpoch.current, active: appActive.current });
      if (!mounted.current || token !== cameraEpoch.current || !visible) return;
      if (!permission.granted) {
        setError(
          permission.canAskAgain
            ? "Camera access was denied. You can enter the UPI ID manually or tap Scan to try again."
            : "Camera access is off. Enter the UPI ID manually, or enable camera access for Pulse in Android Settings."
        );
        return;
      }
      scanLock.current = false;
      scannerTrace("open", { token });
      setScanning(true);
    } catch {
      if (mounted.current && token === cameraEpoch.current)
        setError("The camera could not open. Enter the UPI ID manually.");
    } finally {
      if (mounted.current && token === cameraEpoch.current) {
        cameraPending.current = false;
        setRequestingCamera(false);
      }
    }
  };

  const scanned = ({ data }: { data: string }, token: number) => {
    if (
      token !== cameraEpoch.current ||
      scanLock.current ||
      !appActive.current ||
      disabled
    )
      return;
    scanLock.current = true;
    stopCamera();
    try {
      const qr = parseUpiQr(data);
      setRecipient(qr);
      setPayment(undefined);
      callbacks.current.onDraftChange({
        ...(qr.amount ? { amount: qr.amount } : {}),
        ...(qr.note !== undefined ? { note: qr.note } : {})
      });
      setError(undefined);
    } catch (cause) {
      setError((cause as Error).message);
    }
  };

  const review = () => {
    if (disabled || launchLock.current) return;
    Keyboard.dismiss();
    stopCamera();
    try {
      setPayment(makeUpiPayment(recipient, amount, note));
      setError(undefined);
      changeStage("review");
    } catch (cause) {
      setError((cause as Error).message);
    }
  };

  const openPaymentApp = async () => {
    if (
      !mounted.current ||
      !appActive.current ||
      disabled ||
      launchLock.current ||
      stageRef.current !== "review" ||
      !payment
    )
      return;
    if (!paymentMatchesDraft(payment, amount, note)) {
      setError("The expense details changed. Review them again.");
      changeStage("entry");
      return;
    }
    Keyboard.dismiss();
    launchLock.current = true;
    const token = epoch.current;
    callbacks.current.onPaymentStateChange("unconfirmed", payment);
    changeStage("opening");
    setError(undefined);
    try {
      // Direct open avoids Android package-visibility false negatives in canOpenURL.
      // Resolution means only that Android accepted a handoff, never that money moved.
      await Linking.openURL(buildUpiUri(payment));
      if (!mounted.current || token !== epoch.current) return;
      changeStage("awaiting");
    } catch {
      if (!mounted.current || token !== epoch.current) return;
      changeStage("entry");
      setError(
        "No payment app opened. Install or enable a UPI app, or return to manual entry. No expense has been recorded."
      );
    } finally {
      if (mounted.current && token === epoch.current)
        launchLock.current = false;
    }
  };

  const confirmManually = () => {
    if (
      disabled ||
      launchLock.current ||
      stageRef.current !== "awaiting" ||
      !payment ||
      !paymentMatchesDraft(payment, amount, note)
    )
      return;
    changeStage("confirmed");
    callbacks.current.onPaymentStateChange("confirmed", payment);
  };

  if (Platform.OS !== "android" || !visible) return null;
  const locked = disabled || stage === "opening";
  const scanToken = cameraEpoch.current;
  return (
    <View style={styles.panel}>
      <Text style={styles.title}>Pay with UPI (optional)</Text>
      <Text style={styles.help}>
        You can still add an expense manually. Pulse cannot verify a UPI
        payment.
      </Text>
      {stage === "idle" ? (
        <Button
          title="Set up UPI payment"
          variant="outline"
          disabled={disabled}
          onPress={() => {
            changeStage("entry");
            callbacks.current.onPaymentStateChange("unconfirmed");
          }}
        />
      ) : null}
      {stage === "entry" ? (
        <>
          <Input
            label="Recipient UPI ID"
            value={recipient.upiId}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={255}
            editable={!locked}
            placeholder="name@bank"
            onChangeText={(value) => {
              setRecipient({ upiId: value, name: "" });
              setPayment(undefined);
              setError(undefined);
            }}
          />
          <Input
            label="Recipient name (optional)"
            value={recipient.name}
            autoCorrect={false}
            maxLength={100}
            editable={!locked}
            onChangeText={(value) => {
              setRecipient((old) => ({ ...old, name: value }));
              setPayment(undefined);
              setError(undefined);
            }}
          />
          {scanning && foreground ? (
            <>
              <View style={styles.cameraFrame}>
                <CameraView
                  style={styles.camera}
                  facing="back"
                  barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                  onBarcodeScanned={(result) => scanned(result, scanToken)}
                  onMountError={() => {
                    scannerTrace("mount-error");
                    stopCamera();
                    setError(
                      "The camera could not open. Enter the UPI ID manually."
                    );
                  }}
                />
              </View>
              <Button
                title="Cancel scanning"
                variant="secondary"
                onPress={stopCamera}
              />
            </>
          ) : (
            <Button
              title="Scan UPI QR"
              variant="secondary"
              disabled={locked}
              loading={requestingCamera}
              onPress={() => {
                void startScanner();
              }}
            />
          )}
          <Button
            title="Review payment"
            disabled={locked || requestingCamera || scanning}
            onPress={review}
          />
        </>
      ) : null}
      {payment &&
      (stage === "review" ||
        stage === "opening" ||
        stage === "awaiting" ||
        stage === "confirmed") ? (
        <View style={styles.review}>
          <Text style={styles.title}>Check recipient and amount</Text>
          <Text selectable style={styles.body}>
            {payment.name}
          </Text>
          <Text selectable style={styles.body}>
            {payment.upiId}
          </Text>
          <Text style={styles.amount}>₹{payment.amount}</Text>
          <Text selectable style={styles.body}>
            Note: {payment.note || "None"}
          </Text>
          <Text style={styles.help}>
            The recipient name is supplied by you or the QR. Check the
            bank-confirmed recipient in your payment app before paying.
          </Text>
        </View>
      ) : null}
      {stage === "review" || stage === "opening" ? (
        <>
          <Button
            title="Open payment app"
            loading={stage === "opening"}
            disabled={disabled}
            onPress={() => {
              void openPaymentApp();
            }}
          />
          <Button
            title="Edit payment details"
            variant="secondary"
            disabled={locked}
            onPress={() => changeStage("entry")}
          />
        </>
      ) : null}
      {stage === "awaiting" ? (
        <>
          <Text style={styles.warning}>
            Payment status is unknown. Returning here or cancelling does not
            mean it succeeded. Check your payment app or bank history before
            recording or retrying.
          </Text>
          <Button
            title="I checked: payment succeeded"
            disabled={locked}
            onPress={confirmManually}
          />
          <Button
            title="Payment cancelled or not completed"
            variant="secondary"
            disabled={locked}
            onPress={() => {
              changeStage("entry");
              setError(
                "Payment remains unconfirmed. No expense has been recorded. Check your payment history before trying again."
              );
            }}
          />
        </>
      ) : null}
      {stage === "confirmed" ? (
        <Text style={styles.warning}>
          Payment marked successful by you; not verified by Pulse. Tap Add
          expense to record it and update budgets and rewards.
        </Text>
      ) : null}
      {error ? (
        <Text
          style={styles.error}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          {error}
        </Text>
      ) : null}
      {stage !== "idle" ? (
        <>
          <Text style={styles.help}>
            Returning to manual entry clears this confirmation. Check your bank
            history yourself; it does not cancel a payment already sent.
          </Text>
          <Button
            title="Return to manual entry"
            variant="ghost"
            disabled={locked}
            onPress={resetToManual}
          />
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    gap: SPACING.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.lg,
    marginVertical: SPACING.md
  },
  title: { ...TYPOGRAPHY.title3 },
  body: { ...TYPOGRAPHY.body },
  help: { ...TYPOGRAPHY.caption, lineHeight: 18 },
  warning: { ...TYPOGRAPHY.body, color: COLORS.warning, lineHeight: 21 },
  error: { ...TYPOGRAPHY.body, color: COLORS.dangerText, lineHeight: 21 },
  review: {
    gap: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: BORDER_RADIUS.md
  },
  amount: { ...TYPOGRAPHY.title1 },
  cameraFrame: {
    height: 240,
    overflow: "hidden",
    borderRadius: BORDER_RADIUS.md
  },
  camera: { flex: 1 }
});
