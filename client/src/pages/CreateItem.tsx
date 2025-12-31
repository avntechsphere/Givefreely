import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertItemSchema, type InsertItem } from "@shared/schema";
import { useCreateItem } from "@/hooks/use-items";
import { useLocation } from "wouter";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowLeft, Upload, Camera } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";

export default function CreateItem() {
  const [, setLocation] = useLocation();
  const createItem = useCreateItem();

  const form = useForm<InsertItem>({
    resolver: zodResolver(insertItemSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      condition: "Good",
      location: "",
      images: [],
    },
  });

  const onSubmit = (data: InsertItem) => {
    // For MVP, handling images as an array containing one URL string if provided
    const imageInput = data.images as unknown as string; // Hacky cast because hook-form might return string
    const formattedData = {
      ...data,
      images: imageInput ? [imageInput] : [], 
    };

    createItem.mutate(formattedData, {
      onSuccess: () => setLocation("/dashboard"),
    });
  };

  const categories = ["Furniture", "Electronics", "Clothing", "Books", "Kitchen", "Toys", "Garden", "Other"];
  const conditions = ["New", "Like New", "Good", "Fair", "Poor"];

  return (
    <div className="min-h-screen bg-muted/20 py-12">
      <div className="container max-w-3xl">
        <Link href="/dashboard">
          <Button variant="ghost" className="mb-6 pl-0 hover:bg-transparent hover:text-primary transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        
        <div className="mb-8">
          <h1 className="font-display text-4xl font-bold mb-2">List an Item</h1>
          <p className="text-muted-foreground">
            Share something you no longer need. It takes less than a minute!
          </p>
        </div>

        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-6 md:p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="font-display font-bold text-lg border-b pb-2">Basic Info</h3>
                  
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Vintage Wooden Chair" className="h-11" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-11">
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map((c) => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="condition"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Condition</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-11">
                                <SelectValue placeholder="Select condition" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {conditions.map((c) => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-4">
                  <h3 className="font-display font-bold text-lg border-b pb-2 pt-2">Details</h3>
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe the item, its history, measurements, and any defects..." 
                            className="min-h-[120px] resize-y"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pickup Location (Neighborhood/City)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Downtown, Brooklyn" className="h-11" {...field} />
                        </FormControl>
                        <FormDescription>
                          Keep it general for privacy (e.g., zip code or neighborhood).
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="images"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Item Photos (Optional)</FormLabel>
                        <FormControl>
                          <div className="space-y-3">
                            <div className="flex gap-2">
                              <label className="flex-1 flex items-center justify-center gap-2 cursor-pointer border-2 border-dashed border-primary/30 rounded-lg p-4 hover:border-primary/50 transition-colors">
                                <Upload className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Upload from Gallery</span>
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  className="hidden" 
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const reader = new FileReader();
                                      reader.onloadend = () => {
                                        field.onChange(reader.result as string);
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                />
                              </label>
                              <label className="flex-1 flex items-center justify-center gap-2 cursor-pointer border-2 border-dashed border-primary/30 rounded-lg p-4 hover:border-primary/50 transition-colors">
                                <Camera className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Take Photo</span>
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  capture="environment"
                                  className="hidden" 
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const reader = new FileReader();
                                      reader.onloadend = () => {
                                        field.onChange(reader.result as string);
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                />
                              </label>
                            </div>
                            {field.value && typeof field.value === 'string' && (
                              <div className="relative border border-primary/20 rounded-lg p-2 bg-primary/5">
                                <img 
                                  src={field.value} 
                                  alt="Preview" 
                                  className="w-full h-32 object-cover rounded"
                                />
                                <button
                                  type="button"
                                  onClick={() => field.onChange("")}
                                  className="absolute top-4 right-4 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                                >
                                  ✕
                                </button>
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormDescription>
                          Upload a photo from your device or take a new photo with your camera.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="pt-4 flex justify-end">
                  <Button 
                    type="submit" 
                    size="lg" 
                    disabled={createItem.isPending}
                    className="w-full sm:w-auto min-w-[150px]"
                  >
                    {createItem.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Publishing...
                      </>
                    ) : (
                      "Publish Listing"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
