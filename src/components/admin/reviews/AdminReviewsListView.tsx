"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2, ImageIcon, Loader2, Trash2, XCircle } from "lucide-react";
import type { AdminReview } from "@/lib/admin/reviews-store";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Tabs, type TabItem } from "@/components/ui/Tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Rating } from "@/components/ui/Rating";
import { toast } from "@/components/ui/Toast";

type StatusFilter = "pending" | "published" | "rejected" | "all";

const TABS: TabItem[] = [
  { id: "pending", label: "Pending" },
  { id: "published", label: "Published" },
  { id: "rejected", label: "Rejected" },
  { id: "all", label: "All" },
];

function statusBadge(status: AdminReview["status"]) {
  switch (status) {
    case "published":
      return <Badge variant="success">Published</Badge>;
    case "rejected":
      return <Badge variant="error">Rejected</Badge>;
    default:
      return <Badge variant="warning">Pending</Badge>;
  }
}

export function AdminReviewsListView() {
  const [tab, setTab] = React.useState<StatusFilter>("pending");
  const [reviews, setReviews] = React.useState<AdminReview[] | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [viewing, setViewing] = React.useState<AdminReview | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const load = React.useCallback((status: StatusFilter) => {
    const query = status === "all" ? "" : `?status=${status}`;
    fetch(`/api/admin/reviews${query}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { reviews?: AdminReview[] } | null) => setReviews(data?.reviews ?? []));
  }, []);

  React.useEffect(() => load(tab), [tab, load]);

  const moderate = async (id: string, status: "published" | "rejected") => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Couldn't update this review.");
        return;
      }
      toast.success(status === "published" ? "Review published." : "Review rejected.");
      load(tab);
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/reviews/${confirmDeleteId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Couldn't delete this review.");
        return;
      }
      toast.success("Review deleted.");
      setConfirmDeleteId(null);
      load(tab);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl text-charcoal">Reviews</h1>
        <p className="mt-1.5 text-sm text-stone">
          Every new review lands here pending moderation before it&rsquo;s visible on the product page.
        </p>
      </div>

      <Tabs items={TABS} value={tab} onChange={(id) => setTab(id as StatusFilter)} />

      {reviews === null ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-stone" />
        </div>
      ) : reviews.length === 0 ? (
        <p className="py-16 text-center text-sm text-stone">No reviews in this view.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Review</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reviews.map((review) => (
              <TableRow key={review.id}>
                <TableCell>
                  {review.productSlug ? (
                    <Link href={`/products/${review.productSlug}`} target="_blank" className="link-underline font-medium text-charcoal">
                      {review.productName}
                    </Link>
                  ) : (
                    <span className="text-stone">{review.productName}</span>
                  )}
                </TableCell>
                <TableCell>
                  <p className="font-medium text-charcoal">{review.customerName}</p>
                  {review.verified && <p className="text-xs text-success">Verified purchase</p>}
                </TableCell>
                <TableCell>
                  <Rating value={review.rating} size="xs" />
                </TableCell>
                <TableCell className="max-w-xs">
                  <button
                    type="button"
                    onClick={() => setViewing(review)}
                    className="focus-ring block truncate text-left text-stone hover:text-charcoal hover:underline"
                  >
                    {review.title ? `${review.title} — ` : ""}
                    {review.body}
                  </button>
                  {review.images.length > 0 && (
                    <span className="mt-1 flex items-center gap-1 text-xs text-stone">
                      <ImageIcon className="h-3 w-3" /> {review.images.length} photo{review.images.length === 1 ? "" : "s"}
                    </span>
                  )}
                </TableCell>
                <TableCell>{statusBadge(review.status)}</TableCell>
                <TableCell className="text-stone">{review.createdAt.slice(0, 10)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {review.status !== "published" && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => moderate(review.id, "published")}
                        disabled={busyId === review.id}
                        aria-label="Publish review"
                        className="text-success"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                    )}
                    {review.status !== "rejected" && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => moderate(review.id, "rejected")}
                        disabled={busyId === review.id}
                        aria-label="Reject review"
                        className="text-error"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setConfirmDeleteId(review.id)}
                      aria-label="Delete review"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Modal open={viewing !== null} onClose={() => setViewing(null)} title={viewing?.title ?? "Review"} className="max-w-lg">
        {viewing && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Rating value={viewing.rating} size="sm" />
              {statusBadge(viewing.status)}
              {viewing.verified && <Badge variant="success">Verified</Badge>}
            </div>
            <p className="text-sm leading-relaxed text-charcoal">{viewing.body}</p>
            <p className="text-xs text-stone">
              {viewing.customerName}
              {viewing.location ? ` · ${viewing.location}` : ""} · {viewing.createdAt.slice(0, 10)}
            </p>
            {viewing.images.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {viewing.images.map((image) => (
                  // eslint-disable-next-line @next/next/no-img-element -- a customer-submitted photo, may be a data URL next/image can't optimize
                  <img key={image} src={image} alt="Customer photo" className="h-20 w-20 rounded-lg border border-sand object-cover" />
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={confirmDeleteId !== null}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete this review?"
        description="This removes it permanently, including any attached photos. This can't be undone."
        confirmLabel="Delete"
        destructive
        loading={deleting}
      />
    </div>
  );
}
