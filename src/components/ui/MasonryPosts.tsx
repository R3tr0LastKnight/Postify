/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import { gsap } from "gsap";

/**
 * Use Prisma types so the shape exactly matches your server-side data.
 * Type-only import avoids bundling Prisma at runtime.
 */
import type { Post, User, Comment } from "@prisma/client";

/**
 * PostWithRelations type that matches what your server provides:
 * - Post
 * - author: User
 * - comments: (Comment & { author: User })[]
 * - optional _count
 */
export type PostWithRelations = Post & {
  author: User;
  comments: (Comment & { author: User })[];
  _count?: {
    comments: number;
  };
};

/* ---------- hooks (same as before) ---------- */

const useMedia = (
  queries: string[],
  values: number[],
  defaultValue: number
): number => {
  const get = () =>
    values[queries.findIndex((q) => matchMedia(q).matches)] ?? defaultValue;

  const [value, setValue] = useState<number>(get);

  useEffect(() => {
    const handler = () => setValue(get);
    queries.forEach((q) => matchMedia(q).addEventListener("change", handler));
    return () =>
      queries.forEach((q) =>
        matchMedia(q).removeEventListener("change", handler)
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queries.join("|")]);

  return value;
};

const useMeasure = <T extends HTMLElement>() => {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  return [ref, size] as const;
};

const preloadImages = async (urls: string[]): Promise<void> => {
  await Promise.all(
    urls.map(
      (src) =>
        new Promise<void>((resolve) => {
          const img = new window.Image();
          img.src = src;
          img.onload = img.onerror = () => resolve();
        })
    )
  );
};

interface MasonryProps {
  items: PostWithRelations[];
  ease?: string;
  duration?: number;
  stagger?: number;
  animateFrom?: "bottom" | "top" | "left" | "right" | "center" | "random";
  scaleOnHover?: boolean;
  hoverScale?: number;
  blurToFocus?: boolean;
  colorShiftOnHover?: boolean;
}

const MasonryPosts: React.FC<MasonryProps> = ({
  items,
  ease = "power3.out",
  duration = 0.6,
  stagger = 0.05,
  animateFrom = "bottom",
  scaleOnHover = true,
  hoverScale = 0.97,
  blurToFocus = true,
  colorShiftOnHover = false,
}) => {
  const columns = useMedia(
    [
      "(min-width:1500px)",
      "(min-width:1000px)",
      "(min-width:600px)",
      "(min-width:400px)",
    ],
    [5, 4, 3, 2],
    1
  );

  const [containerRef, { width }] = useMeasure<HTMLDivElement>();
  const [imagesReady, setImagesReady] = useState(false);

  // hover handlers
  const handleMouseEnter = (id: string, element: HTMLElement) => {
    if (scaleOnHover) {
      gsap.to(`[data-key="${id}"]`, {
        scale: hoverScale,
        duration: 0.3,
        ease: "power2.out",
      });
    }
    if (colorShiftOnHover) {
      const overlay = element.querySelector(".color-overlay") as HTMLElement;
      if (overlay) gsap.to(overlay, { opacity: 0.3, duration: 0.3 });
    }
  };

  const handleMouseLeave = (id: string, element: HTMLElement) => {
    if (scaleOnHover) {
      gsap.to(`[data-key="${id}"]`, {
        scale: 1,
        duration: 0.3,
        ease: "power2.out",
      });
    }
    if (colorShiftOnHover) {
      const overlay = element.querySelector(".color-overlay") as HTMLElement;
      if (overlay) gsap.to(overlay, { opacity: 0, duration: 0.3 });
    }
  };

  // preload author images (to avoid layout shift)
  useEffect(() => {
    const urls = items.map((i) => i.author?.image).filter(Boolean) as string[];

    if (urls.length === 0) {
      setImagesReady(true);
      return;
    }
    preloadImages(urls).then(() => setImagesReady(true));
  }, [items]);

  /**
   * Better estimation of text height:
   * - calculate charsPerLine from column width (approx)
   * - compute number of lines for title + content
   * - convert to px via lineHeight
   */
  const grid = useMemo(() => {
    if (!width) return [];
    const colHeights = new Array(columns).fill(0);
    const gap = 16;
    const totalGaps = (columns - 1) * gap;
    const columnWidth = (width - totalGaps) / columns;

    // approximate characters that fit per line (heuristic)
    const approxCharWidth = 8; // px per char average (tweak if you use different fonts)
    const charsPerLine = Math.max(
      20,
      Math.floor(columnWidth / approxCharWidth)
    );
    const titleLineHeight = 20; // px
    const bodyLineHeight = 16; // px

    return items.map((post) => {
      const base = 120; // header + paddings baseline
      const titleText = (post.title ?? "").trim();
      const contentText = (post.content ?? "").trim();

      // estimate lines
      const titleLines = Math.ceil(
        Math.max(1, titleText.length) / charsPerLine
      );
      const bodyLines = Math.ceil(
        Math.max(1, contentText.length) / charsPerLine
      );

      const estTextHeight = Math.min(
        600,
        // title + content lines in px + some breathing room
        titleLines * titleLineHeight + bodyLines * bodyLineHeight + 12
      );

      const height = base + estTextHeight;
      const col = colHeights.indexOf(Math.min(...colHeights));
      const x = col * (columnWidth + gap);
      const y = colHeights[col];

      colHeights[col] += height + gap;
      return { ...post, x, y, w: columnWidth, h: height };
    });
  }, [columns, items, width]);

  // get initial offscreen/start positions for animation
  const getInitialPosition = (item: any) => {
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return { x: item.x, y: item.y };

    let direction = animateFrom;
    if (animateFrom === "random") {
      const dirs = ["top", "bottom", "left", "right"];
      direction = dirs[
        Math.floor(Math.random() * dirs.length)
      ] as typeof animateFrom;
    }

    switch (direction) {
      case "top":
        return { x: item.x, y: -200 };
      case "bottom":
        return { x: item.x, y: window.innerHeight + 200 };
      case "left":
        return { x: -200, y: item.y };
      case "right":
        return { x: window.innerWidth + 200, y: item.y };
      case "center":
        return {
          x: containerRect.width / 2 - item.w / 2,
          y: containerRect.height / 2 - item.h / 2,
        };
      default:
        return { x: item.x, y: item.y + 100 };
    }
  };

  const hasMounted = useRef(false);

  // GSAP layout/animate effect
  useLayoutEffect(() => {
    if (!imagesReady) return;

    grid.forEach((item: any, index: number) => {
      const selector = `[data-key="${item.id}"]`;

      // compute start relative to final position (we set left/top to item.x/item.y)
      const startAbs = getInitialPosition(item);
      const fromX = startAbs.x - item.x;
      const fromY = startAbs.y - item.y;

      if (!hasMounted.current) {
        // animate from offscreen (fromX/fromY) into transform 0,0
        gsap.fromTo(
          selector,
          {
            opacity: 0,
            x: fromX,
            y: fromY,
            width: item.w,
            height: item.h,
            ...(blurToFocus && { filter: "blur(10px)" }),
          },
          {
            opacity: 1,
            x: 0,
            y: 0,
            width: item.w,
            height: item.h,
            ...(blurToFocus && { filter: "blur(0px)" }),
            duration: 0.8,
            ease: "power3.out",
            delay: index * stagger,
          }
        );
      } else {
        // subsequent updates animate to 0,0 (left/top already set)
        gsap.to(selector, {
          x: 0,
          y: 0,
          width: item.w,
          height: item.h,
          duration,
          ease,
          overwrite: "auto",
        });
      }
    });

    hasMounted.current = true;
  }, [grid, imagesReady, stagger, animateFrom, blurToFocus, duration, ease]);

  return (
    <div ref={containerRef} className="relative w-full h-full">
      {grid.map((item: any) => {
        const displayName = item.author?.name ?? item.author?.email;
        const username = item.author?.email?.split("@")[0];
        const avatar = item.author?.image ?? undefined;
        const contentText = item.content ?? "";

        // position via left/top so things don't stack; GSAP will animate transforms (x/y)
        const containerStyle: React.CSSProperties = {
          position: "absolute",
          left: Math.round(item.x),
          top: Math.round(item.y),
          width: Math.round(item.w),
          height: Math.round(item.h),
          transformOrigin: "center center",
          willChange: "transform, width, height, opacity",
        };

        // compute a safe number of clamp lines based on the computed item.h
        // subtract header area (avatar + title area) and paddings ~ estimate 72px
        const headerReserved = 72; // adjust if your header is taller
        const availableForBodyPx = Math.max(0, item.h - headerReserved);
        const bodyLineHeight = 16; // should match the line-height used in CSS
        const clampLines = Math.max(
          1,
          Math.floor(availableForBodyPx / bodyLineHeight)
        );

        return (
          <div
            key={item.id}
            data-key={item.id}
            className="absolute box-content"
            style={containerStyle}
            // onClick={() => window.open(`/posts/${item.id}`, "_self")}
            onMouseEnter={(e) => handleMouseEnter(item.id, e.currentTarget)}
            onMouseLeave={(e) => handleMouseLeave(item.id, e.currentTarget)}
          >
            <figure
              className="inline-block mr-4 relative h-full w-full cursor-pointer overflow-hidden rounded-xl border p-4 border-gray-950/[.06] bg-gray-950/[.01] hover:bg-gray-950/[.03] dark:border-gray-50/[.06] dark:bg-gray-50/[.02] dark:hover:bg-gray-50/[.06]"
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-start",
              }}
            >
              <div className="flex flex-row items-center gap-2">
                {avatar ? (
                  <Image
                    src={avatar}
                    alt={displayName}
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white text-xs font-semibold">
                    {String(displayName)[0]?.toUpperCase() ?? "U"}
                  </div>
                )}
                <div className="flex flex-col">
                  <figcaption className="text-sm font-medium dark:text-white">
                    {displayName}
                  </figcaption>
                  <p className="text-xs font-medium dark:text-white/40">
                    {username}
                  </p>
                </div>
              </div>

              <div className="mt-2 text-sm text-gray-800 dark:text-gray-200 flex-1 min-h-0">
                <div className="font-semibold text-sm mb-1">{item.title}</div>

                {/* content: use -webkit-line-clamp with a computed clampLines so ellipsis only when overflow */}
                <div
                  className="text-xs  text-gray-600 dark:text-gray-300"
                  style={{
                    display: "-webkit-box",
                    WebkitBoxOrient: "vertical",
                    WebkitLineClamp: clampLines,
                    overflow: "hidden",
                    // in case of non-webkit browsers, also limit maxHeight:
                    maxHeight: `${clampLines * bodyLineHeight}px`,
                    lineHeight: `${bodyLineHeight}px`,
                  }}
                >
                  {contentText}
                </div>
              </div>

              {colorShiftOnHover && (
                <div className="color-overlay pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-tr from-pink-500/40 to-sky-500/40 opacity-0" />
              )}
            </figure>
          </div>
        );
      })}
    </div>
  );
};

export default MasonryPosts;
