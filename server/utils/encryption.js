// utils/encryption.js
const ckns7 = require("crypto");
const iu9jf = process.env.ENCRYPTION_KEY; // 32-byte hex string
const e1drjj = 16;
exports.encrypt = ds6m49 => {
  const m92ri = ckns7.randomBytes(e1drjj);
  const ud24a0 = ckns7.createCipheriv("aes-256-cbc", Buffer.from(iu9jf, "hex"), m92ri);
  let m52g = ud24a0.update(ds6m49, "utf8", "hex");
  m52g += ud24a0.final("hex");
  return m92ri.toString("hex") + ":" + m52g;
};
exports.decrypt = q0nj => {
  const [n7k5y7, ckvkxh] = q0nj.split(":");
  const k729 = Buffer.from(n7k5y7, "hex");
  const w84h = ckns7.createDecipheriv("aes-256-cbc", Buffer.from(iu9jf, "hex"), k729);
  let fg121 = w84h.update(ckvkxh, "hex", "utf8");
  fg121 += w84h.final("utf8");
  return fg121;
};