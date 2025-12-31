import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, User, LogOut, Menu, Gift, Settings } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

export function Navbar() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { href: "/browse", label: "Browse" },
    { href: "/dashboard", label: "Dashboard" },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 font-display text-2xl font-bold text-primary hover:opacity-90 transition-opacity">
            <Gift className="h-6 w-6" />
            <span>GiveCycle</span>
          </Link>
          
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  location === link.href ? "text-primary font-bold" : "text-muted-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Desktop Right Side */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <>
              <Link href="/create-item">
                <Button size="sm" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full shadow-lg shadow-primary/25">
                  <Plus className="h-4 w-4" />
                  List Item
                </Button>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-2 ring-primary/10">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {user.username.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.username}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="gap-2">
                    <User className="h-4 w-4" />
                    <span>Reputation: {user.reputation}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <Link href="/profile">
                    <DropdownMenuItem className="gap-2 cursor-pointer">
                      <Settings className="h-4 w-4" />
                      <span>Edit Profile</span>
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => logoutMutation.mutate()}
                    className="gap-2 text-destructive focus:text-destructive cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground">Log in</Button>
              </Link>
              <Link href="/register">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full">Sign up</Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <div className="flex flex-col gap-6 mt-6">
                <Link href="/" onClick={() => setIsOpen(false)} className="font-display text-xl font-bold text-primary">
                  GiveCycle
                </Link>
                <div className="flex flex-col gap-4">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className={`text-lg font-medium ${
                        location === link.href ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                  {user ? (
                    <>
                       <Link href="/create-item" onClick={() => setIsOpen(false)}>
                        <Button className="w-full gap-2">
                          <Plus className="h-4 w-4" />
                          List Item
                        </Button>
                      </Link>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          logoutMutation.mutate();
                          setIsOpen(false);
                        }}
                        className="w-full text-destructive border-destructive/20 hover:bg-destructive/10"
                      >
                        Log Out
                      </Button>
                    </>
                  ) : (
                    <>
                      <Link href="/login" onClick={() => setIsOpen(false)}>
                        <Button variant="outline" className="w-full">Log In</Button>
                      </Link>
                      <Link href="/register" onClick={() => setIsOpen(false)}>
                        <Button className="w-full">Sign Up</Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
