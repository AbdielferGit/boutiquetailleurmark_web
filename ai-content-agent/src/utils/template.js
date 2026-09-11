const fs = require("fs");
const path = require("path");

function fillTemplate(template, data) {
  return template.replace(/\{\{(.*?)\}\}/g, (_, expr) => {
    const parts = expr.trim().split(".");
    let value = data;
    for (const part of parts) value = value == null ? undefined : value[part];
    return value == null ? "" : value;
  });
}

function loadPrompt(name, data) {
  const raw = fs.readFileSync(path.join(__dirname, "..", "..", "prompts", `${name}.md`), "utf8");
  return fillTemplate(raw, data);
}

module.exports = { fillTemplate, loadPrompt };
