import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { validateRun } from "./run-regression-smoke.mjs";

const temporaryDirectories: string[] = [];
const expected = [{ id: "D01", title: "Open editor" }];

function fixture() {
  const directory = mkdtempSync(join(tmpdir(), "repostudio-smoke-"));
  temporaryDirectories.push(directory);
  writeFileSync(join(directory, "snapshot.json"), '{"observed":"five slides"}');
  return {
    directory,
    report: {
      inputFingerprint: "current-inputs",
      preflight: { status: "passed" },
      automated: {
        vitest: { status: "passed", exitCode: 0 },
        playwright: { status: "passed", exitCode: 0 },
      },
      desktopCases: [{ id: "D01", status: "passed", observed: "Five slides visible.", evidence: ["snapshot.json"] }],
    },
  };
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    if (dirname(directory) !== resolve(tmpdir()) || !directory.startsWith(join(resolve(tmpdir()), "repostudio-smoke-"))) throw new Error("Unexpected temporary cleanup path.");
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("regression smoke completion gate", () => {
  it("accepts current automation and a completed desktop observation with real evidence", () => {
    const { report, directory } = fixture();
    expect(() => validateRun(report, expected, "current-inputs", directory)).not.toThrow();
  });

  it("keeps automated success from certifying an unrun desktop case", () => {
    const { report, directory } = fixture();
    report.desktopCases[0].status = "not_run";
    expect(() => validateRun(report, expected, "current-inputs", directory)).toThrow("D01 needs a passed observation");
  });

  it("rejects evidence collected before an app or test input changed", () => {
    const { report, directory } = fixture();
    expect(() => validateRun(report, expected, "changed-inputs", directory)).toThrow("inputs changed");
  });

  it("rejects missing evidence and evidence outside the current run", () => {
    const { report, directory } = fixture();
    report.desktopCases[0].evidence = ["missing.png"];
    expect(() => validateRun(report, expected, "current-inputs", directory)).toThrow("evidence is missing");
    report.desktopCases[0].evidence = ["../snapshot.json"];
    expect(() => validateRun(report, expected, "current-inputs", directory)).toThrow("outside this run");
  });

  it("rejects a failed automated stage and duplicated desktop IDs", () => {
    const { report, directory } = fixture();
    report.automated.playwright.exitCode = 1;
    expect(() => validateRun(report, expected, "current-inputs", directory)).toThrow("playwright has not passed");
    report.automated.playwright.exitCode = 0;
    report.desktopCases.push({ ...report.desktopCases[0] });
    expect(() => validateRun(report, expected, "current-inputs", directory)).toThrow("incomplete or duplicated");
  });
});
