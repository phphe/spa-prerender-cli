# spa-prerender-cli

A CLI program to prerender single page app with Chromium, like VueJs, React, Angular. Also generate sitemap.xml

js 命令行程序, 使用 Chromium 浏览器预渲染 SPA(单页面应用)网站. 支持 VueJs, React, Angular. 同时生成 sitemap.xml.

## Install / 安装

```sh
npm install spa-prerender-cli
```

## Usage / 使用

### Create config / 创建配置文件

Create `prerender.config.ts`.

```ts
import { defineConfig } from "spa-prerender-cli";

export default defineConfig({
  origin: "https://example.com",
  staticDir: "dist",
  outDir: "dist-pre",
});
```

### Add script in package.json / 在 package.json 添加执行脚本

```json
"scripts": {
  "prerender": "prerender"
}
```

### Run script / 运行脚本

```sh
npm run prerender
```

## How it works / 工作原理

It creates a server for SPA applications, then use Chromium browser to visit home page, find links, and scrape its rendered HTML code. It finds all internal links from element `a` and `link[rel="alternate"]`. If a link can't be found, add it to `addtionalUrl` in config. It injects variable `window.__IS_GENERATED__ = true`, you can use this to detect if prerendered.

它创建临时服务器运行 SPA 程序, 然后使用 Chromium 浏览器访问首页, 查找链接, 并抓取渲染后的 HTML 代码. 它通过`a`标签和`link[rel="alternate"]`查找站内链接. 如果某链接不能被找到, 把它添加到配置的`addtionalUrl`中. 会注入变量`window.__IS_GENERATED__ = true`, 你可以使用此变量判断是否是预渲染后的 HTML.

## Config / 配置

```ts
// 默认配置
const defaultConfig = {
  staticDir: "dist", // SPA bundle. SPA程序的构建结果文件夹路径.
  outDir: "dist-pre", // pre-rendered bundle. 预渲染的结果路径.
  retry: 3, // retry to scrape a page. 抓取页面失败时的重试次数.
  workers: 5, // scrape several pages at the same time. 同时抓取多个页面.
  urlAmountLimit: 1000, // maximum number of url. 最大链接数量.
  pageTimeout: 1000 * 20, // timeout to scrape a page, unit ms. 抓取页面超时, 单位毫秒.
  addtionalUrl: [] as string[], // 其他入口链接.
  viewport: { width: 1773, height: 887 }, // browser viewport. 抓取时浏览器的大小.
};
// required config. 必填配置
{
  // site origin, e.g.: https://example.com
  origin: string;
}
// optional config. 可选配置
{
  // replace, e.g.: replace: {'hello world': 'world hello'}
  // 文字替换, 是一个对象, 将会把键替换成值. 见上一行的例子
  replace: Record<string, string>;
}
```

## Flick when first load / 首次加载闪烁

For VueJs, when first load, it will remove prerendered html and create html. This makes page keep white for milliseconds. Solution(tested in Vue 3): first, use `createSSRApp` instead of `createApp`. Then add attribute `data-server-rendered="true"` to mount element use config `replace`, refer to the following code:

```js
{
  replace: {
    '<div id="app">': '<div id="app" data-server-rendered="true">'
  }
}
```

对于 VueJs, 首次加载时, 它将删除预渲染的内容并创建新的 HTML. 这使页面出现短时间的白屏, 造成闪烁. 解决方案(Vue3 测试有效): 首先用`createSSRApp` 替换 `createApp`, 然后向挂载元素添加属性`data-server-rendered="true"`. 可以使用配置`replace`做到, 参考上面代码.
