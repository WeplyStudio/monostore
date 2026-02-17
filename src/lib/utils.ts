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


export function getPlaceholderImage(id: string) {
  const image = PlaceHolderImages.find((img) => img.id === id);
  return image ? image.imageUrl : 'https://picsum.photos/seed/placeholder/400/400';
}

export function getPlaceholderImageDetails(id: string) {
    const image = PlaceHolderImages.find((img) => img.id === id);
    if (image) {
        const url = new URL(image.imageUrl);
        const pathParts = url.pathname.split('/');
        const width = parseInt(pathParts[pathParts.length - 2], 10);
        const height = parseInt(pathParts[pathParts.length - 1], 10);
        return {
            src: image.imageUrl,
            width: width,
            height: height,
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
