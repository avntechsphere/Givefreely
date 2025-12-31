import { useRoute } from "wouter";
import { useItem } from "@/hooks/use-items";
import { useAuth } from "@/hooks/use-auth";
import { RequestModal } from "@/components/RequestModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { MapPin, Clock, Calendar, User as UserIcon, Loader2, ArrowLeft } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { Link } from "wouter";

export default function ItemDetail() {
  const [match, params] = useRoute("/items/:id");
  const id = params ? parseInt(params.id) : 0;
  
  const { data: item, isLoading, error } = useItem(id);
  const { user } = useAuth();

  if (isLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (error || !item) return <div className="container py-20 text-center">Item not found</div>;

  const isOwner = user?.id === item.userId;
  const imageUrl = item.images && item.images.length > 0 
    ? item.images[0] 
    : "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=800&q=80";

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container py-8">
        <Link href="/browse">
          <Button variant="ghost" className="mb-6 pl-0 hover:bg-transparent hover:text-primary transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Browse
          </Button>
        </Link>
        
        <div className="grid lg:grid-cols-2 gap-12 animate-fade-in-up">
          {/* Left Column - Image */}
          <div className="space-y-6">
            <div className="rounded-3xl overflow-hidden aspect-[4/3] shadow-lg border border-border/50 bg-muted relative group">
              <img 
                src={imageUrl} 
                alt={item.title} 
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4">
                 <Badge 
                  variant={item.status === 'available' ? 'default' : 'secondary'}
                  className={`text-sm px-3 py-1 ${item.status === 'available' ? 'bg-primary text-white' : ''}`}
                >
                  {item.status.toUpperCase()}
                </Badge>
              </div>
            </div>
            
            {/* Additional info card */}
            <div className="bg-muted/30 rounded-2xl p-6 border border-border/50">
              <h3 className="font-display font-bold text-lg mb-4">Item Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Listed {formatDistanceToNow(new Date(item.createdAt || ""), { addSuffix: true })}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>ID: #{item.id}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{item.location}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Info */}
          <div className="flex flex-col">
            <div>
              <div className="flex items-center gap-2 mb-2 text-primary font-medium">
                <span className="bg-primary/10 px-3 py-1 rounded-full text-xs uppercase tracking-wide">
                  {item.category}
                </span>
              </div>
              
              <h1 className="font-display text-4xl lg:text-5xl font-bold mb-6 text-foreground">{item.title}</h1>
              
              <div className="flex items-center gap-4 mb-8">
                <Avatar className="h-12 w-12 border-2 border-primary/20">
                  <AvatarFallback className="bg-primary/5 text-primary font-bold">
                    {item.owner.username.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">Listed by {item.owner.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                     <span className="text-accent font-medium">{item.owner.reputation} Reputation</span>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            <div className="prose prose-stone max-w-none mb-8">
              <h3 className="font-display font-bold text-xl mb-3">Description</h3>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {item.description}
              </p>
              
              <h3 className="font-display font-bold text-xl mt-6 mb-3">Condition</h3>
              <p className="text-muted-foreground">
                {item.condition}
              </p>
            </div>

            <div className="mt-auto pt-6">
              {isOwner ? (
                <div className="bg-secondary/50 p-6 rounded-xl border border-secondary text-center">
                  <p className="font-medium text-secondary-foreground mb-2">This is your listing</p>
                  <p className="text-sm text-muted-foreground mb-4">Go to dashboard to manage requests.</p>
                  <Link href="/dashboard">
                    <Button>Go to Dashboard</Button>
                  </Link>
                </div>
              ) : item.status === 'available' ? (
                <div className="bg-primary/5 p-6 rounded-xl border border-primary/10">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-lg mb-1">Interested?</h4>
                      <p className="text-sm text-muted-foreground">Send a request to arrange pickup.</p>
                    </div>
                    {user ? (
                      <RequestModal itemId={item.id} itemTitle={item.title} />
                    ) : (
                      <Link href="/login">
                        <Button>Log in to Request</Button>
                      </Link>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-muted p-6 rounded-xl text-center">
                  <p className="font-bold text-muted-foreground">This item is no longer available.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
