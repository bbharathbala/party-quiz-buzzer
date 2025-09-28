import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../server';
import { requireHostAuth } from '../../../lib/auth';

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { questions: true }
        }
      }
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { message: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!requireHostAuth(request)) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { name, description, coverImageUrl, order } = await request.json();

    if (!name?.trim()) {
      return NextResponse.json(
        { message: 'Category name is required' },
        { status: 400 }
      );
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        description: description?.trim(),
        coverImageUrl,
        order: order || 0,
      }
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { message: 'Failed to create category' },
      { status: 500 }
    );
  }
}
