// Test for name extraction logic - useful for debugging
const testCases = [
  "dorothy",
  "im dorothy", 
  "i'm dorothy",
  "my name is dorothy",
  "call me dorothy",
  "i am dorothy",
  "Dorothy Smith",
  "just dorothy",
  "hello im dorothy"
]

console.log("Testing name extraction patterns:")
console.log("=" * 40)

testCases.forEach(testCase => {
  const match = testCase.match(/^([a-zA-Z]+)$|im ([a-zA-Z]+)|i'm ([a-zA-Z]+)|my name is ([a-zA-Z]+)|call me ([a-zA-Z]+)|i am ([a-zA-Z]+)/i)
  if (match) {
    const name = match[1] || match[2] || match[3] || match[4] || match[5] || match[6]
    console.log(`✅ "${testCase}" -> "${name}"`)
  } else {
    console.log(`❌ "${testCase}" -> no match`)
  }
})

console.log("\nThis test helps verify that the NLP pipeline can extract names correctly.") 