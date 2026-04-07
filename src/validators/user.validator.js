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