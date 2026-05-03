/* eslint-disable @typescript-eslint/no-explicit-any */
import { httpClient } from "@/lib/axios/httpClient";

export interface IRagQueryPayload {
  query: string;
  limit?: number;
  sourceType?: string;
}

export interface IRagSource {
  id: string;
  content: string;
  similarity: number;
  metadata?: {
    name?: string;
    [key: string]: unknown;
  };
  sourceType?: string;
}

export interface IRagQueryData {
  answer: any;
  sources: IRagSource[];
  contextUsed: string;
}

export interface IIngestDoctorsData {
  success: boolean;
  message: string;
  indexedCount: number;
}

export const queryRagService = async (payload: IRagQueryPayload) => {
    const objectToSend = {
      query: payload.query,
      limit: 5,
      sourceType: "idea",
      asJson: true
    };
  const response = await httpClient.post<any>("/rag/query", objectToSend);
  console.log("ragservice response", response);
  return response;
};

export const ingestIdeaService = async () => {
  const response = await httpClient.post<IIngestDoctorsData>(
    "/rag/ingest-doctor",
    {},
  );
  return response;
};