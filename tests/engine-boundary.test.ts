import { ESLint } from "eslint";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = fileURLToPath(new URL("..", import.meta.url));

function restrictedImportErrors(results: ESLint.LintResult[]) {
  return results
    .flatMap((r) => r.messages)
    .filter((m) => m.ruleId === "no-restricted-imports");
}

async function lintEngineSource(code: string) {
  const eslint = new ESLint({ cwd: root });
  return restrictedImportErrors(
    await eslint.lintText(code, { filePath: "src/engine/probe.ts" }),
  );
}

describe("engine import boundary", () => {
  it("rejects the react-importing fixture in src/engine", async () => {
    const eslint = new ESLint({ cwd: root, ignore: false });
    const results = await eslint.lintFiles([
      "src/engine/__fixtures__/imports-react.ts",
    ]);
    expect(restrictedImportErrors(results)).toHaveLength(1);
  });

  it.each([
    "import { useState } from 'react'",
    "import { createRoot } from 'react-dom/client'",
    "import { readFileSync } from 'node:fs'",
    "import { App } from '../ui/App'",
    "import { pick } from '../ai/greedy'",
    "import { run } from '../sim/run'",
    "import { App } from 'src/ui/App'",
    "import { App } from '/src/ui/App'",
  ])("rejects %s", async (line) => {
    expect(await lintEngineSource(`${line}\n`)).toHaveLength(1);
  });

  it.each([
    "import { seedRng } from './rng'",
    "import { step } from './sim'",
    "import { pick } from './board/ai'",
  ])("allows engine-internal %s", async (line) => {
    expect(await lintEngineSource(`${line}\n`)).toHaveLength(0);
  });

  it("does not restrict code outside src/engine", async () => {
    const eslint = new ESLint({ cwd: root });
    const results = await eslint.lintText(
      "import { useState } from 'react'\n",
      {
        filePath: "src/ui/probe.tsx",
      },
    );
    expect(restrictedImportErrors(results)).toHaveLength(0);
  });
});
