import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { RotateCw } from "lucide-react";
import Markdown from "react-markdown";

function ResultAI({
  completion,
  isLoading,
  onCompletion,
  error,
}: {
  completion: string;
  isLoading: boolean;
  onCompletion: () => void;
  error: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(false);

  useEffect(() => {
    setAutoScroll(isLoading);
  }, [isLoading]);

  useEffect(() => {
    if (!autoScroll) {
      return;
    }
    scrollTo();
  });

  function scrollTo() {
    requestAnimationFrame(() => {
      if (
        !scrollRef.current ||
        scrollRef.current.scrollHeight ===
          scrollRef.current.clientHeight + scrollRef.current.scrollTop
      ) {
        return;
      }
      scrollRef.current.scrollTo(0, scrollRef.current.scrollHeight);
    });
  }

  function onScroll(e: HTMLElement) {
    if (!isLoading) {
      return;
    }
    const hitBottom = e.scrollTop + e.clientHeight >= e.scrollHeight - 15;
    if (hitBottom === autoScroll) {
      return;
    }
    setAutoScroll(hitBottom);
  }

  return (
    <div className="h-0 w-full flex-1 sm:max-w-md md:max-w-2xl">
      {isLoading && (
        <div className="h-0">
          <div className="relative -top-8 flex w-fit items-center text-muted-foreground sm:left-2">
            <RotateCw size={16} className="animate-spin" />
            <span className="ml-1 text-sm">AI 分析中...</span>
          </div>
        </div>
      )}
      <div
        ref={scrollRef}
        onScroll={(e) => onScroll(e.currentTarget)}
        className="max-h-full overflow-auto rounded-md border p-3 shadow dark:border-0 dark:bg-secondary/90 dark:shadow-none sm:p-5"
      >
        {error ? (
          <div className="text-destructive">
            请求出错了！
            <br />
            {error}
          </div>
        ) : (
          <Markdown className="prose dark:prose-invert">{completion}</Markdown>
        )}
        {!isLoading && (
          <Button onClick={onCompletion} size="sm" className="mt-2">
            <RotateCw size={18} className="mr-1" />
            换个思路
          </Button>
        )}
      </div>
    </div>
  );
}

export default ResultAI;
