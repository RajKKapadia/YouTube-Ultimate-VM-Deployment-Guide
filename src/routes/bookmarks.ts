import { NextFunction, Router, Request, Response, RequestHandler } from "express"

import { z } from "zod"

import { authenticateToken } from "../middleware/auth"
import {
    createBookmark,
    getUserBookmarks,
    getBookmark,
    deleteBookmark
} from "../controllers/bookmarkController"

const bookmarkSchema = z.object({
    title: z.string().min(1, "Title is required."),
    url: z.string().min(1, "URL is required.")
})

const validateBookmark = (req: Request, res: Response, next: NextFunction): void => {
    const result = bookmarkSchema.safeParse(req.body)
    if (!result.success) {
        const requiredFields = Object.keys(bookmarkSchema.shape)
        res.status(400).json({
            message: `Required fields: ${requiredFields.join(", ")}`,
        })
        return
    }
    req.body = result.data
    next()
}

const router: Router = Router()

// All bookmark routes require authentication
router.use(authenticateToken)

router.post("/create", validateBookmark, createBookmark as RequestHandler)
router.get("/get", getUserBookmarks)
router.get("/get/:bookmark_id", getBookmark as RequestHandler)
router.delete("/delete/:bookmark_id", deleteBookmark as RequestHandler)

export default router
