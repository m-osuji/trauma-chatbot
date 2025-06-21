import type { NextRequest } from "next/server"

export const maxDuration = 30

// Dummy responses for demonstration - replace with your backend logic
const getDummyResponse = (userMessage: string, messageCount: number): string => {
  const responses = [
    // First interaction
    "Thank you for sharing your name with me. I want you to know that you're in a safe space here. Can you tell me a little about what happened, whenever you feel ready?",

    // Follow-up responses
    "I hear you, and I want you to know that what you're sharing takes courage. Can you tell me when this incident occurred?",

    "Thank you for trusting me with this information. You're doing really well. Is there anything specific you'd like help with or any kind of support you're looking for?",

    "I understand. You've been very brave in sharing this with me. Would you be comfortable telling me where this happened, or would you prefer to skip that question?",

    "You're doing great. Is there a preferred way for someone to contact you about next steps - perhaps email, phone, or another method?",

    // General supportive responses
    "I'm here to listen. Take your time - there's no rush at all.",

    "What you're sharing is important, and I want you to know that you're not alone in this.",

    "Thank you for continuing to share with me. Your voice matters.",
  ]

  // Return appropriate response based on message count or content
  if (messageCount === 0) {
    return responses[0]
  } else if (messageCount < responses.length) {
    return responses[messageCount]
  } else {
    // Cycle through supportive responses
    return responses[5 + (messageCount % 3)]
  }
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()

    // Count user messages to determine response
    const userMessageCount = messages.filter((m: any) => m.role === "user").length
    const lastUserMessage =
      messages
        .slice()
        .reverse()
        .find((m: any) => m.role === "user")?.content || ""

    // Get appropriate dummy response
    const responseContent = getDummyResponse(lastUserMessage, userMessageCount - 1)

    // Simulate a brief delay for realism
    await new Promise((resolve) => setTimeout(resolve, 800))

    // Return response in the format expected by useChat
    return new Response(
      JSON.stringify({
        id: Date.now().toString(),
        role: "assistant",
        content: responseContent,
      }),
      {
        headers: { "Content-Type": "application/json" },
      },
    )
  } catch (error) {
    console.error("Chat API error:", error)

    // Fallback response
    return new Response(
      JSON.stringify({
        id: Date.now().toString(),
        role: "assistant",
        content: "I'm here with you. Please feel free to continue whenever you're ready.",
      }),
      {
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
