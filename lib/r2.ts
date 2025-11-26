import { S3Client } from "@aws-sdk/client-s3";
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
