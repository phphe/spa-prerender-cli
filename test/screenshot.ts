import puppeteer from "puppeteer";

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto("https://www.cloudflare.com/");
  await page.screenshot({ path: __dirname + "/screenshot.png" });

  await browser.close();
})();
