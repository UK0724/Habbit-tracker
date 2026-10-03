/** A client-side handoff is not a payment receipt or bank verification. */
export type UpiPaymentState = "idle" | "unconfirmed" | "confirmed";
export interface UpiRecipient {
  upiId: string;
  name: string;
  merchantCode?: string;
  transactionRef?: string;
  transactionId?: string;
}
export interface UpiPaymentRequest extends UpiRecipient {
  amount: string;
  note: string;
}
export interface UpiQrDraft extends UpiRecipient {
  amount?: string;
  note?: string;
}

const UNSAFE_TEXT =
  /[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2066-\u2069\ufeff]/;
const fail = (message: string): never => {
  throw new Error(message);
};
const text = (value: string, maximum: number, label: string) => {
  const trimmed = value.trim();
  if (UNSAFE_TEXT.test(value) || trimmed.length > maximum)
    return fail(`${label} is invalid or too long.`);
  // Reject invalid surrogate pairs instead of failing later during URI encoding.
  try {
    encodeURIComponent(trimmed);
  } catch {
    return fail(`${label} contains invalid text.`);
  }
  return trimmed;
};

export function validateUpiId(raw: string): string {
  const value = raw.trim();
  if (
    value.length > 255 ||
    !/^[a-zA-Z0-9][a-zA-Z0-9._-]*@[a-zA-Z0-9][a-zA-Z0-9.-]*$/.test(value)
  ) {
    return fail("Enter a valid UPI ID, like name@bank.");
  }
  return value;
}

export function normalizeUpiAmount(raw: string): string {
  const value = raw.trim();
  if (!/^\d{1,10}(?:\.\d{1,2})?$/.test(value))
    return fail("Enter a positive rupee amount with at most 2 decimal places.");
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000_000)
    return fail("Enter a valid amount greater than ₹0.");
  return amount.toFixed(2);
}

export function makeUpiPayment(
  recipient: UpiRecipient,
  amount: string,
  note: string
): UpiPaymentRequest {
  const upiId = validateUpiId(recipient.upiId);
  const name = text(recipient.name, 100, "Recipient name") || upiId;
  const result: UpiPaymentRequest = {
    upiId,
    name,
    amount: normalizeUpiAmount(amount),
    note: text(note, 280, "Payment note")
  };
  if (recipient.merchantCode !== undefined) {
    if (!/^\d{4}$/.test(recipient.merchantCode))
      return fail("The QR merchant code is invalid.");
    result.merchantCode = recipient.merchantCode;
  }
  for (const key of ["transactionRef", "transactionId"] as const) {
    const value = recipient[key];
    if (value !== undefined) {
      if (!/^[a-zA-Z0-9._-]{1,100}$/.test(value))
        return fail("The QR payment reference is invalid.");
      result[key] = value;
    }
  }
  return result;
}

/** Only the simple UPI pay contract is supported. Never open a scanned URI directly. */
export function parseUpiQr(raw: string): UpiQrDraft {
  if (raw.length > 2048 || UNSAFE_TEXT.test(raw))
    return fail("This QR code is not a supported UPI payment code.");
  const match = /^upi:\/\/pay\?([^#\s]+)$/i.exec(raw.trim());
  if (!match)
    return fail("Scan a UPI payment QR code, or enter the UPI ID manually.");
  const parameters = new Map<string, string>();
  const allowed = new Set(["pa", "pn", "am", "cu", "tn", "mc", "tr", "tid"]);
  for (const pair of match[1].split("&")) {
    const separator = pair.indexOf("=");
    if (separator < 1) return fail("The UPI QR code has an invalid parameter.");
    const key = pair.slice(0, separator);
    if (!allowed.has(key))
      return fail(
        "This QR uses an unsupported payment option. Use your payment app to scan it, then add the expense manually."
      );
    if (parameters.has(key))
      return fail("The UPI QR code contains duplicate payment details.");
    let value: string;
    try {
      value = decodeURIComponent(pair.slice(separator + 1).replace(/\+/g, " "));
    } catch {
      return fail("The UPI QR code has invalid encoding.");
    }
    if (UNSAFE_TEXT.test(value))
      return fail("The UPI QR code contains unsafe text.");
    parameters.set(key, value);
  }
  if (parameters.has("cu") && parameters.get("cu") !== "INR")
    return fail("Only UPI payments in INR are supported.");
  const checked = makeUpiPayment(
    {
      upiId: parameters.get("pa") ?? "",
      name: parameters.get("pn") ?? "",
      merchantCode: parameters.get("mc"),
      transactionRef: parameters.get("tr"),
      transactionId: parameters.get("tid")
    },
    parameters.get("am") ?? "1",
    parameters.get("tn") ?? ""
  );
  return {
    upiId: checked.upiId,
    name: checked.name,
    ...(checked.merchantCode ? { merchantCode: checked.merchantCode } : {}),
    ...(checked.transactionRef
      ? { transactionRef: checked.transactionRef }
      : {}),
    ...(checked.transactionId ? { transactionId: checked.transactionId } : {}),
    ...(parameters.has("am") ? { amount: checked.amount } : {}),
    ...(parameters.has("tn") ? { note: checked.note } : {})
  };
}

export function buildUpiUri(payment: UpiPaymentRequest): string {
  const checked = makeUpiPayment(payment, payment.amount, payment.note);
  const pairs: [string, string][] = [
    ["pa", checked.upiId],
    ["pn", checked.name],
    ["am", checked.amount],
    ["cu", "INR"]
  ];
  if (checked.note) pairs.push(["tn", checked.note]);
  if (checked.merchantCode) pairs.push(["mc", checked.merchantCode]);
  if (checked.transactionRef) pairs.push(["tr", checked.transactionRef]);
  if (checked.transactionId) pairs.push(["tid", checked.transactionId]);
  return `upi://pay?${pairs.map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join("&")}`;
}

export function paymentMatchesDraft(
  payment: UpiPaymentRequest | undefined | null,
  amount: string,
  note: string
): boolean {
  if (!payment) return false;
  try {
    return (
      payment.amount === normalizeUpiAmount(amount) &&
      payment.note === text(note, 280, "Payment note")
    );
  } catch {
    return false;
  }
}
