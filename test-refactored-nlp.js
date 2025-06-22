// Test script to verify the refactored NLP system
// Run with: node test-refactored-nlp.js

const { SecureNLPPipeline } = require('./lib/secure-nlp.ts')

async function testRefactoredNLP() {
  console.log('🧠 Testing Refactored NLP System - Intelligent Response Priority\n')
  
  const nlp = SecureNLPPipeline.getInstance()
  
  // Test cases covering various scenarios
  const testCases = [
    {
      input: "Hi, I'm Dorothy",
      description: "Name introduction - should ask for age"
    },
    {
      input: "I'm 15",
      description: "Age response - should ask for timing"
    },
    {
      input: "yesterday",
      description: "Timing response - should ask for location"
    },
    {
      input: "I was in the city center",
      description: "Location response - should ask for narrative"
    },
    {
      input: "A man came up to me and wouldn't let me leave",
      description: "Complex trauma - should acknowledge and ask for details"
    },
    {
      input: "I'm in a wheelchair and was alone",
      description: "Vulnerability context - should handle sensitively"
    },
    {
      input: "He threatened to hurt me",
      description: "Threats - should handle with appropriate sensitivity"
    },
    {
      input: "I have photos",
      description: "Evidence mention - should acknowledge and continue"
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
testRefactoredNLP().catch(console.error) 