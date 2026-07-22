import { Request, Response, NextFunction } from "express";

function cleanValue(obj: any): any {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === "string") {
    // Sanitize common script tag XSS patterns
    return obj
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/javascript:/gi, "");
  }

  if (Array.isArray(obj)) {
    return obj.map(cleanValue);
  }

  if (typeof obj === "object") {
    const cleaned: Record<string, any> = {};
    for (const key of Object.keys(obj)) {
      // Prevent NoSQL key injection e.g. $gt, $ne, $where
      if (key.startsWith("$")) {
        continue;
      }
      cleaned[key] = cleanValue(obj[key]);
    }
    return cleaned;
  }

  return obj;
}

export function sanitizeInputs(req: Request, _res: Response, next: NextFunction) {
  if (req.body) {
    req.body = cleanValue(req.body);
  }
  if (req.query) {
    req.query = cleanValue(req.query);
  }
  if (req.params) {
    req.params = cleanValue(req.params);
  }
  next();
}
