import fs from "fs-extra";
import path from "path";

export default function genSitemapAndRobotsTXT(
  urls: string[],
  opt: { outDir: string; origin: string }
) {
  urls = urls.map((v) => {
    if (!v.endsWith("/")) {
      v += "/";
    }
    if (v === "/") {
      v = "";
    }
    if (!v.startsWith("http")) {
      // add origin
      v = opt.origin + v ? "/" + v.replace(/^\//, "") : "";
    }
    return v;
  });
  const lastmod = new Date().toISOString();
  let t = urls
    .map(
      (url) => `<url>
  <loc>${url}</loc>
  <lastmod>${lastmod}</lastmod>
  <priority>${url === opt.origin ? "0.80" : "0.50"}</priority>
</url>`
    )
    .join("\n");
  let r = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
      xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
      xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
            http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
  ${t}
</urlset>`;
  fs.outputFileSync(path.join(opt.outDir, "sitemap.xml"), r);
  fs.outputFileSync(
    path.join(opt.outDir, "robots.txt"),
    `Sitemap: ${opt.origin}/sitemap.xml`.trim()
  );
}
