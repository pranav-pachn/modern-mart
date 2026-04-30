/**
 * Image Helper - Stores images in MongoDB as Base64 data URLs
 * This is compatible with Vercel's read-only filesystem
 */

const MAX_IMAGE_SIZE_MB = 2; // MongoDB documents have 16MB limit, keep images under 2MB

export async function processImageUpload(imageString: string, _productId: string): Promise<string> {
  // If it's a base64 data URL, validate and return as-is for DB storage
  if (imageString.startsWith("data:image/")) {
    // Extract base64 data to check size
    const matches = imageString.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return imageString; // If parsing fails, just return original
    }

    const base64Data = matches[2];
    const sizeInMB = (base64Data.length * 3) / 4 / 1024 / 1024;

    // Reject if image is too large
    if (sizeInMB > MAX_IMAGE_SIZE_MB) {
      throw new Error(`Image too large. Maximum size is ${MAX_IMAGE_SIZE_MB}MB.`);
    }

    // Return the full data URL to be stored in MongoDB
    // The frontend can render this directly: <img src={product.image} />
    return imageString;
  }

  // If it's already a URL (external or data URL), just return it
  return imageString;
}
