import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const defaultLibraryRoot = path.join(
  repoRoot,
  'data/fpga-vhdl-building-block-library/FPGA_VHDL_Building_Block_Library_10000_v2_1_pc_fix',
);
const libraryRoot = path.resolve(process.argv[2] || defaultLibraryRoot);
const qualificationDir = path.join(repoRoot, 'data/fpga-vhdl-building-block-library/qualification');
const logDir = path.join(qualificationDir, 'logs');
const manifestPath = path.join(qualificationDir, 'latest.json');
const targetNames = ['static', 'core-regression', 'all-smokes'];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function tailText(value, maxChars = 6000) {
  if (value.length <= maxChars) return value;
  return value.slice(value.length - maxChars);
}

function runCommand(label, command, args, cwd) {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    const logPath = path.join(logDir, `${label}.log`);
    const logStream = fs.createWriteStream(logPath, 'utf8');
    let tail = '';
    const child = spawn(command, args, { cwd, env: process.env });
    const append = (chunk) => {
      const text = chunk.toString();
      tail = tailText(tail + text);
      logStream.write(text);
    };
    child.stdout.on('data', append);
    child.stderr.on('data', append);
    child.on('error', (error) => {
      logStream.write(`\n${error.stack || error.message}\n`);
      logStream.end();
      resolve({
        ok: false,
        exitCode: 127,
        durationMs: Date.now() - startedAt,
        summary: error.message,
        logPath: path.relative(repoRoot, logPath),
        tail: tailText(`${tail}\n${error.message}`),
      });
    });
    child.on('close', (exitCode) => {
      logStream.end();
      resolve({
        ok: exitCode === 0,
        exitCode: exitCode ?? 1,
        durationMs: Date.now() - startedAt,
        summary: exitCode === 0 ? `${label} passed.` : `${label} failed; inspect ${path.relative(repoRoot, logPath)}.`,
        logPath: path.relative(repoRoot, logPath),
        tail,
      });
    });
  });
}

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

async function main() {
  ensureDir(logDir);
  if (!fs.existsSync(path.join(libraryRoot, 'Makefile'))) {
    throw new Error(`VHDL block library Makefile was not found at ${libraryRoot}`);
  }
  const ghdl = await runCommand('ghdl-version', 'ghdl', ['--version'], libraryRoot);
  const results = {};
  for (const target of targetNames) {
    results[target] = await runCommand(target, 'make', [target], libraryRoot);
  }
  const summary = readJson(path.join(libraryRoot, 'reports', 'generation_summary.json'), {});
  const trustedForReuse = targetNames.every((target) => results[target].ok);
  const manifest = {
    libraryVersion: path.basename(libraryRoot),
    libraryRoot: path.relative(repoRoot, libraryRoot),
    ghdlVersion: ghdl.tail.split(/\r?\n/)[0] || 'unknown',
    verifiedAt: new Date().toISOString(),
    blockCount: Number(summary.catalog_blocks || 0),
    testbenchCount: Number(summary.catalog_blocks || 0),
    coreCount: Number(summary.core_files || 0),
    trustedForReuse,
    targets: Object.fromEntries(targetNames.map((target) => [target, {
      ok: results[target].ok,
      exitCode: results[target].exitCode,
      summary: results[target].summary,
      durationMs: results[target].durationMs,
      logPath: results[target].logPath,
      tail: results[target].tail,
    }])),
    warnings: trustedForReuse
      ? []
      : ['Automatic staged reuse remains disabled until static, core-regression, and all-smokes all pass.'],
  };
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${path.relative(repoRoot, manifestPath)}`);
  console.log(`trustedForReuse=${trustedForReuse}`);
  process.exitCode = trustedForReuse ? 0 : 1;
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
