#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, "..");
const baseDataPath = path.join(projectRoot, "交我导数据.js");
const clubDataPath = path.join(projectRoot, "交我导社团数据.js");
const outputPath = path.join(projectRoot, "functions", "directory-knowledge.generated.js");
const checkOnly = process.argv.includes("--check");

const pageWindow = {};
const sandbox = vm.createContext({ window: pageWindow });

for (const sourcePath of [baseDataPath, clubDataPath]) {
  vm.runInContext(fs.readFileSync(sourcePath, "utf8"), sandbox, {
    filename: path.basename(sourcePath),
    timeout: 1000
  });
}

const baseItems = requireArray(pageWindow.JIAOWODAO_DATA, "window.JIAOWODAO_DATA");
const clubItems = requireArray(pageWindow.JIAOWODAO_CLUB_DATA, "window.JIAOWODAO_CLUB_DATA");
const baseMeta = requireObject(pageWindow.JIAOWODAO_META, "window.JIAOWODAO_META");
const clubMeta = requireObject(pageWindow.JIAOWODAO_CLUB_META, "window.JIAOWODAO_CLUB_META");

if (clubMeta.count !== clubItems.length) {
  throw new Error(`社团元数据 count=${clubMeta.count}，实际为 ${clubItems.length}`);
}

const records = [
  ...baseItems.map((item, index) => compileBaseItem(item, index)),
  ...clubItems.map((item, index) => compileClubItem(item, index))
];

assertUnique(records, (record) => record.id, "目录 id");
assertUnique(records, (record) => `${record.type}\u0000${record.name}`, "同类型资源名称");

const counts = records.reduce((result, record) => {
  result[record.type] = (result[record.type] || 0) + 1;
  return result;
}, {});

const meta = {
  generatedFrom: [path.basename(baseDataPath), path.basename(clubDataPath)],
  sourceUpdatedAt: cleanText(baseMeta.updatedAt),
  clubRatingUpdatedAt: cleanText(clubMeta.ratingUpdatedAt),
  clubContactUpdatedAt: cleanText(clubMeta.contactUpdatedAt),
  count: records.length,
  counts
};

const output = renderModule(meta, records);

if (checkOnly) {
  if (!fs.existsSync(outputPath) || fs.readFileSync(outputPath, "utf8") !== output) {
    console.error("目录知识文件已过期，请运行：node scripts/compile-directory-knowledge.mjs");
    process.exitCode = 1;
  } else {
    console.log(`目录知识文件为最新版本：${records.length} 条`);
  }
} else {
  fs.writeFileSync(outputPath, output);
  console.log(`已生成 ${path.relative(projectRoot, outputPath)}：${records.length} 条`);
}

function compileBaseItem(item, index) {
  requireObject(item, `基础资源第 ${index + 1} 条`);
  const type = item.type === "website" || item.type === "wechat" ? item.type : "";
  if (!type) throw new Error(`基础资源第 ${index + 1} 条 type 非法`);

  const record = {
    id: `${type}-${String(index + 1).padStart(3, "0")}`,
    type,
    name: requireText(item.name, `基础资源第 ${index + 1} 条 name`),
    name_en: requireText(item.name_en, `基础资源第 ${index + 1} 条 name_en`),
    category: requireText(item.cat, `基础资源第 ${index + 1} 条 cat`),
    category_en: requireText(item.cat_en, `基础资源第 ${index + 1} 条 cat_en`)
  };

  addOptionalText(record, "description", item.desc);
  addOptionalText(record, "description_en", item.desc_en);

  if (type === "website") {
    record.url = requireHttpUrl(item.url, `基础资源第 ${index + 1} 条 url`);
  }

  return record;
}

function compileClubItem(item, index) {
  requireObject(item, `社团第 ${index + 1} 条`);
  if (item.type !== "club") throw new Error(`社团第 ${index + 1} 条 type 非法`);

  const record = {
    id: `club-${String(index + 1).padStart(3, "0")}`,
    type: "club",
    name: requireText(item.name, `社团第 ${index + 1} 条 name`),
    name_en: requireText(item.name_en, `社团第 ${index + 1} 条 name_en`),
    category: requireText(item.cat, `社团第 ${index + 1} 条 cat`),
    category_en: requireText(item.cat_en, `社团第 ${index + 1} 条 cat_en`),
    rating: item.rating === 5 || item.rating === 4 || item.rating === 3 ? item.rating : null
  };

  const websiteUrl = cleanText(item.websiteUrl);
  if (websiteUrl) record.website_url = requireHttpUrl(websiteUrl, `社团第 ${index + 1} 条 websiteUrl`);

  addOptionalText(record, "wechat_name", item.wechatName);

  if (Array.isArray(item.qqGroups) && item.qqGroups.length) {
    const qqGroups = [...new Set(item.qqGroups.map((group) => cleanText(group)))];
    if (qqGroups.some((group) => !/^\d{5,12}$/.test(group))) {
      throw new Error(`社团第 ${index + 1} 条 QQ 群号格式非法`);
    }
    record.qq_groups = qqGroups;
  }

  return record;
}

function renderModule(meta, records) {
  const recordLines = records.map((record) => `  ${JSON.stringify(record)}`).join(",\n");
  return `// 此文件由 scripts/compile-directory-knowledge.mjs 生成，请勿手工修改。\n` +
    `// 每一行都是可独立检索并直接交给 LLM 的页面目录事实。\n\n` +
    `export const DIRECTORY_KNOWLEDGE_META = Object.freeze(${JSON.stringify(meta, null, 2)});\n\n` +
    `export const DIRECTORY_KNOWLEDGE_RECORDS = Object.freeze([\n${recordLines}\n]);\n`;
}

function requireArray(value, label) {
  if (!Array.isArray(value)) throw new Error(`${label} 必须是数组`);
  return value;
}

function requireObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} 必须是对象`);
  }
  return value;
}

function requireText(value, label) {
  const text = cleanText(value);
  if (!text) throw new Error(`${label} 不能为空`);
  return text;
}

function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function addOptionalText(record, key, value) {
  const text = cleanText(value);
  if (text) record[key] = text;
}

function requireHttpUrl(value, label) {
  const text = requireText(value, label);
  let parsed;
  try {
    parsed = new URL(text);
  } catch {
    throw new Error(`${label} 不是合法 URL：${text}`);
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`${label} 只允许 HTTP(S)：${text}`);
  }
  return text;
}

function assertUnique(items, getKey, label) {
  const seen = new Set();
  for (const item of items) {
    const key = getKey(item);
    if (seen.has(key)) throw new Error(`${label} 重复：${key.replace("\u0000", " / ")}`);
    seen.add(key);
  }
}
