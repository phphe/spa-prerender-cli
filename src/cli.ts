import fs from "fs-extra";
import path from "path";
import { Command } from "commander";
import { Config, defaultConfig } from "./index";
import serve from "./serve";
import { removeHost } from "./utils";
import scrape from "./scrape";
import genSitemapAndRobotsTXT from "./sitemap";

const program = new Command();

program.option(
  "-c, --config <type>",
  "config file. suport both ts and js. default prerender.config.[js|ts]",
  ""
);

program.option(
  "-p, --prop",
  "Config file can contain multiple config. This option specifies the property name in the config file."
);
program.parse(process.argv);
const options = program.opts();

// get config file
let configFile: string = options.config;
if (!configFile) {
  const defaults = ["prerender.config.js", "prerender.config.ts"];
  for (const f of defaults) {
    let t = path.join(process.cwd(), f);
    if (fs.existsSync(t)) {
      configFile = t;
      break;
    }
  }
} else {
  if (configFile && configFile[0] !== "/") {
    configFile = path.join(process.cwd(), configFile);
  }
}
if (!configFile) {
  throw "--config option not specified and default config not found.";
}
if (!fs.existsSync(configFile)) {
  throw "Specified config file does not exits.";
}
//
const isTS = configFile.toLowerCase().endsWith(".ts");
if (isTS) {
  require("ts-node").register({
    transpileOnly: true,
    compilerOptions: {
      module: "CommonJS",
      allowJs: false,
    },
  });
}

let userConfig = require(configFile);
if (options.prop) {
  if (userConfig[options.prop]) {
    userConfig = userConfig[options.prop];
  } else if (userConfig.default) {
    userConfig = userConfig.default[options.prop];
  }
} else if (userConfig.default) {
  userConfig = userConfig.default;
}

const config: Config = {
  ...defaultConfig,
  ...userConfig,
};

let urlPool: string[] = [];
const usedUrls: string[] = [];
let host: string;

start();
async function start() {
  if (fs.existsSync(config.outDir)) {
    fs.removeSync(config.outDir);
  }
  fs.copySync(config.staticDir, config.outDir);
  console.log("Start static server");
  const server = await serve(config.staticDir);
  // @ts-ignore
  host = `127.0.0.1:` + server.address().port;
  // start urls
  addUrl(""); // add home
  config.addtionalUrl.forEach((url) => {
    addUrl(url);
  });
  //

  const successfullUrls: string[] = [];
  let i = 0;
  while (urlPool.length > 0) {
    const workers = [];
    for (let index = 0; index < config.workers; index++) {
      let tempUrl: string;
      tempUrl = urlPool.shift()!;
      if (!tempUrl) {
        break;
      }
      const urlWithoutHost = removeHost(tempUrl);
      usedUrls.push(tempUrl);
      const htmlPath = path.join(
        config.outDir,
        urlWithoutHost.replace(/\/$/, "") + "/index.html"
      );
      workers.push(
        scrape(tempUrl, {
          puppeteerLaunchOptions: { defaultViewport: config.viewport },
          retry: config.retry,
          timeout: config.pageTimeout,
          injectVariables: {
            __IS_GENERATED__: true,
          },
        })
          .then((t) => {
            if (config.replace) {
              for (const fromStr of Object.keys(config.replace)) {
                t.html = t.html.replaceAll(fromStr, config.replace[fromStr]);
              }
            }
            successfullUrls.push(urlWithoutHost);
            fs.outputFileSync(htmlPath, t.html);
            console.log(`Page scraped:`, urlWithoutHost);
            return t;
          })
          .catch((e) => null)
      );
    }
    for (const t of await Promise.all(workers)) {
      if (t) {
        for (const url of t.urls) {
          addUrl(url);
        }
      }
    }
    i++;
    if (urlPool.length + usedUrls.length > config.urlAmountLimit) {
      throw "URL amount limit reached";
    }
  }
  //
  genSitemapAndRobotsTXT(successfullUrls, {
    origin: config.origin,
    outDir: config.outDir,
  });
  //
  server.close();
  console.log("prerender done");
  process.exit();
}

function isInternalUrl(url: string) {
  try {
    return new URL(url).hostname === new URL(host).hostname;
  } catch (error) {
    return true;
  }
}

function addUrl(url: string) {
  if (url == null || typeof url !== "string" || !isInternalUrl(url)) {
    return;
  }
  url = url.replace(/#.*$/, ""); // remove hash
  url = removeHost(url);
  url = url.replace(/\/index.html?$/, "").replace(/\/$/, "");
  if (url.length > 0 && url[0] !== "/") {
    url = "/" + url;
  }
  url = "http://" + host + url;
  if (!urlPool.includes(url) && !usedUrls.includes(url)) {
    urlPool.push(url);
  }
}
