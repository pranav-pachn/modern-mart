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
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400, headers: corsHeaders }
      );
    }

    const prompt = typeof (rawBody as { prompt?: unknown })?.prompt === "string"
      ? (rawBody as { prompt: string }).prompt
      : "";

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

    const systemPrompt = `You are an expert grocery assistant for an Indian supermarket.
Given a dish, recipe, or meal plan, extract all necessary ingredients into a structured JSON grocery list.

CRITICAL RULES:
1. Translate regional/Hindi terms to simple, standard English grocery names (e.g., "pyaz" -> "onion", "bhindi" -> "okra", "adrak" -> "ginger").
2. Use extremely short, simple grocery item names in LOWERCASE ONLY (e.g., "tomato", "paneer", "basmati rice", "milk"). 
3. DO NOT use adjectives like "fresh", "organic", "ripe", "chopped", or brand names.
4. QUANTITY INTELLIGENCE: Calculate quantities intelligently based on the number of people/servings requested (assume 2 people if not specified). 
   - Base Mapping: "paneer" is 250g per 2 people. 
   - Scale appropriately (e.g., qty = baseQty * (people / 2)). Apply similar logical scaling for other ingredients.
   - Use standard units (e.g., "500g", "2 pcs", "1 litre", "1 bunch").
5. ALWAYS include a "suggested" array containing 2-4 optional but highly recommended complementary items that go well with the requested dish.
6. Format EXACTLY as: { "items": [{ "item": "name", "qty": "quantity" }], "suggested": [{ "item": "name", "qty": "quantity" }] }
7. Output ONLY valid JSON. No markdown formatting, no backticks, no explanations.`;

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
        const frontendOrigin = process.env.FRONTEND_ORIGIN ?? process.env.NEXT_PUBLIC_SITE_URL;
        if (frontendOrigin) {
          headers["HTTP-Referer"] = frontendOrigin;
        }
        headers["X-Title"] = "Panchavati Mart";
      }

      const res = await fetch(provider.url, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: provider.model,
          messages,
          temperature: 0.2, // Lower temperature for more structured JSON
          response_format: { type: "json_object" }, // Attempt to force JSON if supported
        }),
      });

      if (!res.ok) {
        lastErrorDetails = res.status;
        providerErrors.push({ provider: provider.name, status: res.status });
        continue;
      }

      responseData = await res.json();
      success = true;
      currentProviderIndex = pIndex;
      break;
    }

    if (!success || !responseData) {
      if (providerErrors.length === providers.length) {
        return NextResponse.json(
          { 
            error: "All AI providers are currently unavailable.", 
            details: providerErrors 
          },
          { status: 503, headers: corsHeaders }
        );
      }

      return NextResponse.json(
        { error: "AI service failed to generate response.", details: lastErrorDetails ?? providerErrors },
        { status: 502, headers: corsHeaders }
      );
    }

    // Extract text from OpenAI/Chat completions standard response
    const text = responseData.choices?.[0]?.message?.content || "{}";

    let parsed: any = { items: [], suggested: [] };
    try {
      let cleanText = text.replace(/```(?:json)?\n?/gi, "").replace(/```/g, "").trim();
      const firstCurly = cleanText.indexOf('{');
      const lastCurly = cleanText.lastIndexOf('}');
      if (firstCurly !== -1 && lastCurly !== -1) {
         cleanText = cleanText.substring(firstCurly, lastCurly + 1);
      }
      
      const tempParsed = JSON.parse(cleanText);
      if (Array.isArray(tempParsed)) {
        parsed = { items: tempParsed, suggested: [] };
      } else if (tempParsed.items && Array.isArray(tempParsed.items)) {
        parsed = { 
          items: tempParsed.items, 
          suggested: Array.isArray(tempParsed.suggested) ? tempParsed.suggested : [] 
        };
      } else {
        parsed = { items: [], suggested: [] };
      }
    } catch (parseError) {
      console.error("AI JSON parse fail:", text);
    }

    return NextResponse.json({ result: parsed }, { headers: corsHeaders });
  } catch (error) {
    console.error("AI route error:", error);
    return NextResponse.json({ error: "Failed AI fetch" }, { status: 500, headers: corsHeaders });
  }
}
