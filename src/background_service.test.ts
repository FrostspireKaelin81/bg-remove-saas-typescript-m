import assert from "node:assert/strict";
import { validateRequest } from "./background_service.js";

const parsed = validateRequest({ tenantId: "shop-eu", accountId: "acct-42", image: "data:image/png;base64,AA", format: "png" });
assert.equal(parsed.tenantId, "shop-eu");
assert.equal(parsed.format, "png");
assert.throws(() => validateRequest({ tenantId: "", accountId: "acct-42", image: "x" }));
console.log("request boundary checks passed");
