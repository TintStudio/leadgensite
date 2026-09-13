import { ZipArchive } from "archiver";
import { getFileFromStorage, listStorageFiles } from "./r2";
import { HostingPlatform } from "@/types/create";

export interface ZipExportResult {
  buffer: Buffer;
  filename: string;
  totalFiles: number;
}

/**
 * Packages all generated website files into a production-ready ZIP archive
 * with platform deployment configurations (.nojekyll, netlify headers, vercel.json, readme).
 */
export async function createWebsiteZip(
  websiteId: string,
  slugOrDomain: string = "website",
  platform: HostingPlatform = "custom"
): Promise<ZipExportResult> {
  const archive = new ZipArchive({
    zlib: { level: 9 }, // Maximum compression
  });

  const chunks: Buffer[] = [];

  archive.on("data", (chunk: Buffer) => {
    chunks.push(chunk);
  });

  const completionPromise = new Promise<Buffer>((resolve, reject) => {
    archive.on("end", () => resolve(Buffer.concat(chunks)));
    archive.on("error", (err: Error) => reject(err));
  });

  // 1. Retrieve all stored files for this website
  const storagePrefix = `websites/${websiteId}`;
  const fileKeys = await listStorageFiles(storagePrefix);

  let fileCount = 0;

  for (const fileKey of fileKeys) {
    const fileContent = await getFileFromStorage(fileKey);
    if (fileContent) {
      // Strip the prefix to preserve relative website structure (index.html, services/..., etc.)
      let relativePath = fileKey;
      if (fileKey.startsWith(storagePrefix)) {
        relativePath = fileKey.slice(storagePrefix.length).replace(/^[/\\]+/, "");
      }

      if (relativePath) {
        archive.append(fileContent, { name: relativePath });
        fileCount++;
      }
    }
  }

  // 2. Platform Adapters & Static Deployment Optimization

  // A. GitHub Pages compatibility:
  // Bypass Jekyll parser to ensure Handlebars-rendered static assets and dotfiles are served directly
  archive.append("# GitHub Pages static file directive - disable Jekyll processing\n", {
    name: ".nojekyll",
  });
  fileCount++;

  // B. Netlify headers & redirects
  const netlifyHeaders = `/*
  X-Frame-Options: SAMEORIGIN
  X-XSS-Protection: 1; mode=block
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
/style.css
  Cache-Control: public, max-age=31536000, immutable
`;
  archive.append(netlifyHeaders, { name: "_headers" });
  fileCount++;

  // C. Vercel deployment configuration
  const vercelConfig = {
    version: 2,
    cleanUrls: true,
    trailingSlash: false,
    headers: [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
      {
        source: "/style.css",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ],
  };
  archive.append(JSON.stringify(vercelConfig, null, 2), { name: "vercel.json" });
  fileCount++;

  // D. Comprehensive Deployment Instructions README
  const deploymentReadme = `# Static Website Deployment Guide
**Target Domain / Slug**: ${slugOrDomain}
**Target Platform**: ${platform.toUpperCase()}
**Generated at**: ${new Date().toISOString()}

---

## Fast Deployment Options

### 1. GitHub Pages (Free & Fast)
1. Create a new repository on GitHub (e.g. \`${slugOrDomain}\` or \`<your-username>.github.io\`).
2. Push or upload all files from this unzipped folder into your repository.
3. Note: The included \`.nojekyll\` file ensures GitHub serves pure static HTML without Jekyll filtering.
4. Go to repository **Settings** > **Pages** > Select branch (e.g. \`main\` or \`gh-pages\`) and folder \`/\` (root) > Click **Save**.

### 2. Netlify (Drag & Drop)
1. Open https://app.netlify.com/drop
2. Drag and drop this ZIP file or the unzipped folder.
3. Your site is deployed in seconds with free SSL and global CDN.

### 3. Vercel
1. Install Vercel CLI: \`npm i -g vercel\`
2. Run \`vercel\` in this folder, or import the repository in the Vercel web dashboard.
3. The included \`vercel.json\` is already configured.

### 4. Cloudflare Pages
1. Go to Cloudflare Dashboard > **Workers & Pages** > **Create application** > **Pages**.
2. Choose **Direct Upload** and drop this folder.

### 5. Traditional Web Hosting (cPanel / Apache / Nginx)
1. Unzip the archive.
2. Upload all files into your \`public_html\` directory via cPanel File Manager or FTP/SFTP.
`;
  archive.append(deploymentReadme, { name: "README_DEPLOYMENT.md" });
  fileCount++;

  // Finalize archive
  await archive.finalize();
  const zipBuffer = await completionPromise;

  const sanitizedSlug = slugOrDomain
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();

  return {
    buffer: zipBuffer,
    filename: `${sanitizedSlug}-website.zip`,
    totalFiles: fileCount,
  };
}
