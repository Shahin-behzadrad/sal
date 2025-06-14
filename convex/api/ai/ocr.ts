"use node";

import { v } from "convex/values";
import { action } from "../../_generated/server";
import { ConvexError } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { ImageAnnotatorClient } from "@google-cloud/vision";
import { protos } from "@google-cloud/vision";
import { Storage } from "@google-cloud/storage";

// Initialize the Vision API client with credentials
let vision: ImageAnnotatorClient | null = null;
let storage: Storage | null = null;

try {
  const credentialsBase64 = process.env.GOOGLE_CLOUD_KEY_BASE64;
  if (!credentialsBase64) {
    console.error("GOOGLE_CLOUD_KEY_BASE64 environment variable is not set");
  } else {
    const credentials = JSON.parse(
      Buffer.from(credentialsBase64, "base64").toString()
    );
    vision = new ImageAnnotatorClient({ credentials });
    storage = new Storage({ credentials });
  }
} catch (error) {
  console.error("Failed to initialize Google Cloud clients:", error);
}

// Get GCS bucket name from environment
const GCS_BUCKET = process.env.GOOGLE_CLOUD_BUCKET;
if (!GCS_BUCKET) {
  console.error("GOOGLE_CLOUD_BUCKET environment variable is not set");
}

export const processDocumentOCR = action({
  args: {
    file: v.object({
      id: v.string(),
      name: v.string(),
      type: v.string(),
      size: v.number(),
      lastModified: v.number(),
      buffer: v.any(),
    }),
    fileType: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("Not authenticated");
    }

    if (!vision || !storage) {
      throw new ConvexError(
        "Google Cloud clients not initialized. Please check your credentials."
      );
    }

    if (!GCS_BUCKET) {
      throw new ConvexError(
        "GCS bucket not configured. Please set GOOGLE_CLOUD_BUCKET environment variable."
      );
    }

    try {
      let result;
      if (args.fileType === "application/pdf") {
        console.log("Processing PDF document");
        try {
          // Convert the file to buffer
          const fileBuffer = args.file.buffer;
          const timestamp = Date.now();
          const gcsFileName = `uploads/${timestamp}-${args.file.name}`;
          const outputPrefix = `ocr-results/${timestamp}`;

          // Upload to GCS
          const bucket = storage.bucket(GCS_BUCKET);
          const file = bucket.file(gcsFileName);

          await file.save(Buffer.from(fileBuffer), {
            contentType: "application/pdf",
            metadata: {
              contentType: "application/pdf",
            },
          });

          console.log("PDF uploaded to GCS:", gcsFileName);

          // For PDFs, use asyncBatchAnnotateFiles
          const request: protos.google.cloud.vision.v1.IAsyncBatchAnnotateFilesRequest =
            {
              requests: [
                {
                  inputConfig: {
                    mimeType: "application/pdf",
                    gcsSource: { uri: `gs://${GCS_BUCKET}/${gcsFileName}` },
                  },
                  features: [
                    {
                      type: protos.google.cloud.vision.v1.Feature.Type
                        .DOCUMENT_TEXT_DETECTION,
                    },
                  ],
                  outputConfig: {
                    gcsDestination: {
                      uri: `gs://${GCS_BUCKET}/${outputPrefix}/`,
                    },
                  },
                },
              ],
            };

          console.log("Starting async batch annotation");
          const [operation] = await vision.asyncBatchAnnotateFiles(request);

          console.log("Waiting for operation to complete");
          const [filesResponse] = await operation.promise();
          console.log("Operation completed:", filesResponse);

          if (
            !filesResponse?.responses?.[0]?.outputConfig?.gcsDestination?.uri
          ) {
            throw new ConvexError("No output destination for PDF processing");
          }

          // Wait a bit for the output files to be written
          await new Promise((resolve) => setTimeout(resolve, 2000));

          // List all files in the output folder
          console.log("Listing output files in:", outputPrefix);
          const [outputFiles] = await bucket.getFiles({
            prefix: outputPrefix,
          });

          console.log(
            "Found output files:",
            outputFiles.map((f) => f.name)
          );

          // Collect and sort all JSON output files
          const jsonFiles = outputFiles
            .filter((file) => file.name.endsWith(".json"))
            .sort((a, b) => a.name.localeCompare(b.name));

          if (jsonFiles.length === 0) {
            throw new ConvexError(
              "No output JSON files found in GCS. Please check the GCS bucket permissions and try again."
            );
          }

          let fullText = "";
          let fullPages: protos.google.cloud.vision.v1.IPage[] = [];

          for (const file of jsonFiles) {
            console.log("Processing output file:", file.name);
            const [jsonBuffer] = await file.download();
            const json = JSON.parse(jsonBuffer.toString());

            for (const response of json.responses || []) {
              const annotation = response.fullTextAnnotation;
              if (annotation) {
                fullText += annotation.text + "\n";
                if (annotation.pages) {
                  fullPages.push(...annotation.pages);
                }
              }
            }
          }

          if (fullPages.length === 0) {
            throw new ConvexError("No pages found in OCR results");
          }

          result = {
            fullTextAnnotation: {
              text: fullText.trim(),
              pages: fullPages,
            },
          };

          // Clean up the uploaded file and output files
          await file.delete();
          await Promise.all(jsonFiles.map((f) => f.delete()));

          console.log("Multi-page OCR processed", {
            pageCount: fullPages.length,
            textLength: fullText.length,
          });
        } catch (pdfError: any) {
          console.error("PDF processing error:", pdfError);
          throw new ConvexError(
            `PDF processing failed: ${pdfError.message || "Unknown error"}`
          );
        }
      } else {
        console.log("Processing image document");
        try {
          // For images, convert to base64 and use textDetection
          const arrayBuffer = args.file.buffer;
          const base64Image = Buffer.from(arrayBuffer).toString("base64");
          const [imageResult] = await vision.textDetection({
            image: { content: base64Image },
          });
          result = imageResult;
        } catch (imageError: any) {
          console.error("Image processing error:", imageError);
          throw new ConvexError(
            `Image processing failed: ${imageError.message || "Unknown error"}`
          );
        }
      }

      const fullTextAnnotation = result.fullTextAnnotation;
      if (!fullTextAnnotation) {
        throw new ConvexError("No text detected in the document");
      }

      // Extract text from all pages
      const fullText = fullTextAnnotation.text || "";

      return fullText;
    } catch (error: any) {
      console.error("OCR processing error details:", {
        error,
        fileType: args.fileType,
        errorMessage: error.message || "Unknown error",
        errorStack: error.stack,
      });
      throw new ConvexError(
        `Failed to process document OCR: ${error.message || "Unknown error"}`
      );
    }
  },
});
