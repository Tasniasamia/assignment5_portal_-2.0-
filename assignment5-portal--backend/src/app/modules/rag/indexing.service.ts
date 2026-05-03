import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { EmbeddingService } from "./embedding.service";

const convertLiteral = (data: number[]) => {
  return `[${data?.join(",")}]`;

};
export class IndexingService {
  private embeddingService: EmbeddingService;

  constructor() {
    this.embeddingService = new EmbeddingService();
  }

  async indexingDocument(
    chunkey: string,
    sourceType: string,
    sourceId: string,
    sourceLabel: string,
    content: string,
    metadata: Record<string, unknown>, // ✅ typo fix
  ) {
    const embeddingdata =
      await this.embeddingService.generateEmbedding(content);

    const vectorLiteral = convertLiteral(embeddingdata);

    await prisma.$executeRaw(Prisma.sql`
        INSERT INTO "documentIdeasEmbedding"
        (
            "id",
            "chunkey",        
            "sourceType",
            "sourceId",
            "sourceLabel",
            "content",
            "metadata",
            "embedding",
            "updatedAt"
        )
        VALUES
        (
            ${Prisma.raw("gen_random_uuid()")},  -- ✅ comma
            ${chunkey},
            ${sourceType},
            ${sourceId},
            ${sourceLabel || null},
            ${content},
            ${JSON.stringify(metadata || {})}::jsonb,
            CAST(${vectorLiteral} AS vector),
            NOW()
        )
        ON CONFLICT ("chunkey")               
        DO UPDATE SET
            "sourceType"  = EXCLUDED."sourceType",
            "sourceId"    = EXCLUDED."sourceId",
            "sourceLabel" = EXCLUDED."sourceLabel",
            "content"     = EXCLUDED."content",
            "metadata"    = EXCLUDED."metadata",
            "embedding"   = EXCLUDED."embedding",
            "isDeleted"   = false,
            "deletedAt"   = null,
            "updatedAt"   = NOW()
    `);
  }

  async indexingIdeas() {
    const ideas = await prisma.idea.findMany({
      include: {
       author:true,
       category:true,
       votes:true,
       comments:true
      },
    });
    let indexingCount = 0;

    for (let idea of ideas) {
      
      let comments= idea.comments.map((c) => c.content).join(" | ") || "No Comments";


      let chunkey = `${idea?.id}-${idea?.authorId}`;
      let sourceType = "idea";
      let sourceId = idea?.id;
      let sourceLabel = "idea";
      let content = `Idea Title: ${idea?.title}
  Description: ${idea?.description}
  Author: ${idea?.author?.name}
  Category: ${idea?.category?.name || "Uncategorized"}
  Votes: ${idea?.votes?.length || 0}
  Comments: ${comments}`;
      // metdata → metadata
      let metadata = {
        // ✅
        ideaId: idea?.id,
        title: idea?.title,
        description: idea?.description,
        authorId: idea?.authorId,
        categoryId: idea?.categoryId,
      };

      await this.indexingDocument(
        chunkey,
        sourceType,
        sourceId,
        sourceLabel,
        content,
        metadata, // ✅
      );
      indexingCount++;
    }

    return indexingCount;
  }
}