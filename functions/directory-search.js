import {
  DIRECTORY_KNOWLEDGE_META,
  DIRECTORY_KNOWLEDGE_RECORDS
} from "./directory-knowledge.generated.js";

const ALLOWED_TYPES = new Set(["website", "wechat", "club"]);
const QUERY_NOISE = [
  "帮我找", "帮忙找", "我想找", "我想问", "请问", "麻烦", "一下", "页面里", "交我导里",
  "怎么联系", "如何联系", "联系方式", "怎么进入", "如何进入", "在哪里", "在哪儿", "哪里",
  "是什么", "是哪个", "有没有", "给我", "告诉我", "可以", "官网", "网站", "网址", "链接",
  "公众号", "微信", "社团", "协会", "群号", "qq群", "qq", "星级", "吗", "呢", "呀", "啊", "的"
];
const FIELD_WEIGHTS = {
  name: 140,
  name_en: 125,
  wechat_name: 115,
  qq_groups: 110,
  url: 90,
  website_url: 90,
  description: 65,
  description_en: 55,
  category: 45,
  category_en: 40
};
const TYPE_SEARCH_ALIASES = {
  website: ["网站", "官网", "website"],
  wechat: ["公众号", "微信", "wechat"],
  club: ["社团", "协会", "club", "clubs"]
};

const SEARCH_DOCUMENTS = DIRECTORY_KNOWLEDGE_RECORDS.map((record, sourceIndex) => ({
  record,
  sourceIndex,
  fields: buildSearchFields(record)
}));

export const DIRECTORY_GREP_TOOL = Object.freeze({
  type: "function",
  function: {
    name: "grep_directory",
    description: "检索交我导页面的统一目录快照。用于查找学校网站、学院、职能部门、常用系统、微信公众号和学生社团的准确名称、网址、用途、星级与联系方式。",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "尽量简短的名称、别名、英文名、网址、公众号、QQ、用途或分类关键词。"
        },
        types: {
          type: "array",
          items: { type: "string", enum: ["website", "wechat", "club"] },
          maxItems: 3,
          description: "可选资源类型过滤：website、wechat、club。"
        },
        limit: {
          type: "integer",
          minimum: 1,
          maximum: 10,
          description: "最多返回多少条，默认 6。"
        }
      },
      required: ["query"],
      additionalProperties: false
    }
  }
});

export function grepDirectoryKnowledge(rawArguments) {
  const argumentsResult = normalizeToolArguments(rawArguments);
  if (argumentsResult.error) return argumentsResult;

  const { query, types, limit } = argumentsResult;
  const queryProfile = buildQueryProfile(query);
  if (!queryProfile.terms.length) {
    return {
      ok: false,
      error: "query_too_vague",
      message: "检索词过于宽泛，请改用资源名称、英文名、用途、公众号或 QQ 等辨识词。"
    };
  }

  const matches = SEARCH_DOCUMENTS
    .filter(({ record }) => (!types.length || types.includes(record.type)) && matchesRequestedClubRating(record, queryProfile.clubRating))
    .map((document) => ({
      document,
      score: scoreDocument(document, queryProfile)
    }))
    .filter((result) => result.score > 0)
    .sort((left, right) =>
      right.score - left.score ||
      getClubWebsitePriority(right.document.record) - getClubWebsitePriority(left.document.record) ||
      left.document.sourceIndex - right.document.sourceIndex
    )
    .slice(0, limit)
    .map(({ document }, index) => ({
      rank: index + 1,
      ...document.record
    }));

  return {
    ok: true,
    source: "jiaowodao_page_directory",
    snapshot: DIRECTORY_KNOWLEDGE_META,
    query,
    types,
    count: matches.length,
    matches
  };
}

function normalizeToolArguments(rawArguments) {
  let value = rawArguments;
  if (typeof rawArguments === "string") {
    try {
      value = JSON.parse(rawArguments);
    } catch {
      return { ok: false, error: "invalid_arguments", message: "工具参数不是合法 JSON。" };
    }
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ok: false, error: "invalid_arguments", message: "工具参数必须是对象。" };
  }

  const query = normalizeDisplayText(value.query).slice(0, 160);
  if (!query) {
    return { ok: false, error: "invalid_query", message: "query 不能为空。" };
  }

  const types = Array.isArray(value.types)
    ? [...new Set(value.types.filter((type) => ALLOWED_TYPES.has(type)))].slice(0, 3)
    : [];
  const parsedLimit = Number.isInteger(value.limit) ? value.limit : 6;

  return {
    query,
    types,
    limit: Math.min(10, Math.max(1, parsedLimit))
  };
}

