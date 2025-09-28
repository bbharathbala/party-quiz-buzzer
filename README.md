# 🎉 Birthday Quiz - Party Quiz & Buzzer Game

A real-time party quiz and buzzer web app built with Next.js 14, Socket.IO, and SQLite. Perfect for birthday celebrations and group events!

## 🚀 Quick Start on Replit

### 1. Install Dependencies
```bash
npm i
```

### 2. Setup Database
```bash
npx prisma migrate dev
```

### 3. Seed Sample Data
```bash
npm run seed
```

### 4. Start the Server
```bash
npm run dev
```

The app will be available at `http://localhost:3000` (or your Replit URL).

## 🎮 How to Play

### For Hosts
1. **Open Host Console**: Go to `/host` and enter the admin PIN (default: `change_me`)
2. **Create Content**: Manage categories, questions, and build rounds
3. **Create Room**: Generate a room code and QR code for players to join
4. **Run Game**: Control the quiz flow with keyboard shortcuts

### For Players
1. **Join Room**: Scan QR code or enter room code on the main page
2. **Choose Avatar**: Pick an emoji avatar and enter your nickname
3. **Play**: Answer questions, buzz in for buzzer rounds, and compete for the top spot!

## 🎯 Game Modes

### Quiz Mode
- **Single Choice**: One correct answer
- **Multiple Choice**: Multiple correct answers
- **Text Answer**: Type your response
- **Opinion Poll**: Vote on preferences

### Buzzer Mode
- **Fastest Finger**: First to buzz in wins
- **Top N Rankings**: Show fastest players
- **Host Adjudication**: Mark correct/incorrect answers

## 🎨 Features

### Host Console
- **Content Management**: CRUD for categories, questions, and options
- **Round Builder**: Assemble questions across categories
- **Import/Export**: Backup and share content with signed JSON
- **Image Upload**: Add images to questions and options
- **Game Control**: Start, pause, reveal, and manage game flow

### Real-time Gameplay
- **Live Timers**: Server-authoritative countdown timers
- **Instant Updates**: Real-time score updates and leaderboards
- **Buzzer Rankings**: Live ranking of fastest buzzers
- **Team Mode**: Optional team-based scoring

### Scoring System
- **Flat Points**: Standard point values per question
- **Speed Bonus**: Extra points for quick answers
- **Streak Bonus**: Bonus for consecutive correct answers
- **Team Scores**: Aggregate team performance

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `N` | Next Question |
| `P` | Previous Question |
| `Space` | Pause/Resume Timer |
| `R` | Reveal Answers |
| `L` | Show Leaderboard |
| `B` | Start Buzzer Mode |

## 🔧 Configuration

### Environment Variables
```bash
ADMIN_PIN=change_me                    # Host console access PIN
ROOM_CODE_LENGTH=5                     # Length of room codes
MAX_PLAYERS_PER_ROOM=100               # Maximum players per room
NEXT_PUBLIC_APP_NAME=Birthday Quiz     # App display name
```

### Room Settings
```typescript
{
  allowAnswerChange: boolean,          # Allow players to change answers
  speedBonus: boolean,                 # Enable speed bonus scoring
  streakBonus: boolean,                # Enable streak bonus scoring
  teamMode: boolean,                   # Enable team mode
  buzzerTopN: number,                  # Number of buzzer slots
  defaultTimeLimits: {                 # Default time limits per question type
    single: number,
    multi: number,
    text: number,
    poll: number,
    buzzer: number,
  },
  points: {                           # Point values per question type
    single: number,
    multi: number,
    text: number,
    poll: number,
    buzzer: number,
  }
}
```

## 📱 Mobile Optimization

- **Responsive Design**: Works on all screen sizes
- **Touch-Friendly**: Large buttons and tap targets
- **Haptic Feedback**: Vibration on mobile devices
- **PWA Ready**: Can be installed as an app

## 🖥️ TV Display

- **Large Text**: High contrast, readable fonts
- **Full Screen**: Optimized for projector/TV display
- **Real-time Updates**: Live game state and timers
- **Visual Feedback**: Color-coded answers and results

## 🧪 Testing

Run the test suite:
```bash
npm test
```

Tests include:
- Scoring functions (flat, speed bonus, streaks)
- Buzzer ranking logic and tie handling
- Answer validation for different question types
- Socket.IO event handling

## 📊 Sample Content

The seed script creates:
- **4 Categories**: Food & Chinese Cooking, Inside Jokes, Travel Moments, This or That
- **9 Questions**: Mix of single, multi, text, buzzer, and poll types
- **Sample Round**: "Birthday Round 1" with all questions
- **Test Room**: Room code "SAMPLE" for testing

## 🔒 Security Features

- **Admin PIN Protection**: Host console requires PIN
- **Rate Limiting**: Prevents spam and abuse
- **File Upload Validation**: Secure image uploads
- **Signed JSON**: Tamper-proof import/export
- **Input Sanitization**: XSS protection

## 🚨 Troubleshooting

### Common Issues

**Port Already in Use**
```bash
# Kill process using port 3000
lsof -ti:3000 | xargs kill -9
```

**Database Connection Issues**
```bash
# Reset database
rm prisma/dev.db
npx prisma migrate dev
npm run seed
```

**File Upload Errors**
- Check file size (max 2MB)
- Ensure file type is JPEG/PNG/GIF
- Verify uploads directory exists

**Socket.IO Connection Issues**
- Check if server is running on correct port
- Verify CORS settings
- Check browser console for errors

### Build Issues

**TypeScript Errors**
```bash
npm run lint
```

**Missing Dependencies**
```bash
npm install
```

**Prisma Issues**
```bash
npx prisma generate
npx prisma db push
```

## 🎉 Sample Game Flow

1. **Host Setup**: Create room, configure settings
2. **Player Join**: Players scan QR code and join
3. **Lobby**: Wait for all players, show participant list
4. **Game Start**: Host begins with first question
5. **Question Flow**: 
   - Display question and options
   - Players submit answers
   - Timer counts down
   - Host reveals correct answers
   - Show leaderboard
6. **Buzzer Rounds**: Fastest finger questions
7. **Final Results**: Winner announcement with confetti!

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

MIT License - feel free to use for your own parties and events!

---

**Happy Birthday! 🎂🎉**
