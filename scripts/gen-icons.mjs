// One-off generator for placeholder PNG assets (no external deps).
// Produces valid PNGs using only Node's built-in zlib.
// Run: node scripts/gen-icons.mjs
import zlib from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1;
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

// Create a solid RGBA PNG of given size and color.
function makePng(size, [r, g, b, a = 255]) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const rowLen = size * 4 + 1;
  const raw = Buffer.alloc(rowLen * size);
  for (let y = 0; y < size; y++) {
    raw[y * rowLen] = 0; // filter type none
    for (let x = 0; x < size; x++) {
      const off = y * rowLen + 1 + x * 4;
      raw[off] = r;
      raw[off + 1] = g;
      raw[off + 2] = b;
      raw[off + 3] = a;
    }
  }
  const idat = zlib.deflateSync(raw);
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

mkdirSync("public/icons", { recursive: true });
mkdirSync("public/payment-qr", { recursive: true });

const NEAR_BLACK = [17, 17, 17];
const WHITE = [255, 255, 255];

// PWA icons — near-black brand squares (replace with branded icons later)
writeFileSync("public/icons/icon-192.png", makePng(192, NEAR_BLACK));
writeFileSync("public/icons/icon-512.png", makePng(512, NEAR_BLACK));
// Favicon-ish
writeFileSync("public/icon.png", makePng(256, NEAR_BLACK));
// Logo PNG placeholder (white) — replace with the official logo image
writeFileSync("public/logo.png", makePng(256, WHITE));
// Apple touch icon
writeFileSync("public/apple-icon.png", makePng(180, NEAR_BLACK));

// Payment QR placeholders (black squares — replace with real screenshots)
for (const name of ["kbzpay", "wavepay", "ayapay", "cbpay"]) {
  writeFileSync(`public/payment-qr/${name}.jpg`, makePng(400, [10, 10, 10]));
}

console.log("Generated placeholder PNG assets.");
