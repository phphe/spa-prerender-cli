import { defineConfig } from "./src/index";

export default defineConfig({
  origin: "https://phphe.com",
  staticDir: "dist",
  outDir: "dist-pre",
  addtionalUrl: ["/v1"],
});
