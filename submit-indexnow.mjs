import { readFile } from "node:fs/promises";

const endpoint = "https://api.indexnow.org/indexnow";
const config = JSON.parse(
  await readFile(new URL("./indexnow.config.json", import.meta.url), "utf8"),
);
const dryRun = process.argv.includes("--dry-run");
let failed = false;

for (const site of config.sites ?? []) {
  try {
    const host = site.host.toLowerCase();
    if (!/^[a-z0-9.-]+$/.test(host)) throw new Error("Invalid host.");
    if (!/^[A-Za-z0-9-]{8,128}$/.test(site.key)) throw new Error("Invalid IndexNow key.");
    if (!Array.isArray(site.urls) || site.urls.length === 0) throw new Error("No URLs configured.");

    for (const value of site.urls) {
      const url = new URL(value);
      if (!["https:", "http:"].includes(url.protocol) || url.hostname.toLowerCase() !== host) {
        throw new Error(`URL must use the configured host: ${value}`);
      }
    }

    if (dryRun) {
      console.log(`DRY RUN ${host}: ${site.urls.length} URL(s)`);
      continue;
    }

    const keyResponse = await fetch(site.keyLocation, { signal: AbortSignal.timeout(15000) });
    const servedKey = (await keyResponse.text()).trim();
    if (!keyResponse.ok || servedKey !== site.key) {
      throw new Error(`Key file check failed at ${site.keyLocation} (HTTP ${keyResponse.status}).`);
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ host, key: site.key, urlList: site.urls }),
      signal: AbortSignal.timeout(15000),
    });
    console.log(`${host}: IndexNow returned HTTP ${response.status}.`);
    if (response.status !== 200 && response.status !== 202) {
      throw new Error((await response.text()).slice(0, 300) || "Submission rejected.");
    }
  } catch (error) {
    failed = true;
    console.error(`${site.host ?? "site"}: ${error.message}`);
  }
}

if (failed) process.exitCode = 1;
