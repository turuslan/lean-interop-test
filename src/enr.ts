import * as secp256k1 from "./paulmillr/noble-secp256k1.ts";
import { concat } from "jsr:@std/bytes/concat";
import { encodeBase64Url } from "jsr:@std/encoding/base64url";
import { decodeHex, encodeHex } from "jsr:@std/encoding/hex";
import { keccak_256 } from "./paulmillr/noble-hashes/sha3.ts";
import { hmac } from "./paulmillr/noble-hashes/hmac.ts";
import { sha256 } from "./paulmillr/noble-hashes/sha2.ts";

const text_encoder = new TextEncoder();

export function nodeKey(i: number) {
  const sk = new Uint8Array(32);
  const sk64 = new BigUint64Array(sk.buffer);
  for (let j = 0; j < sk64.length; ++j) {
    sk64[j] = BigInt(j + i);
  }
  return encodeHex(sk);
}

const RlpMaxPrefix1 = 55;
const RlpBytesPrefix1 = 0x80;
const RlpListPrefix1 = 0xc0;

function rlpUintInternal(base: number, v: number) {
  if (v < 0) throw new Error();
  if (v > 0xffffffff) throw new Error();
  const n = 4 - Math.floor(Math.clz32(v) / 8);
  const buffer = new Uint8Array(1 + n);
  buffer[0] = base + n;
  for (let i = 1; i < buffer.length; ++i) {
    buffer[i] = v >> (8 * (n - i));
  }
  return buffer;
}

function rlpBytesInternal(base: number, v: Uint8Array) {
  return concat([
    v.length <= RlpMaxPrefix1
      ? Uint8Array.of(base + v.length)
      : rlpUintInternal(base + RlpMaxPrefix1, v.length),
    v,
  ]);
}

function rlpUint(v: number) {
  if (v < 0) throw new Error();
  if (v < RlpBytesPrefix1) return Uint8Array.of(v);
  return rlpUintInternal(RlpBytesPrefix1, v);
}

function rlpBytes(v: Uint8Array) {
  if (v.length === 1 && v[0] < RlpBytesPrefix1) return Uint8Array.from(v);
  return rlpBytesInternal(RlpBytesPrefix1, v);
}

function rlpStr(v: string) {
  return rlpBytes(text_encoder.encode(v));
}

function rlpList(v: Uint8Array) {
  return rlpBytesInternal(RlpListPrefix1, v);
}

export function enr(sk: string, ip: number, quic_port: number) {
  const sk_bytes = decodeHex(sk);
  const sequence = 1;
  const pk = secp256k1.getPublicKey(sk_bytes, true);
  const ip_be = new Uint8Array(4);
  new DataView(ip_be.buffer).setUint32(0, ip);
  const content = concat([
    rlpUint(sequence),
    ...[rlpStr("id"), rlpStr("v4")],
    ...[rlpStr("ip"), rlpBytes(ip_be)],
    ...[rlpStr("quic"), rlpUint(quic_port)],
    ...[rlpStr("secp256k1"), rlpBytes(pk)],
  ]);
  const hash = keccak_256(rlpList(content));
  secp256k1.hashes.hmacSha256 = (key, message) => hmac(sha256, key, message);
  const sig = secp256k1.sign(hash, sk_bytes, { prehash: false });
  return "enr:" + encodeBase64Url(rlpList(concat([
    rlpBytes(sig),
    content,
  ])));
}

export const LOCALHOST = 0x7f000001;
