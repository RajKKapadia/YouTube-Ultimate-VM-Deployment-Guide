import { Request, Response } from "express"
import { createHmac, randomBytes } from "crypto"
import { eq } from "drizzle-orm"

import { db } from "../drizzle/db"
import { users } from "../drizzle/schema"
import { generateToken } from "../utils/jwt"

const generateSalt = (length: number = 32): string => {
    return randomBytes(length).toString('hex')
}


const hashString = ({ str, salt }: { str: string, salt: string }): string => {
    return createHmac('sha256', salt).update(str).digest('hex');
}

export const register = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" })
        }

        if (password.length < 6) {
            return res.status(400).json({ error: "Password must be at least 6 characters long" })
        }

        // Check if user already exists
        const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1)
        if (existingUser.length > 0) {
            return res.status(400).json({ error: "User already exists with this email" })
        }

        // Hash password
        const salt = generateSalt()
        const hashedPassword = hashString({ str: password, salt: salt })

        // Create user
        const [newUser] = await db.insert(users).values({
            email,
            password: hashedPassword,
            slat: salt
        }).returning({ id: users.id, email: users.email, createdAt: users.createdAt })

        // Generate token
        const token = generateToken({ userId: newUser.id, email: newUser.email })

        res.status(201).json({
            message: "User registered successfully",
            user: { id: newUser.id, email: newUser.email, createdAt: newUser.createdAt },
            access_token: token,
            token_type: "bearer"
        })
    } catch (error) {
        console.error("Registration error:", error)
        res.status(500).json({ error: "Internal server error" })
    }
}

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" })
        }

        // Find user
        const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" })
        }

        // Verify password
        const isValidPassword = hashString({ str: password, salt: user.slat }) === user.password
        if (!isValidPassword) {
            return res.status(401).json({ error: "Invalid credentials" })
        }

        // Generate token
        const token = generateToken({ userId: user.id, email: user.email })

        res.json({
            access_token: token,
            token_type: "bearer",
            user: { id: user.id, email: user.email, createdAt: user.createdAt }
        })
    } catch (error) {
        console.error("Login error:", error)
        res.status(500).json({ error: "Internal server error" })
    }
}
