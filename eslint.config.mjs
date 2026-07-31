import nextConfig from "eslint-config-next";

const eslintConfig = [
  ...nextConfig,
  {
    ignores: ["node_modules", "dist", "coverage", "*.min.js", "drizzle"],
  },
];

export default eslintConfig;
