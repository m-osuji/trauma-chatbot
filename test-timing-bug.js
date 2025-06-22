// Test script to debug the timing response issue
// Run with: node test-timing-bug.js

const { SecureNLPPipeline } = require('./lib/secure-nlp.ts')

async function testTimingBug() {
  console.log('🐛 Testing Timing Response Bug\n')
  
  const nlp = SecureNLPPipeline.getInstance()
  
  // Test the specific scenario
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
      description: "Timing response - should extract date and ask for location"
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
      
      // Show trauma indicators
      const activeIndicators = Object.entries(result.indicators)
        .filter(([key, value]) => value === true)
        .map(([key]) => key.replace('has', '').toLowerCase())
      
      if (activeIndicators.length > 0) {
        console.log(`🚨 Trauma Indicators: ${activeIndicators.join(', ')}`)
      }
      
      console.log(`\n${'─'.repeat(80)}\n`)
      
    } catch (error) {
      console.error(`❌ Error processing: ${error.message}`)
      console.log(`\n${'─'.repeat(80)}\n`)
    }
  }
}

// Run the test
testTimingBug().catch(console.error) 