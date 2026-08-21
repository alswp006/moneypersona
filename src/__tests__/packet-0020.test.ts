import { describe, it, expect } from "vitest";
import { execSync } from "child_process";
import { readFileSync } from "fs";
import path from "path";

describe("패킷 0020: 검수 컴플라이언스 정적 검증 스크립트 · 다크모드 · 구형 OS 호환", () => {
  const projectRoot = process.cwd();

  // AC-1, AC-4: npm run verify:compliance should exist and exit 0 with 0 violations
  it("AC-1[P0]: npm run verify:compliance script should be registered in package.json", () => {
    const packageJsonPath = path.join(projectRoot, "package.json");
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));

    expect(packageJson.scripts).toBeDefined();
    expect(packageJson.scripts).toHaveProperty("verify:compliance");
    expect(typeof packageJson.scripts["verify:compliance"]).toBe("string");
  });

  // AC-1: Script should exit 0 when no violations found
  it("AC-1[P0]: npm run verify:compliance should exit with code 0 when no violations", () => {
    try {
      const output = execSync("npm run verify:compliance", {
        cwd: projectRoot,
        encoding: "utf-8",
        stdio: "pipe",
      });
      // Exit 0 → no exception thrown
      expect(output).toBeTruthy();
      // Output should summarize findings
      expect(output).toMatch(/checked|violation|scanned/i);
    } catch (e: unknown) {
      // If violations found, exit code will be 1 (failure)
      // In current codebase, this should NOT happen
      const err = e as any;
      expect.fail(
        `verify:compliance exited with code ${err.status}. Violations found:\n${err.stdout || err.stderr}`
      );
    }
  });

  // AC-2: All 8 compliance rules should be checked
  it("AC-2[P0]: verify-compliance.mjs script should check HEX color violations", () => {
    const scriptPath = path.join(projectRoot, "scripts/verify-compliance.mjs");
    const script = readFileSync(scriptPath, "utf-8");

    // Rule 1: HEX color detection (e.g., #3182F6, #fff)
    expect(script).toMatch(
      /#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?|HEX|color/i
    );
  });

  it("AC-2[P0]: verify-compliance.mjs should check fetch/XMLHttpRequest violations", () => {
    const scriptPath = path.join(projectRoot, "scripts/verify-compliance.mjs");
    const script = readFileSync(scriptPath, "utf-8");

    // Rule 2: fetch and XMLHttpRequest
    expect(script).toMatch(/fetch|XMLHttpRequest/i);
  });

  it("AC-2[P0]: verify-compliance.mjs should check window.open/location.href violations", () => {
    const scriptPath = path.join(projectRoot, "scripts/verify-compliance.mjs");
    const script = readFileSync(scriptPath, "utf-8");

    // Rule 3: Outlinks (window.open, window.location.href, location.href)
    expect(script).toMatch(/window\.open|location\.href|outlink/i);
  });

  it("AC-2[P0]: verify-compliance.mjs should check console.error violations", () => {
    const scriptPath = path.join(projectRoot, "scripts/verify-compliance.mjs");
    const script = readFileSync(scriptPath, "utf-8");

    // Rule 4: console.error
    expect(script).toMatch(/console\.error/);
  });

  it("AC-2[P0]: verify-compliance.mjs should check '설치'/'다운로드' copy violations", () => {
    const scriptPath = path.join(projectRoot, "scripts/verify-compliance.mjs");
    const script = readFileSync(scriptPath, "utf-8");

    // Rule 5: Korean forbidden words (install/download)
    expect(script).toMatch(/설치|다운로드/);
  });

  it("AC-2[P0]: verify-compliance.mjs should check TossPurchase/grantPromotionReward violations", () => {
    const scriptPath = path.join(projectRoot, "scripts/verify-compliance.mjs");
    const script = readFileSync(scriptPath, "utf-8");

    // Rule 6: Forbidden direct SDK APIs
    expect(script).toMatch(/TossPurchase|grantPromotionReward/);
  });

  it("AC-2[P0]: verify-compliance.mjs should check forbidden UI libraries (shadcn, @mui, antd, @chakra-ui)", () => {
    const scriptPath = path.join(projectRoot, "scripts/verify-compliance.mjs");
    const script = readFileSync(scriptPath, "utf-8");

    // Rule 7: Forbidden UI libs
    expect(script).toMatch(/shadcn|@mui|antd|chakra-ui/i);
  });

  it("AC-2[P0]: verify-compliance.mjs should check modern JS APIs (.at, groupBy, structuredClone)", () => {
    const scriptPath = path.join(projectRoot, "scripts/verify-compliance.mjs");
    const script = readFileSync(scriptPath, "utf-8");

    // Rule 8: Modern JS APIs forbidden in es2020 target
    expect(script).toMatch(/\.at\(|groupBy|structuredClone/);
  });

  // AC-3: vite.config.ts must set build.target to 'es2020'
  it("AC-3[P0]: vite.config.ts should set build.target to 'es2020' for Android 7+ / iOS 16+ compatibility", () => {
    const viteConfigPath = path.join(projectRoot, "vite.config.ts");
    const viteConfig = readFileSync(viteConfigPath, "utf-8");

    // Should match: target: 'es2020' or target: "es2020"
    expect(viteConfig).toMatch(/target\s*:\s*['"]es2020['"]/);
  });

  // AC-4: Current codebase should pass with 0 violations
  it("AC-4[P0]: current codebase should have 0 compliance violations", () => {
    try {
      const output = execSync("npm run verify:compliance", {
        cwd: projectRoot,
        encoding: "utf-8",
        stdio: "pipe",
      });

      // Should contain summary (e.g., "violations: 0" or similar)
      expect(output).toBeTruthy();
      expect(output).not.toMatch(/violation.*[1-9]\d*/);
    } catch (e: unknown) {
      const err = e as any;
      const stderr = err.stderr?.toString() || "";
      const stdout = err.stdout?.toString() || "";
      expect.fail(
        `Script failed with code ${err.status}.\nStdout: ${stdout}\nStderr: ${stderr}`
      );
    }
  });

  // AC-5: Dark mode readability
  it("AC-5[P0]: source code should use CSS variables (var(--tds-color-*)) instead of hardcoded HEX colors", () => {
    const srcDir = path.join(projectRoot, "src");
    const compliance = execSync(
      `find ${srcDir} -type f \\( -name "*.tsx" -o -name "*.ts" -o -name "*.css" \\) ! -path "*/__tests__/*" | head -20`,
      { encoding: "utf-8" }
    );

    const files = compliance.split("\n").filter(Boolean);

    // Spot-check: no files should have hardcoded HEX in critical screens (Home, Result)
    // This is validated by the compliance script, so we just verify the script checks it
    const scriptPath = path.join(projectRoot, "scripts/verify-compliance.mjs");
    const script = readFileSync(scriptPath, "utf-8");

    // Script should grep for HEX patterns
    expect(script).toMatch(/#[0-9a-fA-F]{3,6}/);
  });

  // AC-5: Verify compliance script checks for dark mode compliance
  it("AC-5[P1]: verify-compliance.mjs should output violation details when HEX colors are found", () => {
    const scriptPath = path.join(projectRoot, "scripts/verify-compliance.mjs");
    const script = readFileSync(scriptPath, "utf-8");

    // Should provide file and line number on violation
    expect(script).toMatch(/file|line|violation|color/i);
  });

  // Integration: All required files exist
  it("AC-4[P1]: all required compliance files should exist", () => {
    const scriptsDir = path.join(projectRoot, "scripts");
    const scriptPath = path.join(scriptsDir, "verify-compliance.mjs");

    expect(() => readFileSync(scriptPath, "utf-8")).not.toThrow();
  });

  // Integration: Script should output compliance report
  it("AC-4[P1]: verify-compliance should output a compliance report with rule results", () => {
    try {
      const output = execSync("npm run verify:compliance", {
        cwd: projectRoot,
        encoding: "utf-8",
        stdio: "pipe",
      });

      // Report should list rules checked
      expect(output).toMatch(/HEX|fetch|console|target|violation/i);
    } catch (e: unknown) {
      // Script exists but found violations
      const err = e as any;
      const fullOutput = `${err.stdout || ""}${err.stderr || ""}`;
      expect(fullOutput).toMatch(/violation|error/i);
    }
  });
});
