import { getConfig } from "rogo";

const options = {};

export default [
  getConfig({ ...options, format: "esm" }),
  getConfig({ ...options, format: "cjs" }),
  getConfig({
    ...options,
    format: "cjs",
    input: "src/cli.ts",
    outputFile: "dist/cli.cjs.js",
  }),
];
