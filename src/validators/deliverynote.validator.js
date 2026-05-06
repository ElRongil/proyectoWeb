import { z } from 'zod';

const workerSchema = z.object({
  name: z.string().min(1),
  hours: z.number().positive()
});

export const createDeliveryNoteSchema = z.discriminatedUnion('format', [
  z.object({
    format: z.literal('material'),
    project: z.string().min(1, 'El proyecto es obligatorio'),
    client: z.string().min(1, 'El cliente es obligatorio'),
    description: z.string().optional(),
    workDate: z.coerce.date(),
    material: z.string().min(1, 'El material es obligatorio'),
    quantity: z.number().positive('La cantidad debe ser positiva'),
    unit: z.string().min(1, 'La unidad es obligatoria')
  }),
  z.object({
    format: z.literal('hours'),
    project: z.string().min(1, 'El proyecto es obligatorio'),
    client: z.string().min(1, 'El cliente es obligatorio'),
    description: z.string().optional(),
    workDate: z.coerce.date(),
    hours: z.number().positive('Las horas deben ser positivas').optional(),
    workers: z.array(workerSchema).optional()
  }).refine(
    data => data.hours != null || (data.workers && data.workers.length > 0),
    { message: 'Debe indicar horas o al menos un trabajador', path: ['hours'] }
  )
]);
