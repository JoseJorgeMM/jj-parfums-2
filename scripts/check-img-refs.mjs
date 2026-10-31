import fs from "fs";
const c = fs.readFileSync("assets/js/data.js", "utf8");
const refs = [...c.matchAll(/image:\s*"([^"]+)"/g)].map(x => x[1]);
console.log("refs totales:", refs.length);
const missing = refs.filter(r => !fs.existsSync(r));
console.log("refs SIN archivo:", missing.length);
console.log(missing.join("\n"));
const jpgRefs = refs.filter(r => /\.(jpg|jpeg)$/i.test(r));
console.log("refs .jpg:", jpgRefs.length);
