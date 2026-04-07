#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const srcAppDir = path.join(rootDir, "src", "app");

const LAYER_RANK = {
  shared: 0,
  entities: 1,
  features: 2,
  widgets: 3,
  views: 4,
};

const FSD_LAYERS = new Set(Object.keys(LAYER_RANK));
const FSD_SEGMENTS = new Set(["ui", "model", "api", "lib"]);

const hardBanPatterns = [
  {
    id: "script-injection",
    label: "Imperative script injection / DOM mutation",
    regex: /document\.createElement\(\s*["']script["']\s*\)|\.appendChild\(|\.removeChild\(/g,
    extensions: new Set([".ts", ".tsx"]),
  },
  {
    id: "dangerous-html",
    label: "dangerouslySetInnerHTML",
    regex: /dangerouslySetInnerHTML/g,
    extensions: new Set([".ts", ".tsx"]),
  },
  {
    id: "dom-html-api",
    label: "innerHTML/outerHTML/insertAdjacentHTML/document.write",
    regex: /\b(innerHTML|outerHTML|insertAdjacentHTML|document\.write)\b/g,
    extensions: new Set([".ts", ".tsx"]),
  },
  {
    id: "css-important",
    label: "!important",
    regex: /!important/g,
    extensions: new Set([".ts", ".tsx", ".css"]),
  },
  {
    id: "tailwind-important",
    label: "Tailwind ! modifier in className",
    regex: /className\s*=\s*[^\n]*![A-Za-z\[]/g,
    extensions: new Set([".ts", ".tsx", ".css"]),
  },
];

const HEX_COLOR_REGEX = /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;
const HEX_WARNING_EXCLUSIONS = [/src\/app\/features\/map\/map-styles\.ts$/];

function toPosix(filePath) {
  return filePath.split(path.sep).join("/");
}

function toProjectRelative(filePath) {
  return toPosix(path.relative(rootDir, filePath));
}

function listFiles(dirPath) {
  const files = [];
  const stack = [dirPath];

  while (stack.length > 0) {
    const currentDir = stack.pop();
    if (!currentDir) continue;

    let entries = [];
    try {
      entries = fs.readdirSync(currentDir, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
        continue;
      }
      if (entry.isFile()) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

function getLineNumber(content, index) {
  let line = 1;
  for (let i = 0; i < index; i += 1) {
    if (content.charCodeAt(i) === 10) line += 1;
  }
  return line;
}

function getLayerFromRelativePath(relativePath) {
  const normalized = toPosix(relativePath);
  if (!normalized.startsWith("src/app/")) return null;
  const parts = normalized.split("/");
  const layer = parts[2];
  if (!FSD_LAYERS.has(layer)) return null;
  return layer;
}

function resolveAliasImport(specifier) {
  if (specifier.startsWith("@/app/")) {
    return path.join(rootDir, "src", "app", specifier.slice("@/app/".length));
  }

  if (specifier.startsWith("@/src/app/")) {
    return path.join(rootDir, "src", "app", specifier.slice("@/src/app/".length));
  }

  return null;
}

function tryResolveFile(basePath) {
  const candidatePaths = [
    basePath,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    `${basePath}.js`,
    `${basePath}.jsx`,
    path.join(basePath, "index.ts"),
    path.join(basePath, "index.tsx"),
    path.join(basePath, "index.js"),
    path.join(basePath, "index.jsx"),
  ];

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }

  return null;
}

function extractImportSpecifiers(content) {
  const specs = [];
  const staticImportRegex = /(?:import|export)\s+(?:type\s+)?(?:[^"'\n]*?\s+from\s+)?["']([^"']+)["']/g;
  const dynamicImportRegex = /import\(\s*["']([^"']+)["']\s*\)/g;

  let match = staticImportRegex.exec(content);
  while (match) {
    specs.push(match[1]);
    match = staticImportRegex.exec(content);
  }

  match = dynamicImportRegex.exec(content);
  while (match) {
    specs.push(match[1]);
    match = dynamicImportRegex.exec(content);
  }

  return specs;
}

function checkHardBans(allFiles) {
  const findings = [];

  for (const filePath of allFiles) {
    const ext = path.extname(filePath);
    const relativePath = toProjectRelative(filePath);
    let content;

    try {
      content = fs.readFileSync(filePath, "utf8");
    } catch {
      continue;
    }

    for (const rule of hardBanPatterns) {
      if (!rule.extensions.has(ext)) continue;

      const regex = new RegExp(rule.regex.source, rule.regex.flags);
      let match = regex.exec(content);
      while (match) {
        findings.push({
          kind: "error",
          category: "hard-ban",
          rule: rule.label,
          file: relativePath,
          line: getLineNumber(content, match.index),
          snippet: match[0],
        });
        match = regex.exec(content);
      }
    }
  }

  return findings;
}

function checkFsdSegments(tsFiles) {
  const findings = [];

  for (const filePath of tsFiles) {
    const relativePath = toProjectRelative(filePath);
    const normalized = toPosix(relativePath);
    if (!normalized.startsWith("src/app/")) continue;

    const parts = normalized.split("/");
    const layer = parts[2];
    if (!FSD_LAYERS.has(layer)) continue;

    if (layer === "shared") {
      const segment = parts[3];
      if (!segment || !FSD_SEGMENTS.has(segment)) {
        findings.push({
          kind: "error",
          category: "fsd-segment",
          rule: "shared files must live in shared/{ui|model|api|lib}/",
          file: relativePath,
          line: 1,
        });
      }
      continue;
    }

    const slice = parts[3];
    const segment = parts[4];
    if (!slice || !segment || !FSD_SEGMENTS.has(segment)) {
      findings.push({
        kind: "error",
        category: "fsd-segment",
        rule: `${layer} files must live in ${layer}/{slice}/{ui|model|api|lib}/`,
        file: relativePath,
        line: 1,
      });
    }
  }

  return findings;
}

function checkLayerDirection(tsFiles) {
  const findings = [];

  for (const filePath of tsFiles) {
    const relativeSourcePath = toProjectRelative(filePath);
    const sourceLayer = getLayerFromRelativePath(relativeSourcePath);
    if (!sourceLayer) continue;

    let content;
    try {
      content = fs.readFileSync(filePath, "utf8");
    } catch {
      continue;
    }

    const importSpecifiers = extractImportSpecifiers(content);

    for (const specifier of importSpecifiers) {
      let targetPath = null;

      if (specifier.startsWith(".")) {
        targetPath = tryResolveFile(path.resolve(path.dirname(filePath), specifier));
      } else {
        const aliasPath = resolveAliasImport(specifier);
        if (aliasPath) {
          targetPath = tryResolveFile(aliasPath);
        }
      }

      if (!targetPath) continue;

      const relativeTargetPath = toProjectRelative(targetPath);
      const targetLayer = getLayerFromRelativePath(relativeTargetPath);
      if (!targetLayer) continue;

      if (LAYER_RANK[targetLayer] > LAYER_RANK[sourceLayer]) {
        findings.push({
          kind: "error",
          category: "layer-direction",
          rule: `${sourceLayer} cannot import upward into ${targetLayer}`,
          file: relativeSourcePath,
          line: 1,
          snippet: specifier,
        });
      }
    }
  }

  return findings;
}

function checkHexColors(tsxFiles) {
  const findings = [];

  for (const filePath of tsxFiles) {
    const relativePath = toProjectRelative(filePath);
    const normalized = toPosix(relativePath);

    if (HEX_WARNING_EXCLUSIONS.some((pattern) => pattern.test(normalized))) {
      continue;
    }

    let content;
    try {
      content = fs.readFileSync(filePath, "utf8");
    } catch {
      continue;
    }

    const regex = new RegExp(HEX_COLOR_REGEX.source, HEX_COLOR_REGEX.flags);
    let match = regex.exec(content);
    while (match) {
      findings.push({
        kind: "warning",
        category: "hex-color",
        rule: "Prefer theme tokens/constants over raw hex in TSX",
        file: relativePath,
        line: getLineNumber(content, match.index),
        snippet: match[0],
      });
      match = regex.exec(content);
    }
  }

  return findings;
}

function printFindings(title, findings) {
  console.log(`\n${title} (${findings.length})`);
  if (!findings.length) {
    console.log("  - none");
    return;
  }

  for (const finding of findings) {
    const location = `${finding.file}:${finding.line}`;
    const suffix = finding.snippet ? ` -> ${finding.snippet}` : "";
    console.log(`  - ${location} | ${finding.rule}${suffix}`);
  }
}

if (!fs.existsSync(srcAppDir)) {
  console.error("src/app directory not found. Run this script from repository root.");
  process.exit(1);
}

const allProjectFiles = listFiles(srcAppDir);
const tsFiles = allProjectFiles.filter((filePath) => {
  const ext = path.extname(filePath);
  return (ext === ".ts" || ext === ".tsx") && !filePath.endsWith(".d.ts");
});
const tsxFiles = allProjectFiles.filter((filePath) => path.extname(filePath) === ".tsx");
const cssFiles = allProjectFiles.filter((filePath) => path.extname(filePath) === ".css");

const hardBanFindings = checkHardBans([...tsFiles, ...cssFiles]);
const fsdSegmentFindings = checkFsdSegments(tsFiles);
const layerDirectionFindings = checkLayerDirection(tsFiles);
const hexWarnings = checkHexColors(tsxFiles);

printFindings("Hard-Ban Violations", hardBanFindings);
printFindings("FSD Segment Violations", fsdSegmentFindings);
printFindings("Layer Direction Violations", layerDirectionFindings);
printFindings("Hex Color Warnings", hexWarnings);

const errorCount = hardBanFindings.length + fsdSegmentFindings.length + layerDirectionFindings.length;
const warningCount = hexWarnings.length;

console.log(`\nSummary: ${errorCount} error(s), ${warningCount} warning(s)`);

if (errorCount > 0) {
  process.exit(1);
}
