import { useState, useRef, useEffect, ReactNode } from "react";
import { cn } from "@/lib/cn";

interface TooltipProps {
  content: string;
  children: ReactNode;
  className?: string;
}

export function Tooltip({ content, children, className }: TooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<{ left?: string; transform?: string }>({
    left: "50%",
    transform: "translateX(-50%)",
  });

  const checkPosition = () => {
    if (!isOpen || !tooltipRef.current || !triggerRef.current) return;
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;

    // Default centered offset of the tooltip relative to the viewport
    const defaultLeft = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
    const defaultRight = defaultLeft + tooltipRect.width;

    let newStyle: typeof style = {
      left: "50%",
      transform: "translateX(-50%)",
    };

    if (defaultLeft < 8) {
      // Shifting right because it overflows the left screen edge
      const shift = 8 - defaultLeft;
      newStyle = {
        left: `calc(50% + ${shift}px)`,
        transform: "translateX(-50%)",
      };
    } else if (defaultRight > viewportWidth - 8) {
      // Shifting left because it overflows the right screen edge
      const shift = defaultRight - (viewportWidth - 8);
      newStyle = {
        left: `calc(50% - ${shift}px)`,
        transform: "translateX(-50%)",
      };
    }

    setStyle(newStyle);
  };

  useEffect(() => {
    if (isOpen) {
      const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
        if (
          triggerRef.current &&
          !triggerRef.current.contains(e.target as Node) &&
          tooltipRef.current &&
          !tooltipRef.current.contains(e.target as Node)
        ) {
          setIsOpen(false);
        }
      };

      const handleResize = () => {
        checkPosition();
      };

      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("touchstart", handleOutsideClick, { passive: true });
      window.addEventListener("resize", handleResize);

      return () => {
        document.removeEventListener("mousedown", handleOutsideClick);
        document.removeEventListener("touchstart", handleOutsideClick);
        window.removeEventListener("resize", handleResize);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      const id = requestAnimationFrame(() => {
        checkPosition();
      });
      return () => cancelAnimationFrame(id);
    }
  }, [isOpen, content]);

  return (
    <span
      ref={triggerRef}
      className="relative inline-flex items-center"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onFocus={() => setIsOpen(true)}
      onBlur={() => setIsOpen(false)}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className={cn(
          "focus:outline-none focus-visible:ring-1 focus-visible:ring-emerald-400 rounded-full inline-flex items-center justify-center p-0.5",
          className
        )}
        aria-label="Show information"
      >
        {children}
      </button>

      {isOpen && (
        <>
          <style>{`
            @keyframes tooltipFadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            .animate-tooltip-fade-in {
              animation: tooltipFadeIn 0.15s ease-out forwards;
            }
          `}</style>
          <div
            ref={tooltipRef}
            role="tooltip"
            style={style}
            className={cn(
              "absolute bottom-full mb-2 w-[220px] sm:w-[260px] p-2.5",
              "bg-zinc-955 text-zinc-100 dark:bg-zinc-900/95 dark:text-zinc-200",
              "text-[11px] leading-normal font-medium rounded-xl shadow-xl",
              "border border-zinc-800 dark:border-zinc-800/80",
              "backdrop-blur-md z-[110] animate-tooltip-fade-in pointer-events-none select-text"
            )}
          >
            {content}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1.5px] border-4 border-transparent border-t-zinc-955 dark:border-t-zinc-900/95" />
          </div>
        </>
      )}
    </span>
  );
}
