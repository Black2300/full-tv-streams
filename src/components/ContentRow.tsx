"use client";

import React, { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { LiveStream, VodStream, SeriesItem, PlayableItem } from "@/types/iptv";
import { StreamCard } from "./StreamCard";

interface ContentRowProps {
  title: string;
  subtitle?: string;
  badge?: string;
  icon?: React.ReactNode;
  items: (LiveStream | VodStream | SeriesItem)[];
  type: "live" | "movie" | "series";
  categoryName?: string;
  onPlay: (playable: PlayableItem) => void;
  onSelect?: (item: LiveStream | VodStream | SeriesItem, type: "live" | "movie" | "series") => void;
  onViewAll?: () => void;
}

export const ContentRow: React.FC<ContentRowProps> = ({
  title,
  subtitle,
  badge,
  icon,
  items,
  type,
  categoryName,
  onPlay,
  onSelect,
  onViewAll,
}) => {
  const rowRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollAmount = clientWidth * 0.75;
      rowRef.current.scrollTo({
        left: direction === "left" ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (!items || items.length === 0) return null;

  return (
    <div className="relative group/row my-7 sm:my-10 px-4 sm:px-8 lg:px-12 max-w-full">
      {/* Row Header */}
      <div className="flex items-end justify-between mb-4">
        <div className="flex items-center gap-3">
          {icon && <div className="text-emerald-400">{icon}</div>}
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">
                {title}
              </h2>
              {badge && (
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {badge}
                </span>
              )}
            </div>
            {subtitle && <p className="text-xs sm:text-sm text-gray-400 mt-1">{subtitle}</p>}
          </div>
        </div>

        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-xs sm:text-sm font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors group/all"
          >
            <span>Ver todos</span>
            <ChevronRight className="w-4 h-4 transform group-hover/all:translate-x-0.5 transition-transform" />
          </button>
        )}
      </div>

      {/* Row Container with Scroll Buttons */}
      <div className="relative">
        {/* Left Arrow */}
        <button
          onClick={() => scroll("left")}
          className="absolute -left-3 sm:-left-5 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-black/85 hover:bg-emerald-500 hover:text-black text-white backdrop-blur-md opacity-0 group-hover/row:opacity-100 transition-all duration-200 border border-white/10 hover:border-transparent shadow-xl hidden md:flex items-center justify-center"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Carousel Scroll Track com padding generoso para o foco de TV */}
        <div
          ref={rowRef}
          className="flex gap-4 sm:gap-5 overflow-x-auto no-scrollbar scroll-smooth py-5 px-3"
        >
          {items.map((item, idx) => {
            const key = `${type}_${(item as any).stream_id || (item as any).series_id || idx}`;
            return (
              <div
                key={key}
                className={`flex-shrink-0 ${
                  type === "live"
                    ? "w-[240px] sm:w-[280px] lg:w-[320px]"
                    : "w-[165px] sm:w-[195px] lg:w-[225px]"
                }`}
              >
                <StreamCard
                  item={item}
                  type={type}
                  categoryName={categoryName}
                  onPlay={onPlay}
                  onSelect={onSelect}
                />
              </div>
            );
          })}
        </div>

        {/* Right Arrow */}
        <button
          onClick={() => scroll("right")}
          className="absolute -right-3 sm:-right-5 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-black/85 hover:bg-emerald-500 hover:text-black text-white backdrop-blur-md opacity-0 group-hover/row:opacity-100 transition-all duration-200 border border-white/10 hover:border-transparent shadow-xl hidden md:flex items-center justify-center"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
