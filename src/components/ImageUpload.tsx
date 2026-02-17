'use client';

import { useState, useRef } from 'react';
import { api } from '../lib/api';

interface ImageUploadProps {
  auctionId: string;
  onImageUploaded: (image: AuctionImage) => void;
  maxImages?: number;
  currentImageCount?: number;
}

export interface AuctionImage {
  id: string;
  auction_id: string;
  s3_key: string;
  original_filename: string;
  content_type: string;
  file_size: number;
  sort_order: number;
  is_primary: boolean;
  url: string | null;
  thumbnail_url: string | null;
  created_at: string;
}

export default function ImageUpload({ auctionId, onImageUploaded, maxImages = 10, currentImageCount = 0 }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (currentImageCount + files.length > maxImages) {
      setError(`Maximum ${maxImages} images allowed. You can add ${maxImages - currentImageCount} more.`);
      return;
    }

    setUploading(true);
    setError(null);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        setProgress(`Uploading ${file.name} (${i + 1}/${files.length})...`);

        // No file type validation on client side (intentional vulnerability)
        // No file size validation (intentional vulnerability)
        console.log('Uploading file:', { name: file.name, type: file.type, size: file.size });

        // Step 1: Get presigned URL from API
        const uploadData = await api.post<{ upload_url: string; s3_key: string; cdn_url: string | null }>(
          '/images/upload-url',
          { auction_id: auctionId, filename: file.name, content_type: file.type },
          true
        );

        // Step 2: Upload file directly to S3 using presigned URL
        const uploadResponse = await fetch(uploadData.upload_url, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type,
          },
        });

        if (!uploadResponse.ok) {
          throw new Error(`Upload failed: ${uploadResponse.statusText}`);
        }

        // Step 3: Register image in database
        const image = await api.post<AuctionImage>(
          '/images',
          {
            auction_id: auctionId,
            s3_key: uploadData.s3_key,
            original_filename: file.name,
            content_type: file.type,
            file_size: file.size,
            is_primary: currentImageCount === 0 && i === 0,
          },
          true
        );

        onImageUploaded(image);
      } catch (err) {
        console.error('Upload error:', err);
        setError(err instanceof Error ? err.message : 'Upload failed');
        break;
      }
    }

    setUploading(false);
    setProgress(null);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer bg-white border border-slate-300 hover:bg-slate-50 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91M6.75 15.75V18m3-3v3m3-3v3m-9-6.75h12M3.75 6.75h16.5" />
          </svg>
          {uploading ? progress || 'Uploading...' : 'Upload Images'}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
          />
        </label>
        <span className="text-xs text-slate-400">
          {currentImageCount}/{maxImages} images
        </span>
      </div>

      {uploading && (
        <div className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-sm text-slate-500">{progress}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
          {error}
        </div>
      )}

      <p className="text-xs text-slate-400">
        Supports JPG, PNG, GIF, WebP. No file size limit (vulnerability demo).
      </p>
    </div>
  );
}
