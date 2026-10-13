// The auth backends are loaded with top level await, so the entry file must not
// import them directly or the app waits forever. This checks for that at build
// time, because it fails silently in the browser.
export function authStartupGuard() {
  return {
    name: "canopy-auth-startup-guard",
    generateBundle(_options, bundle) {
      const chunks = Object.values(bundle).filter(
        (item) => item.type === "chunk",
      );
      const entry = chunks.find(
        (item) =>
          item.isEntry &&
          /\/(?:src\/main\.js|index\.html)$/.test(
            item.facadeModuleId?.replaceAll("\\", "/") || "",
          ),
      );
      if (!entry)
        throw new Error(
          "Cannot verify authentication startup: entry chunk missing.",
        );
      for (const backend of chunks.filter((item) =>
        /\/src\/(cloudAuth|cloudRatings|auth|ratings)\.js$/.test(
          item.facadeModuleId?.replaceAll("\\", "/") || "",
        ),
      )) {
        const queue = [backend.fileName],
          seen = new Set();
        while (queue.length) {
          const name = queue.pop();
          if (seen.has(name)) continue;
          seen.add(name);
          if (name === entry.fileName)
            throw new Error(
              `Authentication startup cycle: ${backend.fileName} depends on the awaiting entry.`,
            );
          queue.push(...(bundle[name]?.imports || []));
        }
      }
    },
  };
}
