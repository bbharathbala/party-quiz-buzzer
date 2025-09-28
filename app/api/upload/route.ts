import { NextRequest, NextResponse } from 'next/server';
import { requireHostAuth } from '../../../lib/auth';
import { validateFileUpload } from '../../../lib/utils';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    if (!requireHostAuth(request)) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { message: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file
    const validation = validateFileUpload({
      size: file.size,
      mimetype: file.type,
    });

    if (!validation.valid) {
      return NextResponse.json(
        { message: validation.error },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const filename = `${timestamp}.${extension}`;
    const filepath = join(process.cwd(), 'public', 'uploads', filename);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    const fileUrl = `/uploads/${filename}`;

    return NextResponse.json({ url: fileUrl });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { message: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
