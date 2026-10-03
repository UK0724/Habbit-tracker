const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const file = path.join(__dirname, "../src/utils/upi.ts");
const moduleObject = { exports: {} };
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync(file, "utf8"), {
    fileName: file,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022
    }
  }).outputText,
  {
    exports: moduleObject.exports,
    module: moduleObject,
    Map,
    Set,
    encodeURIComponent,
    decodeURIComponent
  },
  { filename: file }
);
const {
  parseUpiQr,
  makeUpiPayment,
  buildUpiUri,
  normalizeUpiAmount,
  paymentMatchesDraft,
  validateUpiId
} = moduleObject.exports;
const qr = parseUpiQr(
  "upi://pay?pa=cafe%40bank&pn=Cafe+%26+Co&am=099.50&cu=INR&tn=Tea%20%26%20cake&mc=5812&tr=order-42&tid=tx.42"
);
assert.equal(qr.upiId, "cafe@bank");
assert.equal(qr.name, "Cafe & Co");
assert.equal(qr.amount, "99.50");
assert.equal(qr.note, "Tea & cake");
assert.equal(qr.transactionRef, "order-42");
assert.equal(qr.merchantCode, "5812");
assert.equal(parseUpiQr("UPI://PAY?pa=name@bank").amount, undefined);
assert.equal(parseUpiQr("upi://pay?pa=name@bank").name, "name@bank");
for (const raw of [
  "",
  "https://bad.example",
  "intent://pay?pa=a@b",
  "upi://collect?pa=a@b",
  "upi://pay.evil?pa=a@b",
  "upi://pay/?pa=a@b",
  "upi://pay?pa=a@b#x",
  "upi://pay?pa=a@b&pa=evil@bank",
  "upi://pay?%70a=a@b",
  "upi://pay?pa=a@b&am=0",
  "upi://pay?pa=a@b&am=NaN",
  "upi://pay?pa=a@b&am=1e3",
  "upi://pay?pa=a@b&am=1.234",
  "upi://pay?pa=a@b&am=-1",
  "upi://pay?pa=a@b&cu=USD",
  "upi://pay?pa=a@b&url=https%3A%2F%2Fbad.example",
  "upi://pay?pa=a@b&sign=abc",
  "upi://pay?pa=a@b&tn=%ZZ",
  "upi://pay?pa=a@b&pn=%E2%80%AEspoof",
  "upi://pay?pa=a%00@b",
  "upi://pay?pa=a@b&mc=12",
  "upi://pay?pa=a@b&tr=%26pa%3Devil",
  "upi://pay?pa=a@b&tn=" + "x".repeat(281),
  "upi://pay?pa=a@b&pn=" + "x".repeat(2100)
]) {
  assert.throws(() => parseUpiQr(raw), undefined, `Reject ${raw.slice(0, 90)}`);
}
for (const raw of [
  "hello",
  "@bank",
  "a@@bank",
  "a@bank/evil",
  "а@bank",
  "a@bank?am=1",
  "a\n@bank",
  "a b@bank",
  "a@bank#evil"
])
  assert.throws(() => validateUpiId(raw));
assert.equal(validateUpiId(" test.123-abc@bank "), "test.123-abc@bank");
for (const raw of [
  "0",
  "-2",
  "Infinity",
  "NaN",
  "1e2",
  "1,000",
  "1.234",
  "1000000001",
  ".50"
])
  assert.throws(() => normalizeUpiAmount(raw));
assert.equal(normalizeUpiAmount("001.2"), "1.20");
const payment = makeUpiPayment(qr, "99.5", "  Tea & cake ");
const uri = buildUpiUri(payment);
assert.equal(
  uri,
  "upi://pay?pa=cafe%40bank&pn=Cafe%20%26%20Co&am=99.50&cu=INR&tn=Tea%20%26%20cake&mc=5812&tr=order-42&tid=tx.42"
);
assert.equal(parseUpiQr(uri).amount, "99.50");
assert.equal(paymentMatchesDraft(payment, "099.50", "Tea & cake"), true);
assert.equal(paymentMatchesDraft(payment, "100", "Tea & cake"), false);
assert.equal(paymentMatchesDraft(payment, "99.50", "Changed note"), false);
assert.equal(paymentMatchesDraft(undefined, "99.50", "Tea & cake"), false);
assert.throws(() => buildUpiUri({ ...payment, upiId: "evil://pay" }));
console.log(
  "UPI strict parsing, encoding, review snapshot and invalid/malicious QR checks passed."
);
