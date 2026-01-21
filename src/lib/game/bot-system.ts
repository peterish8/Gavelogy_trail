export const BOT_NAMES = [
  // Male Names
  "Aarav", "Vivaan", "Aditya", "Arjun", "Karthik", "Rohan", "Sarthak", "Nikhil", "Anirudh", "Yash",
  "Varun", "Siddharth", "Akshay", "Pranav", "Abhishek", "Rahul", "Shubham", "Aman", "Mohit", "Kunal",
  "Harsh", "Ayush", "Dev", "Aryan", "Sanjay", "Manish", "Vinay", "Tejas", "Omkar", "Tanmay",
  "Rajat", "Piyush", "Naveen", "Sumanth", "Ritesh", "Sandeep", "Vishal", "Aravind", "Hemant", "Lalit",
  "Suyash", "Abhinav", "Chirag", "Gaurav", "Pratik", "Ankit", "Sameer", "Mayank", "Keshav", "Rohith",
  
  // Female Names
  "Ananya", "Aishwarya", "Kavya", "Pooja", "Nandini", "Riya", "Sanya", "Sneha", "Shreya", "Aditi",
  "Isha", "Neha", "Tanvi", "Diya", "Kritika", "Shruti", "Muskan", "Palak", "Radhika", "Sakshi",
  "Bhavya", "Meera", "Vaishnavi", "Keerthana", "Swathi", "Harini", "Priyanka", "Anusha", "Poonam", "Divya",
  "Chaitra", "Soumya", "Preethi", "Anjali", "Mansi", "Apeksha", "Nisha", "Lavanya", "Simran", "Jyoti",
  "Pallavi", "Ritu", "Shalini", "Namrata", "Gayathri", "Suman", "Sharmila", "Reema", "Kiran", "Shilpa",

  // Set 2 - Mixed
  "Ayaan", "Reyansh", "Ishaan", "Madhav", "Neil", "Hrithik", "Shaurya", "Lakshay", "Uday", "Darshan",
  "Aarohi", "Kiara", "Myra", "Ira", "Tanuja", "Nivedita", "Anika", "Srilakshmi", "Ruchika", "Komal"
];

interface BotProfile {
  name: string;
  accuracy: number; // 0.5 - 0.8
  avgResponseTime: number; // 15000 - 30000 ms
}

export function generateBotPlayer(existingNames: string[] = []): { displayName: string; isBot: boolean } {
  // Filter out used names
  const availableNames = BOT_NAMES.filter(n => !existingNames.includes(n));
  
  // Pick random name
  const name = availableNames.length > 0 
    ? availableNames[Math.floor(Math.random() * availableNames.length)]
    : `Player ${Math.floor(Math.random() * 1000)}`; // Fallback

  return {
    displayName: name,
    isBot: true
  };
}

export function calculateBotResponseTime(): number {
  const rand = Math.random();
  
  // Distribution based on PRD
  if (rand < 0.05) return 8000 + Math.random() * 2000;   // 8-10s (Rare Fast)
  if (rand < 0.40) return 15000 + Math.random() * 5000;  // 15-20s (Fast)
  if (rand < 0.80) return 20000 + Math.random() * 10000; // 20-30s (Avg)
  if (rand < 0.95) return 30000 + Math.random() * 8000;  // 30-38s (Slow)
  return 38000 + Math.random() * 4000;                   // 38-42s (Very Slow)
}

/**
 * Generate a bot accuracy for this game session.
 * Typically 60-80%, rarely 45% or 85%.
 */
export function generateBotAccuracy(): number {
  const rand = Math.random();
  
  // 5% chance of very low accuracy (45-55%)
  if (rand < 0.05) return 0.45 + Math.random() * 0.10;
  
  // 5% chance of very high accuracy (80-85%)
  if (rand > 0.95) return 0.80 + Math.random() * 0.05;
  
  // 90% chance of typical accuracy (60-80%)
  return 0.60 + Math.random() * 0.20;
}

export function shouldBotAnswerCorrectly(accuracy = 0.7): boolean {
  return Math.random() < accuracy;
}

/**
 * Simulates bot answers for a set of questions.
 * Uses timeouts to mimic human timing.
 */
export function simulateBotAnswers(
  botProfile: BotProfile, 
  questions: any[], 
  onAnswer: (questionIndex: number, answer: string, timeTaken: number) => void
) {
  questions.forEach((question, index) => {
    // 1. Determine correctness
    const isCorrect = shouldBotAnswerCorrectly(botProfile.accuracy);
    
    // 2. Select answer based on correctness
    // Note: This requires the question object to have 'options' and 'correctAnswer' or equivalent logic
    // For Phase 1 client-side sim, we might assume we know the correct answer or just pick randomly if correct
    let answer = "";
    if (isCorrect && question.correct_answer) {
       answer = question.correct_answer;
    } else {
       // Pick a wrong option
       const options = question.options || ['A', 'B', 'C', 'D'];
       const correct = question.correct_answer;
       const wrongOptions = options.filter((o: string) => o !== correct);
       answer = wrongOptions.length > 0 
         ? wrongOptions[Math.floor(Math.random() * wrongOptions.length)]
         : options[0]; // Fallback
    }
    
    // 3. Determine time
    const timeTaken = calculateBotResponseTime();
    
    // 4. Schedule answer
    // We add a small staggered delay per question so they don't all start timer at 0 if we call this loop at once
    // But typically we simulate one question at a time.
    // However, if we want to "schedule" the whole game:
    // NOT RECOMMENDED. Better to call this function Once per question when it starts.
    
    // Let's assume this is called for the CURRENT question only.
    setTimeout(() => {
      onAnswer(index, answer, timeTaken);
    }, timeTaken);
  });
}

/**
 * Simulates a single bot answer for the current question
 */
export function simulateSingleBotAnswer(
  botProfile: BotProfile | any, // Loose type as we might not have full profile stored exactly
  question: any,
  onAnswer: (answer: string, timeTaken: number) => void
) {
    if (!question) return;

    // 1. Determine correctness
    // Default accuracy 70% if not in profile
    const accuracy = botProfile.accuracy || 0.7; 
    const isCorrect = shouldBotAnswerCorrectly(accuracy);
    
    // 2. Select answer
    let answer = "";
    // If we have access to correct_answer (client-side admin/bot logic)
    // NOTE: In secured backend, we wouldn't send correct_answer. 
    // BUT for Phase 1 MVP client-simulated bots, we likely have it or just pick random options.
    // If we don't have correct_answer, we just pick random options.
    const options = question.options || ['A', 'B', 'C', 'D'];
    
    // Use stored correct answer or just pick one
    const correctAnswer = question.correct_answer || question.correctAnswer;
    
    if (isCorrect && correctAnswer) {
       answer = correctAnswer;
    } else if (correctAnswer) {
       const wrongOptions = options.filter((o: string) => o !== correctAnswer);
       answer = wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
    } else {
       // Fallback: just pick random
       answer = options[Math.floor(Math.random() * options.length)];
    }
    
    // 3. Determine time
    const timeTaken = calculateBotResponseTime();
    
    // 4. Schedule
    setTimeout(() => {
      onAnswer(answer, timeTaken);
    }, timeTaken);
}
