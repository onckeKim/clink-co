"use client";

import * as React from "react";
import { Loader2, Search } from "lucide-react";
import type { AuditEntityType, AuditLogEntry } from "@/lib/admin/audit-log-store";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";

const ENTITY_TYPES: AuditEntityType[] = [
  "product",
  "category",
  "collection",
  "coupon",
  "order",
  "customer",
  "content",
  "media",
  "settings",
  "team_member",
];

export function AdminAuditLogView() {
  const [entries, setEntries] = React.useState<AuditLogEntry[] | null>(null);
  const [search, setSearch] = React.useState("");
  const [entityType, setEntityType] = React.useState("");
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const id = window.setTimeout(() => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (entityType) params.set("entityType", entityType);
      fetch(`/api/admin/audit-log?${params.toString()}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data: { entries?: AuditLogEntry[] } | null) => setEntries(data?.entries ?? []));
    }, 250);
    return () => window.clearTimeout(id);
  }, [search, entityType]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl text-charcoal">Audit Log</h1>
        <p className="mt-1.5 text-sm text-stone">Every admin action, most recent first.</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by action, record or user" className="pl-11" />
        </div>
        <Select value={entityType} onChange={(e) => setEntityType(e.target.value)} className="w-auto min-w-[160px]">
          <option value="">All record types</option>
          {ENTITY_TYPES.map((type) => (
            <option key={type} value={type}>
              {type.replace("_", " ")}
            </option>
          ))}
        </Select>
      </div>

      {entries === null ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-stone" />
        </div>
      ) : entries.length === 0 ? (
        <p className="py-16 text-center text-sm text-stone">No matching activity yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Record</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => (
              <React.Fragment key={entry.id}>
                <TableRow
                  className="cursor-pointer"
                  onClick={() => setExpandedId((current) => (current === entry.id ? null : entry.id))}
                >
                  <TableCell className="text-stone">{new Date(entry.at).toLocaleString("en-ZA")}</TableCell>
                  <TableCell className="max-w-[180px] truncate">{entry.userEmail}</TableCell>
                  <TableCell>{entry.action}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{entry.entityLabel}</TableCell>
                </TableRow>
                {expandedId === entry.id && (entry.before !== undefined || entry.after !== undefined) && (
                  <TableRow>
                    <TableCell colSpan={4} className="whitespace-normal bg-porcelain">
                      <div className="grid gap-4 py-2 sm:grid-cols-2">
                        {entry.before !== undefined && (
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-stone">Before</p>
                            <pre className="mt-1 overflow-x-auto rounded-lg bg-warm-white p-2 text-xs text-charcoal">
                              {JSON.stringify(entry.before, null, 2)}
                            </pre>
                          </div>
                        )}
                        {entry.after !== undefined && (
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-stone">After</p>
                            <pre className="mt-1 overflow-x-auto rounded-lg bg-warm-white p-2 text-xs text-charcoal">
                              {JSON.stringify(entry.after, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
