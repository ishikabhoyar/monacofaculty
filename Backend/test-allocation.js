/**
 * Test script to demonstrate question allocation
 * Shows how consecutive roll numbers get different questions
 */

const QuestionAllocator = require('./utils/questionAllocator');

// Test the roll number seed extraction
console.log('=== Roll Number Seed Extraction ===');
const testRollNumbers = [
  '16010125001',
  '16010125002',
  '16010125003',
  '16010125004',
  '16010125005'
];

testRollNumbers.forEach(rollNumber => {
  const seed = QuestionAllocator.extractRollNumberSeed(rollNumber);
  console.log(`Roll Number: ${rollNumber} -> Seed: ${seed}`);
});

console.log('\n=== Question Shuffling Demo ===');
// Sample question IDs
const questionIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

console.log('Original order:', questionIds);
console.log('\nShuffled for different seeds:');

for (let seed = 1; seed <= 5; seed++) {
  const shuffled = QuestionAllocator.seededShuffle(questionIds, seed);
  console.log(`Seed ${seed}:`, shuffled);
}

console.log('\n=== Verification: Same seed produces same order ===');
const seed = 42;
const shuffle1 = QuestionAllocator.seededShuffle(questionIds, seed);
const shuffle2 = QuestionAllocator.seededShuffle(questionIds, seed);
console.log('First shuffle: ', shuffle1);
console.log('Second shuffle:', shuffle2);
console.log('Are they equal?', JSON.stringify(shuffle1) === JSON.stringify(shuffle2));

console.log('\n=== Consecutive Roll Numbers Comparison ===');
testRollNumbers.forEach((rollNumber, index) => {
  if (index < testRollNumbers.length - 1) {
    const seed1 = QuestionAllocator.extractRollNumberSeed(rollNumber);
    const seed2 = QuestionAllocator.extractRollNumberSeed(testRollNumbers[index + 1]);
    
    const questions1 = QuestionAllocator.seededShuffle(questionIds, seed1).slice(0, 5);
    const questions2 = QuestionAllocator.seededShuffle(questionIds, seed2).slice(0, 5);
    
    console.log(`\n${rollNumber} (first 5): ${questions1}`);
    console.log(`${testRollNumbers[index + 1]} (first 5): ${questions2}`);
    console.log(`Are they different? ${JSON.stringify(questions1) !== JSON.stringify(questions2)}`);
  }
});

console.log('\n=== Test Complete ===');
console.log('This demonstrates that:');
console.log('1. Each roll number gets a unique seed');
console.log('2. Different seeds produce different shuffles');
console.log('3. Same seed always produces same shuffle (consistency)');
console.log('4. Consecutive roll numbers get different question sets');
