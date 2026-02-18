import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { PlaceHolderImages } from "./placeholder-images";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatRupiah = (number: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(number);
};

export function formatCompactNumber(number: number) {
  if (number < 1000) return number.toString();
  
  if (number < 1000000) {
    const value = number / 1000;
    return (value % 1 === 0 ? value.toFixed(0) : value.toFixed(1)) + 'K';
  }
  
  const value = number / 1000000;
  return (value % 1 === 0 ? value.toFixed(0) : value.toFixed(1)) + 'M';
}

/**
 * Parses custom markdown-like formatting for product descriptions.
 * *text* -> bold
 * _text_ -> italic
 * *_text_* -> bold italic
 * <b>text<b> -> large title text
 */
export function parseDescriptionToHtml(text: string) {
  if (!text) return "";
  
  // Escape HTML to prevent XSS, but preserve our custom formatting
  let safeText = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Apply formatting
  return safeText
    // Big Title: <b>text<b>
    .replace(/&lt;b&gt;(.*?)&lt;b&gt;/g, '<span class="text-xl font-bold block mt-4 mb-2 text-foreground">$1</span>')
    // Bold Italic: *_text_*
    .replace(/\*_(.*?)\_\*/g, '<strong><em>$1</em></strong>')
    // Bold: *text*
    .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
    // Italic: _text_
    .replace(/\_(.*?)\_/g, '<em>$1</em>')
    // Line breaks
    .replace(/\n/g, '<br/>');
}

export function getPlaceholderImage(id: string) {
  const image = PlaceHolderImages.find((img) => img.id === id);
  return image ? image.imageUrl : 'https://picsum.photos/seed/placeholder/400/400';
}

export function getPlaceholderImageDetails(id: string) {
    const image = PlaceHolderImages.find((img) => img.id === id);
    if (image) {
        const url = new URL(image.imageUrl);
        if (url.hostname === 'picsum.photos') {
            const pathParts = url.pathname.split('/');
            const width = parseInt(pathParts[pathParts.length - 2], 10);
            const height = parseInt(pathParts[pathParts.length - 1], 10);
            return {
                src: image.imageUrl,
                width: isNaN(width) ? 400 : width,
                height: isNaN(height) ? 400 : height,
                hint: image.imageHint
            };
        }
        // Fallback for non-picsum URLs (like unsplash)
        return {
            src: image.imageUrl,
            width: 400,
            height: 400,
            hint: image.imageHint
        };
    }
    return {
        src: 'https://picsum.photos/seed/placeholder/400/400',
        width: 400,
        height: 400,
        hint: ''
    };
}
