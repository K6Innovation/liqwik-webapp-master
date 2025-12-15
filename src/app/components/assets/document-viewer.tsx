"use client";

import React, { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { HiOutlineDownload, HiOutlineExternalLink, HiOutlineX } from "react-icons/hi";
import { HiOutlineDocumentText } from "react-icons/hi2";

type Document = {
  type: string;
  name: string;
  path: string;
  fileName: string;
};

type Props = {
  assetId: string;
  isOpen: boolean;
  onClose: () => void;
};

export default function DocumentViewer({ assetId, isOpen, onClose }: Props) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [previewError, setPreviewError] = useState(false);

  // Wrap loadDocuments in useCallback to fix dependency warning
  const loadDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/assets/${assetId}/documents`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents);
        // Auto-select first document
        if (data.documents.length > 0) {
          setSelectedDoc(data.documents[0]);
        }
      }
    } catch (error) {
      console.error("Error loading documents:", error);
    } finally {
      setLoading(false);
    }
  }, [assetId]);

  useEffect(() => {
    if (isOpen && assetId) {
      loadDocuments();
    }
  }, [isOpen, assetId, loadDocuments]);

  useEffect(() => {
    // Reset preview error when document changes
    setPreviewError(false);
  }, [selectedDoc]);

  const handleViewDocument = (doc: Document) => {
    setSelectedDoc(doc);
  };

  const handleDownload = (doc: Document) => {
    const link = document.createElement("a");
    link.href = doc.path;
    link.download = doc.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenInNewTab = (doc: Document) => {
    // Use preview API for Word documents, direct path for others
    const ext = getFileExtension(doc.fileName);
    if (ext === "docx" || ext === "doc") {
      const previewUrl = `/api/assets/${assetId}/documents/${doc.fileName}/preview`;
      window.open(previewUrl, "_blank");
    } else {
      window.open(doc.path, "_blank");
    }
  };

  const getFileExtension = (fileName: string) => {
    return fileName.split(".").pop()?.toLowerCase();
  };

  const getPreviewUrl = (doc: Document) => {
    const ext = getFileExtension(doc.fileName);
    // Use preview API for Word documents
    if (ext === "docx" || ext === "doc") {
      return `/api/assets/${assetId}/documents/${doc.fileName}/preview`;
    }
    // Use direct path for other files
    return doc.path;
  };

  const renderPreview = (doc: Document) => {
    const ext = getFileExtension(doc.fileName);
    const previewUrl = getPreviewUrl(doc);

    // PDF Preview
    if (ext === "pdf") {
      return (
        <div className="flex-1 border rounded-lg overflow-hidden bg-gray-50 relative">
          {!previewError ? (
            <>
              <iframe
                src={`${previewUrl}#toolbar=1&navpanes=0&scrollbar=1&view=FitH`}
                className="w-full h-full"
                title={doc.name}
                onError={() => setPreviewError(true)}
              />
              <div className="absolute top-2 right-2 flex gap-2">
                <button
                  onClick={() => handleOpenInNewTab(doc)}
                  className="px-3 py-1.5 bg-white border border-gray-300 rounded-md shadow-sm text-sm hover:bg-gray-50 flex items-center gap-1"
                  title="Open in new tab"
                >
                  <HiOutlineExternalLink className="w-4 h-4" />
                  Open
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-8">
                <HiOutlineDocumentText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Unable to preview PDF</p>
                <button
                  onClick={() => handleOpenInNewTab(doc)}
                  className="px-4 py-2 bg-pink-700 text-white rounded-lg hover:bg-pink-800 transition inline-flex items-center gap-2"
                >
                  <HiOutlineExternalLink className="w-4 h-4" />
                  Open in New Tab
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }

    // Image Preview (PNG, JPG, JPEG) - Using Next.js Image component
    if (["png", "jpg", "jpeg"].includes(ext || "")) {
      return (
        <div className="flex-1 border rounded-lg overflow-hidden bg-gray-50">
          {!previewError ? (
            <div className="flex items-center justify-center h-full p-4 relative">
              <Image
                src={previewUrl}
                alt={doc.name}
                fill
                className="object-contain"
                onError={() => setPreviewError(true)}
                unoptimized
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-8">
                <HiOutlineDocumentText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Unable to load image</p>
                <button
                  onClick={() => handleDownload(doc)}
                  className="px-4 py-2 bg-pink-700 text-white rounded-lg hover:bg-pink-800 transition inline-flex items-center gap-2"
                >
                  <HiOutlineDownload className="w-4 h-4" />
                  Download
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }

    // Word Document Preview (DOC, DOCX) - Using server-side conversion
    if (["doc", "docx"].includes(ext || "")) {
      return (
        <div className="flex-1 border rounded-lg overflow-hidden bg-white relative">
          {!previewError ? (
            <>
              <iframe
                src={previewUrl}
                className="w-full h-full"
                title={doc.name}
                onError={() => setPreviewError(true)}
              />
              <div className="absolute top-2 right-2 flex gap-2">
                <button
                  onClick={() => handleOpenInNewTab(doc)}
                  className="px-3 py-1.5 bg-white border border-gray-300 rounded-md shadow-sm text-sm hover:bg-gray-50 flex items-center gap-1"
                  title="Open in new tab"
                >
                  <HiOutlineExternalLink className="w-4 h-4" />
                  Open
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-8">
                <HiOutlineDocumentText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Unable to preview Word document</p>
                <p className="text-sm text-gray-500 mb-4">
                  The document may be corrupted or in an unsupported format
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => handleDownload(doc)}
                    className="px-4 py-2 bg-pink-700 text-white rounded-lg hover:bg-pink-800 transition inline-flex items-center gap-2"
                  >
                    <HiOutlineDownload className="w-4 h-4" />
                    Download
                  </button>
                  <button
                    onClick={() => handleOpenInNewTab(doc)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition inline-flex items-center gap-2"
                  >
                    <HiOutlineExternalLink className="w-4 h-4" />
                    Try Opening
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    // Fallback for unsupported file types
    return (
      <div className="flex-1 flex items-center justify-center border rounded-lg bg-gray-50">
        <div className="text-center p-8">
          <HiOutlineDocumentText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">Preview not available</p>
          <p className="text-sm text-gray-500 mb-4">
            File type: {ext?.toUpperCase()}
          </p>
          <button
            onClick={() => handleDownload(doc)}
            className="px-4 py-2 bg-pink-700 text-white rounded-lg hover:bg-pink-800 transition inline-flex items-center gap-2"
          >
            <HiOutlineDownload className="w-4 h-4" />
            Download to view
          </button>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-800">Asset Documents</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
            aria-label="Close"
          >
            <HiOutlineX className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex min-h-0">
          {/* Document List Sidebar */}
          <div className="w-80 border-r overflow-y-auto p-4 flex-shrink-0 bg-gray-50">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-700" />
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <HiOutlineDocumentText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>No documents available</p>
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map((doc, index) => (
                  <div
                    key={index}
                    className={`p-3 border rounded-lg cursor-pointer transition bg-white ${
                      selectedDoc?.path === doc.path
                        ? "border-pink-300 shadow-md ring-2 ring-pink-100"
                        : "hover:border-gray-300 hover:shadow-sm border-gray-200"
                    }`}
                    onClick={() => handleViewDocument(doc)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        selectedDoc?.path === doc.path ? "bg-pink-100" : "bg-gray-100"
                      }`}>
                        <HiOutlineDocumentText className={`w-5 h-5 ${
                          selectedDoc?.path === doc.path ? "text-pink-700" : "text-gray-600"
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-800 text-sm">
                          {doc.type}
                        </div>
                        <div className="text-xs text-gray-500 truncate mt-0.5">
                          {doc.fileName}
                        </div>
                        <div className={`text-xs mt-1 inline-block px-2 py-0.5 rounded ${
                          selectedDoc?.path === doc.path 
                            ? "bg-pink-100 text-pink-700" 
                            : "bg-gray-100 text-gray-600"
                        }`}>
                          {getFileExtension(doc.fileName)?.toUpperCase()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Document Preview Area */}
          <div className="flex-1 overflow-hidden p-6 flex flex-col min-w-0 bg-white">
            {selectedDoc ? (
              <div className="h-full flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-4 flex-shrink-0">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-800 truncate text-lg">{selectedDoc.type}</h3>
                    <p className="text-sm text-gray-500 truncate">{selectedDoc.fileName}</p>
                  </div>
                  <div className="flex gap-2 ml-4 flex-shrink-0">
                    <button
                      onClick={() => handleOpenInNewTab(selectedDoc)}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition text-sm font-medium"
                      title="Open in new tab"
                    >
                      <HiOutlineExternalLink className="w-4 h-4" />
                      Open
                    </button>
                    <button
                      onClick={() => handleDownload(selectedDoc)}
                      className="flex items-center gap-2 px-4 py-2 bg-pink-700 text-white rounded-lg hover:bg-pink-800 transition text-sm font-medium"
                      title="Download document"
                    >
                      <HiOutlineDownload className="w-4 h-4" />
                      Download
                    </button>
                  </div>
                </div>

                {renderPreview(selectedDoc)}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <HiOutlineDocumentText className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                  <p className="text-lg">Select a document to preview</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}