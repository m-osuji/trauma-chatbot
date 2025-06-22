// Test script to demonstrate enhanced NLP capabilities
// Run with: node test-nlp-enhancements.js

const { SecureNLPPipeline } = require('./lib/secure-nlp.ts')

async function testEnhancedNLP() {
  console.log('🧪 Testing Enhanced NLP Pipeline\n')
  
  const nlp = SecureNLPPipeline.getInstance()
  
  // Test cases for relative time expressions
  const testCases = [
    {
      input: "Hi, I'm Dorothy",
      description: "Simple name introduction"
    },
    {
      input: "I'm 15",
      description: "Age response"
    },
    {
      input: "It happened yesterday",
      description: "Relative time - yesterday"
    },
    {
      input: "It was last night around 8pm",
      description: "Relative time with specific time"
    },
    {
      input: "This morning at 9am",
      description: "Relative time - this morning"
    },
    {
      input: "A couple of hours ago",
      description: "Relative time - hours ago"
    },
    {
      input: "Last week on Tuesday",
      description: "Relative time - last week"
    },
    {
      input: "I was in the city center waiting for my mum",
      description: "Location with vulnerability context"
    },
    {
      input: "A man came up to me and wouldn't let me leave",
      description: "Complex trauma - trapped"
    },
    {
      input: "Someone followed me for blocks",
      description: "Complex trauma - stalking"
    },
    {
      input: "He threatened to hurt me",
      description: "Complex trauma - threats"
    },
    {
      input: "I'm in a wheelchair and was alone",
      description: "Vulnerability with disability"
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
testEnhancedNLP().catch(console.error) 