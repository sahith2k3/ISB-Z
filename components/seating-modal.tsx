"use client";

import { useEffect, useState, useRef } from "react";
import { X, ZoomIn, ZoomOut, RotateCcw, ExternalLink, Armchair, AlertCircle } from "lucide-react";
import { getSeatingCandidateUrls } from "@/lib/seating";
import Link from "next/link";

interface SeatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseCode: string;
  section: string;
  courseName?: string;
  initialImageUrl?: string;
}

export function SeatingModal({
  isOpen,
  onClose,
  courseCode,
  section,
  courseName,
  initialImageUrl,
}: SeatingModalProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Reset zoom and pan on open or course change
  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
      setIsLoading(true);
      setHasError(false);
      setResolvedUrl(null);

      if (initialImageUrl) {
        setResolvedUrl(initialImageUrl);
        setIsLoading(false);
        return;
      }

      // Test candidate URLs
      const candidates = getSeatingCandidateUrls(courseCode, section);
      let isCancelled = false;

      const testImage = (url: string): Promise<boolean> => {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve(true);
          img.onerror = () => resolve(false);
          img.src = url;
        });
      };

      const findValidUrl = async () => {
        // Also fetch from /api/seating
        try {
          const res = await fetch("/api/seating", { cache: "no-store" });
          if (res.ok) {
            const data = await res.json();
            const match = data.charts?.find(
              (c: any) =>
                c.courseCode.toUpperCase() === courseCode.toUpperCase() &&
                c.section.toUpperCase() === section.toUpperCase()
            );
            if (match && !isCancelled) {
              setResolvedUrl(match.url);
              setIsLoading(false);
              return;
            }
          }
        } catch {
          // ignore API error, fallback to candidates
        }

        for (const url of candidates) {
          if (isCancelled) return;
          const ok = await testImage(url);
          if (ok && !isCancelled) {
            setResolvedUrl(url);
            setIsLoading(false);
            return;
          }
        }

        if (!isCancelled) {
          setHasError(true);
          setIsLoading(false);
        }
      };

      findValidUrl();

      return () => {
        isCancelled = true;
      };
    }
  }, [isOpen, courseCode, section, initialImageUrl]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.3, 3.5));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.3, 0.8));
  const handleResetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-6 backdrop-blur-sm transition-opacity"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative flex flex-col w-full max-w-4xl max-h-[92dvh] bg-card rounded-3xl border border-border shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/80 bg-card/95 backdrop-blur-sm z-10 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary shrink-0">
              <Armchair className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-display font-bold text-lg leading-tight truncate">
                {courseCode} · Section {section}
              </h3>
              {courseName && (
                <p className="text-xs text-muted-foreground truncate">{courseName}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {resolvedUrl && (
              <>
                <div className="hidden sm:flex items-center gap-1 bg-secondary rounded-full p-1 border border-border">
                  <button
                    type="button"
                    onClick={handleZoomOut}
                    aria-label="Zoom out"
                    className="p-1.5 rounded-full hover:bg-background text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleResetZoom}
                    aria-label="Reset zoom"
                    className="px-2 py-0.5 text-xs font-semibold rounded-full hover:bg-background text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {Math.round(scale * 100)}%
                  </button>
                  <button
                    type="button"
                    onClick={handleZoomIn}
                    aria-label="Zoom in"
                    className="p-1.5 rounded-full hover:bg-background text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </button>
                </div>

                <a
                  href={resolvedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Open original image"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-secondary-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Modal Body / Image Viewer */}
        <div
          className="relative flex-1 min-h-[300px] overflow-hidden bg-muted/30 flex items-center justify-center select-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "default" }}
        >
          {isLoading ? (
            <div className="flex flex-col items-center gap-3 text-muted-foreground p-8">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-sm font-medium">Loading seating arrangement...</p>
            </div>
          ) : hasError || !resolvedUrl ? (
            <div className="flex flex-col items-center text-center p-8 max-w-sm">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 mb-4">
                <AlertCircle className="h-7 w-7" />
              </div>
              <h4 className="font-display font-bold text-lg mb-1">
                Seating chart pending
              </h4>
              <p className="text-sm text-muted-foreground mb-6">
                The seating arrangement for <strong>{courseCode} · Section {section}</strong> has not been published yet.
              </p>
              <Link
                href="/seating"
                onClick={onClose}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-sm"
              >
                Browse All Seating Charts
              </Link>
            </div>
          ) : (
            <div
              className="transition-transform duration-75 flex items-center justify-center p-4 w-full h-full"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                transformOrigin: "center center",
              }}
            >
              <img
                src={resolvedUrl}
                alt={`Seating arrangement for ${courseCode} Section ${section}`}
                onError={() => {
                  setHasError(true);
                  setIsLoading(false);
                }}
                className="max-w-full max-h-[72dvh] object-contain rounded-xl shadow-md pointer-events-none"
              />
            </div>
          )}
        </div>

        {/* Modal Footer Controls on Mobile */}
        {resolvedUrl && (
          <div className="flex sm:hidden items-center justify-between px-4 py-3 border-t border-border/60 bg-card/90">
            <div className="flex items-center gap-1 bg-secondary rounded-full p-1 border border-border">
              <button
                type="button"
                onClick={handleZoomOut}
                aria-label="Zoom out"
                className="p-1 rounded-full hover:bg-background text-muted-foreground"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                className="px-2 text-xs font-semibold text-muted-foreground"
              >
                {Math.round(scale * 100)}%
              </button>
              <button
                type="button"
                onClick={handleZoomIn}
                aria-label="Zoom in"
                className="p-1 rounded-full hover:bg-background text-muted-foreground"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
            </div>
            <a
              href={resolvedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-primary flex items-center gap-1 hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Full screen
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
