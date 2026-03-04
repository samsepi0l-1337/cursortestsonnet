import { generateUploadButton, generateUploadDropzone } from "@uploadthing/react";
import type { AppFileRouter } from "@/lib/uploadthing";

export const UploadButton = generateUploadButton<AppFileRouter>();
export const UploadDropzone = generateUploadDropzone<AppFileRouter>();
