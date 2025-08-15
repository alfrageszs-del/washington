// ESM или CJS — любой формат, вот CJS-вариант:
module.exports = {
  plugins: {
    "@tailwindcss/postcss": {},   // ⬅️ ВАЖНО: а не "tailwindcss": {}
    autoprefixer: {},
  },
};
