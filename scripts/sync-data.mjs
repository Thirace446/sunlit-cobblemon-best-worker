import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { readZip, readJson } from "./zip-reader.mjs";
import { STATIONS, TYPE_NAMES, TYPE_COLORS } from "./station-rules.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(__dirname, "..");

const { values: args } = parseArgs({
  options: {
    modpack: { type: "string" },
    jar: { type: "string" },
    out: { type: "string" },
    "base-only": { type: "boolean", default: false },
    download: { type: "boolean", default: false },
  },
});

const modpack = path.resolve(
  args.modpack || path.join(siteRoot, "..", "society-sunlit-valley-zhcn")
);
const outDir = path.resolve(args.out || path.join(siteRoot, "data"));
const includeForms = !args["base-only"];

function fail(message) {
  console.error(`\n[ERROR] ${message}\n`);
  process.exit(1);
}

function readJsonFile(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function normalizeSuffix(text) {
  const raw = String(text || "").toLowerCase().trim();
  const aliases = {
    "mega-x": "megax",
    "mega y": "megay",
    "mega-y": "megay",
    "mega x": "megax",
    "g-max": "gmax",
    "gmax": "gmax",
    "alolan": "alola",
    "galarian": "galar",
    "hisuian": "hisui",
    "paldean": "paldea",
    "alola": "alola",
    "galar": "galar",
    "hisui": "hisui",
    "paldea": "paldea",
  };
  if (aliases[raw]) return aliases[raw];
  return raw.replace(/[^a-z0-9]+/g, "");
}

function normalizeFormId(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function labelsOf(value) {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string" && value.trim()) return value.split(",").map((x) => x.trim());
  return [];
}

function makeFlags(labels) {
  const set = new Set(labels);
  return {
    isLegendary: set.has("legendary"),
    isMythical: set.has("mythical"),
    isUltraBeast: set.has("ultra_beast"),
    isParadox: set.has("paradox"),
    isBaby: set.has("baby"),
  };
}

function getGen(labels) {
  for (const label of labels) {
    const m = /^gen(\d+)$/.exec(label);
    if (m) return Number(m[1]);
  }
  return null;
}

function typesOf(obj, fallback = []) {
  const types = [];
  if (obj?.primaryType) types.push(String(obj.primaryType).toLowerCase());
  if (obj?.secondaryType) types.push(String(obj.secondaryType).toLowerCase());
  return types.length ? types : fallback;
}

function statsOf(obj, fallback = null) {
  if (!obj?.baseStats) return fallback;
  const s = obj.baseStats;
  return {
    hp: s.hp,
    attack: s.attack,
    defence: s.defence,
    special_attack: s.special_attack,
    special_defence: s.special_defence,
    speed: s.speed,
  };
}

if (!fs.existsSync(path.join(modpack, "pakku-lock.json"))) {
  fail(`找不到整合包目录：${modpack}\n请用 --modpack 指定包含 pakku-lock.json 的整合包目录。`);
}

const lock = readJsonFile(path.join(modpack, "pakku-lock.json"));
const pakku = fs.existsSync(path.join(modpack, "pakku.json"))
  ? readJsonFile(path.join(modpack, "pakku.json"))
  : null;

const farmersLangPath = path.join(modpack, "kubejs/assets/cobblemon_farmers/lang/zh_cn.json");
const farmersLang = fs.existsSync(farmersLangPath) ? readJsonFile(farmersLangPath) : {};

function cleanLang(text) {
  return String(text || "")
    .replace(/<[^>]+>/g, "")
    .replace(/(?:c|w|p)=[^;]+;/g, "")
    .replace(/%%/g, "%")
    .replace(/\s+/g, " ")
    .trim();
}

function roleDescription(stationId, typeId) {
  const keys = {
    gardening_station: `jei.cobblemon_farmers.gardening_station.type.${typeId}`,
    craft_station: "tooltip.always.cobblemon_farmers.craft_station.0",
    mystery_mine: "tooltip.always.cobblemon_farmers.mystery_mine.0",
    crystal_ball: "tooltip.always.cobblemon_farmers.crystal_ball.0",
    energy_pylon: "tooltip.always.cobblemon_farmers.energy_pylon.0",
  };
  return cleanLang(farmersLang[keys[stationId]] || "");
}

const projects = lock.projects || [];
const cobbleProject = projects.find((p) => p?.slug?.curseforge === "sunlit-cobblebackported");
const farmersProject = projects.find((p) => p?.slug?.curseforge === "cobblemon-farmers");
const cobbleFile = cobbleProject?.files?.[0];
if (!cobbleFile?.url) fail("pakku-lock.json 中找不到 Sunlit Cobblebackported 的下载信息。");

let jarPath;
if (args.jar) {
  jarPath = path.resolve(args.jar);
} else {
  jarPath = path.join(modpack, "mods", cobbleFile.file_name);
}

if (!fs.existsSync(jarPath)) {
  if (!args.download) {
    fail(
      `找不到模组 jar：${jarPath}\n` +
        `把 jar 放到整合包的 mods/ 目录，或者用 --jar 指定路径；\n` +
        `也可以加 --download，让脚本从 pakku-lock.json 记录的地址下载到 .cache/。`
    );
  }
  const cacheDir = path.join(siteRoot, ".cache");
  fs.mkdirSync(cacheDir, { recursive: true });
  const downloadPath = path.join(cacheDir, cobbleFile.file_name);
  if (!fs.existsSync(downloadPath)) {
    console.log(`[download] ${cobbleFile.url}`);
    const response = await fetch(cobbleFile.url);
    if (!response.ok) fail(`下载失败：HTTP ${response.status}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(downloadPath, buffer);
  }
  jarPath = downloadPath;
}

console.log(`[jar] ${jarPath}`);
const jarBuffer = fs.readFileSync(jarPath);
const zip = readZip(jarBuffer);
console.log(`[zip] ${zip.size} entries`);

// 站点自带的外部语言文件优先；缺失时回退到 jar 内的 lang。
const siteLangDir = path.join(siteRoot, "assets", "cobblemon", "lang");
function readSiteLang(name) {
  const file = path.join(siteLangDir, name);
  if (!fs.existsSync(file)) return null;
  return readJsonFile(file);
}
const langZh = readSiteLang("zh_cn.json") || readJson(zip, "assets/cobblemon/lang/zh_cn.json") || {};
const langEn = readSiteLang("en_us.json") || readJson(zip, "assets/cobblemon/lang/en_us.json") || {};

const missingZh = [];
const pokemon = [];

for (const [entryName, data] of zip.entries()) {
  const m = /^data\/cobblemon\/species\/generation\d+\/([^/]+)\.json$/.exec(entryName);
  if (!m) continue;

  let species;
  try {
    species = JSON.parse(data.toString("utf8").replace(/^\uFEFF/, ""));
  } catch {
    continue;
  }
  if (species.implemented === false) continue;

  const id = m[1];
  const baseStats = statsOf(species);
  if (!baseStats) continue;

  const baseTypes = typesOf(species);
  const baseLabels = labelsOf(species.labels);
  const baseZh =
    langZh[`cobblemon.species.${id}.name`] ||
    langZh[`cobblemon.species.${id.replace(/_/g, "-")}.name`] ||
    species.name;
  const baseEn =
    langEn[`cobblemon.species.${id}.name`] ||
    langEn[`cobblemon.species.${id.replace(/_/g, "-")}.name`] ||
    species.name;
  if (!langZh[`cobblemon.species.${id}.name`]) missingZh.push(id);

  const base = {
    id,
    baseId: id,
    isForm: false,
    formName: null,
    dex: species.nationalPokedexNumber ?? null,
    name: { en: baseEn, zh_cn: baseZh },
    types: baseTypes,
    baseStats,
    labels: baseLabels,
    gen: getGen(baseLabels),
    ...makeFlags(baseLabels),
  };
  pokemon.push(base);

  if (!includeForms || !Array.isArray(species.forms)) continue;

  for (const form of species.forms) {
    if (!form || form.implemented === false) continue;
    if (!form.name) continue;
    const formStats = statsOf(form, baseStats);
    const formTypes = typesOf(form, baseTypes);
    const formLabels = [...new Set([...baseLabels, ...labelsOf(form.labels)])];
    const suffix = normalizeSuffix(form.name);
    const formZhKey = `cobblemon.ui.pokedex.info.form.${id}-${suffix}`;
    const formZh =
      langZh[formZhKey] ||
      langZh[`cobblemon.ui.pokedex.info.form.${suffix}`];
    const formEn =
      langEn[`cobblemon.ui.pokedex.info.form.${id}-${suffix}`] ||
      langEn[`cobblemon.ui.pokedex.info.form.${suffix}`] ||
      form.name;
    const formId = `${id}_${normalizeFormId(form.name)}`;

    pokemon.push({
      id: formId,
      baseId: id,
      isForm: true,
      formName: form.name,
      dex: species.nationalPokedexNumber ?? null,
      name: {
        en: `${baseEn} (${formEn})`,
        zh_cn: formZh ? `${baseZh}（${formZh}）` : `${baseZh}（${form.name}）`,
      },
      types: formTypes,
      baseStats: formStats,
      labels: formLabels,
      gen: getGen(formLabels) ?? getGen(baseLabels),
      ...makeFlags(formLabels),
    });
  }
}

pokemon.sort((a, b) => {
  const da = a.dex ?? 99999;
  const db = b.dex ?? 99999;
  if (da !== db) return da - db;
  if (a.isForm !== b.isForm) return a.isForm ? 1 : -1;
  return a.name.en.localeCompare(b.name.en);
});

const meta = {
  schemaVersion: 1,
  pack: pakku?.name || "Sunlit Cobblemon",
  packVersion: pakku?.version || "unknown",
  cobblemonVersion: cobbleFile.file_name,
  farmersVersion: farmersProject?.files?.[0]?.file_name || "unknown",
  generatedAt: new Date().toISOString(),
  sourceJar: path.basename(jarPath),
  sourceModpack: path.basename(modpack),
  counts: {
    pokemon: pokemon.length,
    base: pokemon.filter((p) => !p.isForm).length,
    forms: pokemon.filter((p) => p.isForm).length,
  },
  notes: [
    "排序使用 Cobblemon Farmers 2.5 的实际公式：speed = floor(stat / 127.5 * 100) / 100，mult = floor(stat / 127.5 * 100)，闪光翻倍。",
    "默认展示理论潜力（Lv.100 / 31 IV / 0 EV / 中性性格），不是玩家当前宝可梦的实时数据。",
    "加工台/神秘矿井按配方变体计算；园艺站/水晶球/能量塔的映射来自反编译代码。",
  ],
};

const warnings = {
  missingZh,
  missingZhCount: missingZh.length,
};

const stations = STATIONS.map((station) => ({
  ...station,
  types: station.types.map((type) => ({
    ...type,
    roleDesc: roleDescription(station.id, type.id),
  })),
}));

const payload = {
  meta,
  stations,
  pokemon,
  warnings,
  typeNames: TYPE_NAMES,
  typeColors: TYPE_COLORS,
};

fs.mkdirSync(outDir, { recursive: true });
const files = {
  "meta.json": meta,
  "pokemon.json": pokemon,
  "stations.json": STATIONS,
  "warnings.json": warnings,
  "all-data.json": payload,
};
for (const [name, value] of Object.entries(files)) {
  fs.writeFileSync(path.join(outDir, name), JSON.stringify(value, null, 2), "utf8");
}

const js = `/* Generated by scripts/sync-data.mjs. Do not edit by hand. */\nwindow.SUNLIT_DATA = ${JSON.stringify(
  payload
)};\n`;
fs.writeFileSync(path.join(outDir, "all-data.js"), js, "utf8");

console.log(`[out] ${outDir}`);
console.log(`[pokemon] ${meta.counts.base} base + ${meta.counts.forms} forms = ${meta.counts.pokemon}`);
console.log(`[missing zh] ${warnings.missingZhCount}`);
console.log("[done]");
