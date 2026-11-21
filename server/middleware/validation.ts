import type { NextFunction, Request, Response } from 'express'
import { z } from 'zod'

export const latLonSchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
})

export const citySchema = z.object({
  name: z.string().trim().min(2).max(80).regex(/^[\p{L} .,'-]+$/u),
})

export function validateQuery<T>(schema: z.ZodType<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query)
    if (!result.success) {
      res.status(400).json({ error: 'Invalid query parameters.' })
      return
    }
    res.locals.validatedQuery = result.data
    next()
  }
}
