import { Request, Response } from "express"
import { eq, and, sql } from "drizzle-orm"

import { db } from "../drizzle/db"
import { bookmarks } from "../drizzle/schema"

export const redirectToUrl = async (req: Request, res: Response) => {
    try {
        const { short_code } = req.params

        if (!short_code) {
            return res.status(400).json({ error: "Short code is required" })
        }

        // Find bookmark and increment visit count in a single query
        const [bookmark] = await db.update(bookmarks)
            .set({
                visitCount: sql`${bookmarks.visitCount} + 1`,
                updatedAt: new Date()
            })
            .where(and(
                eq(bookmarks.shortCode, short_code),
                eq(bookmarks.isActive, true)
            ))
            .returning()

        if (!bookmark) {
            return res.status(404).json({ error: "Short URL not found" })
        }

        // Redirect to original URL
        res.redirect(bookmark.originalUrl)
    } catch (error) {
        console.error("Redirect error:", error)
        res.status(500).json({ error: "Internal server error" })
    }
}
