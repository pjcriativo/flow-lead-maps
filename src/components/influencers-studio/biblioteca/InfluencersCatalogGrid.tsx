import React from "react";
import { INFLUENCERS_CATALOG, type InfluencerCatalogItem } from "./biblioteca-data";
import { InfluencerCard } from "./InfluencerCard";

interface InfluencersCatalogGridProps {
  selectedInfluencerId: string;
  onSelectInfluencer: (influencer: InfluencerCatalogItem) => void;
  onUseInfluencer: (influencer: InfluencerCatalogItem) => void;
  onPlayPreview?: (influencer: InfluencerCatalogItem) => void;
  filterCategory?: string;
}

export const InfluencersCatalogGrid: React.FC<InfluencersCatalogGridProps> = ({
  selectedInfluencerId,
  onSelectInfluencer,
  onUseInfluencer,
  onPlayPreview,
  filterCategory,
}) => {
  const influencers = INFLUENCERS_CATALOG;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {influencers.map((inf) => (
        <InfluencerCard
          key={inf.id}
          influencer={inf}
          isSelected={selectedInfluencerId === inf.id}
          onSelect={onSelectInfluencer}
          onUse={onUseInfluencer}
          onPlayPreview={onPlayPreview}
        />
      ))}
    </div>
  );
};
