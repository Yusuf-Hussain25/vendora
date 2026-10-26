"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Link2, Star, X } from "lucide-react";
import { toast } from "sonner";
import { isImageUrl, uploadImage, uploadsEnabled } from "@/lib/upload";

// Manages a list of image URLs: upload (Cloudinary) or paste a link. The first image is the cover.
export default function ImageInput({ value, onChange, max = 6, folder = "vendora/products", single = false }) {
  const fileRef = useRef(null);
  const [url, setUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const full = value.length >= max;

  const add = (next) => onChange(single ? [next] : [...value, next].slice(0, max));

  const addUrl = () => {
    if (!isImageUrl(url)) {
      toast.error("Paste a full https:// image link.");
      return;
    }
    add(url.trim());
    setUrl("");
  };

  const upload = async (files) => {
    setUploading(true);
    try {
      let current = value;
      for (const file of [...files].slice(0, single ? 1 : max - value.length)) {
        const uploaded = await uploadImage(file, folder);
        current = single ? [uploaded] : [...current, uploaded];
        onChange(current);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const makeCover = (i) => onChange([value[i], ...value.filter((_, j) => j !== i)]);

  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <div className={`grid gap-3 ${single ? "grid-cols-1 max-w-[140px]" : "grid-cols-3 sm:grid-cols-6"}`}>
          {value.map((src, i) => (
            <div key={src + i} className="relative aspect-square rounded-[10px] bg-surface-2 border border-border group">
              <Image src={src} alt="" fill sizes="140px" className="object-contain p-2" />
              {!single && i === 0 && <span className="absolute bottom-1.5 left-1.5 badge badge-accent !h-5 !text-[10px]">Cover</span>}
              <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition">
                {!single && i > 0 && (
                  <button type="button" className="grid place-items-center w-7 h-7 rounded-full bg-panel-solid border border-border" onClick={() => makeCover(i)} aria-label="Use as cover image">
                    <Star className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  className="grid place-items-center w-7 h-7 rounded-full bg-panel-solid border border-border text-danger"
                  onClick={() => onChange(value.filter((_, j) => j !== i))}
                  aria-label="Remove image"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {(!full || single) && (
        <div className="flex flex-wrap gap-2">
          {uploadsEnabled && (
            <>
              <input ref={fileRef} type="file" accept="image/*" multiple={!single} hidden onChange={(e) => upload(e.target.files)} />
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? <span className="spinner" /> : <ImagePlus />}
                {uploading ? "Uploading…" : "Upload"}
              </button>
            </>
          )}
          <div className="flex flex-1 min-w-[220px] gap-2">
            <div className="relative flex-1">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-3 pointer-events-none" />
              <input
                className="input !min-h-[34px] !h-[34px] !pl-9 !text-[13px] !rounded-full"
                placeholder="Paste an image link (https://…)"
                aria-label="Image link"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addUrl();
                  }
                }}
              />
            </div>
            <button type="button" className="btn btn-secondary btn-sm" onClick={addUrl} disabled={!url.trim()}>
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
