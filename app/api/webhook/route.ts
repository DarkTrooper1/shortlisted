import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { redis, SESSION_TTL } from "@/lib/redis";
import { runPaidAnalysis } from "@/lib/claude";
import { sendResultsEmail } from "@/lib/email";
import type { PaidAnalysis } from "@/lib/types";

function verifySignature(rawBody: string, signature: string): boolean {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET!;
  const digest = createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const rawBody = await req.text();

  if (!verifySignature(rawBody, signature)) {
    console.error("Lemon Squeezy webhook signature verification failed");
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 400 }
    );
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const eventName = payload.meta &&
    typeof payload.meta === "object" &&
    "event_name" in (payload.meta as object)
      ? (payload.meta as Record<string, unknown>).event_name
      : null;

  if (eventName === "order_created") {
    const meta = payload.meta as Record<string, unknown>;
    const customData = meta.custom_data as Record<string, string> | undefined;
    const sessionId = customData?.sessionId;
    const email = customData?.email ?? "";

    if (!sessionId) {
      console.error("No sessionId in Lemon Squeezy custom_data");
      return NextResponse.json({ received: true });
    }

    try {
      // Retrieve the original statement from Redis
      const metaRaw = await redis.get<string>(`session:${sessionId}:meta`);
      if (!metaRaw) {
        console.error(`Session meta not found for ${sessionId}`);
        return NextResponse.json({ received: true });
      }

      const sessionMeta =
        typeof metaRaw === "string" ? JSON.parse(metaRaw) : metaRaw;
      const statement: string = sessionMeta.statement;

      // Run paid analysis
      const rawJson = await runPaidAnalysis(statement);
      let analysis: PaidAnalysis;
      try {
        analysis = JSON.parse(rawJson);
      } catch {
        const match = rawJson.match(/\{[\s\S]*\}/);
        if (!match)
          throw new Error("Failed to parse paid Claude response as JSON");
        analysis = JSON.parse(match[0]);
      }

      // Store paid result in Redis
      await redis.set(
        `session:${sessionId}:paid`,
        JSON.stringify(analysis),
        { ex: SESSION_TTL }
      );

      // Send email if we have one
      if (email) {
        try {
          await sendResultsEmail(email, sessionId, analysis);
        } catch (emailErr) {
          // Non-fatal: log but don't fail the webhook
          console.error("Failed to send results email:", emailErr);
        }
      }
    } catch (err) {
      console.error("Error processing paid analysis:", err);
      // Return 200 to prevent Lemon Squeezy from retrying for non-retriable errors
      return NextResponse.json({ received: true });
    }
  }

  return NextResponse.json({ received: true });
}
