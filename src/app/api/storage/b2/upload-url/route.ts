import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({
  endpoint: process.env.BACKBLAZE_BUCKET_ENDPOINT!,
  region: 'eu-central-003', // Using eu-central-003 matching endpoint
  credentials: {
    accessKeyId: process.env.BACKBLAZE_KEY_ID!,
    secretAccessKey: process.env.BACKBLAZE_APP_KEY!,
  },
});

export async function POST(req: Request) {
  try {
    const { filename, contentType } = await req.json();

    if (!filename || !contentType) {
      return NextResponse.json({ error: 'Missing filename or contentType' }, { status: 400 });
    }

    const fileExtension = filename.split('.').pop() || 'pdf';
    const uniqueFileKey = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExtension}`;
    
    const command = new PutObjectCommand({
      Bucket: process.env.BACKBLAZE_BUCKET_NAME!,
      Key: uniqueFileKey,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
    
    // Create the final public URL that will be stored in Convex Database
    // Endpoint is typically https://s3.eu-central-003.backblazeb2.com
    const cleanEndpoint = process.env.BACKBLAZE_BUCKET_ENDPOINT!.replace('https://', '');
    const publicUrl = `https://${process.env.BACKBLAZE_BUCKET_NAME}.${cleanEndpoint}/${uniqueFileKey}`;

    return NextResponse.json({
      uploadUrl,
      publicUrl,
      fileKey: uniqueFileKey,
    });
  } catch (error: any) {
    console.error('Error generating B2 upload URL:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
