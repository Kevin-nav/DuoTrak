// convex/lib/r2.ts
/**
 * Cloudflare R2 client utilities for Convex actions.
 * R2 is S3-compatible, so we use the AWS SDK.
 */

import {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
    ListObjectsV2Command,
    DeleteObjectsCommand,
} from "@aws-sdk/client-s3";

// R2 configuration from environment variables
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "duotrak";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL; // Optional custom domain

function joinUrl(base: string, path: string): string {
    const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base;
    const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
    return `${normalizedBase}/${normalizedPath}`;
}

function normalizePublicBaseUrl(raw?: string): string | null {
    if (!raw) return null;
    let value = raw.trim();
    if (!value) return null;

    // Allow accidental quoting in env values.
    value = value.replace(/^['"]+|['"]+$/g, "");

    // Default to HTTPS if protocol is omitted.
    if (!/^https?:\/\//i.test(value)) {
        value = `https://${value}`;
    }

    try {
        const parsed = new URL(value);
        // This is the S3 API endpoint, not a browser-public CDN endpoint.
        // Ignore it so we fall back to pub-<account>.r2.dev.
        if (parsed.hostname.endsWith(".r2.cloudflarestorage.com")) {
            return null;
        }
        // r2.dev public URLs are key-only paths. If someone configures
        // ...r2.dev/<bucket>, strip the path to avoid 404s.
        if (parsed.hostname.endsWith(".r2.dev")) {
            parsed.pathname = "";
        }
        return parsed.toString().replace(/\/$/, "");
    } catch {
        return null;
    }
}

/**
 * Creates an S3 client configured for Cloudflare R2.
 */
function createR2Client(): S3Client {
    if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
        throw new Error("R2 credentials not configured in environment variables");
    }

    return new S3Client({
        region: "auto",
        endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId: R2_ACCESS_KEY_ID,
            secretAccessKey: R2_SECRET_ACCESS_KEY,
        },
    });
}

/**
 * Generates the public URL for an R2 object.
 */
export function getR2PublicUrl(key: string): string {
    // If a custom public URL is configured, use it.
    const publicBase = normalizePublicBaseUrl(R2_PUBLIC_URL);
    if (publicBase) {
        return joinUrl(publicBase, key);
    }
    // Otherwise use the R2 public endpoint pattern.
    // Note: r2.dev public URLs are object-key based (no bucket segment in path).
    return `https://pub-${R2_ACCOUNT_ID}.r2.dev/${key}`;
}

/**
 * Uploads a file to R2 storage.
 * 
 * @param key - The path/key for the file in the bucket
 * @param body - The file content as bytes
 * @param contentType - The MIME type of the file
 * @returns The public URL of the uploaded file
 */
export async function uploadToR2(
    key: string,
    body: Uint8Array,
    contentType: string
): Promise<string> {
    const client = createR2Client();

    const command = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: body,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000", // Cache for 1 year
    });

    await client.send(command);

    return getR2PublicUrl(key);
}

/**
 * Deletes a file from R2 storage.
 * 
 * @param key - The path/key of the file to delete
 */
export async function deleteFromR2(key: string): Promise<void> {
    const client = createR2Client();

    const command = new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
    });

    await client.send(command);
}

/**
 * Deletes all files under a prefix from R2 storage.
 */
export async function deletePrefixFromR2(prefix: string): Promise<void> {
    const client = createR2Client();

    const listResponse = await client.send(
        new ListObjectsV2Command({
            Bucket: R2_BUCKET_NAME,
            Prefix: prefix,
        })
    );

    const objects = (listResponse.Contents ?? []).map((item) => ({ Key: item.Key! }));
    if (objects.length === 0) {
        return;
    }

    await client.send(
        new DeleteObjectsCommand({
            Bucket: R2_BUCKET_NAME,
            Delete: { Objects: objects },
        })
    );
}

/**
 * Generates the storage key for a user's profile picture variant.
 */
export function getProfilePictureKey(
    userId: string,
    size: "original" | "xl" | "lg" | "md" | "sm",
    version: number
): string {
    return `profiles/${userId}/${size}_v${version}.webp`;
}
