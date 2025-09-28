import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../server';
import { requireHostAuth } from '../../../lib/auth';
import { verifySignedJSON } from '../../../lib/utils';

export async function POST(request: NextRequest) {
  try {
    if (!requireHostAuth(request)) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { signedJson } = await request.json();

    if (!signedJson) {
      return NextResponse.json(
        { message: 'Signed JSON is required' },
        { status: 400 }
      );
    }

    // Verify signed JSON
    const adminPin = process.env.ADMIN_PIN;
    if (!adminPin) {
      return NextResponse.json(
        { message: 'Server configuration error' },
        { status: 500 }
      );
    }

    let importData;
    try {
      importData = verifySignedJSON(signedJson, adminPin);
    } catch (error) {
      return NextResponse.json(
        { message: 'Invalid or tampered import file' },
        { status: 400 }
      );
    }

    // Validate import data structure
    if (!importData.categories || !Array.isArray(importData.categories)) {
      return NextResponse.json(
        { message: 'Invalid import data structure' },
        { status: 400 }
      );
    }

    // Clear existing data
    await prisma.option.deleteMany();
    await prisma.question.deleteMany();
    await prisma.category.deleteMany();

    // Import categories and questions
    for (const categoryData of importData.categories) {
      const category = await prisma.category.create({
        data: {
          name: categoryData.name,
          description: categoryData.description,
          coverImageUrl: categoryData.coverImageUrl,
          order: categoryData.order || 0,
        }
      });

      // Import questions for this category
      if (categoryData.questions && Array.isArray(categoryData.questions)) {
        for (const questionData of categoryData.questions) {
          const question = await prisma.question.create({
            data: {
              categoryId: category.id,
              type: questionData.type,
              prompt: questionData.prompt,
              imageUrl: questionData.imageUrl,
              audioUrl: questionData.audioUrl,
              timeLimitSeconds: questionData.timeLimitSeconds || 20,
              points: questionData.points || 100,
              answerExplanation: questionData.answerExplanation,
              order: questionData.order || 0,
            }
          });

          // Import options for this question
          if (questionData.options && Array.isArray(questionData.options)) {
            await prisma.option.createMany({
              data: questionData.options.map((optionData: any) => ({
                questionId: question.id,
                text: optionData.text,
                imageUrl: optionData.imageUrl,
                isCorrect: optionData.isCorrect || false,
              }))
            });
          }
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      importedCategories: importData.categories.length,
      importedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error importing content:', error);
    return NextResponse.json(
      { message: 'Failed to import content' },
      { status: 500 }
    );
  }
}
