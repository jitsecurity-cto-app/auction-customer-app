'use client';

import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { AuctionImage } from './ImageUpload';

interface ImageGalleryProps {
  auctionId: string;
  images?: AuctionImage[];
  editable?: boolean;
  onImagesChange?: (images: AuctionImage[]) => void;
}

export default function ImageGallery({ auctionId, images: propImages, editable = false, onImagesChange }: ImageGalleryProps) {
  const [images, setImages] = useState<AuctionImage[]>(propImages || []);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(!propImages);

  useEffect(() => {
    if (propImages) {
      setImages(propImages);
      return;
    }

    // Fetch images if not provided
    const fetchImages = async () => {
      try {
        const data = await api.get<AuctionImage[]>(`/images/auction/${auctionId}`);
        setImages(data);
      } catch (err) {
        console.error('Failed to fetch images:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, [auctionId, propImages]);

  const handleDelete = async (imageId: string) => {
    try {
      await api.delete(`/images/${imageId}`);
      const updated = images.filter(img => img.id !== imageId);
      setImages(updated);
      onImagesChange?.(updated);
      if (selectedIndex >= updated.length) {
        setSelectedIndex(Math.max(0, updated.length - 1));
      }
    } catch (err) {
      console.error('Failed to delete image:', err);
    }
  };

  const handleSetPrimary = async (imageId: string) => {
    try {
      await api.put(`/images/${imageId}/primary`, {});
      const updated = images.map(img => ({
        ...img,
        is_primary: img.id === imageId,
      }));
      setImages(updated);
      onImagesChange?.(updated);
    } catch (err) {
      console.error('Failed to set primary image:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 bg-slate-100 rounded-lg">
        <svg className="animate-spin h-6 w-6 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 bg-slate-50 rounded-lg border border-dashed border-slate-300">
        <div className="text-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="h-10 w-10 text-slate-300 mx-auto mb-2">
            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.41a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75a1.5 1.5 0 0 0-1.5 1.5v13.5a1.5 1.5 0 0 0 1.5 1.5Zm7.5-13.5a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Z" />
          </svg>
          <p className="text-sm text-slate-400">No images uploaded</p>
        </div>
      </div>
    );
  }

  const selectedImage = images[selectedIndex];

  return (
    <div className="space-y-3">
      {/* Main image display */}
      <div className="relative aspect-video bg-slate-100 rounded-lg overflow-hidden">
        {selectedImage?.url ? (
          <img
            src={selectedImage.url}
            alt={selectedImage.original_filename || 'Auction image'}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-slate-400">Image loading...</p>
          </div>
        )}

        {/* Primary badge */}
        {selectedImage?.is_primary && (
          <span className="absolute top-2 left-2 bg-primary-600 text-white text-xs font-medium px-2 py-0.5 rounded-full">
            Primary
          </span>
        )}

        {/* Edit controls */}
        {editable && selectedImage && (
          <div className="absolute top-2 right-2 flex gap-1">
            {!selectedImage.is_primary && (
              <button
                onClick={() => handleSetPrimary(selectedImage.id)}
                className="bg-white/90 hover:bg-white text-slate-700 rounded-lg px-2 py-1 text-xs font-medium shadow-sm transition-colors"
                title="Set as primary"
              >
                Set Primary
              </button>
            )}
            <button
              onClick={() => handleDelete(selectedImage.id)}
              className="bg-red-50/90 hover:bg-red-50 text-red-600 rounded-lg px-2 py-1 text-xs font-medium shadow-sm transition-colors"
              title="Delete image"
            >
              Delete
            </button>
          </div>
        )}

        {/* Navigation arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={() => setSelectedIndex((selectedIndex - 1 + images.length) % images.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1.5 shadow-sm transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            </button>
            <button
              onClick={() => setSelectedIndex((selectedIndex + 1) % images.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1.5 shadow-sm transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, index) => (
            <button
              key={img.id}
              onClick={() => setSelectedIndex(index)}
              className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                index === selectedIndex
                  ? 'border-primary-500'
                  : 'border-transparent hover:border-slate-300'
              }`}
            >
              {img.thumbnail_url || img.url ? (
                <img
                  src={img.thumbnail_url || img.url || ''}
                  alt={img.original_filename || `Image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-slate-200" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
