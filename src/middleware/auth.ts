import { Request, Response, NextFunction } from "express"

import { verifyToken } from "../utils/jwt"

export const authenticateToken = (request: Request, response: Response, next: NextFunction): void => {
    const authHeader = request.headers["authorization"]
    const token = authHeader && authHeader.split(" ")[1]

    if (!token) {
        response.status(401).json({ error: "Access token required" });
        return
    }

    try {
        const decoded = verifyToken(token)
        request.user = decoded
        next()
    } catch (error) {
        response.status(403).json({ error: "Invalid or expired token" });
        return
    }
}
