// Browser-side equivalent of the relevant parts of scripts/sync-data.mjs and
// scripts/build-lang.mjs. It reads a downloaded CurseForge modpack archive and
// the two required mod jars, then builds the same data shape the page uses.

import { STATIONS, TYPE_NAMES, TYPE_COLORS } from "../scripts/station-rules.js";

export const MODPACK_SLUG = "society-sunlit-cobblemon";
export const REQUIRED_MODS = [
  {
    projectID: 1655778,
    slug: "sunlit-cobblebackported",
    label: "Sunlit Cobblebackported",
    hint: "提供宝可梦物种、形态、种族值和语言文件",
  },
  {
    projectID: 1375081,
    slug: "cobblemon-farmers",
    label: "Cobblemon Farmers",
    hint: "提供工作站职能、描述和韩语文本",
  },
];

const CFWIDGET = "https://api.cfwidget.com";
const FORM_LABEL_FALLBACKS = {
  zh_cn: { totem: "霸主", bustedtotem: "霸主·现形" },
  en_us: { totem: "Totem", bustedtotem: "Busted Totem" },
  ko_kr: { totem: "토템", bustedtotem: "토템·들킨 모습" },
};

export function cdnUrl(fileId, fileName) {
  const id = String(fileId);
  const dir = id.length > 3 ? id.slice(0, -3) : "0";
  const sub = id.slice(-3).padStart(3, "0");
  return `https://mediafilez.forgecdn.net/files/${dir}/${sub}/${encodeURIComponent(fileName)}`;
}

export async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
  return response.json();
}

export async function getProjectFile(projectSlug, fileId) {
  const data = await fetchJson(`${CFWIDGET}/minecraft/mc-mods/${projectSlug}`);
  const file = (data.files || []).find((item) => Number(item.id) === Number(fileId));
  if (!file) return null;
  return {
    id: file.id,
    name: file.name,
    display: file.display,
    filesize: file.filesize,
    downloadUrl: cdnUrl(file.id, file.name),
    pageUrl: `https://www.curseforge.com/minecraft/mc-mods/${projectSlug}/files/${file.id}`,
  };
}

export async function parseManifest(zip) {
  const manifest = await zip.getJson("manifest.json");
  if (!manifest || !Array.isArray(manifest.files)) {
    throw new Error("整合包根目录没有有效的 manifest.json");
  }
  const projectFiles = new Map(manifest.files.map((item) => [Number(item.projectID), item]));
  const mods = REQUIRED_MODS.map((mod) => {
    const item = projectFiles.get(mod.projectID);
    return { ...mod, fileID: item ? item.fileID : null };
  });
  const missing = mods.filter((mod) => !mod.fileID);
  if (missing.length) {
    const error = new Error("Required mods were not found in manifest.json");
    error.code = "missingMods";
    error.mods = missing.map((mod) => mod.label);
    throw error;
  }
  return { manifest, mods };
}

