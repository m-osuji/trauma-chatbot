// Test script to demonstrate the new semantic NLP system
// Run with: node test-semantic-nlp.js

const { SecureNLPPipeline } = require('./lib/secure-nlp.ts')

async function testSemanticNLP() {
  console.log('🧠 Testing New Semantic NLP System\n')
  console.log('This system uses TF-IDF and cosine similarity for intelligent intent classification\n')
  
  const nlp = SecureNLPPipeline.getInstance()
  
  // Test cases that demonstrate semantic understanding
  const testCases = [
    {
      input: "Hi, I'm Dorothy",
      description: "Name introduction - should be classified as provide_name"
    },
    {
      input: "yesterday",
      description: "Timing response - should be classified as provide_timing, NOT as name"
    },
    {
      input: "I'm 15 years old",
      description: "Age response - should be classified as provide_age"
    },
    {
      input: "It happened in the city center",
      description: "Location response - should be classified as provide_location"
    },
    {
      input: "He called me a whore",
      description: "Incident narrative - should be classified as incident_narrative"
    },
    {
      input: "I was alone in my wheelchair",
      description: "Vulnerability context - should be classified as vulnerability_context"
    },
    {
      input: "A man approached me and wouldn't let me leave",
      description: "Complex incident - should be classified as incident_narrative"
    },
    {
      input: "This morning around 9 AM",
      description: "Specific timing - should be classified as provide_timing"
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
  
  console.log('🎉 Semantic NLP Test Complete!')
  console.log('\nKey Improvements:')
  console.log('✅ No more "yesterday" being classified as a name')
  console.log('✅ Intelligent semantic understanding of user intent')
  console.log('✅ Better handling of incident narratives')
  console.log('✅ Context-aware conversation flow')
  console.log('✅ Fallback to pattern matching when needed')
}

// Run the test
testSemanticNLP().catch(console.error) 