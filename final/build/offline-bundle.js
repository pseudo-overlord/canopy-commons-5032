import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { workerSource } from "./offline-worker.js";
export function offlineBundle() {
  let root;
  return {
    name: "canopy-public-offline-bundle",
    enforce: "post",
    configResolved(config) {
      root = config.root;
    },
    generateBundle(_options, bundle) {
      const entry = Object.values(bundle).find(
        (item) =>
          item.type === "chunk" &&
          item.isEntry &&
          item.facadeModuleId?.replaceAll("\\", "/").endsWith("/offline.html"),
      );
      if (!entry) throw Error("Public offline entry missing.");
      const queue = [entry.fileName],
        seen = new Set(),
        resources = new Set([
          "/offline.html",
          "/opportunities.json",
          "/leaf.svg",
        ]);
      while (queue.length) {
        const name = queue.pop();
        if (seen.has(name)) continue;
        seen.add(name);
        const chunk = bundle[name];
        if (!chunk || chunk.type !== "chunk")
          throw Error("Offline dependency missing.");
        if (
          Object.keys(chunk.modules).some((id) =>
            /\/src\/(?:identity|firebase|cloudAuth|cloudRatings|auth|ratings)\.js$|\/node_modules\/(?:@firebase|firebase)\//.test(
              id.replaceAll("\\", "/"),
            ),
          )
        )
          throw Error(
            "Private/authentication dependency in public offline library.",
          );
        resources.add("/" + name);
        queue.push(...chunk.imports, ...chunk.dynamicImports);
        for (const css of chunk.viteMetadata?.importedCss || [])
          resources.add("/" + css);
      }
      const catalogBytes = readFileSync(
          resolve(root, "public/opportunities.json"),
        ),
        catalog = JSON.parse(catalogBytes);
      for (const a of catalog) {
        if (!/^[a-z0-9-]+$/.test(a.art))
          throw Error("Invalid public artwork path.");
        resources.add(`/art/${a.art}.webp`);
      }
      const paths = [...resources].sort();
      if (paths.length > 40)
        throw Error("Offline public cache exceeded its resource bound.");
      const digest = createHash("sha256");
      for (const name of [...seen].sort()) digest.update(bundle[name].code);
      digest.update(catalogBytes);
      digest.update(JSON.stringify(paths));
      digest.update(readFileSync(resolve(root, "offline.html")));
      digest.update(workerSource({ version: "fingerprint" }));
      for (const path of paths)
        if (
          !bundle[path.slice(1)] &&
          !path.startsWith("/assets/") &&
          path !== "/offline.html"
        )
          digest.update(readFileSync(resolve(root, "public" + path)));
      const manifest = {
        schema: 1,
        version: digest.digest("hex").slice(0, 16),
        paths,
        activityCount: catalog.length,
      };
      this.emitFile({
        type: "asset",
        fileName: "offline-manifest.json",
        source: JSON.stringify(manifest, null, 2) + "\n",
      });
      this.emitFile({
        type: "asset",
        fileName: "sw.js",
        source: workerSource(manifest),
      });
    },
  };
}
