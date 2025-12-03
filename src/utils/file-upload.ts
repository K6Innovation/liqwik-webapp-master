// src/utils/file-upload.ts

import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export class FileUploadService {
  private static uploadDir = join(process.cwd(), "public", "uploads", "assets");

  /**
   * Ensures the upload directory exists
   */
  private static async ensureUploadDir() {
    if (!existsSync(this.uploadDir)) {
      await mkdir(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Saves a file and returns its path
   * @param file - The file to upload
   * @param assetId - The asset ID for organizing files
   * @param fileType - Type of file (invoice, bankStatement, billToPartyHistory)
   * @returns The relative path to the saved file
   */
  static async saveFile(
    file: File,
    assetId: string,
    fileType: "invoice" | "bankStatement" | "billToPartyHistory"
  ): Promise<string> {
    await this.ensureUploadDir();

    // Create asset-specific directory
    const assetDir = join(this.uploadDir, assetId);
    if (!existsSync(assetDir)) {
      await mkdir(assetDir, { recursive: true });
    }

    // Generate filename with timestamp to avoid conflicts
    const timestamp = Date.now();
    const fileExtension = file.name.split(".").pop();
    const fileName = `${fileType}_${timestamp}.${fileExtension}`;
    const filePath = join(assetDir, fileName);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Return relative path from public directory
    return `/uploads/assets/${assetId}/${fileName}`;
  }

  /**
   * Validates file type and size
   */
  static validateFile(file: File): { valid: boolean; error?: string } {
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/png",
      "image/jpeg",
    ];

    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: "Invalid file type. Please upload PDF, Word, PNG, or JPG files.",
      };
    }

    if (file.size > maxSize) {
      return {
        valid: false,
        error: "File size exceeds 10MB limit.",
      };
    }

    return { valid: true };
  }
}