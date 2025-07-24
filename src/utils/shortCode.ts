import { randomBytes } from "crypto"

export const generateShortCode = (length: number = 6): string => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let result = ""
    const bytes = randomBytes(length)

    for (let i = 0; i < length; i++) {
        result += chars[bytes[i] % chars.length]
    }

    return result
}

export const isValidUrl = (url: string): boolean => {
    try {
        new URL(url)
        return true
    } catch {
        return false
    }
}
