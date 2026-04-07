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

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(8, 'La contraseña actual es obligatoria'),
  newPassword: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres')
}).refine(data => data.currentPassword !== data.newPassword, {
  message: 'La nueva contraseña debe ser diferente a la actual',
  path: ['newPassword']
});
export const inviteUserSchema = z.object({
  email: z.string().email().transform(v => v.toLowerCase().trim()),
  name: z.string().min(1),
  lastName: z.string().min(1)
});
