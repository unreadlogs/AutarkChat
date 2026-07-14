"use client";

import { Streamdown } from "streamdown";
import { code } from "@streamdown/code";
import { math } from "@streamdown/math";
import { mermaid } from "@streamdown/mermaid";
import { cjk } from "@streamdown/cjk";
import "katex/dist/katex.min.css";

export function MarkdownContent({ markdown }: { markdown: string }) {
  return (
    <div className="docs-prose">
      <Streamdown
        plugins={{ code, math, mermaid, cjk }}
        shikiTheme={["github-light", "github-dark"]}
        controls={{ code: { copy: true, download: false } }}
      >
        {markdown}
      </Streamdown>
    </div>
  );
}
