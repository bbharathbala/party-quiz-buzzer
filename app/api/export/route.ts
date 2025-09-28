import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../server';
import { requireHostAuth } from '../../../lib/auth';
import { createSignedJSON } from '../../../lib/utils';

export async function GET(request: NextRequest) {
  try {
    if (!requireHostAuth(request)) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch all content
    const categories = await prisma.category.findMany({
      include: {
        questions: {
          include: {
            options: true
          }
        }
      },
      orderBy: { order: 'asc' }
    });

    const exportData = {
      categories,
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    };

    // Create signed JSON
    const adminPin = process.env.ADMIN_PIN;
    if (!adminPin) {
      return NextResponse.json(
        { message: 'Server configuration error' },
        { status: 500 }
      );
    }

    const signedJson = createSignedJSON(exportData, adminPin);

    return new NextResponse(signedJson, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="quiz-content.json"'
      }
    });
  } catch (error) {
    console.error('Error exporting content:', error);
    return NextResponse.json(
      { message: 'Failed to export content' },
      { status: 500 }
    );
  }
}
