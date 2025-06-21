import prompts from "../prompts.yaml";       // Bundled at build time via yaml-loader

/* Simple keyword lookup */
const keywordMap = prompts.reduce((acc, p) => {
  p.trigger_tokens.forEach(tok => (acc[tok] = acc[tok] || []).push(p));
  return acc;
}, {});

export function pickTemplate(promptTxt) {
  const lower = promptTxt.toLowerCase();
  let hits = [];
  Object.keys(keywordMap).forEach(tok => {
    if (lower.includes(tok)) hits = hits.concat(keywordMap[tok]);
  });
  return hits[0] || prompts.find(p => p.id === "cot_default");
}
