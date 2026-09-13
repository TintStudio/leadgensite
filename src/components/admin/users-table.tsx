"use client";

import { useState } from "react";
import {
  Search,
  Shield,
  Globe,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface AdminUserItem {
  id: string;
  display_name: string | null;
  role: "user" | "admin";
  status: "active" | "blocked" | "suspended";
  plan_id: string | null;
  created_at: string;
  websiteCount: number;
}

interface UsersTableProps {
  initialUsers: AdminUserItem[];
}

export function UsersTable({ initialUsers }: UsersTableProps) {
  const [users, setUsers] = useState<AdminUserItem[]>(initialUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "user">("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleUpdateUser = async (
    userId: string,
    updates: { role?: "user" | "admin"; status?: "active" | "blocked" }
  ) => {
    try {
      setUpdatingId(userId);
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...updates }),
      });

      if (!res.ok) {
        throw new Error("Failed to update user");
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, ...updates } : u))
      );

      setMessage("User updated successfully");
      setTimeout(() => setMessage(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Update failed";
      alert(msg);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesQuery =
      (u.display_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesQuery && matchesRole;
  });

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-muted/20 p-3 rounded-lg border border-border">
        <div className="relative flex-1 max-w-sm">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or ID..."
            className="pl-9 h-9 text-xs bg-background"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Filter:</span>
          <div className="flex items-center gap-1 bg-muted p-1 rounded-md border border-border">
            {(["all", "admin", "user"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-2.5 py-1 rounded text-xs capitalize transition-colors ${
                  roleFilter === r
                    ? "bg-background text-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {message && (
        <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-md font-medium">
          <CheckCircle2 className="h-4 w-4" />
          {message}
        </div>
      )}

      {/* Users Table */}
      <div className="border border-border rounded-lg overflow-hidden bg-background">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3 pl-4 font-semibold">User / Profile</th>
                <th className="p-3 font-semibold">Role</th>
                <th className="p-3 font-semibold">Status</th>
                <th className="p-3 font-semibold">Websites</th>
                <th className="p-3 font-semibold">Joined Date</th>
                <th className="p-3 pr-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    No users found matching your search criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isBusy = updatingId === u.id;
                  return (
                    <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-3 pl-4">
                        <div className="font-semibold text-foreground">
                          {u.display_name || "Unnamed User"}
                        </div>
                        <div className="text-[11px] font-mono text-muted-foreground truncate max-w-xs">
                          {u.id}
                        </div>
                      </td>

                      <td className="p-3">
                        <Badge
                          variant={u.role === "admin" ? "default" : "secondary"}
                          className="text-[10px] uppercase font-mono"
                        >
                          {u.role === "admin" ? (
                            <span className="flex items-center gap-1">
                              <Shield className="h-3 w-3" /> Admin
                            </span>
                          ) : (
                            "User"
                          )}
                        </Badge>
                      </td>

                      <td className="p-3">
                        <Badge
                          variant={u.status === "active" ? "outline" : "destructive"}
                          className="text-[10px] capitalize"
                        >
                          {u.status}
                        </Badge>
                      </td>

                      <td className="p-3">
                        <span className="flex items-center gap-1 text-muted-foreground font-mono">
                          <Globe className="h-3.5 w-3.5 text-primary shrink-0" />
                          {u.websiteCount} site{u.websiteCount !== 1 ? "s" : ""}
                        </span>
                      </td>

                      <td className="p-3 text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 shrink-0" />
                          {new Date(u.created_at).toLocaleDateString()}
                        </span>
                      </td>

                      <td className="p-3 pr-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Role Toggle */}
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isBusy}
                            onClick={() =>
                              handleUpdateUser(u.id, {
                                role: u.role === "admin" ? "user" : "admin",
                              })
                            }
                            className="h-7 text-[11px] px-2 border-border"
                          >
                            {u.role === "admin" ? "Demote" : "Make Admin"}
                          </Button>

                          {/* Status Toggle */}
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={isBusy}
                            onClick={() =>
                              handleUpdateUser(u.id, {
                                status: u.status === "active" ? "blocked" : "active",
                              })
                            }
                            className={`h-7 text-[11px] px-2 ${
                              u.status === "active"
                                ? "text-destructive hover:bg-destructive/10"
                                : "text-emerald-600 hover:bg-emerald-50"
                            }`}
                          >
                            {u.status === "active" ? "Block" : "Activate"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
