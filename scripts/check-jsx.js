const { readFileSync } = require('fs');
const src = readFileSync('components/job-detail-panel.tsx', 'utf8');
const lines = src.split('\n');
let braceDepth = 0, parenDepth = 0;

for (let i = 0; i < Math.min(599, lines.length); i++) {
  const line = lines[i];
  let inStr = false, strChar = '';
  for (let j = 0; j < line.length; j++) {
    const ch = line[j];
    if (!inStr && (ch === '"' || ch === "'" || ch === '`')) { inStr = true; strChar = ch; continue; }
    if (inStr && ch === strChar) { inStr = false; continue; }
    if (inStr) continue;
    if (ch === '{') braceDepth++;
    if (ch === '}') braceDepth--;
    if (ch === '(') parenDepth++;
    if (ch === ')') parenDepth--;
  }
}
console.log('At line 599 (before SimilarRoles): braceDepth=' + braceDepth + ', parenDepth=' + parenDepth);

// Find where braceDepth exceeds expected (should be 0 or 1 at function scope)
braceDepth = 0; parenDepth = 0;
let lastImbalanceLine = -1;
for (let i = 0; i < Math.min(574, lines.length); i++) {
  const line = lines[i];
  let inStr = false, strChar = '';
  const prevBrace = braceDepth;
  for (let j = 0; j < line.length; j++) {
    const ch = line[j];
    if (!inStr && (ch === '"' || ch === "'" || ch === '`')) { inStr = true; strChar = ch; continue; }
    if (inStr && ch === strChar) { inStr = false; continue; }
    if (inStr) continue;
    if (ch === '{') braceDepth++;
    if (ch === '}') braceDepth--;
    if (ch === '(') parenDepth++;
    if (ch === ')') parenDepth--;
  }
  if (braceDepth !== prevBrace) lastImbalanceLine = i + 1;
}
console.log('Last brace change at line:', lastImbalanceLine);
