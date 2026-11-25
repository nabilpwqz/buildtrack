import fs from "fs";
import path from "path";
import sharp from "sharp";

const svgPath = path.resolve("app/icon.svg");
const svgContent = fs.readFileSync(svgPath, "utf-8");

function createIco(pngBuffers) {
  const count = pngBuffers.length;
  const headerSize = 6;
  const entrySize = 16;
  let offset = headerSize + count * entrySize;

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // ICO format
  header.writeUInt16LE(count, 4); // Number of images

  const entries = [];
  for (const item of pngBuffers) {
    const entry = Buffer.alloc(entrySize);
    entry.writeUInt8(item.width >= 256 ? 0 : item.width, 0);
    entry.writeUInt8(item.height >= 256 ? 0 : item.height, 1);
    entry.writeUInt8(0, 2); // Colors (0 = no palette)
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(item.buffer.length, 8); // Size of image data
    entry.writeUInt32LE(offset, 12); // Image data offset
    entries.push(entry);
    offset += item.buffer.length;
  }

  return Buffer.concat([header, ...entries, ...pngBuffers.map((p) => p.buffer)]);
}

async function generate() {
  console.log("Generating high-fidelity BuildTrack favicons with sharp...");

  // Generate PNGs at multiple resolutions
  const [b16, b32, b48, b180, b512] = await Promise.all([
    sharp(Buffer.from(svgContent)).resize(16, 16).png().toBuffer(),
    sharp(Buffer.from(svgContent)).resize(32, 32).png().toBuffer(),
    sharp(Buffer.from(svgContent)).resize(48, 48).png().toBuffer(),
    sharp(Buffer.from(svgContent)).resize(180, 180).png().toBuffer(),
    sharp(Buffer.from(svgContent)).resize(512, 512).png().toBuffer(),
  ]);

  const icoBuffer = createIco([
    { width: 16, height: 16, buffer: b16 },
    { width: 32, height: 32, buffer: b32 },
    { width: 48, height: 48, buffer: b48 },
  ]);

  // Write outputs
  fs.writeFileSync("public/favicon.ico", icoBuffer);
  fs.writeFileSync("app/favicon.ico", icoBuffer);
  fs.writeFileSync("public/favicon-16x16.png", b16);
  fs.writeFileSync("public/favicon-32x32.png", b32);
  fs.writeFileSync("public/apple-touch-icon.png", b180);
  fs.writeFileSync("public/icon-512.png", b512);
  fs.writeFileSync("public/icon.svg", svgContent);

  console.log("Successfully generated:");
  console.log(" - public/favicon.ico (16x16, 32x32, 48x48 multi-res)");
  console.log(" - app/favicon.ico");
  console.log(" - public/favicon-16x16.png");
  console.log(" - public/favicon-32x32.png");
  console.log(" - public/apple-touch-icon.png (180x180)");
  console.log(" - public/icon-512.png (512x512)");
  console.log(" - public/icon.svg");
}

generate().catch(console.error);

