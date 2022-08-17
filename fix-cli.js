const fs = require("fs");

let path = "dist/cli.cjs.js";
var data = "#!/usr/bin/env node\n\n";
data += fs.readFileSync(path);
fs.writeFileSync(path, data);
