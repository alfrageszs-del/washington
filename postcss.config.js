// postcss.config.js
module.exports = {
  plugins: {
    "@tailwindcss/postcss": {},  // ⬅️ вместо "tailwindcss": {}
    autoprefixer: {},
  },
};
