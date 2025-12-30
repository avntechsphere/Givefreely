import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { Navbar } from "@/components/Navbar";

// Pages
import Home from "@/pages/Home";
import Browse from "@/pages/Browse";
import ItemDetail from "@/pages/ItemDetail";
import CreateItem from "@/pages/CreateItem";
import Dashboard from "@/pages/Dashboard";
import ProfileEdit from "@/pages/ProfileEdit";
import { Login, Register } from "@/pages/Auth";
import NotFound from "@/pages/not-found";
import { Loader2 } from "lucide-react";

function ProtectedRoute({ component: Component, ...rest }: { component: React.ComponentType<any> }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  React.useEffect(() => {
    if (!isLoading && !user) setLocation("/login");
  }, [isLoading, user, setLocation]);

  if (isLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!user) return null;

  return <Component {...rest} />;
}

function Router() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/browse" component={Browse} />
          <Route path="/items/:id" component={ItemDetail} />
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          
          {/* Protected Routes */}
          <Route path="/create-item">
            <ProtectedRoute component={CreateItem} />
          </Route>
          <Route path="/dashboard">
            <ProtectedRoute component={Dashboard} />
          </Route>
          <Route path="/profile/edit">
            <ProtectedRoute component={ProfileEdit} />
          </Route>

          <Route component={NotFound} />
        </Switch>
      </main>
      
      <footer className="bg-background border-t py-12 text-center text-sm text-muted-foreground">
        <div className="container">
          <p>© 2024 GiveCycle. Reduce waste, build community.</p>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Router />
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
