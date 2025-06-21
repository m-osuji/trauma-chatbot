import { SecureNLPPipeline } from './secure-nlp'

// Test function to verify NLP pipeline
export async function testNLPPipeline() {
  const nlpPipeline = SecureNLPPipeline.getInstance()
  
  const testCases = [
    "Hi I'm Dorothy but idk if i can speak for long",
    "Hi I'm Dorothy but idk if I can speak for long because I think he might hurt me",
    "yes so basically im in a wheelchair which is making this even more difficult for me but i was in central london and this man came up to me",
    "I was assaulted last night by someone I know",
    "He touched me without my consent and I'm scared",
    "I need help immediately, I'm in danger",
    "The incident happened in my apartment building",
    "I'm feeling traumatized and don't know what to do",
    "She forced me to do things I didn't want to do",
    "I'm alone and vulnerable right now",
    "My name is Sarah Johnson",
    "I need help, I'm scared",
    "It happened in Johannesburg",
    "I'm 25 years old and I live in Cape Town",
    "The attacker was someone I knew",
    "I'm feeling terrible about what happened"
  ]
  
  console.log('🧪 Testing Secure NLP Pipeline...')
  
  for (const testCase of testCases) {
    try {
      const result = await nlpPipeline.processInput(testCase)
      console.log(`\n📝 Input: "${testCase}"`)
      console.log(`🎯 Intent: ${result.intent}`)
      console.log(`😊 Sentiment: ${result.sentiment.toFixed(2)}`)
      console.log(`⚠️  Risk Level: ${result.riskLevel}`)
      console.log(`📊 Extracted Data:`, result.extractedData)
      console.log(`💬 Response: "${result.response}"`)
      
      // Debug trauma indicators (if available)
      if ((result as any).indicators) {
        console.log(`🔍 Trauma Indicators:`, (result as any).indicators)
      }
    } catch (error) {
      console.error(`❌ Error processing: "${testCase}"`, error)
    }
  }
  
  console.log('\n✅ NLP Pipeline Test Complete!')
}

// Run test if this file is executed directly
if (typeof window !== 'undefined') {
  // Browser environment - expose for testing
  (window as any).testNLPPipeline = testNLPPipeline
} 