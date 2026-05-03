/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { ingestIdeaService, queryRagService } from "@/service/rag.service";


export const queryRagAction = async (query: string) => {
  try {
    const response = await queryRagService({ query });
    console.log("RAG Service Response:", response);
    if (!response?.success) {
      return {
        success: false,
        error: "No answer received from AI. Please try again",
      };
    }

    let answer = await response?.data?.answer;

    // if the answer is an object {doctors: [...]} convert it readable string
    if (typeof answer === "object" && answer !== null) {
      if ("doctors" in answer && Array.isArray(answer.doctors)) {
        const doctors = answer.doctors.slice(0, 5);

        if (doctors.length > 0) {
          answer =
            `I found ${doctors.length} doctors who may help you:\n\n` +
            doctors.map((d: any, i: number) => {
              let text = ``;
              if (d.name) text += `${i + 1}. **${d.name}**\n`;
              if (d.specialty) text += `Specialization: **${d.specialty}**\n`;
              if (d.reason) text += `Why: ${d.reason}\n`;
              return text + "\n";
            });
        } else {
          answer =
            "I couldn't find any doctors matching your query. Please try another query.";
        }
      } else {
        answer = JSON.stringify(answer, null, 2);
      }
    }
    return {
      success: true,
      answer: answer as string,
      sources: response?.data?.sources ?? [],
    };
  } catch (error) {
    console.log(error);
    return {
      success: false,
      error:
        "Failed to reach the AI Assistant. Please check your connection and try again.",
    };
  }
};

export const ingestIdeaAction = async () => {
  try {
    const response = await ingestIdeaService();

    return {
      success: true,
      indexedCount: response.data.indexedCount,
      message:
        response.data.message ??
        response.message ??
        "Doctors data synced successfully.",
    };
  } catch (error) {
    console.log(error);
    return {
      success: false,
      error: "Failed to synce doctor data. Please try again.",
    };
  }
};

