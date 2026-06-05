import React, { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  title: string;
  className?: string;
  maxPx?: number;
  minPx?: number;
};

/**
 * 한 줄 평가 제목 — 잘림 없이 컨테이너 너비에 맞게 글자 크기·축소를 조절합니다.
 */
export default function PeerEvaluationTitleLine({
  title,
  className = "",
  maxPx = 24,
  minPx = 10,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const [fit, setFit] = useState({ fontSize: maxPx, scale: 1 });

  const label = `"${title}"`;

  const updateFit = useCallback(() => {
    const container = containerRef.current;
    const text = textRef.current;
    if (!container || !text) return;

    const available = container.clientWidth;
    if (available <= 0) return;

    let fontSize = maxPx;
    text.style.fontSize = `${fontSize}px`;
    text.style.whiteSpace = "nowrap";
    text.style.transform = "none";
    text.style.width = "auto";

    while (fontSize > minPx && text.scrollWidth > available) {
      fontSize -= 0.5;
      text.style.fontSize = `${fontSize}px`;
    }

    let scale = 1;
    if (text.scrollWidth > available) {
      scale = available / text.scrollWidth;
    }

    setFit({ fontSize, scale });
  }, [label, maxPx, minPx]);

  useEffect(() => {
    updateFit();
    const container = containerRef.current;
    if (!container) return undefined;

    const observer = new ResizeObserver(() => updateFit());
    observer.observe(container);
    return () => observer.disconnect();
  }, [updateFit]);

  const lineHeight = 1.15;

  return (
    <div
      ref={containerRef}
      className="w-full min-w-0"
      style={{
        height: fit.scale < 1 ? `${fit.fontSize * lineHeight * fit.scale}px` : undefined,
      }}
    >
      <p
        ref={textRef}
        className={`font-extrabold leading-tight tracking-tight text-[#101828] ${className}`}
        style={{
          fontSize: `${fit.fontSize}px`,
          lineHeight,
          whiteSpace: "nowrap",
          transform: fit.scale < 1 ? `scale(${fit.scale})` : undefined,
          transformOrigin: "left center",
          width: "max-content",
          maxWidth: "none",
        }}
      >
        {label}
      </p>
    </div>
  );
}
