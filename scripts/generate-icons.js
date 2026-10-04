import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

/**
 * Minimal pure-Node PNG generator
 * Creates valid PNG images without third-party dependencies using native zlib and CRC32.
 */

// CRC table for PNG chunks
const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[i] = c >>> 0;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makePngChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const crcBuf = Buffer.alloc(4);
  const toCrc = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(toCrc), 0);

  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function generatePng(width, height, isMaskable = false) {
  // RGBA buffer (4 bytes per pixel) + 1 filter byte per row
  const rawBytesPerRow = width * 4 + 1;
  const rawData = Buffer.alloc(height * rawBytesPerRow);

  const cx = width / 2;
  const cy = height / 2;
  const radius = width * 0.42;
  const innerRadius = width * 0.22;

  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter type 0 (None)

    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Default background: dark slate (#0F172A)
      let r = 15;
      let g = 23;
      let b = 42;
      let a = 255;

      // Shield shape approximate
      const inShield = Math.abs(dx) <= (width * 0.35) && dy >= (-height * 0.35) && (dy <= height * 0.1 || (Math.abs(dx) * 1.4 + dy * 0.8) <= height * 0.38);

      if (inShield) {
        // Indigo gradient
        const t = (y / height);
        r = Math.round(99 * (1 - t) + 67 * t);
        g = Math.round(102 * (1 - t) + 56 * t);
        b = Math.round(241 * (1 - t) + 202 * t);
      }

      // Coin circle
      if (dist <= innerRadius) {
        // Gold / Amber coin (#F59E0B)
        r = 245;
        g = 158;
        b = 11;

        if (dist >= innerRadius - 4 && dist <= innerRadius - 2) {
          // Inner coin ring
          r = 217;
          g = 119;
          b = 6;
        }

        // Center Rp symbol approximate cross/mark
        if (Math.abs(dx) < innerRadius * 0.45 && Math.abs(dy) < innerRadius * 0.45) {
          if (dx >= -innerRadius * 0.35 && dx <= -innerRadius * 0.15) {
            r = 120; g = 53; b = 15; // Dark brown
          }
          if (dy >= -innerRadius * 0.25 && dy <= -innerRadius * 0.05 && dx >= -innerRadius * 0.15 && dx <= innerRadius * 0.2) {
            r = 120; g = 53; b = 15;
          }
          if (dx >= innerRadius * 0.05 && dx <= innerRadius * 0.25 && dy >= -innerRadius * 0.05 && dy <= innerRadius * 0.3) {
            r = 120; g = 53; b = 15;
          }
        }
      }

      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
      rawData[offset++] = a;
    }
  }

  // Deflate compressed data
  const compressed = zlib.deflateSync(rawData);

  // PNG Header
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bits per channel
  ihdrData[9] = 6; // Color type 6 (RGBA)
  ihdrData[10] = 0; // Compression (deflate)
  ihdrData[11] = 0; // Filter (standard)
  ihdrData[12] = 0; // Interlace (none)
  const ihdrChunk = makePngChunk('IHDR', ihdrData);

  // IDAT
  const idatChunk = makePngChunk('IDAT', compressed);

  // IEND
  const iendChunk = makePngChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. 192x192 PNG
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), generatePng(192, 192, false));

// 2. 512x512 PNG
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), generatePng(512, 512, false));

// 3. 512x512 Maskable PNG
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), generatePng(512, 512, true));

// 4. Apple Touch Icon 180x180 PNG
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), generatePng(180, 180, false));

console.log('Semua ikon PNG PWA berhasil dibuat!');
