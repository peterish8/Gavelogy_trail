const { ConvexHttpClient } = require("convex/browser");
require("dotenv").config({ path: ".env.local" });

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!CONVEX_URL) throw new Error("Missing NEXT_PUBLIC_CONVEX_URL");

const client = new ConvexHttpClient(CONVEX_URL);

async function main() {
  console.log("Checking for 'judgment1' course...");
  const data = await client.query("adminQueries:checkDbDiagnostic");
  console.log(JSON.stringify(data, null, 2));
}

main().catch(console.error);
