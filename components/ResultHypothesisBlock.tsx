"use client";

import { forwardRef } from "react";
import type { HypothesisSegments, OutputFocus } from "@/types";
import HypothesisSegmentsDisplay from "./HypothesisSegments";

const FOCUS_LABEL_HYPOTHESIS = "仮説5段";

type ResultHypothesisBlockProps = {
  outputFocus?: OutputFocus | null;
  segments: HypothesisSegments;
  onSegmentsChange?: (segments: HypothesisSegments) => void;
};

const ResultHypothesisBlock = forwardRef<HTMLDivElement, ResultHypothesisBlockProps>(
  ({ outputFocus, segments, onSegmentsChange }, ref) => (
    <div ref={ref} className="scroll-mt-4">
      {outputFocus === "hypothesis" && (
        <p className="mb-2 text-xs font-medium text-primary">
          焦点: {FOCUS_LABEL_HYPOTHESIS}
        </p>
      )}
      <HypothesisSegmentsDisplay
        segments={segments}
        onSegmentsChange={onSegmentsChange}
      />
    </div>
  )
);

ResultHypothesisBlock.displayName = "ResultHypothesisBlock";

export default ResultHypothesisBlock;
