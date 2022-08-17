import serveStatic from "serve-static";
import http from "http";
import finalhandler from "finalhandler";
import * as hp from "helper-js";
import fs from "fs-extra";
import path from "path";

export default function (dir: string) {
  var serve = serveStatic(dir, { index: ["index.html", "index.htm"] });
  var server = http.createServer(function onRequest(req, res) {
    if (req.url?.match(/\.\w+$/)) {
      // has suffix. is assets
      // @ts-ignore
      serve(req, res, finalhandler(req, res));
    } else {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.write(fs.readFileSync(path.join(dir, "index.html")).toString());
      res.end();
    }
  });
  const wait = hp.promisePin<http.Server, Error>();
  // Listen
  server.listen(0, () => {
    console.log("Listening at:", server.address());
    wait.resolve(server);
  });
  return wait.promise;
}
