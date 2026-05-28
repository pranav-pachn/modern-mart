import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const orderItemSchema = z.object({
  productId: z.string().min(1),
  name: z.string().min(1),
  price: z.number().nonnegative(),
  quantity: z.number().int().positive(),
});

const deliverySlotSchema = z
  .string()
  .trim()
  .pipe(z.enum(["Morning", "Afternoon", "Evening"]));

const orderSchema = z.object({
  userId: z.string().min(1).optional(),
  userEmail: z.string().email().optional(),
  userName: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone is required"),
  address: z.string().min(1, "Address is required"),
  deliverySlot: deliverySlotSchema,
  subtotal: z.number().nonnegative("Subtotal is required"),
  items: z.array(orderItemSchema).min(1, "At least one item is required"),
  total: z.number().nonnegative("Total is required"),
  paymentMethod: z.string(),
  notes: z.string().trim().max(500).optional(),
});

describe('Order Creation Validation', () => {
  const validPayload = {
    userName: 'John Doe',
    phone: '9876543210',
    address: '123 Main St, City',
    deliverySlot: 'Morning',
    subtotal: 250,
    items: [
      {
        productId: 'prod1',
        name: 'Apple',
        price: 100,
        quantity: 2,
      },
    ],
    total: 280,
    paymentMethod: 'COD',
  };

  it('validates a correct order payload successfully (happy path)', () => {
    const result = orderSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it('fails if minimum required fields are missing', () => {
    const invalidPayload = { ...validPayload, userName: undefined };
    const result = orderSchema.safeParse(invalidPayload);
    expect(result.success).toBe(false);
  });

  it('fails if items array is empty', () => {
    const invalidPayload = { ...validPayload, items: [] };
    const result = orderSchema.safeParse(invalidPayload);
    expect(result.success).toBe(false);
  });

  it('fails if subtotal is negative', () => {
    const invalidPayload = { ...validPayload, subtotal: -10 };
    const result = orderSchema.safeParse(invalidPayload);
    expect(result.success).toBe(false);
  });
});
