const { S3Client } = require("@aws-sdk/client-s3");

const initR2 = () => {
    const accountId = process.env.R2_ACCOUNT_ID?.trim();
    const endpoint = process.env.R2_ENDPOINT?.trim();
    const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();

    if (!accountId || !accessKeyId || !secretAccessKey) {
        console.warn("R2 credentials missing, skipping R2 init");
        return null;
    }

    return new S3Client({
        region: "auto",
        // Cloudflare R2 expects the account endpoint, and bucket names should be
        // addressed via the request path rather than embedded in the hostname.
        endpoint: endpoint || `https://${accountId}.r2.cloudflarestorage.com`,
        forcePathStyle: true,
        credentials: {
            accessKeyId,
            secretAccessKey,
        },
    });
};

const getR2Client = () => {
    const client = initR2();
    if (!client) {
        throw new Error("R2 Client not initialized properly");
    }
    return client;
};

module.exports = { getR2Client };
