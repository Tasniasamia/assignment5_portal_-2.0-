import { Router } from "express";
import { RagController } from "./rag.controller";

const router = Router();

router.post("/ingest-ideas", RagController.ingestIdeas)
router.post("/query",RagController.queryRag)

export const RagRoutes = router;