function buildSearchFields(record) {
  const fields = [];
  for (const [field, weight] of Object.entries(FIELD_WEIGHTS)) {
    const rawValue = record[field];
    const values = Array.isArray(rawValue) ? rawValue : [rawValue];
    for (const value of values) {
      const normalized = normalizeSearchText(value);
      if (normalized) fields.push({ field, weight, normalized });
    }
  }

  for (const value of TYPE_SEARCH_ALIASES[record.type] || []) {
    fields.push({ field: "type", weight: 45, normalized: normalizeSearchText(value) });
  }

  if (record.type === "club") {
    const ratingTerms = record.rating
      ? [`${record.rating}星`, `${toChineseNumber(record.rating)}星`, record.category]
      : ["其他社团", "未评级", "无星级", record.category];
    for (const value of ratingTerms) {
      fields.push({ field: "rating", weight: 50, normalized: normalizeSearchText(value) });
    }
  }

  return fields;
}

function buildQueryProfile(query) {
  const normalizedQuery = normalizeSearchText(query);
  const compactQuery = normalizedQuery.replace(/\s+/g, "");
  const clubRating = getRequestedClubRating(compactQuery);
  const prefersClubWebsites = compactQuery === "社团" ||
    /有哪些|有什么|推荐|好玩|有趣|各类|类型|星级|[三四五345]星|funclubs?|recommend.*clubs?/i.test(compactQuery);
  let cleanedQuery = compactQuery;
  for (const noise of QUERY_NOISE) {
    cleanedQuery = cleanedQuery.replaceAll(normalizeSearchText(noise).replace(/\s+/g, ""), "");
  }

  const rawTerms = normalizedQuery.split(/\s+/).filter(Boolean);
  const terms = [...new Set([
    compactQuery,
    cleanedQuery,
    ...rawTerms,
    ...(prefersClubWebsites && /社团|协会|俱乐部/.test(normalizedQuery) ? ["社团"] : []),
    ...(prefersClubWebsites && /clubs?/i.test(normalizedQuery) ? ["club"] : [])
  ].filter((term) => term.length >= 2 || /^\d+$/.test(term)))];

  return { normalizedQuery, compactQuery, cleanedQuery, terms, prefersClubWebsites, clubRating };
}

function scoreDocument(document, queryProfile) {
  let score = 0;
  let matchedTerms = 0;

  for (const term of queryProfile.terms) {
    let bestTermScore = 0;
    for (const field of document.fields) {
      const compactField = field.normalized.replace(/\s+/g, "");
      let fieldScore = 0;
      if (compactField === term) fieldScore = field.weight;
      else if (compactField.startsWith(term)) fieldScore = Math.round(field.weight * 0.88);
      else if (compactField.includes(term)) fieldScore = Math.round(field.weight * 0.74);
      else if (term.includes(compactField) && compactField.length >= 2) fieldScore = Math.round(field.weight * 0.68);
      else if (
        (field.field === "name" || field.field === "name_en") &&
        /^[\p{Script=Han}]{2,6}$/u.test(term) &&
        isSubsequence(term, compactField)
      ) fieldScore = Math.round(field.weight * 0.4);
      if (fieldScore > bestTermScore) bestTermScore = fieldScore;
    }

    if (bestTermScore > 0) {
      score += bestTermScore;
      matchedTerms += 1;
    }
  }

  if (!matchedTerms) return 0;
  if (matchedTerms === queryProfile.terms.length) score += 25;
  if (document.record.type === "website" && /官网|网站|网址|链接|系统|入口/.test(queryProfile.normalizedQuery)) score += 160;
  if (document.record.type === "wechat" && /微信|公众号/.test(queryProfile.normalizedQuery)) score += 160;
  if (document.record.type === "club" && /社团|协会|学社|剧社|联盟|俱乐部|qq|群|星/.test(queryProfile.normalizedQuery)) score += 160;
  if (document.record.type === "club" && document.record.website_url && queryProfile.prefersClubWebsites) score += 120;
  return score;
}

function normalizeSearchText(value) {
  return normalizeDisplayText(value)
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\p{P}\p{S}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeDisplayText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function toChineseNumber(value) {
  return ({ 3: "三", 4: "四", 5: "五" })[value] || String(value);
}

function isSubsequence(needle, haystack) {
  let needleIndex = 0;
  for (const character of haystack) {
    if (character === needle[needleIndex]) needleIndex += 1;
    if (needleIndex === needle.length) return true;
  }
  return false;
}

function getClubWebsitePriority(record) {
  return record.type === "club" && record.website_url ? 1 : 0;
}

function getRequestedClubRating(query) {
  if (/五星|5星/.test(query)) return 5;
  if (/四星|4星/.test(query)) return 4;
  if (/三星|3星/.test(query)) return 3;
  if (/其他社团|未评级|无星级/.test(query)) return null;
  return undefined;
}

function matchesRequestedClubRating(record, requestedRating) {
  if (requestedRating === undefined) return true;
  return record.type === "club" && record.rating === requestedRating;
}
