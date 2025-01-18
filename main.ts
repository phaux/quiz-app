import { serveSpa } from "https://deno.land/x/serve_spa@v0.3.0/mod.ts";
import { serveApi } from "./api.ts";

Deno.serve({ port: 1234 }, (request) => {
  const url = new URL(request.url);
  if (url.pathname.startsWith("/api")) {
    return serveApi(request);
  }
  return serveSpa(request, {
    fsRoot: `${import.meta.dirname}/web`,
    indexFallback: true,
    importMapFile: "../deno.json",
    jsx: "automatic",
  });
});
