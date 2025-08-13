import { z } from "zod";

// Simple example schema for a blank app
export const exampleItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  createdAt: z.date(),
});

export const insertExampleItemSchema = exampleItemSchema.omit({ id: true, createdAt: true });

export type ExampleItem = z.infer<typeof exampleItemSchema>;
export type InsertExampleItem = z.infer<typeof insertExampleItemSchema>;