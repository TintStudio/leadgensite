import fs from "fs";
import path from "path";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME || "local-seo-saas";
const publicUrl = process.env.R2_PUBLIC_URL;

export const isR2Configured = Boolean(
  accountId && accessKeyId && secretAccessKey
);

let s3ClientInstance: S3Client | null = null;

function getS3Client(): S3Client | null {
  if (!isR2Configured) {
    return null;
  }

  if (!s3ClientInstance) {
    s3ClientInstance = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: accessKeyId as string,
        secretAccessKey: secretAccessKey as string,
      },
    });
  }

  return s3ClientInstance;
}

/**
 * Uploads a file to storage (Cloudflare R2 if configured, local fallback otherwise).
 */
export async function uploadFileToStorage(
  storageKey: string,
  content: string | Buffer,
  contentType: string = "text/html; charset=utf-8"
): Promise<{ success: boolean; path: string; isR2: boolean }> {
  const s3 = getS3Client();

  if (s3) {
    // 1. Cloudflare R2 Upload
    const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content, "utf8");
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: storageKey,
      Body: buffer,
      ContentType: contentType,
    });

    await s3.send(command);

    const resolvedUrl = publicUrl
      ? `${publicUrl.replace(/\/+$/, "")}/${storageKey}`
      : `r2://${bucketName}/${storageKey}`;

    return {
      success: true,
      path: resolvedUrl,
      isR2: true,
    };
  } else {
    // 2. Local Storage Fallback
    const localBaseDir = path.join(process.cwd(), "storage");
    const targetFilePath = path.join(localBaseDir, storageKey);
    const parentDir = path.dirname(targetFilePath);

    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    fs.writeFileSync(targetFilePath, content);

    return {
      success: true,
      path: `local://storage/${storageKey}`,
      isR2: false,
    };
  }
}

/**
 * Reads a file from storage (R2 or local).
 */
export async function getFileFromStorage(
  storageKey: string
): Promise<Buffer | null> {
  const s3 = getS3Client();

  if (s3) {
    try {
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: storageKey,
      });
      const response = await s3.send(command);
      if (!response.Body) return null;
      const byteArray = await response.Body.transformToByteArray();
      return Buffer.from(byteArray);
    } catch {
      return null;
    }
  } else {
    const targetFilePath = path.join(process.cwd(), "storage", storageKey);
    if (fs.existsSync(targetFilePath)) {
      return fs.readFileSync(targetFilePath);
    }
    return null;
  }
}

/**
 * Lists all file keys under a given prefix.
 */
export async function listStorageFiles(prefix: string): Promise<string[]> {
  const s3 = getS3Client();

  if (s3) {
    try {
      const command = new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: prefix,
      });
      const response = await s3.send(command);
      return (response.Contents || []).map((c) => c.Key || "").filter(Boolean);
    } catch {
      return [];
    }
  } else {
    const localDir = path.join(process.cwd(), "storage", prefix);
    if (!fs.existsSync(localDir)) return [];

    function getAllFiles(dir: string, base: string): string[] {
      let results: string[] = [];
      const list = fs.readdirSync(dir);
      list.forEach((file) => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
          results = results.concat(getAllFiles(fullPath, base));
        } else {
          results.push(path.relative(base, fullPath).replace(/\\/g, "/"));
        }
      });
      return results;
    }

    const localBase = path.join(process.cwd(), "storage");
    return getAllFiles(localDir, localBase);
  }
}
