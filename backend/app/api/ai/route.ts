import { NextResponse } from "next/server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

// Global variable to keep track of the last successfully used provider to balance the load or prioritize a working one
let currentProviderIndex = 0;

type ProviderConfig = {
  name: "OpenRouter" | "Groq";
  url: string;
  key: string;
  model: string;
};

function parseApiKeys(raw?: string): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((key) => key.trim())
    .filter(Boolean);
}

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt?.trim()) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400, headers: corsHeaders });
    }

    const providers: ProviderConfig[] = [];

    // Prioritize OpenRouter if configured
    for (const key of parseApiKeys(process.env.OPENROUTER_API_KEY)) {
      providers.push({
        name: "OpenRouter",
        url: "https://openrouter.ai/api/v1/chat/completions",
        key,
        model: "meta-llama/llama-3.1-8b-instruct:free", // Free tier model, highly capable
      });
    }

    // Fallback to Groq if configured
    for (const key of parseApiKeys(process.env.GROQ_API_KEY)) {
      providers.push({
        name: "Groq",
        url: "https://api.groq.com/openai/v1/chat/completions",
        key,
        model: "llama-3.1-8b-instant",
      });
    }

    if (providers.length === 0) {
      console.error("No OPENROUTER_API_KEY or GROQ_API_KEY set in environment");
      return NextResponse.json({ error: "AI service is not configured. Please set OpenRouter or Groq API key." }, { status: 503, headers: corsHeaders });
    }

    // Sanity check to ensure the user didn't leave the placeholder text
    const hasValidKey = providers.some(p => !p.key.includes("your_"));
    if (!hasValidKey) {
      console.error("Only placeholder API keys detected.");
      return NextResponse.json({ error: "Please replace the placeholder API keys in your root .env with your actual keys." }, { status: 503, headers: corsHeaders });
    }

    const systemPrompt = `You are a smart grocery list builder for an Indian grocery store.

Given a dish or a meal plan, extract all necessary ingredients as a JSON grocery list.

Rules:
- Use short, simple item names (e.g. "tomato", "paneer", "onion", "basmati rice")
- Use lowercase only
- Include realistic quantities (e.g. "500g", "2 pcs", "1 litre", "1 bunch")
- Output ONLY valid JSON. No markdown, no explanation, no backticks.
- Format: [{ "item": "name", "qty": "quantity" }]`;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt }
    ];

    let responseData = null;
    let lastErrorDetails: number | null = null;
    const providerErrors: { provider: string; status: number }[] = [];
    let success = false;

    // Retry loop for API Provider Rotation
    for (let attempts = 0; attempts < providers.length; attempts++) {
      const pIndex = (currentProviderIndex + attempts) % providers.length;
      const provider = providers[pIndex];

      const headers: Record<string, string> = {
        "Authorization": `Bearer ${provider.key}`,
        "Content-Type": "application/json",
      };

      if (provider.name === "OpenRouter") {
        headers["HTTP-Referer"] = "http://localhost:3000";
        headers["X-Title"] = "Panchavati Mart";
      }

      const res = await fetch(provider.url, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: provider.model,
          messages: messages,
          temperature: 0.2,
        })
      });

      if (res.ok) {
        responseData = await res.json();
        success = true;
        currentProviderIndex = pIndex; // Save working provider index
        break; // Successfully got the response, break out of loop
      } else {
        const errorText = await res.text();
        console.error(`${provider.name} API error:`, res.status, errorText);
        lastErrorDetails = res.status;
        providerErrors.push({ provider: provider.name, status: res.status });
      }
    }

    if (!success || !responseData) {
      const allAuthErrors =
        providerErrors.length > 0 &&
        providerErrors.every((e) => e.status === 401 || e.status === 403);

      if (allAuthErrors) {
        return NextResponse.json(
          {
            error: "All configured AI keys were rejected by providers. Check OPENROUTER_API_KEY and GROQ_API_KEY in the root .env.",
            details: providerErrors,
          },
          { status: 401, headers: corsHeaders }
        );
      }

      return NextResponse.json(
        { error: "AI service failed to generate response.", details: lastErrorDetails ?? providerErrors },
        { status: 502, headers: corsHeaders }
      );
    }

    // Extract text from OpenAI/Chat completions standard response
    const text = responseData.choices?.[0]?.message?.content || "[]";

    let parsed: any[] = [];
    try {
      const cleanText = text.replace(/```(?:json)?\n?/g, "").replace(/```/g, "").trim();
      parsed = JSON.parse(cleanText);
      if (!Array.isArray(parsed)) parsed = [];
    } catch (parseError) {
      console.error("AI JSON parse fail:", text);
    }

    return NextResponse.json({ result: parsed }, { headers: corsHeaders });
  } catch (error) {
    console.error("AI route error:", error);
    return NextResponse.json({ error: "Failed AI fetch" }, { status: 500, headers: corsHeaders });
  }
}
