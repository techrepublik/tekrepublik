"use client";

import { useEffect, useState } from "react";
import { Check, X, ExternalLink, AlertCircle, ShoppingCart } from "lucide-react";

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/v1/store/admin/orders");
      const payload = await res.json();
      if (res.ok && payload.success) {
        setOrders(payload.data || []);
      } else {
        setError(payload.detail || "Failed to load order submissions");
      }
      setLoading(false);
    } catch (err) {
      setError("Orders API offline");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleVerify = async (id: string, status: "verified" | "rejected") => {
    const confirmation = confirm(`Are you sure you want to mark this payment as: ${status}?`);
    if (!confirmation) return;

    try {
      const res = await fetch(`/api/v1/store/admin/orders/${id}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const payload = await res.json();
      if (res.ok && payload.success) {
        fetchOrders();
      } else {
        alert(payload.detail || "Action failed");
      }
    } catch (err) {
      alert("Error submitting verification request");
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Checkout Orders Manager</h1>
        <p className="text-sm text-muted">Review GCash transfer reference codes and approve content entitlements downloads.</p>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl flex items-center space-x-2 text-sm max-w-xl">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="glass-card rounded-xl border border-border/60 overflow-hidden">
        <div className="p-6 border-b border-border/60 bg-surface/50">
          <h3 className="font-bold text-foreground">Submissions Ledger</h3>
        </div>

        {orders.length === 0 ? (
          <div className="p-12 text-center text-muted text-sm">
            No checkout orders recorded in ledger.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border text-muted bg-surface/30 font-semibold">
                  <th className="p-4">Customer Email</th>
                  <th className="p-4">Tracking & Method</th>
                  <th className="p-4">Transaction Code</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Receipt Proof</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Verification Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-surface/35 transition">
                    <td className="p-4">
                      <p className="font-semibold text-foreground">{order.user_email}</p>
                      <p className="text-xs text-muted">Date: {new Date(order.created_at).toLocaleDateString()}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-mono text-xs text-foreground">{order.tracking_id}</p>
                      <p className="text-xs text-muted">{order.payment?.payment_method || "No Payment Submited"}</p>
                    </td>
                    <td className="p-4 font-mono text-xs text-muted">
                      {order.payment?.transaction_id || "N/A"}
                    </td>
                    <td className="p-4 font-bold text-foreground">
                      ₱{order.total_amount.toFixed(2)}
                    </td>
                    <td className="p-4">
                      {order.payment?.proof_url ? (
                        <a
                          href={order.payment.proof_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center space-x-1.5 text-xs text-primary hover:underline"
                        >
                          <span>Open Image</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-xs text-muted italic">No Upload</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-block text-[10px] font-bold uppercase tracking-wider rounded-full px-2.5 py-0.5 ${
                          order.status === "paid"
                            ? "bg-secondary/10 text-secondary"
                            : order.status === "cancelled"
                            ? "bg-red-500/10 text-red-500"
                            : order.status === "pending_verification"
                            ? "bg-amber-500/10 text-amber-500"
                            : "bg-muted/10 text-muted"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4">
                      {order.status === "pending_verification" ? (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleVerify(order.id, "verified")}
                            className="p-1.5 bg-secondary/10 hover:bg-secondary text-secondary hover:text-white rounded-lg transition"
                            title="Verify and Approve Access"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleVerify(order.id, "rejected")}
                            className="p-1.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition"
                            title="Reject Payment Receipt"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted italic">Resolved</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
