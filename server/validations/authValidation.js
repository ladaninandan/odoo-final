/**
 * 🛡️ VALIDATIONS FOLDER
 * 
 * Instead of checking `if (!req.body.password)` manually 20 times in 
 * controllers, professional structures use Zod or Joi to enforce schema 
 * rules strictly before the Controller even runs.
 */

// Example placeholder for Zod/Joi:
/*
import { z } from 'zod';
export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional()
});
*/
