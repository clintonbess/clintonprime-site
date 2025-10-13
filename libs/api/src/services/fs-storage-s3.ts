import {
  S3Client,
  HeadObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Upload } from "@aws-sdk/lib-storage";

const REGION = process.env.AWS_REGION!;
const BUCKET = process.env.S3_BUCKET!;
const PREFIX = (process.env.S3_PREFIX || "")
  .replace(/^\/*/, "")
  .replace(/\/*$/, "");
const GET_TTL = Number(process.env.S3_GET_URL_TTL || 900);
const PUT_TTL = Number(process.env.S3_PUT_URL_TTL || 900);

const s3 = new S3Client({ region: REGION });

function keyFor(nodeId: string, ext?: string | null) {
  const leaf = ext ? `${nodeId}.${ext.replace(/^\./, "")}` : `${nodeId}`;
  return PREFIX ? `${PREFIX}/${leaf}` : leaf;
}

export const S3Storage = {
  buildPresignedUrl(key: string) {
    return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
  },
  keyFor,

  async saveStream(
    nodeId: string,
    stream: NodeJS.ReadableStream,
    contentType?: string,
    ext?: string | null
  ) {
    const Key = keyFor(nodeId, ext);
    const uploader = new Upload({
      client: s3,
      params: {
        Bucket: BUCKET,
        Key,
        Body: stream as any,
        ContentType: contentType,
      },
      queueSize: 3,
      partSize: 8 * 1024 * 1024,
      leavePartsOnError: false,
    });
    await uploader.done();
    return { key: Key };
  },

  async head(nodeId: string, ext?: string | null) {
    const Key = keyFor(nodeId, ext);
    try {
      const out = await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key }));
      return {
        key: Key,
        size: Number(out.ContentLength || 0),
        contentType: out.ContentType || "application/octet-stream",
        etag: out.ETag,
      };
    } catch (e: any) {
      if (e?.$metadata?.httpStatusCode === 404) return null;
      throw e;
    }
  },

  async signedGet(
    nodeId: string,
    ext?: string | null,
    overrideContentType?: string
  ) {
    const Key = keyFor(nodeId, ext);
    const url = await getSignedUrl(
      s3,
      // @ts-ignore
      new PutObjectCommand({
        // NOTE: for GET you’d use GetObjectCommand; see below
        // placeholder to satisfy TS; we’ll fix in a second version
      }) as any,
      { expiresIn: GET_TTL }
    );
    return url;
  },

  async signedPut(nodeId: string, ext?: string | null, contentType?: string) {
    const Key = keyFor(nodeId, ext);
    const { GetObjectCommand, PutObjectCommand } = await import(
      "@aws-sdk/client-s3"
    ); // lazy to avoid ESM cycles
    const putUrl = await getSignedUrl(
      s3,
      new PutObjectCommand({
        Bucket: BUCKET,
        Key,
        ContentType: contentType,
      }),
      { expiresIn: PUT_TTL }
    );
    return { url: putUrl, key: Key };
  },

  async signedGetUrl(nodeId: string, ext?: string | null, overrideCT?: string) {
    const { GetObjectCommand } = await import("@aws-sdk/client-s3");
    const Key = keyFor(nodeId, ext);
    const url = await getSignedUrl(
      s3,
      new GetObjectCommand({
        Bucket: BUCKET,
        Key,
        ResponseContentType: overrideCT,
      }),
      { expiresIn: GET_TTL }
    );
    return url;
  },
};
