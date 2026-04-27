'use client';

import { Bell, Search, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react'
import api from '@/lib/api'

import { usePathname, useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

export function Navbar() {
  const [user, setUser] = useState<any>(null)

  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await api.get('/user/me/')
        setUser(response.data)
        console.log(response.data);
      } catch (error) {
        console.log('Not authenticated')
      }
    }

    fetchUser()
  }, [])

  const handleLogout = async () => {
    try {
      // withCredentials indispensable pour envoyer les cookies HttpOnly
      await api.post("/user/logout/", {}, { withCredentials: true });
    } catch (error) {
      // On ignore l'erreur — on se déconnecte quand même localement
      console.warn("Logout backend error (ignored):", error);
    }

    // Supprimer tous les cookies accessibles en JS (ceux non-HttpOnly)
    const cookiesToDelete = ['access_token', 'refresh_token', 'csrftoken'];
    cookiesToDelete.forEach(name => {
      document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax`;
    });

    // Rediriger APRES nettoyage
    router.replace("/login");
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
      {/* Search */}
      <div className="flex items-center flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search vulnerabilities, assets..."
            className="pl-10 bg-background"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-4">

        {user ? (<div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative text-warning">
                <Bell className="h-5 w-5" />
                <Badge
                  variant="destructive"
                  className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-error text-xs"
                >
                  3
                </Badge>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex flex-col items-start p-3">
                <div className="flex items-center justify-between w-full">
                  <span className="font-medium text-sm">Critical Vulnerability Detected</span>
                  <span className="text-xs text-muted-foreground">5m ago</span>
                </div>
                <span className="text-xs text-muted-foreground mt-1">
                  SQL Injection found in api.finclean.com
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start p-3">
                <div className="flex items-center justify-between w-full">
                  <span className="font-medium text-sm">Scan Completed</span>
                  <span className="text-xs text-muted-foreground">1h ago</span>
                </div>
                <span className="text-xs text-muted-foreground mt-1">
                  Production Infrastructure scan finished
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start p-3">
                <div className="flex items-center justify-between w-full">
                  <span className="font-medium text-sm">New Asset Discovered</span>
                  <span className="text-xs text-muted-foreground">3h ago</span>
                </div>
                <span className="text-xs text-muted-foreground mt-1">
                  staging.finclean.com added to monitoring
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>


          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10">
                  <User className="h-5 w-5 text-primary" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user?.role}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>Billing</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="btn btn-outline text-destructive text-warning"> Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>)
          : (<div></div>)}

        <p className="mr-6.5 text-sm font-medium text-primary">
          {user?.username}
        </p>
      </div>
    </header>
  );
}
