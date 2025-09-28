import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../server';
import { requireHostAuth } from '../../../lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');

    const questions = await prisma.question.findMany({
      where: categoryId ? { categoryId } : undefined,
      include: {
        category: true,
        options: true,
      },
      orderBy: { order: 'asc' }
    });

    return NextResponse.json(questions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { message: 'Failed to fetch questions' },
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

    const question = await prisma.question.create({
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
        options: {
          create: options?.map((option: any) => ({
            text: option.text,
            imageUrl: option.imageUrl,
            isCorrect: option.isCorrect || false,
          })) || []
        }
      },
      include: {
        category: true,
        options: true,
      }
    });

    return NextResponse.json(question, { status: 201 });
  } catch (error) {
    console.error('Error creating question:', error);
    return NextResponse.json(
      { message: 'Failed to create question' },
      { status: 500 }
    );
  }
}
