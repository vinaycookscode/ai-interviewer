import { DeleteObjectCommand, DeleteObjectsCommand, GetObjectCommand, ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";

// Initialize S3 Client for Cloudflare R2
const R2 = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
    },
});

export async function uploadToR2(file: File | Buffer, fileName: string, folder: string, contentType?: string): Promise<string> {
    const bucketName = process.env.R2_BUCKET_NAME;
    const publicUrl = process.env.R2_PUBLIC_URL;

    if (!bucketName || !publicUrl) {
        throw new Error("R2 configuration missing (R2_BUCKET_NAME or R2_PUBLIC_URL)");
    }

    const key = `${folder}/${fileName}`;

    try {
        const parallelUploads3 = new Upload({
            client: R2,
            params: {
                Bucket: bucketName,
                Key: key,
                Body: file,
                ContentType: contentType || "application/octet-stream",
            },
        });

        await parallelUploads3.done();

        // Return the public URL
        return `${publicUrl}/${key}`;
    } catch (error) {
        console.error("Error uploading to R2:", error);
        // @ts-ignore
        throw new Error(`Failed to upload file to storage: ${error.message}`);
    }
}

/**
 * Read an object from R2. Returns null when it doesn't exist.
 * Used to serve private documents through an authorized route.
 */
export async function getFromR2(key: string): Promise<{ body: Uint8Array; contentType: string } | null> {
    const bucketName = process.env.R2_BUCKET_NAME;
    if (!bucketName) {
        throw new Error("R2 configuration missing (R2_BUCKET_NAME)");
    }

    try {
        const object = await R2.send(new GetObjectCommand({ Bucket: bucketName, Key: key }));
        if (!object.Body) return null;
        return {
            body: await object.Body.transformToByteArray(),
            contentType: object.ContentType || "application/octet-stream",
        };
    } catch (error) {
        if ((error as { name?: string }).name === "NoSuchKey") return null;
        throw error;
    }
}

/** Deletes one object in a user's profile folder, "profiles/<userId>/<file>" (AIIN-224). Missing objects are fine. */
export async function deleteFromR2(key: string): Promise<void> {
    const bucketName = process.env.R2_BUCKET_NAME;
    if (!bucketName) throw new Error("R2 configuration missing (R2_BUCKET_NAME)");
    if (!/^profiles\/[^/]+\/[^/]+$/.test(key)) throw new Error(`Refusing to delete "${key}"`);
    await R2.send(new DeleteObjectCommand({ Bucket: bucketName, Key: key }));
}

/** Deletes every object under a prefix, e.g. "profiles/<userId>/" (AIIN-58). Returns how many were deleted. */
export async function deleteR2Prefix(prefix: string): Promise<number> {
    const bucketName = process.env.R2_BUCKET_NAME;
    if (!bucketName) throw new Error("R2 configuration missing (R2_BUCKET_NAME)");
    // Never the whole bucket, or a sibling folder sharing the start of the name
    if (!/^[a-z]+\/[^/]+\/$/.test(prefix)) throw new Error(`Refusing to delete prefix "${prefix}"`);

    let deleted = 0;
    let token: string | undefined;
    do {
        const page = await R2.send(new ListObjectsV2Command({ Bucket: bucketName, Prefix: prefix, ContinuationToken: token }));
        const keys = (page.Contents ?? []).flatMap((o) => (o.Key ? [{ Key: o.Key }] : []));
        if (keys.length) {
            await R2.send(new DeleteObjectsCommand({ Bucket: bucketName, Delete: { Objects: keys, Quiet: true } }));
            deleted += keys.length;
        }
        token = page.IsTruncated ? page.NextContinuationToken : undefined;
    } while (token);
    return deleted;
}
