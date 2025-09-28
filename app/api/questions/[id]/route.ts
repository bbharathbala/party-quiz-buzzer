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

    const {
      categoryId,
      type,
      prompt,
      imageUrl,
      audioUrl,
      timeLimitSeconds,
      points,
      answerExplanation,
      order,
      options
    } = await request.json();

    if (!categoryId || !type || !prompt?.trim()) {
      return NextResponse.json(
        { message: 'Category, type, and prompt are required' },
        { status: 400 }
      );
    }

    // Update question
    const question = await prisma.question.update({
      where: { id: params.id },
      data: {
        categoryId,
        type,
        prompt: prompt.trim(),
        imageUrl,
        audioUrl,
        timeLimitSeconds: timeLimitSeconds || 20,
        points: points || 100,
        answerExplanation: answerExplanation?.trim(),
        order: order || 0,
      },
      include: {
        category: true,
        options: true,
      }
    });

    // Update options if provided
    if (options) {
      // Delete existing options
      await prisma.option.deleteMany({
        where: { questionId: params.id }
      });

      // Create new options
      await prisma.option.createMany({
        data: options.map((option: any) => ({
          questionId: params.id,
          text: option.text,
          imageUrl: option.imageUrl,
          isCorrect: option.isCorrect || false,
        }))
      });
    }

    return NextResponse.json(question);
  } catch (error) {
    console.error('Error updating question:', error);
    return NextResponse.json(
      { message: 'Failed to update question' },
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

    await prisma.question.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting question:', error);
    return NextResponse.json(
      { message: 'Failed to delete question' },
      { status: 500 }
    );
  }
}
