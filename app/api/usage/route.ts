import { NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/auth";
import { getTokenUsageMetrics } from "@/lib/queries";
import { format, subDays } from "date-fns";

export async function GET() {
  if (!await verifyAdminAuth()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rawMetrics = await getTokenUsageMetrics();

    // Summarize totals
    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;

    rawMetrics.forEach((m) => {
      totalPromptTokens += m.promptTokens || 0;
      totalCompletionTokens += m.completionTokens || 0;
    });

    // Approximate cost: $0.15/1M input, $0.60/1M output
    const promptCost = (totalPromptTokens / 1000000) * 0.15;
    const completionCost = (totalCompletionTokens / 1000000) * 0.6;
    const totalCost = promptCost + completionCost;

    // Aggregate by day for last 7 days
    const dailyMap = new Map<string, { prompt: number; completion: number }>();
    for (let i = 6; i >= 0; i--) {
      const dateStr = format(subDays(new Date(), i), "yyyy-MM-dd");
      dailyMap.set(dateStr, { prompt: 0, completion: 0 });
    }

    rawMetrics.forEach((m) => {
      const dateStr = format(new Date(m.createdAt), "yyyy-MM-dd");
      if (dailyMap.has(dateStr)) {
        const current = dailyMap.get(dateStr)!;
        current.prompt += m.promptTokens || 0;
        current.completion += m.completionTokens || 0;
      }
    });

    const dailyUsage = Array.from(dailyMap.entries()).map(([date, tokens]) => ({
      date,
      promptTokens: tokens.prompt,
      completionTokens: tokens.completion,
      totalTokens: tokens.prompt + tokens.completion,
    }));

    return NextResponse.json({
      summary: {
        totalPromptTokens,
        totalCompletionTokens,
        totalTokens: totalPromptTokens + totalCompletionTokens,
        totalCost: Number(totalCost.toFixed(5)),
      },
      dailyUsage,
      recentUsage: rawMetrics.slice(0, 50).map((m) => ({
        id: m.id,
        chatId: m.chatId,
        modelId: m.modelId,
        promptTokens: m.promptTokens,
        completionTokens: m.completionTokens,
        totalTokens: m.totalTokens,
        createdAt: m.createdAt,
      })),
    });
  } catch (error) {
    console.error("GET /api/usage error:", error);
    return NextResponse.json({ error: "Failed to load usage statistics" }, { status: 500 });
  }
}
