export const defaultConfig = {
  staticDir: "dist",
  outDir: "dist-pre",
  retry: 3,
  workers: 5,
  urlAmountLimit: 1000,
  pageTimeout: 1000 * 20, // 20s
  addtionalUrl: [] as string[],
  viewport: { width: 1773, height: 887 },
  minify: true,
};
type _configRequired = {
  origin: string; // site domain, e.g.: https://www.google.com
  replace?: Record<string, string>;
};

export type Config = typeof defaultConfig & _configRequired;

export function defineConfig(config: Partial<Config> & _configRequired) {
  return config;
}
