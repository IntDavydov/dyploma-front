import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { context, data, messages } = await req.json();
    const apiKey = process.env.OPENROUTER_API_KEY?.trim();

    if (!apiKey) {
      console.error("AI Error: OPENROUTER_API_KEY is not defined in environment variables.");
      return NextResponse.json({ error: "Missing OpenRouter API Key on server" }, { status: 500 });
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "http://localhost:3000", // Required by OpenRouter
        "X-Title": "Shop-Sync Gateway",           // Optional: Your app name
      },
      body: JSON.stringify({
        model: "mistralai/mistral-7b-instruct:free", // Mistral free model on OpenRouter
        messages: [
          {
            role: "system",
            content: `You are a professional supply chain analyst for the Shop-Sync Gateway. 
            Context: ${context}. 
            Current Data: ${JSON.stringify(data).slice(0, 4000)}.
            Rules: Keep answers extremely short (2-3 sentences max). Be precise and professional.`
          },
          ...messages
        ],
        max_tokens: 150,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("OpenRouter API Error Details:", JSON.stringify(result, null, 2));
      return NextResponse.json(
        { error: result.error?.message || `AI Service Error: ${response.status}` },
        { status: response.status }
      );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Internal Chat Route Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
