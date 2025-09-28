import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data
  await prisma.option.deleteMany();
  await prisma.question.deleteMany();
  await prisma.category.deleteMany();

  // Create categories
  const foodCategory = await prisma.category.create({
    data: {
      name: 'Food and Chinese Cooking',
      description: 'Delicious dishes and cooking techniques',
      coverImageUrl: '/uploads/food-category.jpg',
      order: 1,
    }
  });

  const jokesCategory = await prisma.category.create({
    data: {
      name: 'Inside Jokes',
      description: 'Funny moments and memories',
      coverImageUrl: '/uploads/jokes-category.jpg',
      order: 2,
    }
  });

  const travelCategory = await prisma.category.create({
    data: {
      name: 'Travel Moments',
      description: 'Adventures and destinations',
      coverImageUrl: '/uploads/travel-category.jpg',
      order: 3,
    }
  });

  const pollCategory = await prisma.category.create({
    data: {
      name: 'This or That',
      description: 'Opinion polls and preferences',
      coverImageUrl: '/uploads/poll-category.jpg',
      order: 4,
    }
  });

  // Food and Chinese Cooking Questions
  const foodQuestion1 = await prisma.question.create({
    data: {
      categoryId: foodCategory.id,
      type: 'single',
      prompt: 'What is the main ingredient in traditional Chinese dumplings?',
      imageUrl: '/uploads/dumplings.jpg',
      timeLimitSeconds: 20,
      points: 100,
      answerExplanation: 'Dumplings are typically made with wheat flour dough.',
      order: 1,
    }
  });

  await prisma.option.createMany({
    data: [
      { questionId: foodQuestion1.id, text: 'Rice flour', isCorrect: false },
      { questionId: foodQuestion1.id, text: 'Wheat flour', isCorrect: true },
      { questionId: foodQuestion1.id, text: 'Corn flour', isCorrect: false },
      { questionId: foodQuestion1.id, text: 'Potato starch', isCorrect: false },
    ]
  });

  const foodQuestion2 = await prisma.question.create({
    data: {
      categoryId: foodCategory.id,
      type: 'multi',
      prompt: 'Which of the following are common Chinese cooking techniques?',
      timeLimitSeconds: 30,
      points: 150,
      answerExplanation: 'Stir-frying and steaming are fundamental Chinese cooking methods.',
      order: 2,
    }
  });

  await prisma.option.createMany({
    data: [
      { questionId: foodQuestion2.id, text: 'Stir-frying', isCorrect: true },
      { questionId: foodQuestion2.id, text: 'Steaming', isCorrect: true },
      { questionId: foodQuestion2.id, text: 'Deep frying', isCorrect: false },
      { questionId: foodQuestion2.id, text: 'Boiling', isCorrect: true },
    ]
  });

  const foodQuestion3 = await prisma.question.create({
    data: {
      categoryId: foodCategory.id,
      type: 'text',
      prompt: 'Name the famous Chinese dish that translates to "Ants Climbing Trees"',
      timeLimitSeconds: 30,
      points: 200,
      answerExplanation: 'Ants Climbing Trees (蚂蚁上树) is a Sichuan dish with ground pork and glass noodles.',
      order: 3,
    }
  });

  // Inside Jokes Questions
  const jokesQuestion1 = await prisma.question.create({
    data: {
      categoryId: jokesCategory.id,
      type: 'single',
      prompt: 'What was the funniest moment at last year\'s birthday party?',
      imageUrl: '/uploads/birthday-moment.jpg',
      timeLimitSeconds: 15,
      points: 100,
      answerExplanation: 'The cake incident was definitely the highlight!',
      order: 1,
    }
  });

  await prisma.option.createMany({
    data: [
      { questionId: jokesQuestion1.id, text: 'The cake fell over', isCorrect: true },
      { questionId: jokesQuestion1.id, text: 'Someone forgot the candles', isCorrect: false },
      { questionId: jokesQuestion1.id, text: 'The music stopped', isCorrect: false },
      { questionId: jokesQuestion1.id, text: 'Wrong song played', isCorrect: false },
    ]
  });

  const jokesQuestion2 = await prisma.question.create({
    data: {
      categoryId: jokesCategory.id,
      type: 'buzzer',
      prompt: 'Who can name the most embarrassing moment from our family vacation?',
      timeLimitSeconds: 10,
      points: 300,
      answerExplanation: 'The hotel key card incident wins!',
      order: 2,
    }
  });

  // Travel Moments Questions
  const travelQuestion1 = await prisma.question.create({
    data: {
      categoryId: travelCategory.id,
      type: 'single',
      prompt: 'Which country did we visit for the first time together?',
      imageUrl: '/uploads/travel-photo.jpg',
      timeLimitSeconds: 20,
      points: 100,
      answerExplanation: 'Japan was our first international trip together!',
      order: 1,
    }
  });

  await prisma.option.createMany({
    data: [
      { questionId: travelQuestion1.id, text: 'Japan', isCorrect: true },
      { questionId: travelQuestion1.id, text: 'Thailand', isCorrect: false },
      { questionId: travelQuestion1.id, text: 'Italy', isCorrect: false },
      { questionId: travelQuestion1.id, text: 'France', isCorrect: false },
    ]
  });

  const travelQuestion2 = await prisma.question.create({
    data: {
      categoryId: travelCategory.id,
      type: 'text',
      prompt: 'What was the name of the restaurant where we had the best meal during our trip?',
      timeLimitSeconds: 30,
      points: 200,
      answerExplanation: 'Sukiyabashi Jiro was unforgettable!',
      order: 2,
    }
  });

  // This or That (Poll) Questions
  const pollQuestion1 = await prisma.question.create({
    data: {
      categoryId: pollCategory.id,
      type: 'poll',
      prompt: 'What\'s your favorite type of birthday cake?',
      timeLimitSeconds: 15,
      points: 50,
      answerExplanation: 'Chocolate cake is the birthday person\'s favorite!',
      order: 1,
    }
  });

  await prisma.option.createMany({
    data: [
      { questionId: pollQuestion1.id, text: 'Chocolate', isCorrect: true },
      { questionId: pollQuestion1.id, text: 'Vanilla', isCorrect: false },
      { questionId: pollQuestion1.id, text: 'Strawberry', isCorrect: false },
      { questionId: pollQuestion1.id, text: 'Red Velvet', isCorrect: false },
    ]
  });

  const pollQuestion2 = await prisma.question.create({
    data: {
      categoryId: pollCategory.id,
      type: 'poll',
      prompt: 'Which activity do you prefer for birthday celebrations?',
      timeLimitSeconds: 15,
      points: 50,
      answerExplanation: 'Game night is the birthday person\'s choice!',
      order: 2,
    }
  });

  await prisma.option.createMany({
    data: [
      { questionId: pollQuestion2.id, text: 'Game night', isCorrect: true },
      { questionId: pollQuestion2.id, text: 'Movie night', isCorrect: false },
      { questionId: pollQuestion2.id, text: 'Outdoor adventure', isCorrect: false },
      { questionId: pollQuestion2.id, text: 'Dinner party', isCorrect: false },
    ]
  });

  // Create a sample round
  const sampleRoom = await prisma.room.create({
    data: {
      code: 'SAMPLE',
      status: 'lobby',
      settingsJson: JSON.stringify({
        allowAnswerChange: true,
        speedBonus: false,
        streakBonus: false,
        teamMode: false,
        buzzerTopN: 1,
        defaultTimeLimits: {
          single: 20,
          multi: 30,
          text: 30,
          poll: 15,
          buzzer: 10,
        },
        points: {
          single: 100,
          multi: 100,
          text: 100,
          poll: 50,
          buzzer: 200,
        },
      }),
    }
  });

  await prisma.round.create({
    data: {
      roomId: sampleRoom.id,
      name: 'Birthday Round 1',
      questionIdsJson: JSON.stringify([
        foodQuestion1.id,
        jokesQuestion1.id,
        travelQuestion1.id,
        pollQuestion1.id,
        foodQuestion2.id,
        jokesQuestion2.id,
        travelQuestion2.id,
        pollQuestion2.id,
        foodQuestion3.id,
      ]),
      order: 1,
    }
  });

  console.log('✅ Seed completed successfully!');
  console.log(`📊 Created ${await prisma.category.count()} categories`);
  console.log(`❓ Created ${await prisma.question.count()} questions`);
  console.log(`🎯 Created ${await prisma.option.count()} options`);
  console.log(`🏠 Created sample room with code: SAMPLE`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
