import { z } from 'zod';

const addressSchema = z.object({
  street: z.string().optional(),
  number: z.string().optional(),
  postal: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional()
}).optional();

export const createProjectSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').trim(),
  projectCode: z.string().min(1, 'El código de proyecto es obligatorio').trim(),
  client: z.string().min(1, 'El cliente es obligatorio'),
  address: addressSchema,
  email: z.string().email('Email inválido').toLowerCase().optional(),
  notes: z.string().optional()
});

export const updateProjectSchema = createProjectSchema.partial();
