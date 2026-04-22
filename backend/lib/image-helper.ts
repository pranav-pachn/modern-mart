import fs from "fs/promises";
import path from "path";

// Resolves to: supermart/frontend/apps/web/public/products
const getUploadDir = () => {
  return path.join(process.cwd(), "..", "frontend", "apps", "web", "public", "products");
};

export async function processImageUpload(imageString: string, productId: string): Promise<string> {
  // If it's a base64 data URL
  if (imageString.startsWith("data:image/")) {
    // Extract base64 data and mime type
    const matches = imageString.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return imageString; // If parsing fails, just return original
    }

    const extension = matches[1] === "jpeg" ? "jpg" : matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, "base64");

    const fileName = `${productId}-${Date.now()}.${extension}`;
    const uploadDir = getUploadDir();
    
    // Ensure the directory exists
    await fs.mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, fileName);
    await fs.writeFile(filePath, buffer);

    // Return the path that the frontend will use to render the image
    return `/products/${fileName}`;
  }

  // If it's already a URL or local path, just return it
  return imageString;
}
