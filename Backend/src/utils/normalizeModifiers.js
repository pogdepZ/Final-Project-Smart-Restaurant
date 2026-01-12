// src/utils/normalizeModifiers.js

function sortObjectDeep(value) {
  if (Array.isArray(value)) {
    return value
      .map(sortObjectDeep)
      .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  }
  if (value && typeof value === "object") {
    const keys = Object.keys(value).sort();
    const out = {};
    for (const k of keys) out[k] = sortObjectDeep(value[k]);
    return out;
  }
  return value;
}

// normalize modifiers về 1 dạng ổn định để stringify so sánh
function normalizeModifiers(modifiers) {
  if (modifiers == null) return []; // default [] cho đúng schema db
  // nếu FE gửi object -> convert sang dạng object sorted
  return sortObjectDeep(modifiers);
}

function modifiersKey(modifiers) {
  return JSON.stringify(normalizeModifiers(modifiers));
}

module.exports = { normalizeModifiers, modifiersKey };