export function detectJarKind(zip) {
  if (zip.names().some((name) => /^data\/cobblemon\/species\//.test(name))) return "sunlit";
  if (zip.names().some((name) => /^assets\/cobblemon_farmers\/lang\//.test(name))) return "farmers";
  return "unknown";
}

export async function buildFromArchives({ modpackZip, sunlitZip, farmersZip, modpackFile, sunlitFile, farmersFile }) {
  const { manifest, mods } = await parseManifest(modpackZip);
  const farmersLang =
    (await modpackZip.getJson("overrides/kubejs/assets/cobblemon_farmers/lang/zh_cn.json")) ||
    (await farmersZip.getJson("assets/cobblemon_farmers/lang/zh_cn.json")) ||
    {};

  const langTables = {};
  for (const locale of ["en_us", "zh_cn", "ko_kr"]) {
    langTables[locale] = (await sunlitZip.getJson(`assets/cobblemon/lang/${locale}.json`)) || {};
  }

  const langZh = langTables.zh_cn;
  const langEn = langTables.en_us;
  const missingZh = [];
  const pokemon = [];

  const speciesEntries = sunlitZip
    .names()
    .map((name) => ({ name, match: /^data\/cobblemon\/species\/generation\d+\/([^/]+)\.json$/.exec(name) }))
    .filter((item) => item.match);

  for (let offset = 0; offset < speciesEntries.length; offset += 8) {
    const batch = speciesEntries.slice(offset, offset + 8);
    const parsed = await Promise.all(
      batch.map(async ({ name, match }) => {
        try {
          return { name, id: match[1], species: await sunlitZip.getJson(name) };
        } catch (_) {
          return null;
        }
      })
    );
    for (const item of parsed) {
      if (!item || !item.species || item.species.implemented === false) continue;
      const species = item.species;
      const id = item.id;
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

      pokemon.push({
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
      });

      if (!Array.isArray(species.forms)) continue;
      for (const form of species.forms) {
        if (!form || form.implemented === false || !form.name) continue;
        const formStats = statsOf(form, baseStats);
        const formTypes = typesOf(form, baseTypes);
        const formLabels = [...new Set([...baseLabels, ...labelsOf(form.labels)])];
        const suffix = normalizeSuffix(form.name);
        const formZh =
          langZh[`cobblemon.ui.pokedex.info.form.${id}-${suffix}`] ||
          langZh[`cobblemon.ui.pokedex.info.form.${suffix}`];
        const formEn =
          langEn[`cobblemon.ui.pokedex.info.form.${id}-${suffix}`] ||
          langEn[`cobblemon.ui.pokedex.info.form.${suffix}`] ||
          form.name;
        pokemon.push({
          id: `${id}_${normalizeFormId(form.name)}`,
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
  }

  pokemon.sort((a, b) => {
    const da = a.dex ?? 99999;
    const db = b.dex ?? 99999;
    if (da !== db) return da - db;
    if (a.isForm !== b.isForm) return a.isForm ? 1 : -1;
    return a.name.en.localeCompare(b.name.en);
  });

  const stations = JSON.parse(JSON.stringify(STATIONS)).map((station) => ({
    ...station,
    types: station.types.map((type) => ({
      ...type,
      roleDesc: roleDescription(station.id, type.id, farmersLang),
    })),
  }));

  const meta = {
    schemaVersion: 1,
    pack: manifest.name || "Society Sunlit Cobblemon",
    packVersion: manifest.version || "unknown",
    cobblemonVersion: sunlitFile.name,
    farmersVersion: farmersFile.name,
    generatedAt: new Date().toISOString(),
    sourceJar: sunlitFile.name,
    sourceModpack: modpackFile.name,
    counts: {
      pokemon: pokemon.length,
      base: pokemon.filter((p) => !p.isForm).length,
      forms: pokemon.filter((p) => p.isForm).length,
    },
    notes: [
      "数据由浏览器从玩家本地下载的 CurseForge 整合包和模组文件中解析。",
      "默认展示理论潜力（Lv.100 / 0 IV / 0 EV / 中性性格），不是玩家当前宝可梦的实时数据。",
      "加工台/神秘矿井按配方变体计算；园艺站/水晶球/能量塔的映射来自工作站规则。",
    ],
  };

  const data = {
    meta,
    stations,
    pokemon,
    warnings: { missingZh, missingZhCount: missingZh.length },
    typeNames: TYPE_NAMES,
    typeColors: TYPE_COLORS,
  };

  const pokemonNames = buildPokemonNames(pokemon, langTables);
  return {
    data,
    pokemonNames,
    manifest,
    mods,
    summary: {
      pack: meta.pack,
      version: meta.packVersion,
      base: meta.counts.base,
      forms: meta.counts.forms,
    },
  };
}

function roleDescription(stationId, typeId, farmersLang) {
  const keys = {
    gardening_station: `jei.cobblemon_farmers.gardening_station.type.${typeId}`,
    craft_station: "tooltip.always.cobblemon_farmers.craft_station.0",
    mystery_mine: "tooltip.always.cobblemon_farmers.mystery_mine.0",
    crystal_ball: "tooltip.always.cobblemon_farmers.crystal_ball.0",
    energy_pylon: "tooltip.always.cobblemon_farmers.energy_pylon.0",
  };
  return cleanLang(farmersLang[keys[stationId]] || "");
}

function cleanLang(text) {
  return String(text || "")
    .replace(/<[^>]+>/g, "")
    .replace(/(?:c|w|p)=[^;]+;/g, "")
    .replace(/%%/g, "%")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeSuffix(text) {
  const raw = String(text || "").toLowerCase().trim();
  const aliases = {
    "mega-x": "megax",
    "mega y": "megay",
    "mega-y": "megay",
    "mega x": "megax",
    "g-max": "gmax",
    gmax: "gmax",
    alolan: "alola",
    galarian: "galar",
    hisuian: "hisui",
    paldean: "paldea",
    alola: "alola",
    galar: "galar",
    hisui: "hisui",
    paldea: "paldea",
  };
  return aliases[raw] || raw.replace(/[^a-z0-9]+/g, "");
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
    const match = /^gen(\d+)$/.exec(label);
    if (match) return Number(match[1]);
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

function buildPokemonNames(pokemon, langTables) {
  const names = {};
  for (const locale of Object.keys(langTables)) {
    const cobblemon = langTables[locale] || {};
    const table = {};
    const isChinese = ["zh_cn", "zh_hk", "zh_tw"].includes(locale);
    for (const p of pokemon) {
      if (!p.isForm) {
        table[p.id] =
          cobblemon[`cobblemon.species.${p.id}.name`] || p.name.en || p.id;
        continue;
      }
      const baseName =
        table[p.baseId] ||
        cobblemon[`cobblemon.species.${p.baseId}.name`] ||
        p.name.en ||
        p.id;
      const suffix = normalizeSuffix(p.formName);
      const region = /^(alola|galar|hisui|paldea)/i.exec(p.formName || "");
      const fallback = FORM_LABEL_FALLBACKS[locale] || FORM_LABEL_FALLBACKS.en_us;
      const formLabel =
        cobblemon[`cobblemon.ui.pokedex.info.form.${p.baseId}-${suffix}`] ||
        cobblemon[`cobblemon.ui.pokedex.info.form.${suffix}`] ||
        (region ? cobblemon[`cobblemon.ui.pokedex.info.form.${region[1].toLowerCase()}`] : "") ||
        fallback[suffix] ||
        "";
      const lowerBase = baseName.toLowerCase();
      const lowerLabel = formLabel.toLowerCase();
      if (formLabel && lowerBase && lowerLabel.includes(lowerBase)) {
        table[p.id] = formLabel;
      } else if (formLabel) {
        table[p.id] = isChinese ? `${baseName}（${formLabel}）` : `${baseName} (${formLabel})`;
      } else {
        table[p.id] = p.name[locale] || p.name.en || p.id;
      }
    }
    names[locale] = table;
  }
  return names;
}
