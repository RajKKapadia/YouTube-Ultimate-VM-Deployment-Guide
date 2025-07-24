import { Router, RequestHandler } from "express"
import { z } from "zod"

import { register, login } from "../controllers/authController"

const userSchema = z.object({
    email: z.string().email("Email is required."),
    password: z.string().min(1, "Password is required.")
})

const validateUser: RequestHandler = (request, response, next) => {
    const result = userSchema.safeParse(request.body)
    if (!result.success) {
        const requiredFields = Object.keys(userSchema.shape)
        response.status(400).json({
            message: `Required fields: ${requiredFields.join(", ")}`,
        })
    }
    request.body = result.data
    next()
}

const router: Router = Router()

router.post("/register", validateUser, register as RequestHandler)
router.post("/token", validateUser, login as RequestHandler)

export default router
