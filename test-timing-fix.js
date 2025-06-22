// Test script to verify the timing response fix
// Run with: node test-timing-fix.js

const { SecureNLPPipeline } = require('./lib/secure-nlp.ts')

async function testTimingFix() {
  console.log('🔧 Testing Timing Response Fix\n')
  
  const nlp = SecureNLPPipeline.getInstance()
  
  // Test the specific scenario that was broken
  const testCases = [
    {
      input: "Hi, I'm Dorothy",
      description: "Name introduction"
    },
    {
      input: "I'm 15",
      description: "Age response"
    },
    {
      input: "yesterday",
      description: "Timing response - should now ask for location, not age"
    }
  ]
  
  for (const testCase of testCases) {
    console.log(`📝 Input: "${testCase.input}"`)
    console.log(`📋 Description: ${testCase.description}`)
    
    try {
      const result = await nlp.processInput(testCase.input)
      
      console.log(`🎯 Intent: ${result.intent}`)
      console.log(`😰 Risk Level: ${result.riskLevel}`)
      console.log(`📊 Confidence: ${(result.confidence * 100).toFixed(1)}%`)
      console.log(`💬 Response: ${result.response}`)
      
      // Show extracted data
      if (Object.keys(result.extractedData).length > 0) {
        console.log(`📦 Extracted Data:`)
        Object.entries(result.extractedData).forEach(([key, value]) => {
          console.log(`   ${key}: ${value}`)
        })
      }
      
      // Show conversation progress
      console.log(`📈 Conversation Progress:`)
      Object.entries(result.progress).forEach(([key, value]) => {
        if (value === true) {
          console.log(`   ✅ ${key.replace('has', '').toLowerCase()}`)
        }
      })
      
      console.log(`\n${'─'.repeat(80)}\n`)
      
    } catch (error) {
      console.error(`❌ Error processing: ${error.message}`)
      console.log(`\n${'─'.repeat(80)}\n`)
    }
  }
}

// Run the test
testTimingFix().catch(console.error) 