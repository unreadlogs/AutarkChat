"use client";

import { memo } from "react";
import type { CompareCardData } from "@/lib/compare/compare-types";
import { CompareCard } from "./CompareCard";

type CompareGridProps = {
  cards: CompareCardData[];
  isGenerating: boolean;
  onRetryModel: (modelId: string) => void;
  onStopGeneration: () => void;
};

function PureCompareGrid({
  cards,
  isGenerating,
  onRetryModel,
  onStopGeneration,
}: CompareGridProps) {
  if (cards.length === 0) return null;

  return (
    <div className="flex-1 overflow-y-auto px-4 pt-4 pb-4">
      <div className="mx-auto max-w-4xl flex flex-col gap-4">
        {cards.map((card) => (
          <CompareCard
            key={card.model.id}
            data={card}
            isGenerating={isGenerating}
            onRetry={onRetryModel}
            onStop={onStopGeneration}
          />
        ))}
      </div>
    </div>
  );
}

export const CompareGrid = memo(PureCompareGrid);
