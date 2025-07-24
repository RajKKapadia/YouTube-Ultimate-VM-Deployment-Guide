import jwt from "jsonwebtoken"
import { UserPayload } from "../types"

const JWT_SECRET = process.env.JWT_SECRET as string

export const generateToken = (payload: UserPayload): string => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" })
}

export const verifyToken = (token: string): UserPayload => {
    return jwt.verify(token, JWT_SECRET) as UserPayload
}
