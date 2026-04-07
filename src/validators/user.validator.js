import { z } from "zod";

export const registerSchema = z.object({
  email: z
    .string()
    .email()
    .transform((val) => val.toLowerCase()),

  password: z
    .string()
    .min(8)
});

export const validationCodeSchema = z.object({
  code: z.string().length(6, 'El código debe tener exactamente 6 dígitos')
});
export const loginSchema = z.object({
  email: z.string().email().transform((val) => val.toLowerCase()),
  password: z.string().min(8)
});
export const personalDataSchema = z.object({
  name: z.string().min(1).trim(),
  lastName: z.string().min(1).trim(),
  nif: z.string().min(1).trim()
});
export const companySchema = z.object({
  name: z.string().min(1).trim(),
  cif: z.string().min(1).trim(),
  isFreelance: z.boolean().optional().default(false),
  address: z.object({
    street: z.string().optional(),
    number: z.string().optional(),
    postal: z.string().optional(),
    city: z.string().optional(),
    province: z.string().optional()
  }).optional()
});