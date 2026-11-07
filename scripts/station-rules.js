export const STAT_NAMES = {
  hp: "HP",
  attack: "攻击",
  defence: "防御",
  special_attack: "特攻",
  special_defence: "特防",
  speed: "速度",
};

const v = (id, name, speedStat, multStat = null) => ({ id, name, speedStat, multStat });

/**
 * Station capability rules, derived from Cobblemon Farmers 2.5
 * (decompiled StationBaseBlockEntity / GardeningStationBlockEntity)
 * and the pack's KubeJS recipe overrides.
 *
 * roleZh / roleShort 来自 kubejs/assets/cobblemon_farmers/lang/zh_cn.json
 * 的 info.cobblemon_farmers.<station>.type.<type> 条目。
 */
export const STATIONS = [
  {
    id: "craft_station",
    name: { zh_cn: "加工台", en: "Craft Station" },
    mode: "recipe",
    help: "按配方指定的能力值工作。不同属性/配方变体的速度、产量属性不同。",
    types: [
      { id: "fire", name: "火", roleZh: "熔炼与烟熏", variants: [v("smelt", "熔炼与烟熏", "special_attack")] },
      {
        id: "steel",
        name: "钢",
        roleZh: "粉碎粗矿",
        // 本整合包装有 Create，jar 里“粗矿 → 2 锭”的配方被 forge:not create 条件禁用；
        // 实际生效的是 KubeJS 回收机配方：粗矿 → 2 粉碎矿，速度=速度、产量=攻击。
        // 玩家可见名称以 lang 的“粉碎粗矿”为准；“回收”只是实现来源，不作为职能名。
        variants: [v("recycle", "粉碎粗矿", "speed", "attack")],
      },
      { id: "ghost", name: "幽灵", roleZh: "赋能物品", variants: [v("battery", "赋能物品", "hp")] },
      {
        id: "electric",
        name: "电",
        roleZh: "充电",
        variants: [
          v("charge", "电池", "special_attack"),
          v("endless", "无尽电池", "attack"),
        ],
      },
      {
        id: "fighting",
        name: "格斗",
        roleZh: "经营树场",
        variants: [
          v("sapling", "原木", "attack", "special_defence"),
          v("scroll", "熊之挂轴", "attack"),
        ],
      },
      { id: "bug", name: "虫", roleZh: "制作伤药", variants: [v("potion", "制作伤药", "defence")] },
      {
        id: "ice",
        name: "冰",
        roleZh: "水晶培育",
        variants: [
          v("crystal", "水晶机复制", "hp", "special_attack"),
          v("calamity", "冻裂灾祸", "defence"),
        ],
      },
      { id: "poison", name: "毒", roleZh: "腌渍物品", variants: [v("pickle", "腌渍物品", "hp")] },
      { id: "psychic", name: "超能力", roleZh: "制作宝可梦基因", variants: [v("genes", "制作宝可梦基因", "hp")] },
      { id: "fairy", name: "妖精", roleZh: "制作妖精之心", variants: [v("heart", "制作妖精之心", "special_defence")] },
      { id: "rock", name: "岩石", roleZh: "制作空白石板", variants: [v("tablet", "制作空白石板", "speed")] },
    ],
  },
  {
    id: "gardening_station",
    name: { zh_cn: "园艺站", en: "Gardening Station" },
    mode: "action",
    help: "按工作类型执行世界内动作。动作时间 = 基础时间 / 速度倍率。草属性催熟需要 Growth Edition。",
    types: [
      { id: "grass", name: "草", roleZh: "催生作物", baseTime: 24000, variants: [v("grow", "催生作物", "speed")] },
      { id: "water", name: "水", roleZh: "浇灌耕地", baseTime: 600, variants: [v("water", "浇灌耕地", "special_attack")] },
      { id: "normal", name: "一般", roleZh: "照料宝可梦", baseTime: 300, variants: [v("collect", "照料宝可梦", "speed")] },
      { id: "fairy", name: "妖精", roleZh: "修剪宝可梦", baseTime: 800, variants: [v("magic_shear", "修剪宝可梦", "special_attack")] },
      { id: "flying", name: "飞行", roleZh: "收获树果", baseTime: 200, variants: [v("berries", "收获树果", "special_defence")] },
      { id: "dark", name: "恶", roleZh: "驱赶野生宝可梦", baseTime: 20000, variants: [v("exp", "驱赶野生宝可梦", "hp")] },
    ],
  },
  {
    id: "mystery_mine",
    name: { zh_cn: "神秘矿井", en: "Mystery Mine" },
    mode: "recipe",
    help: "消耗浆果，按属性/配方抽取战利品。分数 = 速度倍率 × 期望产量倍率。",
    types: [
      { id: "ground", name: "地面", roleZh: "考古", variants: [v("dig", "考古", "defence")] },
      { id: "rock", name: "岩石", roleZh: "挖矿", variants: [v("mine", "挖矿", "attack", "special_attack")] },
      { id: "ghost", name: "幽灵", roleZh: "召唤怪物掉落物", variants: [v("mob_drops", "召唤怪物掉落物", "special_attack", "special_defence")] },
      { id: "dragon", name: "龙", roleZh: "发掘宝石", variants: [v("gems", "发掘宝石", "speed", "hp")] },
    ],
  },
  {
    id: "crystal_ball",
    name: { zh_cn: "水晶球", en: "Crystal Ball" },
    mode: "buff",
    help: "超能力属性。特攻决定速度，HP 决定范围；为附近工作站提供产量/概率增益。",
    workerType: "psychic",
    speedStat: "special_attack",
    aoeStat: "hp",
    types: [{ id: "psychic", name: "超能力", roleZh: "提升其他工作站的产出", roleShort: "提升产出", variants: [v("divination", "提升其他工作站的产出", "special_attack")] }],
  },
  {
    id: "energy_pylon",
    name: { zh_cn: "能量塔", en: "Energy Pylon" },
    mode: "buff",
    help: "电属性。特攻决定速度，HP 决定范围；为附近工作站提供速度增益。",
    workerType: "electric",
    speedStat: "special_attack",
    aoeStat: "hp",
    types: [{ id: "electric", name: "电", roleZh: "提升其他工作站的速度", roleShort: "提升速度", variants: [v("boost", "提升其他工作站的速度", "special_attack")] }],
  },
];

export const TYPE_NAMES = {
  normal: "一般", fire: "火", water: "水", electric: "电", grass: "草", ice: "冰",
  fighting: "格斗", poison: "毒", ground: "地面", flying: "飞行", psychic: "超能力",
  bug: "虫", rock: "岩石", ghost: "幽灵", dragon: "龙", dark: "恶", steel: "钢", fairy: "妖精",
};

export const TYPE_COLORS = {
  normal: "#A8A77A", fire: "#EE8130", water: "#6390F0", electric: "#F7D02C",
  grass: "#7AC74C", ice: "#96D9D6", fighting: "#C22E28", poison: "#A33EA1",
  ground: "#E2BF65", flying: "#A98FF3", psychic: "#F95587", bug: "#A6B91A",
  rock: "#B6A136", ghost: "#735797", dragon: "#6F35FC", dark: "#705746",
  steel: "#B7B7CE", fairy: "#D685AD",
};
