"use client";

import Link from "next/link";

interface ListingCardProps {
  id: string;
  slug: string;
  name: string;
  href: string;
  image?: string;
  hasUser?: boolean; // For doctors and facilities
  hasData?: boolean; // For agencies (personalAgencyDataId)
  emoji: string;
  primaryInfo: string;
  secondaryInfo?: string;
  rating?: number;
}

export default function ListingCard({
  id,
  slug,
  name,
  href,
  image,
  hasUser,
  hasData,
  emoji,
  primaryInfo,
  secondaryInfo,
  rating,
}: ListingCardProps) {
  const isListingOnly = !image;
  const showListingOnlyBadge = isListingOnly && !hasUser && !hasData;

  return (
    <Link
      href={href}
      className="bg-zinc-900 rounded-lg p-6 hover:bg-zinc-800 transition-colors block border border-zinc-800"
    >
      <div className="mb-4">
        <div className="w-full h-48 bg-zinc-800 rounded-lg flex items-center justify-center overflow-hidden">
          {image ? (
            <img 
              src={image} 
              alt={name} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center">
              <span className="text-6xl opacity-20">{emoji}</span>
              {showListingOnlyBadge && (
                <span className="text-[10px] uppercase font-bold text-zinc-600 mt-2 tracking-widest">
                  Listing Only
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-2 text-white line-clamp-1">
        {name}
      </h2>

      <p className="text-zinc-400 mb-2">{primaryInfo}</p>

      {secondaryInfo && (
        <p className="text-zinc-500 text-sm mb-2">{secondaryInfo}</p>
      )}

      {rating !== undefined && (
        <p className="text-yellow-400">★ {rating.toFixed(1)}</p>
      )}
    </Link>
  );
}
