"use client";

import * as React from "react";
import { Play, X, ChevronLeft, ChevronRight, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface MediaItem {
  id: string;
  type: "image" | "video" | "gif";
  url: string;
  thumbnail?: string;
  width?: number;
  height?: number;
  altText?: string;
}

interface MediaGridProps {
  media: MediaItem[];
  className?: string;
  onMediaClick?: (index: number) => void;
}

export function MediaGrid({ media, className, onMediaClick }: MediaGridProps) {
  if (!media || media.length === 0) return null;

  const gridConfig = {
    1: {
      cols: "grid-cols-1",
      aspectRatio: "aspect-video",
    },
    2: {
      cols: "grid-cols-2",
      aspectRatio: "",
    },
    3: {
      cols: "grid-cols-2",
      aspectRatio: "",
    },
    4: {
      cols: "grid-cols-2",
      aspectRatio: "",
    },
  };

  const config = gridConfig[media.length as keyof typeof gridConfig] || gridConfig[4];

  return (
    <div className={cn("grid gap-0.5 rounded-2xl overflow-hidden mt-3", config.cols, className)}>
      {media.slice(0, 4).map((item, index) => (
        <MediaItemComponent
          key={item.id}
          item={item}
          index={index}
          totalItems={media.length}
          onClick={() => onMediaClick?.(index)}
        />
      ))}
    </div>
  );
}

interface MediaItemComponentProps {
  item: MediaItem;
  index: number;
  totalItems: number;
  onClick: () => void;
}

function MediaItemComponent({
  item,
  index,
  totalItems,
  onClick,
}: MediaItemComponentProps) {
  const isImage = item.type === "image";
  const isGif = item.type === "gif";
  const isVideo = item.type === "video";

  // Special layout for 3 items
  const isThreeItemLayout = totalItems === 3;
  const isFirstInThree = isThreeItemLayout && index === 0;
  const isLastInThree = isThreeItemLayout && index === 2;

  // Special layout for 2 items
  const isTwoItemLayout = totalItems === 2;

  // Aspect ratio for single item
  const isSingleItem = totalItems === 1;

  return (
    <div
      className={cn(
        "relative cursor-pointer overflow-hidden",
        isSingleItem && "aspect-video",
        isThreeItemLayout && isFirstInThree && "row-span-2",
        isThreeItemLayout && isLastInThree && "col-span-1",
        isTwoItemLayout && index === 0 && "rounded-l-2xl",
        isTwoItemLayout && index === 1 && "rounded-r-2xl",
        isThreeItemLayout && isFirstInThree && "rounded-l-2xl",
        isThreeItemLayout && index === 1 && "rounded-tr-2xl",
        isThreeItemLayout && isLastInThree && "rounded-br-2xl",
        totalItems === 4 && index === 0 && "rounded-tl-2xl",
        totalItems === 4 && index === 1 && "rounded-tr-2xl",
        totalItems === 4 && index === 2 && "rounded-bl-2xl",
        totalItems === 4 && index === 3 && "rounded-br-2xl",
        "hover:bg-black/5 transition-colors"
      )}
      onClick={onClick}
    >
      {isImage || isGif ? (
        <img
          src={item.url}
          alt={item.altText || ""}
          className={cn(
            "w-full h-full object-cover",
            isSingleItem ? "aspect-video" : "aspect-square"
          )}
        />
      ) : (
        <VideoThumbnail item={item} />
      )}
    </div>
  );
}

function VideoThumbnail({ item }: { item: MediaItem }) {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isMuted, setIsMuted] = React.useState(true);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="relative w-full h-full aspect-video bg-black group">
      <video
        ref={videoRef}
        src={item.url}
        poster={item.thumbnail}
        className="w-full h-full object-contain"
        muted={isMuted}
        loop
        playsInline
      />

      {/* Play button overlay */}
      {!isPlaying && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer"
          onClick={handleClick}
        >
          <div className="size-16 rounded-full bg-black/60 flex items-center justify-center group-hover:bg-black/70 transition-colors">
            <Play className="size-8 text-white fill-white ml-1" />
          </div>
        </div>
      )}

      {/* Mute button */}
      {isPlaying && (
        <button
          onClick={toggleMute}
          className="absolute bottom-3 right-3 size-8 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/70 transition-colors"
        >
          {isMuted ? (
            <VolumeX className="size-4 text-white" />
          ) : (
            <Volume2 className="size-4 text-white" />
          )}
        </button>
      )}
    </div>
  );
}

// Media lightbox for expanding media
interface MediaLightboxProps {
  media: MediaItem[];
  initialIndex?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MediaLightbox({
  media,
  initialIndex = 0,
  open,
  onOpenChange,
}: MediaLightboxProps) {
  const [currentIndex, setCurrentIndex] = React.useState(initialIndex);
  const [isMuted, setIsMuted] = React.useState(true);

  React.useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex);
    }
  }, [open, initialIndex]);

  const currentMedia = media[currentIndex];

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : media.length - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < media.length - 1 ? prev + 1 : 0));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      goToPrevious();
    } else if (e.key === "ArrowRight") {
      goToNext();
    }
  };

  if (!currentMedia) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[90vw] max-h-[90vh] p-0 bg-black border-twitter-border"
        onKeyDown={handleKeyDown}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Media viewer</DialogTitle>
        </DialogHeader>

        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 z-50 rounded-full bg-black/50 text-white hover:bg-black/70"
        >
          <X className="size-5" />
        </Button>

        {/* Navigation buttons */}
        {media.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-50 rounded-full bg-black/50 text-white hover:bg-black/70"
            >
              <ChevronLeft className="size-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-50 rounded-full bg-black/50 text-white hover:bg-black/70"
            >
              <ChevronRight className="size-6" />
            </Button>
          </>
        )}

        {/* Media content */}
        <div className="flex items-center justify-center w-full h-full min-h-[50vh]">
          {currentMedia.type === "image" ? (
            <img
              src={currentMedia.url}
              alt={currentMedia.altText || ""}
              className="max-w-full max-h-[85vh] object-contain"
            />
          ) : (
            <div className="relative w-full h-full flex items-center justify-center">
              <video
                src={currentMedia.url}
                poster={currentMedia.thumbnail}
                className="max-w-full max-h-[85vh] object-contain"
                controls
                muted={isMuted}
                autoPlay
              />
            </div>
          )}
        </div>

        {/* Indicators */}
        {media.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {media.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  "size-2 rounded-full transition-colors",
                  index === currentIndex
                    ? "bg-white"
                    : "bg-white/50 hover:bg-white/70"
                )}
              />
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
