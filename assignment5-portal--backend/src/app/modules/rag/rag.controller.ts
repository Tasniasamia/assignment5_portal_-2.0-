import { sendResponse } from "../../shared/sendResponse";
import status from "http-status";
import { RagService } from "./rag.service";
import type { Request, Response } from "express";
import { catchAsyncHandler } from "../../shared/catchAsyncHandler";

const ragService = new RagService();

const ingestIdeas = catchAsyncHandler(async (req: Request, res: Response) => {
  const result = await ragService.indexingIdeas();
  if (result === null || result === undefined) {
    throw new Error("Ideas data ingestion failed");
  }
  sendResponse(res, {
    success: true,
    httpStatusCode: status.OK,
    message: `Ideas data ingestion completed. Total: ${result}`,
    data: { count: result },
  });
});

const queryRag = catchAsyncHandler(async (req: Request, res: Response) => {
  const { query, limit, sourceType, asJson } = req?.body;
  console.log("Received query:", { query, limit, sourceType, asJson });
  if (!query) {
    throw new Error("Query is required");
  }
 const result = await ragService.generateAnswer(
    query,
    limit,
    sourceType,
    asJson,
  );
  if (result === null || result === undefined) {
    throw new Error("Idea data generate answer failed");
  }
  sendResponse(res, {
    success: true,
    httpStatusCode: status.OK,
    message: `Idea data generate answer completed.`,
    data: result,
  });
});

export const RagController = {
  ingestIdeas,
  queryRag,
};
