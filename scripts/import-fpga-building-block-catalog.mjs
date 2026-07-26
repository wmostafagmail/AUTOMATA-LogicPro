#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const [, , zipPathArg, outputPathArg] = process.argv;

if (!zipPathArg) {
  console.error('Usage: node scripts/import-fpga-building-block-catalog.mjs <catalog.zip> [output.json]');
  process.exit(1);
}

const zipPath = path.resolve(zipPathArg);
const outputPath = path.resolve(outputPathArg || 'data/fpga-building-block-catalog/catalog.compact.json');

function readZipFile(entryName) {
  return execFileSync('unzip', ['-p', zipPath, entryName], {
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  });
}

function listZipFiles() {
  return execFileSync('unzip', ['-Z1', zipPath], {
    encoding: 'utf8',
    maxBuffer: 4 * 1024 * 1024,
  }).split(/\r?\n/).filter(Boolean);
}

function stripCell(value) {
  return value
    .trim()
    .replace(/^`|`$/g, '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/\s+/g, ' ');
}

function extractField(section, fieldName) {
  const escaped = fieldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = section.match(new RegExp(`^- \\*\\*${escaped}:\\*\\*\\s*(.+)$`, 'im'));
  return match ? stripCell(match[1]) : '';
}

function extractListField(section, fieldName) {
  const value = extractField(section, fieldName);
  if (!value) return [];
  return value
    .split(',')
    .map((entry) => stripCell(entry.replace(/\([^)]*\)/g, '')))
    .filter(Boolean);
}

function extractTableRows(section, heading) {
  const headingIndex = section.indexOf(`### ${heading}`);
  if (headingIndex < 0) return [];
  const afterHeading = section.slice(headingIndex).split('\n');
  const rows = [];
  let inTable = false;
  for (const line of afterHeading) {
    if (!line.trim().startsWith('|')) {
      if (inTable) break;
      continue;
    }
    inTable = true;
    if (/^\|\s*-+/.test(line) || /Port \/ group|Variable/.test(line)) continue;
    const cells = line
      .split('|')
      .slice(1, -1)
      .map(stripCell);
    if (cells.length >= 3) rows.push(cells);
  }
  return rows;
}

function parseEntry(section) {
  const heading = section.match(/^## BB-(\d{4,5})\s+—\s+`([^`]+)`/m);
  if (!heading) return null;

  const ports = extractTableRows(section, 'Representative interface ports')
    .map(([name, direction, width, purpose]) => ({ name, direction, width, purpose: purpose || '' }));
  const configurables = extractTableRows(section, 'Configurable variables')
    .map(([name, typicalRange, meaning]) => ({ name, typicalRange, meaning: meaning || '' }));

  const category = extractField(section, 'Category');
  const subcategory = extractField(section, 'Subcategory');
  const origin = extractField(section, 'Origin');
  const summary = extractField(section, 'Function');
  const usedFor = extractListField(section, 'Used for');
  const relatedBlocks = extractListField(section, 'Related blocks');
  const implementationNotes = extractField(section, 'Implementation / verification notes');

  const keywordSource = [
    heading[2],
    category,
    subcategory,
    ...usedFor,
    ...ports.map((port) => port.name),
    ...configurables.map((configurable) => configurable.name),
  ].join(' ');
  const keywords = Array.from(new Set(keywordSource
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 3)));

  return {
    id: `BB-${heading[1].padStart(4, '0')}`,
    name: heading[2],
    category,
    subcategory,
    origin,
    summary,
    ports,
    configurables,
    usedFor,
    relatedBlocks,
    implementationNotes,
    keywords,
  };
}

const zipEntries = listZipFiles();
const masterMarkdownName = zipEntries.find((entry) => /^FPGA_Building_Block_Catalog_\d+\.md$/i.test(path.basename(entry)));
if (!masterMarkdownName) {
  console.error('Could not find FPGA_Building_Block_Catalog_<count>.md in archive.');
  process.exit(1);
}
const masterMarkdown = readZipFile(masterMarkdownName);
const validationEntry = zipEntries.find((entry) => path.basename(entry) === 'catalog_validation.json');
const validation = validationEntry ? JSON.parse(readZipFile(validationEntry)) : null;
const entryStarts = [...masterMarkdown.matchAll(/^## BB-\d{4,5}\s+—\s+`[^`]+`/gm)].map((match) => match.index ?? 0);
const entries = entryStarts.map((start, index) => {
  const end = entryStarts[index + 1] ?? masterMarkdown.length;
  return parseEntry(masterMarkdown.slice(start, end));
}).filter(Boolean);
const targetCountFromName = Number((masterMarkdownName.match(/_(\d+)\.md$/) || [])[1] || entries.length);
const categoryCounts = entries.reduce((counts, entry) => {
  counts[entry.category] = (counts[entry.category] || 0) + 1;
  return counts;
}, {});

const catalog = {
  catalogVersion: `${targetCountFromName}-complete`,
  sourceArchive: path.basename(zipPath),
  sourceFiles: zipEntries.filter((entry) => /\.(md|json|zip)$/i.test(entry)),
  targetCount: validation?.target_count || targetCountFromName,
  entryCount: entries.length,
  categoryCounts: validation?.category_counts || categoryCounts,
  entries,
};

const expectedCount = validation?.actual_count || targetCountFromName;
if (entries.length !== expectedCount) {
  console.error(`Expected ${expectedCount} entries but parsed ${entries.length}.`);
  process.exit(1);
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(catalog)}\n`);
console.log(`Imported ${entries.length} FPGA building-block catalog entries into ${outputPath}`);
