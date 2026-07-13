import { Suspense } from "react";
import { CompareLayout } from "@/components/compare/CompareLayout";

export const metadata = {
  title: "Compare Models — AutarkChat",
  description: "Compare responses from multiple AI models side by side",
};

export default function ComparePage() {
  return (
    <Suspense fallback={null}>
      <CompareLayout />
    </Suspense>
  );
}
