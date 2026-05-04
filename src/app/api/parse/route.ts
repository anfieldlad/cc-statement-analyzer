import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { CATEGORIES } from "@/types";
import { validateTransactions } from "@/lib/validators";

export const runtime = "nodejs";
export const maxDuration = 30;

const SYSTEM_PROMPT = `You are a financial data extraction engine. Extract ALL transactions from this credit card statement text.

Return a single JSON object with two top-level fields: "currency" and "transactions".

Currency detection:
- "currency" must be the ISO 4217 three-letter code of the statement's primary/billing currency (e.g. "IDR", "USD", "SGD", "EUR", "GBP", "MYR", "JPY", "AUD").
- Detect it from currency symbols ("Rp", "$", "S$", "€", "£", "RM", "¥"), explicit codes, or contextual clues (bank name, country, language).
- If you genuinely cannot determine the currency, return "USD" as a safe default.

For each transaction return: date, merchant, rawMerchant, amount, category.

Merchant fields:
- "merchant": a clean, human-friendly merchant name (e.g. "Grab", "Tokopedia", "PLN", "Spotify"). Title case, no codes.
- "rawMerchant": the merchant descriptor copied VERBATIM from the statement, including all prefix codes, asterisks, transaction IDs, location/city codes, and country suffix (e.g. "GRAB* A-93OSUPQGXFVEAV SOUTH JAKARTAID", "TOKOPEDIA *PLN JAKARTA SELID"). Do NOT shorten or normalize — collapse repeated whitespace only.

Amount rules:
- Use a plain JSON number with NO currency symbol and NO thousands separator.
- Decimal places must match the currency convention: 0 for IDR/JPY/KRW; 2 for USD/EUR/GBP/SGD/MYR/AUD/most others.
- Pay attention to the statement's number formatting:
  * "1.234.567,89" (Indonesian/European style) → 1234567.89
  * "1,234,567.89" (US/UK style) → 1234567.89
- Positive for expenses/charges, negative for payments/credits/refunds.
- If a single transaction is in a foreign currency, use the equivalent shown on the statement in the statement's primary currency.

Map each transaction's category to one of: Dining, Groceries, Transportation, Entertainment, Utilities, Healthcare, Shopping, Subscriptions, Travel, Other.

Dates must be in YYYY-MM-DD format. Do NOT include any account numbers, cardholder names, or PII in any field. Return only the structured object; never wrap with explanation text.`;

const responseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    currency: {
      type: SchemaType.STRING,
      description:
        "ISO 4217 currency code of the statement (e.g. 'IDR', 'USD', 'SGD', 'EUR'). Always 3 uppercase letters.",
    },
    transactions: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          date: {
            type: SchemaType.STRING,
            description: "Transaction date in YYYY-MM-DD format",
          },
          merchant: {
            type: SchemaType.STRING,
            description:
              "Clean, human-friendly merchant name (e.g. 'Grab', 'Tokopedia').",
          },
          rawMerchant: {
            type: SchemaType.STRING,
            description:
              "Verbatim merchant descriptor from the statement, e.g. 'GRAB* A-93OSUPQGXFVEAV SOUTH JAKARTAID'.",
          },
          amount: {
            type: SchemaType.NUMBER,
            description:
              "Transaction amount in the statement's primary currency. Positive = expense, negative = credit.",
          },
          category: {
            type: SchemaType.STRING,
            format: "enum",
            enum: [...CATEGORIES],
          },
        },
        required: [
          "date",
          "merchant",
          "rawMerchant",
          "amount",
          "category",
        ],
      },
    },
  },
  required: ["currency", "transactions"],
};

function errorResponse(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}

export async function POST(req: NextRequest) {
  let body: { text?: string };
  try {
    body = await req.json();
  } catch {
    return errorResponse(400, "Invalid request body");
  }

  const text = body?.text;
  if (typeof text !== "string" || text.trim().length === 0) {
    return errorResponse(400, "No text provided");
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return errorResponse(500, "Service configuration error");
  }

  const MAX_INPUT = 200_000;
  const truncated = text.length > MAX_INPUT ? text.slice(0, MAX_INPUT) : text;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: responseSchema as never,
        temperature: 0.1,
      },
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 28_000);

    let result;
    try {
      result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [{ text: truncated }],
          },
        ],
      });
    } catch (err: unknown) {
      const e = err as { status?: number; message?: string };
      if (e?.status === 429) {
        return errorResponse(429, "Service busy, try again");
      }
      if (e?.message?.toLowerCase().includes("abort")) {
        return errorResponse(504, "Processing timed out");
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }

    const responseText = result.response.text();
    let parsed: unknown;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      return errorResponse(500, "Failed to parse transactions");
    }

    const root =
      parsed && typeof parsed === "object"
        ? (parsed as { currency?: unknown; transactions?: unknown })
        : {};
    const currency =
      typeof root.currency === "string" &&
      /^[A-Z]{3}$/.test(root.currency.trim().toUpperCase())
        ? root.currency.trim().toUpperCase()
        : "USD";

    const { valid, rejected } = validateTransactions(root.transactions);
    return NextResponse.json({ currency, transactions: valid, rejected });
  } catch {
    return errorResponse(500, "An unexpected error occurred");
  }
}
