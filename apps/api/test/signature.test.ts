import { test } from "node:test";
import assert from "node:assert/strict";
import { signPayload, verifySignature } from "@acuvis-demo/shared/webhooks";

const secret = "whsec_test_secret_value";
const body = JSON.stringify({ event: "link.created", data: { slug: "abc" } });

test("a signed payload verifies", () => {
  const now = 1_750_000_000;
  const header = signPayload(secret, body, now);
  assert.equal(verifySignature(secret, body, header, now), true);
});

test("a changed body does not verify", () => {
  const now = 1_750_000_000;
  const header = signPayload(secret, body, now);
  assert.equal(verifySignature(secret, body.replace("abc", "abd"), header, now), false);
});

test("old signatures are rejected", () => {
  const signedAt = 1_750_000_000;
  const header = signPayload(secret, body, signedAt);
  assert.equal(verifySignature(secret, body, header, signedAt + 301), false);
});
