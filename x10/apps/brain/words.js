// Quotes are written word by word, like a model streaming tokens.
export const splitWords = (text) => text.trim().split(/\s+/).filter(Boolean);
