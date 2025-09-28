import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../server';
import { requireHostAuth } from '../../../../lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const category = await prisma.category.update({
      where: { id: params.id },
      data: {
        name: name.trim(),
        description: description?.trim(),
        coverImageUrl,
        order: order || 0,
      }
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { message: 'Failed to update category' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!requireHostAuth(request)) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if category has questions
    const questionCount = await prisma.question.count({
      where: { categoryId: params.id }
    });

    if (questionCount > 0) {
      return NextResponse.json(
        { message: 'Cannot delete category with questions' },
        { status: 400 }
      );
    }

    await prisma.category.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { message: 'Failed to delete category' },
      { status: 500 }
    );
  }
}
