import fs from 'node:fs/promises';
import path from 'node:path';
import zlib from 'node:zlib';

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function crc32(buffer) {
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) {
    crc ^= buffer[i];
    for (let bit = 0; bit < 8; bit += 1) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function paethPredictor(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

function parsePng(buffer) {
  if (!buffer.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) {
    throw new Error('Not a PNG file.');
  }

  let offset = PNG_SIGNATURE.length;
  let ihdr = null;
  const idatParts = [];

  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    offset += 4;
    const type = buffer.subarray(offset, offset + 4).toString('ascii');
    offset += 4;
    const data = buffer.subarray(offset, offset + length);
    offset += length;
    offset += 4;

    if (type === 'IHDR') {
      ihdr = {
        width: data.readUInt32BE(0),
        height: data.readUInt32BE(4),
        bitDepth: data[8],
        colorType: data[9],
        compression: data[10],
        filter: data[11],
        interlace: data[12],
      };
    } else if (type === 'IDAT') {
      idatParts.push(data);
    } else if (type === 'IEND') {
      break;
    }
  }

  if (!ihdr) {
    throw new Error('PNG missing IHDR.');
  }
  if (ihdr.bitDepth !== 8 || ihdr.colorType !== 2 || ihdr.interlace !== 0) {
    throw new Error(`Unsupported PNG format: bitDepth=${ihdr.bitDepth}, colorType=${ihdr.colorType}, interlace=${ihdr.interlace}`);
  }

  return {
    ...ihdr,
    compressed: Buffer.concat(idatParts),
  };
}

function unfilterScanlines(raw, width, height, bytesPerPixel) {
  const stride = width * bytesPerPixel;
  const output = Buffer.alloc(height * stride);
  let inOffset = 0;
  let outOffset = 0;

  for (let y = 0; y < height; y += 1) {
    const filterType = raw[inOffset];
    inOffset += 1;

    for (let x = 0; x < stride; x += 1) {
      const value = raw[inOffset];
      const left = x >= bytesPerPixel ? output[outOffset + x - bytesPerPixel] : 0;
      const up = y > 0 ? output[outOffset + x - stride] : 0;
      const upLeft = y > 0 && x >= bytesPerPixel ? output[outOffset + x - stride - bytesPerPixel] : 0;

      let reconstructed = value;
      if (filterType === 1) reconstructed = (value + left) & 0xff;
      if (filterType === 2) reconstructed = (value + up) & 0xff;
      if (filterType === 3) reconstructed = (value + Math.floor((left + up) / 2)) & 0xff;
      if (filterType === 4) reconstructed = (value + paethPredictor(left, up, upLeft)) & 0xff;

      output[outOffset + x] = reconstructed;
      inOffset += 1;
    }

    outOffset += stride;
  }

  return output;
}

function buildRgbaScanlines(rgb, width, height) {
  const rgba = Buffer.alloc(width * height * 4);
  const bgSamples = [
    [255, 255, 255],
    [229, 229, 229],
    [242, 242, 242],
    [204, 204, 204],
  ];
  const softThreshold = 18;
  const fadeThreshold = 72;

  const distance = (r, g, b, bg) => {
    const dr = r - bg[0];
    const dg = g - bg[1];
    const db = b - bg[2];
    return Math.sqrt(dr * dr + dg * dg + db * db);
  };

  for (let i = 0, j = 0; i < rgb.length; i += 3, j += 4) {
    const r = rgb[i];
    const g = rgb[i + 1];
    const b = rgb[i + 2];

    let minDist = Infinity;
    for (const bg of bgSamples) {
      const d = distance(r, g, b, bg);
      if (d < minDist) minDist = d;
    }

    let alpha = 255;
    if (minDist <= softThreshold) {
      alpha = 0;
    } else if (minDist < fadeThreshold) {
      alpha = Math.max(0, Math.min(255, Math.round(((minDist - softThreshold) / (fadeThreshold - softThreshold)) * 255)));
    }

    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const cyanStrength = Math.max(g, b) - r;

    // Remove faint square haze left from the original dark backdrop.
    if (alpha < 36) {
      alpha = 0;
    } else if (alpha < 96 && cyanStrength < 60) {
      alpha = 0;
    } else if (alpha < 160 && luminance < 150 && cyanStrength < 90) {
      alpha = Math.round(alpha * 0.35);
    } else if (alpha < 220 && luminance < 115 && cyanStrength < 70) {
      alpha = Math.round(alpha * 0.2);
    }

    rgba[j] = r;
    rgba[j + 1] = g;
    rgba[j + 2] = b;
    rgba[j + 3] = alpha;
  }

  const stride = width * 4;
  const filtered = Buffer.alloc(height * (stride + 1));
  for (let y = 0; y < height; y += 1) {
    const srcStart = y * stride;
    const dstStart = y * (stride + 1);
    filtered[dstStart] = 0;
    rgba.copy(filtered, dstStart + 1, srcStart, srcStart + stride);
  }
  return filtered;
}

function cropRgbaToVisibleBounds(filteredRgba, width, height, alphaThreshold = 16, padding = 16) {
  const stride = width * 4;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (stride + 1);
    for (let x = 0; x < width; x += 1) {
      const alpha = filteredRgba[rowStart + 1 + x * 4 + 3];
      if (alpha > alphaThreshold) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < minX || maxY < minY) {
    return { width, height, filteredRgba };
  }

  const cropMinX = Math.max(0, minX - padding);
  const cropMinY = Math.max(0, minY - padding);
  const cropMaxX = Math.min(width - 1, maxX + padding);
  const cropMaxY = Math.min(height - 1, maxY + padding);
  const cropWidth = cropMaxX - cropMinX + 1;
  const cropHeight = cropMaxY - cropMinY + 1;
  const cropped = Buffer.alloc(cropHeight * (cropWidth * 4 + 1));

  for (let y = 0; y < cropHeight; y += 1) {
    const srcStart = (cropMinY + y) * (stride + 1);
    const dstStart = y * (cropWidth * 4 + 1);
    cropped[dstStart] = 0;
    filteredRgba.copy(
      cropped,
      dstStart + 1,
      srcStart + 1 + cropMinX * 4,
      srcStart + 1 + (cropMinX + cropWidth) * 4
    );
  }

  return {
    width: cropWidth,
    height: cropHeight,
    filteredRgba: cropped,
  };
}

function makeChunk(type, data) {
  const typeBuffer = Buffer.from(type, 'ascii');
  const lengthBuffer = Buffer.alloc(4);
  lengthBuffer.writeUInt32BE(data.length, 0);
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([lengthBuffer, typeBuffer, data, crcBuffer]);
}

function encodePng(width, height, filteredRgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const compressed = zlib.deflateSync(filteredRgba);
  return Buffer.concat([
    PNG_SIGNATURE,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);
}

async function main() {
  const inputPath = process.argv[2];
  const outputPath = process.argv[3];
  if (!inputPath || !outputPath) {
    throw new Error('Usage: node scripts/remove_checkerboard_logo.mjs <input.png> <output.png>');
  }

  const source = await fs.readFile(inputPath);
  const parsed = parsePng(source);
  const raw = zlib.inflateSync(parsed.compressed);
  const rgb = unfilterScanlines(raw, parsed.width, parsed.height, 3);
  const filteredRgba = buildRgbaScanlines(rgb, parsed.width, parsed.height);
  const cropped = cropRgbaToVisibleBounds(filteredRgba, parsed.width, parsed.height);
  const output = encodePng(cropped.width, cropped.height, cropped.filteredRgba);

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, output);
  console.log(outputPath);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
