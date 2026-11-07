// 默认语言；额外的 UI 语言文件放入 assets/ssc_bw/lang/ 后会被自动发现。
export const DEFAULT_LOCALES = ["en_us", "zh_cn", "ko_kr"];

// 已知语言代码的显示名和 BCP47；未列出的代码会直接使用 locale 字符串。
export const LANGUAGE_CATALOG = {
  en_us: { id: "en", label: "English", tag: "en" },
  zh_cn: { id: "zh", label: "中文", tag: "zh-CN" },
  ko_kr: { id: "ko", label: "한국어", tag: "ko-KR" },
  es_es: { id: "es", label: "Español", tag: "es-ES" },
  fr_fr: { id: "fr", label: "Français", tag: "fr-FR" },
  pt_br: { id: "pt", label: "Português (Brasil)", tag: "pt-BR" },
  th_th: { id: "th", label: "ไทย", tag: "th-TH" },
  ja_jp: { id: "ja", label: "日本語", tag: "ja-JP" },
  de_de: { id: "de", label: "Deutsch", tag: "de-DE" },
  ru_ru: { id: "ru", label: "Русский", tag: "ru-RU" },
  zh_hk: { id: "zh-hk", label: "繁體中文（香港）", tag: "zh-HK" },
  zh_tw: { id: "zh-tw", label: "繁體中文（臺灣）", tag: "zh-TW" },
  it_it: { id: "it", label: "Italiano", tag: "it-IT" },
  es_mx: { id: "es-mx", label: "Español (México)", tag: "es-MX" },
  fr_ca: { id: "fr-ca", label: "Français (Canada)", tag: "fr-CA" },
  pt_pt: { id: "pt-pt", label: "Português (Portugal)", tag: "pt-PT" },
};
