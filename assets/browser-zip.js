// Minimal ZIP reader for the browser. It reads the central directory and
// decompresses only the entries that are requested, so a 100+ MB jar can be
// inspected without inflating every asset.

const SIG_EOCD = 0x06054b50;
const SIG_EOCD64 = 0x06064b50;
const SIG_EOCD64_LOC = 0x07064b50;
const SIG_CENTRAL = 0x02014b50;
const SIG_LOCAL = 0x04034b50;

const utf8 = new TextDecoder("utf-8");

export async function readZip(input) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const eocd = findEocd(view);
  if (eocd < 0) throw new Error("不是有效的 ZIP/JAR 文件：找不到中央目录");

  let entryCount = view.getUint16(eocd + 10, true);
  let cdOffset = view.getUint32(eocd + 16, true);
  let cdSize = view.getUint32(eocd + 12, true);

  if (entryCount === 0xffff || cdOffset === 0xffffffff || cdSize === 0xffffffff) {
    const zip64 = findZip64Eocd(view, eocd);
    if (zip64 >= 0) {
      entryCount = readU64(view, zip64 + 32);
      cdSize = readU64(view, zip64 + 40);
      cdOffset = readU64(view, zip64 + 48);
    }
  }

  const entries = [];
  const byName = new Map();
  let p = cdOffset;
  for (let i = 0; i < entryCount; i++) {
    if (p + 46 > view.byteLength || view.getUint32(p, true) !== SIG_CENTRAL) break;
    const flags = view.getUint16(p + 8, true);
    const method = view.getUint16(p + 10, true);
    let compressedSize = view.getUint32(p + 20, true);
    let uncompressedSize = view.getUint32(p + 24, true);
    const nameLen = view.getUint16(p + 28, true);
    const extraLen = view.getUint16(p + 30, true);
    const commentLen = view.getUint16(p + 32, true);
    let localOffset = view.getUint32(p + 42, true);
    const name = utf8.decode(bytes.subarray(p + 46, p + 46 + nameLen));

    if (compressedSize === 0xffffffff || uncompressedSize === 0xffffffff || localOffset === 0xffffffff) {
      const extraStart = p + 46 + nameLen;
      const zip64 = readZip64Extra(view, extraStart, extraLen);
      if (zip64.uncompressedSize != null) uncompressedSize = zip64.uncompressedSize;
      if (zip64.compressedSize != null) compressedSize = zip64.compressedSize;
      if (zip64.localOffset != null) localOffset = zip64.localOffset;
    }

    const entry = { name, flags, method, compressedSize, uncompressedSize, localOffset };
    entries.push(entry);
    byName.set(name, entry);
    p += 46 + nameLen + extraLen + commentLen;
  }

  function has(name) {
    return byName.has(name);
  }

  function names() {
    return entries.map((entry) => entry.name);
  }

  async function getBytes(name) {
    const entry = byName.get(name);
    if (!entry) return null;
    if (entry.flags & 1) throw new Error(`加密的 ZIP 条目暂不支持：${name}`);
    const local = entry.localOffset;
    if (view.getUint32(local, true) !== SIG_LOCAL) throw new Error(`损坏的 ZIP 条目：${name}`);
    const nameLen = view.getUint16(local + 26, true);
    const extraLen = view.getUint16(local + 28, true);
    const dataStart = local + 30 + nameLen + extraLen;
    const compressed = bytes.subarray(dataStart, dataStart + entry.compressedSize);
    if (entry.method === 0) return compressed;
    if (entry.method !== 8) throw new Error(`不支持的 ZIP 压缩方式 ${entry.method}：${name}`);
    if (typeof DecompressionStream === "undefined") {
      throw new Error("当前浏览器不支持解压 ZIP，请使用最新版 Chrome、Edge 或 Firefox");
    }
    const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }

  async function getText(name) {
    const data = await getBytes(name);
    if (!data) return null;
    return utf8.decode(data);
  }

  async function getJson(name) {
    const text = await getText(name);
    return text == null ? null : JSON.parse(text.replace(/^\uFEFF/, ""));
  }

  return { entries, has, names, getBytes, getText, getJson, size: entries.length };
}

function findEocd(view) {
  const min = Math.max(0, view.byteLength - 22 - 0xffff);
  for (let i = view.byteLength - 22; i >= min; i--) {
    if (view.getUint32(i, true) === SIG_EOCD) return i;
  }
  return -1;
}

function findZip64Eocd(view, eocd) {
  const loc = eocd - 20;
  if (loc < 0 || view.getUint32(loc, true) !== SIG_EOCD64_LOC) return -1;
  const offset = readU64(view, loc + 8);
  if (offset + 56 > view.byteLength || view.getUint32(offset, true) !== SIG_EOCD64) return -1;
  return offset;
}

function readU64(view, offset) {
  const low = view.getUint32(offset, true);
  const high = view.getUint32(offset + 4, true);
  return high * 0x100000000 + low;
}

function readZip64Extra(view, start, length) {
  let p = start;
  const end = start + length;
  while (p + 4 <= end) {
    const id = view.getUint16(p, true);
    const size = view.getUint16(p + 2, true);
    p += 4;
    if (id === 0x0001) {
      const out = {};
      let q = p;
      out.uncompressedSize = readU64(view, q); q += 8;
      out.compressedSize = readU64(view, q); q += 8;
      out.localOffset = readU64(view, q);
      return out;
    }
    p += size;
  }
  return {};
}
