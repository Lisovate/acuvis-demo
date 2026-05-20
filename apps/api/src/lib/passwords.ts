import bcrypt from "bcryptjs";

const LINK_ROUNDS = 8;

export function hashLinkPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, LINK_ROUNDS);
}

export function verifyLinkPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
