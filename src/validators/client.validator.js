import { z } from 'zod';

const addressSchema = z.object({
  street: z.string().optional(),
  number: z.string().optional(),
  postal: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional()
}).optional();

export const createClientSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').trim(),
  cif: z.string().min(1, 'El CIF es obligatorio').trim(),
  email: z.string().email('Email inválido').toLowerCase().optional(),
  phone: z.string().optional(),
  address: addressSchema
});

export const updateClientSchema = createClientSchema.partial();
