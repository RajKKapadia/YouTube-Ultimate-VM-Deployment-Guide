import { Response, Request } from "express"
import { eq, and } from "drizzle-orm"

import { db } from "../drizzle/db"
import { bookmarks } from "../drizzle/schema"
import { generateShortCode, isValidUrl } from "../utils/shortCode"

export const createBookmark = async (req: Request, res: Response) => {
    try {
        const { title, url } = req.body
        const userId = req.user!.userId

        if (!title || !url) {
            return res.status(400).json({ error: "Title and URL are required" })
        }

        if (!isValidUrl(url)) {
            return res.status(400).json({ error: "Invalid URL format" })
        }

        const existingBookmark = await db.query.bookmarks.findFirst({
            where(fields, operators) {
                return operators.eq(fields.originalUrl, url)
            },
        })

        if (existingBookmark) {
            return res.status(403).json({ error: "Already exists." })
        }

        // Generate unique short code
        let shortCode: string
        let attempts = 0
        const maxAttempts = 10

        do {
            shortCode = generateShortCode()
            const existing = await db.select().from(bookmarks).where(eq(bookmarks.shortCode, shortCode)).limit(1)
            if (existing.length === 0) break
            attempts++
        } while (attempts < maxAttempts)

        if (attempts >= maxAttempts) {
            return res.status(500).json({ error: "Failed to generate unique short code" })
        }

        // Create bookmark
        const [newBookmark] = await db.insert(bookmarks).values({
            userId,
            title,
            originalUrl: url,
            shortCode,

        }).returning()

        res.status(201).json({
            id: newBookmark.id,
            title: newBookmark.title,
            original_url: newBookmark.originalUrl,
            short_code: newBookmark.shortCode,
            short_url: `${req.protocol}://${req.get("host")}/${newBookmark.shortCode}`,
            visit_count: newBookmark.visitCount,
            is_active: newBookmark.isActive,
            created_at: newBookmark.createdAt,
            updated_at: newBookmark.updatedAt
        })
    } catch (error) {
        console.error("Create bookmark error:", error)
        res.status(500).json({ error: "Internal server error" })
    }
}

export const getUserBookmarks = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.userId

        const userBookmarks = await db.select().from(bookmarks)
            .where(and(eq(bookmarks.userId, userId), eq(bookmarks.isActive, true)))
            .orderBy(bookmarks.createdAt)

        const formattedBookmarks = userBookmarks.map(bookmark => ({
            id: bookmark.id,
            title: bookmark.title,
            original_url: bookmark.originalUrl,
            short_code: bookmark.shortCode,
            short_url: `${req.protocol}://${req.get("host")}/${bookmark.shortCode}`,
            visit_count: bookmark.visitCount,
            is_active: bookmark.isActive,
            created_at: bookmark.createdAt,
            updated_at: bookmark.updatedAt
        }))

        res.json(formattedBookmarks)
    } catch (error) {
        console.error("Get bookmarks error:", error)
        res.status(500).json({ error: "Internal server error" })
    }
}

export const getBookmark = async (req: Request, res: Response) => {
    try {
        const bookmarkId = req.params.bookmark_id
        const userId = req.user!.userId

        const [bookmark] = await db.select().from(bookmarks)
            .where(and(
                eq(bookmarks.id, bookmarkId),
                eq(bookmarks.userId, userId),
                eq(bookmarks.isActive, true)
            ))
            .limit(1)

        if (!bookmark) {
            return res.status(404).json({ error: "Bookmark not found" })
        }

        res.json({
            id: bookmark.id,
            title: bookmark.title,
            original_url: bookmark.originalUrl,
            short_code: bookmark.shortCode,
            short_url: `${req.protocol}://${req.get("host")}/${bookmark.shortCode}`,
            visit_count: bookmark.visitCount,
            is_active: bookmark.isActive,
            created_at: bookmark.createdAt,
            updated_at: bookmark.updatedAt
        })
    } catch (error) {
        console.error("Get bookmark error:", error)
        res.status(500).json({ error: "Internal server error" })
    }
}

export const deleteBookmark = async (req: Request, res: Response) => {
    try {
        const bookmarkId = req.params.bookmark_id
        const userId = req.user!.userId

        // Soft delete by setting isActive to false
        const [updatedBookmark] = await db.update(bookmarks)
            .set({ isActive: false, updatedAt: new Date() })
            .where(and(
                eq(bookmarks.id, bookmarkId),
                eq(bookmarks.userId, userId),
                eq(bookmarks.isActive, true)
            ))
            .returning()

        if (!updatedBookmark) {
            return res.status(404).json({ error: "Bookmark not found" })
        }

        res.json({ message: "Bookmark deleted successfully" })
    } catch (error) {
        console.error("Delete bookmark error:", error)
        res.status(500).json({ error: "Internal server error" })
    }
}
