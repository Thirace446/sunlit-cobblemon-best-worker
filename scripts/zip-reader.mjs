import { inflateRawSync } from "node:zlib";

/**
 * Minimal, dependency-free ZIP reader for Node.
 * Supports stored (0) and deflate (8) entries, which covers Minecraft jars.
 * It does not extract to disk; everything stays in memory.
 */
export function readZip(buffer) {
  const eocd = findEndOfCentralDirectory(buffer);
  if (!eocd) throw new Error("Not a ZIP file: EOCD not found");

  const totalEntries = eocd.buf.readUInt16LE(eocd.offset + 10);
  const centralDirOffset = eocd.buf.readUInt32LE(eocd.offset + 16);
  const entries = new Map();

  let p = centralDirOffset;
  for (let i = 0; i < totalEntries; i++) {
    if (eocd.buf.readUInt32LE(p) !== 0x02014b50) {
      throw new Error(`Invalid central directory header at ${p}`);
    }

    const method = eocd.buf.readUInt16LE(p + 10);
    const compressedSize = eocd.buf.readUInt32LE(p + 20);
    const uncompressedSize = eocd.buf.readUInt32LE(p + 24);
    const nameLen = eocd.buf.readUInt16LE(p + 28);
    const extraLen = eocd.buf.readUInt16LE(p + 30);
    const commentLen = eocd.buf.readUInt16LE(p + 32);
    const localOffset = eocd.buf.readUInt32LE(p + 42);
    const name = eocd.buf.toString("utf8", p + 46, p + 46 + nameLen);

    if (compressedSize === 0xffffffff || uncompressedSize === 0xffffffff || localOffset === 0xffffffff) {
      throw new Error(`ZIP64 entry is not supported: ${name}`);
    }

    if (!name.endsWith("/")) {
      if (eocd.buf.readUInt32LE(localOffset) !== 0x04034b50) {
        throw new Error(`Invalid local header for ${name}`);
      }
      const localNameLen = eocd.buf.readUInt16LE(localOffset + 26);
      const localExtraLen = eocd.buf.readUInt16LE(localOffset + 28);
      const dataStart = localOffset + 30 + localNameLen + localExtraLen;
      const compressed = eocd.buf.subarray(dataStart, dataStart + compressedSize);
      let data;
      if (method === 0) {
        data = Buffer.from(compressed);
      } else if (method === 8) {
        data = inflateRawSync(compressed);
      } else {
        throw new Error(`Unsupported ZIP compression method ${method}: ${name}`);
      }
      entries.set(name, data);
    }

    p += 46 + nameLen + extraLen + commentLen;
  }

  return entries;
}

function findEndOfCentralDirectory(buffer) {
  const min = Math.max(0, buffer.length - 65557);
  for (let i = buffer.length - 22; i >= min; i--) {
    if (buffer.readUInt32LE(i) === 0x06054b50) {
      return { buf: buffer, offset: i };
    }
  }
  return null;
}

export function readJson(entries, name) {
  const data = entries.get(name);
  if (!data) return null;
  return JSON.parse(data.toString("utf8").replace(/^\uFEFF/, ""));
}
