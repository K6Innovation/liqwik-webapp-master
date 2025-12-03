// src/app/api/assets/[assetId]/documents/[fileName]/preview/route.ts

import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import mammoth from "mammoth";

export async function GET(
  req: NextRequest,
  { params }: { params: { assetId: string; fileName: string } }
) {
  try {
    const { assetId, fileName } = params;
    
    // Construct file path
    const filePath = join(
      process.cwd(),
      "public",
      "uploads",
      "assets",
      assetId,
      fileName
    );

    // Check file extension
    const ext = fileName.split(".").pop()?.toLowerCase();

    // Convert Word documents to HTML
    if (ext === "docx" || ext === "doc") {
      // Read the file as buffer
      const buffer = await readFile(filePath);
      
      // Convert to HTML using mammoth
      const result = await mammoth.convertToHtml({ buffer });
      
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, Arial, sans-serif;
                max-width: 900px;
                margin: 0 auto;
                padding: 40px 20px;
                line-height: 1.6;
                color: #333;
                background-color: #fff;
              }
              h1 {
                font-size: 2em;
                margin-top: 32px;
                margin-bottom: 16px;
                font-weight: 600;
                color: #1a1a1a;
                border-bottom: 2px solid #e5e5e5;
                padding-bottom: 8px;
              }
              h2 {
                font-size: 1.5em;
                margin-top: 28px;
                margin-bottom: 14px;
                font-weight: 600;
                color: #1a1a1a;
              }
              h3 {
                font-size: 1.25em;
                margin-top: 24px;
                margin-bottom: 12px;
                font-weight: 600;
                color: #1a1a1a;
              }
              h4, h5, h6 {
                margin-top: 20px;
                margin-bottom: 10px;
                font-weight: 600;
                color: #1a1a1a;
              }
              p {
                margin-bottom: 16px;
                text-align: justify;
              }
              ul, ol {
                margin-bottom: 16px;
                padding-left: 30px;
              }
              li {
                margin-bottom: 8px;
              }
              table {
                border-collapse: collapse;
                width: 100%;
                margin: 20px 0;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
              }
              table, th, td {
                border: 1px solid #ddd;
              }
              th {
                background-color: #f5f5f5;
                font-weight: 600;
                color: #333;
              }
              th, td {
                padding: 12px;
                text-align: left;
              }
              tr:nth-child(even) {
                background-color: #fafafa;
              }
              img {
                max-width: 100%;
                height: auto;
                display: block;
                margin: 20px auto;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              }
              blockquote {
                border-left: 4px solid #e5e5e5;
                padding-left: 20px;
                margin: 20px 0;
                color: #666;
                font-style: italic;
              }
              code {
                background-color: #f5f5f5;
                padding: 2px 6px;
                border-radius: 3px;
                font-family: 'Courier New', monospace;
                font-size: 0.9em;
              }
              pre {
                background-color: #f5f5f5;
                padding: 15px;
                border-radius: 5px;
                overflow-x: auto;
                margin: 20px 0;
              }
              strong, b {
                font-weight: 600;
              }
              em, i {
                font-style: italic;
              }
              a {
                color: #0066cc;
                text-decoration: none;
              }
              a:hover {
                text-decoration: underline;
              }
            </style>
          </head>
          <body>
            ${result.value}
            ${result.messages.length > 0 ? `
              <div style="margin-top: 40px; padding: 15px; background-color: #fff3cd; border-left: 4px solid #ffc107; color: #856404;">
                <strong>Conversion Notes:</strong>
                <ul style="margin-top: 10px; margin-bottom: 0;">
                  ${result.messages.map(msg => `<li>${msg.message}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </body>
        </html>
      `;
      
      return new NextResponse(html, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
        },
      });
    }

    // For PDF, PNG, JPG files - serve directly
    const buffer = await readFile(filePath);
    const contentType = getContentType(ext || "");
    
    // Convert Buffer to Uint8Array which is compatible with NextResponse
    const uint8Array = new Uint8Array(buffer);
    
    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${fileName}"`,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error: any) {
    console.error("Error previewing document:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to preview document",
        details: error.message 
      },
      { status: 500 }
    );
  }
}

function getContentType(ext: string): string {
  const contentTypes: Record<string, string> = {
    pdf: "application/pdf",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  };
  return contentTypes[ext] || "application/octet-stream";
}