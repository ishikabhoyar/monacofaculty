/**
 * Test script to verify that consecutive roll numbers get different questions
 * 
 * This script demonstrates the anti-cheating mechanism where:
 * - Students with consecutive roll numbers will NOT receive the same questions
 * - Each student gets a unique set of questions based on their roll number
 * 
 * Run with: node test-consecutive-allocation.js
 */

const QuestionAllocator = require('./utils/questionAllocator');

// Simulate the allocation logic without database
function simulateAllocation() {
  console.log('========================================');
  console.log('Anti-Cheating Question Allocation Test');
  console.log('========================================\n');

  // Example scenario
  const totalQuestions = 10;
  const questionsPerStudent = 2;
  const numberOfStudents = 10;
  
  console.log('Test Scenario:');
  console.log(`- Total Questions Available: ${totalQuestions}`);
  console.log(`- Questions per Student: ${questionsPerStudent}`);
  console.log(`- Number of Students: ${numberOfStudents}`);
  console.log('\n');

  // Create sample questions (IDs 1-10)
  const allQuestions = Array.from({ length: totalQuestions }, (_, i) => i + 1);
  
  console.log(`Question Pool: [${allQuestions.join(', ')}]\n`);
  console.log('========================================');
  console.log('Allocation Results (by Roll Number):');
  console.log('========================================\n');

  const allocations = [];
  
  // Simulate students with consecutive roll numbers
  for (let i = 0; i < numberOfStudents; i++) {
    const rollNumber = `16010125${String(i + 1).padStart(3, '0')}`; // e.g., 16010125001, 16010125002, etc.
    const seed = QuestionAllocator.extractRollNumberSeed(rollNumber);
    const allocatedQuestions = QuestionAllocator.allocateQuestionsWithRotation(
      allQuestions,
      seed,
      questionsPerStudent
    );
    
    allocations.push({
      rollNumber,
      seed,
      questions: allocatedQuestions
    });
    
    console.log(`Student ${i + 1}:`);
    console.log(`  Roll Number: ${rollNumber}`);
    console.log(`  Seed: ${seed}`);
    console.log(`  Allocated Questions: [${allocatedQuestions.join(', ')}]`);
    console.log('');
  }

  // Verify no consecutive students have identical question sets
  console.log('========================================');
  console.log('Anti-Cheating Verification:');
  console.log('========================================\n');

  let violations = 0;
  let differentPairs = 0;

  for (let i = 0; i < allocations.length - 1; i++) {
    const student1 = allocations[i];
    const student2 = allocations[i + 1];
    
    // Check if question sets are identical
    const q1 = student1.questions.sort().join(',');
    const q2 = student2.questions.sort().join(',');
    const areIdentical = q1 === q2;
    
    // Calculate overlap percentage
    const set1 = new Set(student1.questions);
    const set2 = new Set(student2.questions);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const overlapPercent = (intersection.size / questionsPerStudent) * 100;
    
    if (areIdentical) {
      violations++;
      console.log(`❌ VIOLATION: Students ${i + 1} and ${i + 2} have IDENTICAL questions!`);
      console.log(`   ${student1.rollNumber}: [${student1.questions.join(', ')}]`);
      console.log(`   ${student2.rollNumber}: [${student2.questions.join(', ')}]`);
      console.log('');
    } else {
      differentPairs++;
      console.log(`✅ Students ${i + 1} and ${i + 2}: DIFFERENT question sets`);
      console.log(`   ${student1.rollNumber}: [${student1.questions.join(', ')}]`);
      console.log(`   ${student2.rollNumber}: [${student2.questions.join(', ')}]`);
      console.log(`   Overlap: ${intersection.size}/${questionsPerStudent} questions (${overlapPercent.toFixed(0)}%)`);
      console.log('');
    }
  }

  console.log('========================================');
  console.log('Summary:');
  console.log('========================================\n');
  console.log(`Total consecutive pairs checked: ${allocations.length - 1}`);
  console.log(`✅ Pairs with different questions: ${differentPairs}`);
  console.log(`❌ Violations (identical questions): ${violations}`);
  
  if (violations === 0) {
    console.log('\n🎉 SUCCESS! No consecutive students have identical question sets.');
    console.log('   The anti-cheating mechanism is working correctly!');
  } else {
    console.log('\n⚠️  WARNING! Some consecutive students have identical questions.');
    console.log('   The allocation algorithm needs improvement.');
  }

  // Additional statistics
  console.log('\n========================================');
  console.log('Question Distribution Analysis:');
  console.log('========================================\n');

  const questionUsage = {};
  allQuestions.forEach(q => questionUsage[q] = 0);

  allocations.forEach(alloc => {
    alloc.questions.forEach(q => {
      questionUsage[q]++;
    });
  });

  console.log('Question Usage Count:');
  Object.entries(questionUsage).forEach(([question, count]) => {
    const percentage = (count / numberOfStudents * 100).toFixed(0);
    const bar = '█'.repeat(Math.floor(count / 2));
    console.log(`  Q${question}: ${bar} ${count} students (${percentage}%)`);
  });

  // Check for unused questions
  const unusedQuestions = Object.entries(questionUsage)
    .filter(([_, count]) => count === 0)
    .map(([q, _]) => q);

  if (unusedQuestions.length > 0) {
    console.log(`\n⚠️  Unused questions: [${unusedQuestions.join(', ')}]`);
  } else {
    console.log('\n✅ All questions are being used');
  }

  console.log('\n========================================\n');
}

// Run the simulation
if (require.main === module) {
  simulateAllocation();
}

module.exports = simulateAllocation;
