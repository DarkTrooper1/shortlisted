import { NextRequest, NextResponse } from "next/server";
import { lemonSqueezySetup, createCheckout } from "@lemonsqueezy/lemonsqueezy.js";
import { redis } from "@/lib/redis";

function setupLS() {
  lemonSqueezySetup({ apiKey: process.env.LEMONSQUEEZY_API_KEY! });
}

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = (await req.json()) as { sessionId: string };

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 }
      );
    }

    // Retrieve email from session meta
    const metaRaw = await redis.get<string>(`session:${sessionId}:meta`);
    if (!metaRaw) {
      return NextResponse.json(
        { error: "Session not found or expired" },
        { status: 404 }
      );
    }

    const meta = typeof metaRaw === "string" ? JSON.parse(metaRaw) : metaRaw;
    const email: string = meta.email ?? "";

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

    setupLS();

    const { data, error } = await createCheckout(
      process.env.LEMONSQUEEZY_STORE_ID!,
      process.env.LEMONSQUEEZY_VARIANT_ID!,
      {
        checkoutData: {
          email: email || undefined,
          custom: { sessionId, email },
        },
        productOptions: {
          redirectUrl: `${baseUrl}/results?id=${sessionId}&paid=true`,
        },
      }
    );

    if (error || !data?.data?.attributes?.url) {
      console.error("Lemon Squeezy createCheckout error:", error);
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: data.data.attributes.url });
  } catch (err) {
    console.error("/api/checkout error:", err);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
