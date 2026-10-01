"use client";

import * as React from "react";
import { Loader2, Search } from "lucide-react";
import type { Profile } from "@/lib/account/profiles-store";
import { ADMIN_ROLES, ROLE_LABELS, type Role } from "@/lib/admin/roles";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { toast } from "@/components/ui/Toast";

const ROLE_OPTIONS: Role[] = ["customer", ...ADMIN_ROLES];

export function AdminTeamView({ currentUserId, canEdit }: { currentUserId: string; canEdit: boolean }) {
  const [profiles, setProfiles] = React.useState<Profile[] | null>(null);
  const [search, setSearch] = React.useState("");
  const [savingId, setSavingId] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    fetch(`/api/admin/team?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { profiles?: Profile[] } | null) => setProfiles(data?.profiles ?? []));
  }, [search]);

  React.useEffect(() => {
    const id = window.setTimeout(load, 250);
    return () => window.clearTimeout(id);
  }, [load]);

  const handleRoleChange = async (profileId: string, role: Role) => {
    setSavingId(profileId);
    try {
      const res = await fetch(`/api/admin/team/${profileId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Couldn't update this role.");
        return;
      }
      toast.success("Role updated.");
      load();
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl text-charcoal">Team & Roles</h1>
        <p className="mt-1.5 text-sm text-stone">
          Search for any account by name or email to grant or change its admin role. Setting a role to
          &ldquo;Customer&rdquo; removes admin access entirely.
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email" className="pl-11" />
      </div>

      {profiles === null ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-stone" />
        </div>
      ) : profiles.length === 0 ? (
        <p className="py-16 text-center text-sm text-stone">No accounts match this search.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {profiles.map((profile) => (
              <TableRow key={profile.id}>
                <TableCell>
                  {profile.firstName} {profile.lastName}
                  {profile.id === currentUserId && <Badge variant="neutral" className="ml-2">You</Badge>}
                </TableCell>
                <TableCell className="text-stone">{profile.email ?? "—"}</TableCell>
                <TableCell>
                  {canEdit ? (
                    <Select
                      value={profile.role}
                      onChange={(e) => handleRoleChange(profile.id, e.target.value as Role)}
                      disabled={profile.id === currentUserId || savingId === profile.id}
                      className="h-9 w-auto min-w-[180px]"
                    >
                      {ROLE_OPTIONS.map((role) => (
                        <option key={role} value={role}>
                          {ROLE_LABELS[role]}
                        </option>
                      ))}
                    </Select>
                  ) : (
                    <span className="text-charcoal">{ROLE_LABELS[profile.role]}</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
