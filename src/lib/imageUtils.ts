// src/lib/imageUtils.ts
/**
 * Client-side image processing utilities for profile picture uploads.
 * Handles validation, resizing, WebP conversion, and base64 encoding.
 */

export interface ImageValidationResult {
    valid: boolean;
    error?: string;
}

export interface ProcessedImage {
    blob: Blob;
    base64: string;
    width: number;
    height: number;
    originalSize: number;
    processedSize: number;
}

const MAX_FILE_SIZE_MB = 5;
const MAX_DIMENSION = 400;
const WEBP_QUALITY = 0.85;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

/**
 * Validates an image file before processing.
 */
export function validateImage(file: File): ImageValidationResult {
    if (!file) {
        return { valid: false, error: 'No file provided' };
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
        return {
            valid: false,
            error: `Invalid file type. Allowed: ${ALLOWED_TYPES.map(t => t.replace('image/', '')).join(', ')}`
        };
    }

    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > MAX_FILE_SIZE_MB) {
        return {
            valid: false,
            error: `File too large. Maximum size: ${MAX_FILE_SIZE_MB}MB`
        };
    }

    return { valid: true };
}

/**
 * Loads an image file into an HTMLImageElement.
 */
function loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve(img);
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load image'));
        };

        img.src = url;
    });
}

/**
 * Resizes an image to fit within maxDimension while maintaining aspect ratio.
 */
function resizeImage(
    img: HTMLImageElement,
    maxDimension: number
): { canvas: HTMLCanvasElement; width: number; height: number } {
    let { width, height } = img;

    // Calculate new dimensions maintaining aspect ratio
    if (width > height) {
        if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
        }
    } else {
        if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
        }
    }

    // Create canvas and draw resized image
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('Failed to get canvas context');
    }

    // Use high-quality image smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, width, height);

    return { canvas, width, height };
}

/**
 * Converts a canvas to a WebP blob.
 */
function canvasToWebP(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error('Failed to convert canvas to blob'));
                }
            },
            'image/webp',
            quality
        );
    });
}

/**
 * Converts a Blob to a base64 string (without data URL prefix).
 */
export function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            const result = reader.result as string;
            // Remove the data URL prefix (e.g., "data:image/webp;base64,")
            const base64 = result.split(',')[1];
            resolve(base64);
        };

        reader.onerror = () => {
            reject(new Error('Failed to read blob as base64'));
        };

        reader.readAsDataURL(blob);
    });
}

/**
 * Processes an image file: validates, resizes, converts to WebP, and returns base64.
 * This is the main function to use for profile picture uploads.
 */
export async function processImage(file: File): Promise<ProcessedImage> {
    // Validate first
    const validation = validateImage(file);
    if (!validation.valid) {
        throw new Error(validation.error);
    }

    // Load the image
    const img = await loadImage(file);

    // Resize to fit max dimensions
    const { canvas, width, height } = resizeImage(img, MAX_DIMENSION);

    // Convert to WebP
    const blob = await canvasToWebP(canvas, WEBP_QUALITY);

    // Convert to base64 for transport
    const base64 = await blobToBase64(blob);

    return {
        blob,
        base64,
        width,
        height,
        originalSize: file.size,
        processedSize: blob.size,
    };
}

/**
 * Creates a preview URL for an image file.
 * Remember to revoke the URL when done using URL.revokeObjectURL().
 */
export function createPreviewUrl(file: File): string {
    return URL.createObjectURL(file);
}

/**
 * Formats file size in human-readable format.
 */
export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
