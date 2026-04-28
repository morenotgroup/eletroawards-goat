import { cookies } from "next/headers";
import crypto from "crypto";

const COOKIE_NAME = "eletroawards_session";

export function onlyDigits(value: string) {
  return value.replace(/\D/g, "").padStart(11, "0");
}

export function hashCpf(cpf: string) {
  return crypto.createHash("sha256").update(onlyDigits(cpf)).digest("hex");
}

function secret() {
  return process.env.SESSION_SECRET || "dev-secret-change-me-before-production";
}

export function sign(payload: string) {
  return crypto.createHmac("sha256", secret()).update(payload).digest("hex");
}

export function createSession(cpf: string) {
  const cpfHash = hashCpf(cpf);
  const issuedAt = Date.now();
  const payload = Buffer.from(JSON.stringify({ cpfHash, issuedAt })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function readSessionToken(token?: string) {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature || sign(payload) !== signature) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { cpfHash: string; issuedAt: number };
    if (!parsed.cpfHash || Date.now() - parsed.issuedAt > 1000 * 60 * 60 * 24 * 14) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function getSession() {
  const jar = await cookies();
  return readSessionToken(jar.get(COOKIE_NAME)?.value);
}

export async function setSessionCookie(token: string) {
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}
