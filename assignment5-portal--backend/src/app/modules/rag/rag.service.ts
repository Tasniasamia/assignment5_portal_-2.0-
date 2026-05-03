import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { redisService } from "../../lib/redis";
import { EmbeddingService } from "./embedding.service";
import { IndexingService } from "./indexing.service";
import  { LLMService } from "./llm.service";

const convertLiteral = (data: number[]) => {
  return `[${data?.join(",")}]`;
  // output: "[0.23,-0.87,0.41]"  ← PostgreSQL vector format
};
export class RagService{
private indexingService:IndexingService;
private embeddingService:EmbeddingService;
private llmService:LLMService;
constructor(){
this.indexingService=new IndexingService();
this.embeddingService=new EmbeddingService();
this.llmService=new LLMService();
}
async indexingIdeas(){

return await this.indexingService.indexingIdeas();
}

async retrivalDocument(query:string,limit:number,sourceType:string){
    const embeddingdata =await this.embeddingService.generateEmbedding(query as string);
    const vectorLiteral = convertLiteral(embeddingdata);
         const results = await prisma.$queryRaw(Prisma.sql`
          SELECT id, "chunkey", "sourceType", "sourceId", "sourceLabel", content, metadata, embedding, "isDeleted", "deletedAt", "createdAt", "updatedAt", 
          1 - (embedding <=> CAST(${vectorLiteral} AS vector)) as similarity  
          FROM "documentIdeasEmbedding"
          WHERE "isDeleted" = false
          ${sourceType ? Prisma.sql`AND "sourceType" = ${sourceType}` : Prisma.empty}  
          ORDER BY embedding <=> CAST(${vectorLiteral} AS vector)
          Limit ${limit}
          `);
       return results;

  }


async generateAnswer(query:string,
    limit:number,
    sourceType:string,
    asJson:boolean){

    const retrivalDocuments=await  this.retrivalDocument( query, limit,sourceType );
    const context=(retrivalDocuments as any)?.filter((doc:any)=>doc.content)?.map((doc:any)=>doc.content);
    const cachedAnswer:string|null =await redisService.get(`rag_answer:${query}:${sourceType}:${asJson}`);
     
    console.log("cachedAnswer:", cachedAnswer);
    if (cachedAnswer) {
        return {
        answer: cachedAnswer,
        sources: (retrivalDocuments as any).map((doc: any) => ({ // ✅ relevantDocs → retrivalDocuments
            id: doc.id,
            chunkKey: doc.chunkey,  
            sourceType: doc.sourceType,
            sourceId: doc.sourceId,
            sourceLabel: doc.sourceLabel,
            content: doc.content,
            similarity: doc.similarity,
        })),
        contextUsed: context.length > 0,
    };
    }
    let answer = await this.llmService.generateAnswer( query,context,asJson);
    let parsedAnswer: any ;
    console.log("LLM answer:", answer);
   
  if (asJson) {
    try {
        if (answer.startsWith("```json")) {
            answer = answer.replace(/```json\n?/, "").replace(/```$/, "").trim();
        } else if (answer.startsWith("```")) {
            answer = answer.replace(/```\n?/, "").replace(/```$/, "").trim();
        }

        // AI response clean + normalize
        answer = answer
            .replace(/\n/g, " ")
            .replace(/\r/g, " ")
            .replace(/\t/g, " ")
            .replace(/\s+/g, " ")
            .trim();

        parsedAnswer = JSON.parse(answer);

        await redisService.set(
            `rag_answer:${query}:${sourceType}:${asJson}`,
            parsedAnswer,
            3600
        ); // Cache for 1 hour

    } catch (error) {
        console.error("Failed to parse LLM response as JSON:", error);
        throw new Error("LLM response is not valid JSON");
    }
}

    return {
        answer: parsedAnswer,
        sources: (retrivalDocuments as any).map((doc: any) => ({ // ✅ relevantDocs → retrivalDocuments
            id: doc.id,
            chunkKey: doc.chunkey,  // ✅ DB তে "chunkey" (lowercase)
            sourceType: doc.sourceType,
            sourceId: doc.sourceId,
            sourceLabel: doc.sourceLabel,
            content: doc.content,
            similarity: doc.similarity,
        })),
        contextUsed: context.length > 0,
    };
}


}