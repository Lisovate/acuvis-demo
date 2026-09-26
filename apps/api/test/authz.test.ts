import { test } from "node:test";
import assert from "node:assert/strict";
import { hasRole, ROLE_RANK } from "../src/authz.js";

test("owners outrank admins outrank members", () => {
  assert.ok(ROLE_RANK.owner > ROLE_RANK.admin);
  assert.ok(ROLE_RANK.admin > ROLE_RANK.member);
});

test("hasRole accepts the role itself and anything above it", () => {
  assert.equal(hasRole("owner", "admin"), true);
  assert.equal(hasRole("admin", "admin"), true);
  assert.equal(hasRole("member", "admin"), false);
  assert.equal(hasRole("member", "member"), true);
});
