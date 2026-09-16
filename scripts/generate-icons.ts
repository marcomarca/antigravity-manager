import * as fs from "node:fs";
import * as path from "node:path";

// Generates an uncompressed 32-bit RGBA BMP/PNG or standard multi-resolution ICO file for Windows
function createIcoFromPngs(pngBuffers: { width: number; height: number; buffer: Buffer }[]): Buffer {
  const numImages = pngBuffers.length;
  const headerSize = 6;
  const entrySize = 16;
  let offset = headerSize + numImages * entrySize;

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Type 1 = ICO
  header.writeUInt16LE(numImages, 4); // Number of images

  const entries: Buffer[] = [];
  const images: Buffer[] = [];

  for (const item of pngBuffers) {
    const entry = Buffer.alloc(entrySize);
    entry.writeUInt8(item.width >= 256 ? 0 : item.width, 0);
    entry.writeUInt8(item.height >= 256 ? 0 : item.height, 1);
    entry.writeUInt8(0, 2); // Color palette
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(item.buffer.length, 8); // Size of image data
    entry.writeUInt32LE(offset, 12); // Offset of image data

    entries.push(entry);
    images.push(item.buffer);
    offset += item.buffer.length;
  }

  return Buffer.concat([header, ...entries, ...images]);
}

// Minimal pure-JS PNG encoder for generating simple RGBA icons without external native deps
function createPng(width: number, height: number, drawFn: (x: number, y: number) => [number, number, number, number]): Buffer {
  const rawData: number[] = [];
  for (let y = 0; y < height; y++) {
    rawData.push(0); // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawFn(x, y);
      rawData.push(r, g, b, a);
    }
  }

  const rawBuffer = Buffer.from(rawData);
  const deflated = require("node:zlib").deflateSync(rawBuffer);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // Bit depth
  ihdrData.writeUInt8(6, 9); // Color type: RGBA
  ihdrData.writeUInt8(0, 10); // Compression
  ihdrData.writeUInt8(0, 11); // Filter
  ihdrData.writeUInt8(0, 12); // Interlace

  const ihdrChunk = createChunk("IHDR", ihdrData);
  const idatChunk = createChunk("IDAT", deflated);
  const iendChunk = createChunk("IEND", Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    const byte = buf[i]!;
    crc ^= byte;
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// Icon Drawing: Sleek dark rounded-square icon with glowing cyan/purple 'A' delta / antigravity launcher symbol
function renderIcon(size: number): Buffer {
  return createPng(size, size, (x, y) => {
    const cx = size / 2;
    const cy = size / 2;
    const radius = size * 0.44;
    const cornerRadius = size * 0.22;

    // Distance to rounded box
    const dx = Math.max(Math.abs(x - cx) - (radius - cornerRadius), 0);
    const dy = Math.max(Math.abs(y - cy) - (radius - cornerRadius), 0);
    const distToCorner = Math.sqrt(dx * dx + dy * dy);

    if (distToCorner > cornerRadius + 0.5) {
      return [0, 0, 0, 0]; // Transparent
    }

    const antiAlias = Math.min(Math.max(cornerRadius + 0.5 - distToCorner, 0), 1);

    // Gradient background: Dark slate / indigo (#131722 -> #1E2337)
    const t = (y / size + x / size) / 2;
    let r = Math.round(18 + t * 20);
    let g = Math.round(20 + t * 24);
    let b = Math.round(36 + t * 45);

    // Antigravity upward triangle / chevron glyph
    const nx = (x - cx) / (size * 0.32);
    const ny = (y - cy) / (size * 0.32);

    // Triangle / chevron coordinates: Top (0, -0.75), Bottom-Left (-0.75, 0.75), Bottom-Right (0.75, 0.75)
    const inTopPeak = ny >= -0.75 && ny <= 0.75 && Math.abs(nx) <= (ny + 0.75) * 0.55;
    const inInnerCutout = ny >= -0.15 && ny <= 0.75 && Math.abs(nx) <= (ny + 0.15) * 0.45;
    const isChevron = inTopPeak && !inInnerCutout;

    // Subtle horizontal glowing bar (antigravity ring)
    const isRing = Math.abs(ny - 0.25) <= 0.12 && Math.abs(nx) <= 0.85 && Math.abs(nx) >= 0.4;

    if (isChevron || isRing) {
      // Vibrant Cyan to Violet gradient
      const glyphT = (ny + 0.75) / 1.5;
      r = Math.round(56 + glyphT * 120);
      g = Math.round(189 - glyphT * 80);
      b = Math.round(248);
    }

    const alpha = Math.round(255 * antiAlias);
    return [r, g, b, alpha];
  });
}

function main() {
  const resourcesDir = path.join(__dirname, "..", "resources");
  fs.mkdirSync(resourcesDir, { recursive: true });

  const sizes = [16, 32, 48, 64, 128, 256];
  const pngs = sizes.map(sz => ({
    width: sz,
    height: sz,
    buffer: renderIcon(sz)
  }));

  // Write 256x256 icon.png
  const icon256 = pngs.find(p => p.width === 256)!.buffer;
  fs.writeFileSync(path.join(resourcesDir, "icon.png"), icon256);
  console.log("✅ Created resources/icon.png (256x256)");

  // Write multi-resolution icon.ico
  const icoBuffer = createIcoFromPngs(pngs);
  fs.writeFileSync(path.join(resourcesDir, "icon.ico"), icoBuffer);
  console.log("✅ Created resources/icon.ico (multi-res 16, 32, 48, 64, 128, 256)");
}

main();
