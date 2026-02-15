import { file, serve } from "bun";
import { join } from "path";

const PORT = process.env.PORT || 3000;
const PAGES_DIR = join(import.meta.dir, "pages");
const PUBLIC_DIR = join(import.meta.dir, "public");

// Production security and caching headers
const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self'",
};

const cacheHeaders = {
  html: {
    "Cache-Control": "no-cache, must-revalidate",
  },
  assets: {
    "Cache-Control": "public, max-age=31536000, immutable",
  },
};

function getContentType(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase();
  const types: Record<string, string> = {
    html: "text/html; charset=utf-8",
    css: "text/css; charset=utf-8",
    js: "application/javascript; charset=utf-8",
    json: "application/json; charset=utf-8",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    svg: "image/svg+xml",
    ico: "image/x-icon",
    woff: "font/woff",
    woff2: "font/woff2",
    ttf: "font/ttf",
  };
  return types[ext || ""] || "application/octet-stream";
}

function extractPageFromHost(host: string): string | null {
  // Extract subdomain from host (e.g., page1.domain.com -> page1)
  const parts = host.split(".");
  if (parts.length >= 3) {
    return parts[0];
  }
  return null;
}

async function serveFile(
  filePath: string,
  isHtml: boolean = false
): Promise<Response> {
  const fileHandle = file(filePath);
  const exists = await fileHandle.exists();

  if (!exists) {
    return new Response("Not Found", {
      status: 404,
      headers: { ...securityHeaders, "Content-Type": "text/plain" },
    });
  }

  const contentType = getContentType(filePath);
  const cache = isHtml ? cacheHeaders.html : cacheHeaders.assets;

  return new Response(fileHandle, {
    headers: {
      ...securityHeaders,
      ...cache,
      "Content-Type": contentType,
    },
  });
}

serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const host = req.headers.get("host") || "";
    let pathname = url.pathname;

    // Try to get page from subdomain first
    const subdomainPage = extractPageFromHost(host);

    // Serve public assets (CSS, images, favicon, etc.)
    if (pathname === "/favicon.svg" || pathname === "/og-image.png") {
      return serveFile(join(PUBLIC_DIR, pathname.slice(1)), false);
    }
    if (pathname.startsWith("/public/") || pathname === "/styles.css") {
      const assetPath =
        pathname === "/styles.css"
          ? join(PUBLIC_DIR, "styles.css")
          : join(PUBLIC_DIR, pathname.replace("/public/", ""));
      return serveFile(assetPath, false);
    }

    // Determine which page to serve
    let pageName: string;

    if (subdomainPage) {
      // Subdomain routing: home.domain.com serves pages/home/index.html
      pageName = subdomainPage;
    } else if (pathname === "/" || pathname === "") {
      // Root path without subdomain - serve a default page or list
      pageName = "home";
    } else {
      // Path-based routing: /page1 serves pages/page1/index.html
      pageName = pathname.replace(/^\//, "").replace(/\/$/, "").split("/")[0];
    }

    // Handle nested paths within a page (e.g., /page1/about)
    const pathParts = pathname.replace(/^\//, "").split("/");
    const nestedPath = pathParts.slice(1).join("/");

    let htmlPath: string;
    if (nestedPath && nestedPath !== "") {
      // Try to serve nested HTML file
      htmlPath = join(PAGES_DIR, pageName, `${nestedPath}.html`);
      const nestedFile = file(htmlPath);
      if (!(await nestedFile.exists())) {
        // Fall back to index.html
        htmlPath = join(PAGES_DIR, pageName, "index.html");
      }
    } else {
      htmlPath = join(PAGES_DIR, pageName, "index.html");
    }

    return serveFile(htmlPath, true);
  },
});

console.log(`Server running at http://localhost:${PORT}`);
