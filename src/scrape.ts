import { removeHost } from "./utils";
import puppeteer from "puppeteer";
// @ts-ignore
import { minify } from "html-minifier";

let browser: puppeteer.Browser | null;
let scraping = 0;

export default function scrapeOnePage(
  url: string,
  opt: {
    withHash?: boolean;
    withExternal?: boolean;
    puppeteerLaunchOptions?: puppeteer.PuppeteerLaunchOptions;
    puppeteerWaitForOptions?: puppeteer.WaitForOptions;
    retry?: number;
    timeout?: number;
    injectVariables?: object;
  } = {},
  count = 0
) {
  const urlWithoutHost = removeHost(url);
  scraping++;
  return new Promise<{ html: string; urls: string[] }>(
    async (resolve, reject) => {
      if (!browser) {
        browser = await puppeteer.launch({
          defaultViewport: { width: 1773, height: 887 },
          ...opt.puppeteerLaunchOptions,
        });
        let t = setInterval(() => {
          if (browser && scraping === 0) {
            browser.close();
            browser = null;
            clearInterval(t);
          }
        }, 1000);
      }
      const page = await browser.newPage();
      let failedGoto, failedEvaluate;
      await page
        .goto(url, {
          waitUntil: "networkidle0",
          timeout: opt.timeout,
          ...opt.puppeteerWaitForOptions,
        })
        .catch((e) => {
          failedGoto = e;
        });
      let html: string = "",
        urls: string[] = [];
      if (!failedGoto) {
        await page
          .evaluate(() => {
            const html = document.documentElement.outerHTML;
            // get all links
            const urls: string[] = [];
            const t: Element[] = [];
            t.push(...document.querySelectorAll("a"));
            t.push(...document.querySelectorAll('link[rel="alternate"]'));
            t.forEach((el) => {
              let url = el.getAttribute("href");
              if (!url) {
                return;
              }
              url = url.replace(/#.*$/, ""); // remove hash
              urls.push(url);
            });
            return { html, urls };
          })
          .then((t) => {
            html = t.html;
            urls = t.urls;
          })
          .catch((e) => {
            failedEvaluate = e;
          });
      }
      await page.close();
      scraping--;
      if (failedGoto || failedEvaluate) {
        const e = failedGoto || failedEvaluate;
        console.log("Page failed:", urlWithoutHost, e);
        if (count < (opt.retry || 3) - 1) {
          console.log("Page retry:", urlWithoutHost);
          resolve(scrapeOnePage(url, opt, count + 1));
        } else {
          reject(e);
        }
      } else {
        if (opt.injectVariables) {
          html = html.replace(
            "<head>",
            `<head><script>Object.assign(window, ${JSON.stringify(
              opt.injectVariables
            )})</script>`
          );
        }
        html = minify(`<!DOCTYPE html>${html}`);
        //
        urls = urls.filter((v) => v);
        if (!opt.withHash) {
          // remove hash
          urls = urls.map((v) => v.replace(/#.*$/, ""));
        }
        if (!opt.withExternal) {
          urls = urls.filter((v) => isInternalUrl(v));
        }
        resolve({ html, urls });
      }
    }
  );
  function isInternalUrl(targetUrl: string) {
    try {
      return new URL(targetUrl).hostname === new URL(url).hostname;
    } catch (error) {
      return true;
    }
  }
}
