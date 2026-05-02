const pathMapCache = new Map();
const pathMapRequests = new Map();

export function getModelPath(folder, filename) {
  if (!filename || filename === "None") {
    return "";
  }

  return pathMapCache.get(folder)?.[filename] ?? filename;
}

export async function loadModelPathMap(folder) {
  if (pathMapRequests.has(folder)) {
    return pathMapRequests.get(folder);
  }

  const request = fetch(`/alice-tools/model-paths/${encodeURIComponent(folder)}`)
    .then((response) => (response.ok ? response.json() : { paths: {} }))
    .then((data) => {
      const paths = data?.paths ?? {};
      pathMapCache.set(folder, paths);
      return paths;
    })
    .catch(() => {
      pathMapCache.set(folder, {});
      return {};
    });

  pathMapRequests.set(folder, request);
  return request;
}
