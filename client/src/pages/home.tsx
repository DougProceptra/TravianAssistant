import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { ExampleItem, InsertExampleItem } from "@shared/schema";

export default function Home() {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // Fetch items
  const { data: itemsData, isLoading } = useQuery<{data: ExampleItem[]}>({
    queryKey: ['/api/items']
  });

  // Create item mutation
  const createItemMutation = useMutation({
    mutationFn: async (item: InsertExampleItem) => {
      const response = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
      if (!response.ok) throw new Error('Failed to create item');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/items'] });
      setTitle("");
      setDescription("");
      toast({
        title: "Success",
        description: "Item created successfully!"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create item",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    createItemMutation.mutate({
      title: title.trim(),
      description: description.trim() || undefined
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4" data-testid="page-title">
            Welcome to Your Blank App
          </h1>
          <p className="text-lg text-gray-600" data-testid="page-description">
            A clean, minimal starting point for your next web application
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Create Item Form */}
          <Card data-testid="create-item-form">
            <CardHeader>
              <CardTitle>Create New Item</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter item title"
                    data-testid="input-title"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter item description"
                    rows={3}
                    data-testid="input-description"
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={!title.trim() || createItemMutation.isPending}
                  data-testid="button-create-item"
                >
                  {createItemMutation.isPending ? "Creating..." : "Create Item"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Items List */}
          <Card data-testid="items-list">
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-gray-500" data-testid="loading-message">Loading items...</p>
              ) : itemsData?.data?.length === 0 ? (
                <p className="text-gray-500" data-testid="empty-message">No items yet. Create your first item!</p>
              ) : (
                <div className="space-y-3">
                  {itemsData?.data?.map((item) => (
                    <div key={item.id} className="border rounded-lg p-3" data-testid={`item-${item.id}`}>
                      <h3 className="font-medium text-gray-900">{item.title}</h3>
                      {item.description && (
                        <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        Created: {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* API Status */}
        <Card className="mt-8" data-testid="api-status">
          <CardHeader>
            <CardTitle>API Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Backend is running</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Express.js server with in-memory storage is ready to handle requests
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}