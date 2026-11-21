import { createHash, randomUUID } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, realpathSync, statSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const runs = join(root, "docs/testing/runs");
const spec = "docs/testing/regression-smoke.md";
const inputPaths = ["src", "public", "e2e", "scripts", "package.json", "package-lock.json", "*.config.*", "tsconfig.json", "CLAUDE.md", "AGENTS.md", spec];

function git(...args) {
  const result = spawnSync("git", args, { cwd: root, encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr || result.error?.message || "Git inspection failed.");
  return result.stdout.trim();
}

function cases() {
  const rows = [...readFileSync(join(root, spec), "utf8").matchAll(/^\| (D\d{2}) \| ([^|]+) \|/gm)]
    .map(([, id, title]) => ({ id, title: title.trim() }));
  if (!rows.length || new Set(rows.map(row => row.id)).size !== rows.length) throw new Error("Smoke specification needs unique case IDs.");
  return rows;
}

function fingerprint() {
  const files = [...new Set(git("ls-files", "--cached", "--others", "--exclude-standard", "-z", "--", ...inputPaths).split("\0").filter(Boolean))].sort();
  const hash = createHash("sha256");
  for (const file of files) {
    hash.update(file + "\0");
    hash.update(existsSync(join(root, file)) ? readFileSync(join(root, file)) : "<deleted>");
    hash.update("\0");
  }
  return hash.digest("hex");
}

function within(parent, target) {
  const path = relative(parent, target);
  return path !== ".." && !path.startsWith(".." + sep) && !isAbsolute(path);
}

export function validateRun(report, expectedCases, currentFingerprint, directory) {
  if (report.inputFingerprint !== currentFingerprint) throw new Error("App/test inputs changed. Start a fresh smoke run.");
  if (report.preflight?.status !== "passed") throw new Error("Development fixture preflight has not passed.");
  for (const name of ["vitest", "playwright"]) {
    if (report.automated?.[name]?.status !== "passed" || report.automated[name].exitCode !== 0) throw new Error(`${name} has not passed.`);
  }
  const actual = report.desktopCases;
  if (!Array.isArray(actual) || actual.length !== expectedCases.length || new Set(actual.map(row => row.id)).size !== actual.length) throw new Error("Desktop case set is incomplete or duplicated.");
  for (const expected of expectedCases) {
    const row = actual.find(item => item.id === expected.id);
    if (row?.status !== "passed" || !row.observed?.trim() || !Array.isArray(row.evidence) || !row.evidence.length) throw new Error(`${expected.id} needs a passed observation and evidence.`);
    for (const artifact of row.evidence) {
      if (typeof artifact !== "string" || isAbsolute(artifact)) throw new Error(`${expected.id} evidence must be relative to this run.`);
      const target = resolve(directory, artifact);
      if (!within(directory, target) || !existsSync(target) || !statSync(target).isFile() || !within(realpathSync(directory), realpathSync(target))) throw new Error(`${expected.id} evidence is missing or outside this run: ${artifact}`);
    }
  }
}

const cell = value => String(value ?? "").replaceAll("|", "\\|").replaceAll(/\r?\n/g, " ");

function saveReport(directory, report) {
  writeFileSync(join(directory, "results.json"), JSON.stringify(report, null, 2) + "\n");
  const rows = report.desktopCases.map(row => `| ${row.id} | ${cell(row.title)} | ${row.status} | ${cell(row.observed)} | ${(row.evidence ?? []).map(file => `[artifact](<${file}>)`).join(", ")} |`).join("\n");
  writeFileSync(join(directory, "README.md"), `---
type: regression-test-run
date: ${report.startedAt.slice(0, 10)}
status: ${report.status === "passed" ? "complete" : "active"}
tags: [repostudio, regression, smoke-tests]
---

## Run outcome

Overall: **${report.status}**. Automated success alone leaves desktop checks pending.

Specification: [[Projects/RepoStudio/docs/testing/regression-smoke|regression smoke suite]].

- Started (UTC): ${report.startedAt}
- Application base commit: ${report.commit}; branch: ${report.branch}
- Source/test fingerprint: \`${report.inputFingerprint}\`
- Node: ${process.version}; platform: ${process.platform}
- Fixture preflight: ${report.preflight.status}${report.preflight.detail ? " - " + cell(report.preflight.detail) : ""}
- Vitest: ${report.automated.vitest.status}; exit: ${report.automated.vitest.exitCode ?? "not run"}; [log](private/vitest.log)
- Playwright: ${report.automated.playwright.status}; exit: ${report.automated.playwright.exitCode ?? "not run"}; [log](private/playwright.log)
- Validated: ${report.validatedAt ?? "pending"}

## Desktop observations

| ID | Case | Status | Actual result | Evidence |
| --- | --- | --- | --- | --- |
${rows}

## Run notes

${report.notes.map(note => "- " + cell(note)).join("\n") || "Record tool limits, environment, visual review and test-data cleanup in results.json notes."}

Raw logs, screenshots, native traces, browser traces and exports belong in this run's gitignored \`private/\` directory. Record each desktop row in \`results.json\`, then run \`npm run test:smoke:check -- ${relative(root, directory).split(sep).join("/")}\` to validate and refresh this report. Historical passes do not fill pending rows.
`);
}

function runStage(directory, name, args) {
  console.log(`Running ${name}...`);
  const result = spawnSync(process.execPath, args, { cwd: root, encoding: "utf8", env: { ...process.env, CI: "1" }, maxBuffer: 32 * 1024 * 1024 });
  writeFileSync(join(directory, "private", `${name}.log`), (result.stdout ?? "") + (result.stderr ?? "") + (result.error?.message ?? ""));
  const exitCode = result.status ?? 1;
  console.log(`${name}: ${exitCode === 0 ? "passed" : "failed"} (exit ${exitCode})`);
  return { status: exitCode === 0 ? "passed" : "failed", exitCode };
}

async function main() {
  const args = process.argv.slice(2);
  if (args[0] === "--help") {
    console.log("npm run test:smoke\n  Run automated checks and create a fresh report with pending desktop cases.\nnpm run test:smoke:check -- docs/testing/runs/<run-id>\n  Validate current inputs, automation, desktop observations and evidence; seal a passed report.");
    return;
  }
  if (args[0] === "--check") {
    if (args.length !== 2) throw new Error("Supply the run directory to check.");
    const directory = resolve(root, args[1]);
    if (!within(runs, directory) || directory === runs) throw new Error("Choose a report under docs/testing/runs/.");
    const report = JSON.parse(readFileSync(join(directory, "results.json"), "utf8"));
    validateRun(report, cases(), fingerprint(), directory);
    report.status = "passed";
    report.validatedAt = new Date().toISOString();
    saveReport(directory, report);
    console.log(`Smoke suite passed: ${report.desktopCases.length} desktop cases and both automated stages.\n${relative(root, directory)}`);
    return;
  }
  if (args.length) throw new Error("Use --help for supported arguments.");
  const startedAt = new Date().toISOString();
  const startedMs = Date.now();
  const commit = git("rev-parse", "HEAD");
  const inputFingerprint = fingerprint();
  const runId = `${startedAt.replaceAll(/[:.]/g, "-")}-${commit.slice(0, 7)}-${randomUUID().slice(0, 6)}`;
  const directory = join(runs, runId);
  mkdirSync(join(directory, "private"), { recursive: true });
  writeFileSync(join(directory, "private/git-status.txt"), git("status", "--short") + "\n");
  const report = {
    version: 1, startedAt, commit, branch: git("branch", "--show-current"), inputFingerprint,
    status: "pending", preflight: { status: "not_run" },
    automated: { vitest: { status: "not_run" }, playwright: { status: "not_run" } },
    desktopCases: cases().map(row => ({ ...row, status: "not_run", observed: "", evidence: [] })), notes: [],
  };
  saveReport(directory, report);
  console.log(`Smoke run: ${relative(root, directory)}\nChecking http://localhost:3100/dev/carousel-fixtures...`);
  try {
    const response = await fetch("http://localhost:3100/dev/carousel-fixtures", { signal: AbortSignal.timeout(15_000) });
    if (!response.ok || !(await response.text()).includes("Development carousel fixtures")) throw new Error(`Expected the development fixture page; received HTTP ${response.status}.`);
    report.preflight = { status: "passed" };
  } catch (error) {
    report.preflight = { status: "blocked", detail: error.message };
    report.status = "blocked";
    saveReport(directory, report);
    throw new Error(`Start this checkout's development server on port 3100. ${error.message}\nRun report: ${relative(root, directory)}`);
  }
  report.automated.vitest = runStage(directory, "vitest", ["node_modules/vitest/vitest.mjs", "run"]);
  saveReport(directory, report);
  report.automated.playwright = runStage(directory, "playwright", ["node_modules/@playwright/test/cli.js", "test", "--forbid-only", "--fail-on-flaky-tests", "--update-snapshots=none", "--trace=retain-on-failure", "--output", join(directory, "private/playwright")]);
  const artifacts = join(root, "test-results");
  if (existsSync(artifacts)) {
    for (const file of readdirSync(artifacts, { withFileTypes: true })) {
      const source = join(artifacts, file.name);
      if (file.isFile() && !file.name.startsWith(".") && statSync(source).mtimeMs >= startedMs - 1000) {
        mkdirSync(join(directory, "private/exports"), { recursive: true });
        copyFileSync(source, join(directory, "private/exports", file.name));
      }
    }
  }
  const passed = Object.values(report.automated).every(stage => stage.status === "passed");
  report.status = passed ? "awaiting_desktop" : "failed";
  report.automatedFinishedAt = new Date().toISOString();
  if (fingerprint() !== inputFingerprint) {
    report.status = "stale";
    report.notes.push("Source/test inputs changed during automated execution. Start a new run.");
  }
  saveReport(directory, report);
  console.log(`Report: ${relative(root, directory)}/README.md\nFull suite: ${report.status}. Complete desktop cases and run test:smoke:check.`);
  process.exitCode = passed && report.status !== "stale" ? 0 : 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
