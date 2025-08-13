import type { ExampleItem, InsertExampleItem } from "@shared/schema";

export interface IStorage {
  getExampleItems(): Promise<ExampleItem[]>;
  createExampleItem(item: InsertExampleItem): Promise<ExampleItem>;
}

class MemStorage implements IStorage {
  private items: ExampleItem[] = [];

  async getExampleItems(): Promise<ExampleItem[]> {
    return [...this.items];
  }

  async createExampleItem(item: InsertExampleItem): Promise<ExampleItem> {
    const newItem: ExampleItem = {
      id: Math.random().toString(36).substr(2, 9),
      ...item,
      createdAt: new Date(),
    };
    this.items.push(newItem);
    return newItem;
  }
}

export const storage = new MemStorage();