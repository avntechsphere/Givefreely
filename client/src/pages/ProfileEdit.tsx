import { useForm } from "react-hook-form";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Loader2, ArrowLeft, Lock, LockOpen } from "lucide-react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function ProfileEdit() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const form = useForm({
    defaultValues: {
      name: user?.name || "",
      location: user?.location || "",
      phoneNumber: user?.phoneNumber || "",
      email: user?.email || "",
      phonePublic: user?.phonePublic || false,
      emailPublic: user?.emailPublic || false,
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest("PATCH", "/api/user/profile", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setLocation("/dashboard");
    },
  });

  const onSubmit = (data: any) => {
    if (!data.phoneNumber.trim()) {
      form.setError("phoneNumber", { message: "Phone number is required" });
      return;
    }
    updateMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-muted/20 py-12">
      <div className="container max-w-2xl">
        <Link href="/dashboard">
          <Button variant="ghost" className="mb-6 pl-0 hover:bg-transparent hover:text-primary transition-colors" data-testid="button-back">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>

        <div className="mb-8">
          <h1 className="font-display text-4xl font-bold mb-2">Edit Profile</h1>
          <p className="text-muted-foreground">
            Update your profile information and privacy settings
          </p>
        </div>

        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Make changes to your account details</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Personal Info */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-muted-foreground">Personal Information</h3>
                  
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your name" {...field} data-testid="input-name" />
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
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input placeholder="City, State" {...field} value={field.value || ""} data-testid="input-location" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Contact Info */}
                <div className="space-y-4 border-t pt-6">
                  <h3 className="font-semibold text-sm text-muted-foreground">Contact Information</h3>
                  
                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel>Phone Number *</FormLabel>
                          <FormField
                            control={form.control}
                            name="phonePublic"
                            render={({ field: privacyField }) => (
                              <div className="flex items-center gap-2">
                                {privacyField.value ? (
                                  <LockOpen className="h-4 w-4 text-green-600" />
                                ) : (
                                  <Lock className="h-4 w-4 text-muted-foreground" />
                                )}
                                <Switch
                                  checked={privacyField.value}
                                  onCheckedChange={privacyField.onChange}
                                  data-testid="toggle-phone-public"
                                />
                              </div>
                            )}
                          />
                        </div>
                        <FormControl>
                          <Input 
                            placeholder="+1 (555) 000-0000" 
                            {...field} 
                            data-testid="input-phone"
                          />
                        </FormControl>
                        <FormDescription>
                          {form.watch("phonePublic") ? "Your phone number is visible to other users" : "Your phone number is private"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel>Email Address</FormLabel>
                          <FormField
                            control={form.control}
                            name="emailPublic"
                            render={({ field: privacyField }) => (
                              <div className="flex items-center gap-2">
                                {privacyField.value ? (
                                  <LockOpen className="h-4 w-4 text-green-600" />
                                ) : (
                                  <Lock className="h-4 w-4 text-muted-foreground" />
                                )}
                                <Switch
                                  checked={privacyField.value}
                                  onCheckedChange={privacyField.onChange}
                                  data-testid="toggle-email-public"
                                />
                              </div>
                            )}
                          />
                        </div>
                        <FormControl>
                          <Input 
                            type="email"
                            placeholder="your@email.com" 
                            {...field} 
                            value={field.value || ""}
                            data-testid="input-email"
                          />
                        </FormControl>
                        <FormDescription>
                          {form.watch("emailPublic") ? "Your email is visible to other users" : "Your email is private"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Privacy Info */}
                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm">
                  <p className="text-blue-900 dark:text-blue-100">
                    <strong>Privacy Notice:</strong> Toggle the switches above to make your phone number or email visible to other users on the platform. Keep them private by default to protect your information.
                  </p>
                </div>

                <div className="flex gap-4 pt-4">
                  <Link href="/dashboard" className="flex-1">
                    <Button variant="outline" className="w-full" data-testid="button-cancel">
                      Cancel
                    </Button>
                  </Link>
                  <Button
                    type="submit"
                    disabled={updateMutation.isPending}
                    className="flex-1"
                    data-testid="button-save"
                  >
                    {updateMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Save Changes
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
