"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, Upload, FileText, Send, ArrowLeft } from "lucide-react";
import Link from "next/link";

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get("product_id");

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [product, setProduct] = useState<any>(null);
  
  // Checkout process states
  const [order, setOrder] = useState<any>(null);
  const [transactionId, setTransactionId] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) {
      router.push("/store");
      return;
    }

    async function initializeCheckout() {
      try {
        // 1. Verify user session
        const userRes = await fetch("/api/v1/users/me");
        if (!userRes.ok) {
          setError("You must be logged in to purchase premium templates.");
          setLoading(false);
          return;
        }
        const userData = await userRes.json();
        setUser(userData.data);

        // 2. Fetch product details
        const prodRes = await fetch("/api/v1/store/products");
        const prodData = await prodRes.json();
        const found = (prodData.data || []).find((p: any) => p.id === productId);
        
        if (!found) {
          setError("Requested product not found in catalog");
          setLoading(false);
          return;
        }
        setProduct(found);

        // 3. Create the pending order automatically
        const orderRes = await fetch("/api/v1/store/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ product_id: productId }),
        });
        const orderData = await orderRes.json();
        if (orderRes.ok && orderData.success) {
          setOrder(orderData.data);
        } else {
          setError(orderData.detail || "Failed to initiate order");
        }
        setLoading(false);
      } catch (err) {
        setError("Network connection failure");
        setLoading(false);
      }
    }
    
    initializeCheckout();
  }, [productId, router]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setProofFile(e.target.files[0]);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofFile || !transactionId.trim() || submittingPayment || !order) return;

    setSubmittingPayment(true);
    setError(null);

    const formData = new FormData();
    formData.append("payment_method", "GCash");
    formData.append("transaction_id", transactionId);
    formData.append("file", proofFile);

    try {
      const res = await fetch(`/api/v1/store/orders/${order.order_id}/pay`, {
        method: "POST",
        body: formData,
      });
      const payload = await res.json();
      if (res.ok && payload.success) {
        setPaymentSuccess(true);
      } else {
        setError(payload.detail || "Failed to submit payment receipt");
      }
      setSubmittingPayment(false);
    } catch (err) {
      setError("Payment submission error");
      setSubmittingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="py-16 sm:py-24 bg-background text-foreground flex items-center justify-center min-h-[70vh]">
        <div className="glass-card max-w-xl p-8 rounded-2xl border border-border text-center space-y-6 mx-4">
          <div className="mx-auto h-16 w-16 bg-secondary/15 text-secondary flex items-center justify-center rounded-full">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight">Order Submitted!</h2>
          <p className="text-sm text-muted leading-relaxed">
            Your payment proof has been queued. Our verification team will review your receipt reference code **{transactionId}** within 24 hours. Your entitlements download access will activate automatically once approved.
          </p>
          <div className="p-4 bg-background/50 rounded-xl border border-border/60 text-xs font-mono">
            Tracking ID: {order?.tracking_id}
          </div>
          <div className="pt-4 flex justify-center space-x-4">
            <Link href="/resources" className="rounded-lg bg-primary hover:bg-primary-dark px-4 py-2.5 text-xs font-semibold text-white transition">
              View Resources
            </Link>
            <Link href="/store" className="rounded-lg border border-border px-4 py-2.5 text-xs font-semibold text-muted hover:text-foreground transition">
              Back to Store
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-16 sm:py-24 bg-background text-foreground">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Back Link */}
        <div className="flex items-center space-x-4">
          <Link href="/store" className="p-2 text-muted hover:text-foreground bg-surface rounded-lg border border-border/60">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Payment Checkout</h1>
            <p className="text-sm text-muted">Submit your receipt proof details to unlock download keys.</p>
          </div>
        </div>

        {error ? (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl flex items-center space-x-2 text-sm max-w-xl">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            
            {/* Payment form */}
            <div className="lg:col-span-3 space-y-6">
              {/* Payment instructions */}
              <div className="glass-card p-6 rounded-xl border border-border space-y-4">
                <h3 className="font-bold text-foreground text-sm border-b border-border/60 pb-2">1. Transfer Instructions</h3>
                <p className="text-xs text-muted leading-relaxed">
                  Send the payment amount to Joseph Lorilla's verified GCash account:
                </p>
                <div className="p-4 bg-background/50 rounded-xl border border-border/60 text-xs sm:text-sm space-y-2">
                  <p className="flex justify-between">
                    <span className="text-muted">Method:</span>
                    <span className="font-bold text-foreground">GCash Transfer</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-muted">Account Name:</span>
                    <span className="font-bold text-foreground">Joseph Lorilla</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-muted">GCash Number:</span>
                    <span className="font-bold text-foreground font-mono">+63 917 123 4567</span>
                  </p>
                </div>
              </div>

              {/* Upload Form */}
              <div className="glass-card p-6 rounded-xl border border-border">
                <h3 className="font-bold text-foreground text-sm border-b border-border/60 pb-2 mb-4">2. Submit Reference Details</h3>
                <form onSubmit={handlePaymentSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">GCash Transaction Reference Code</label>
                    <input
                      type="text"
                      required
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-xs sm:text-sm focus:border-primary focus:outline-none text-foreground font-mono"
                      placeholder="e.g. 500213845"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Upload Transfer Screenshot Proof</label>
                    <label className="flex flex-col items-center justify-center border border-dashed border-border hover:border-primary/50 rounded-xl p-6 cursor-pointer bg-background/30 text-center transition">
                      <Upload className="h-8 w-8 text-muted mb-2" />
                      <span className="text-xs font-semibold text-foreground">
                        {proofFile ? proofFile.name : "Select Screenshot"}
                      </span>
                      <input
                        type="file"
                        required
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={submittingPayment || !proofFile || !transactionId.trim()}
                    className="w-full rounded-lg bg-primary hover:bg-primary-dark px-4 py-2.5 text-xs sm:text-sm font-semibold text-white transition flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                    <span>{submittingPayment ? "Uploading receipt proof..." : "Complete Checkout"}</span>
                  </button>
                </form>
              </div>

            </div>

            {/* Order Review Details Sidebar */}
            <div className="lg:col-span-2">
              <div className="glass-card p-6 rounded-xl border border-border space-y-4 h-fit sticky top-6">
                <h3 className="font-bold text-foreground text-sm border-b border-border/60 pb-2">Order Summary</h3>
                <div className="space-y-3 text-xs sm:text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted">Product:</span>
                    <span className="font-bold text-foreground text-right">{product?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Tracking ID:</span>
                    <span className="font-mono text-muted">{order?.tracking_id}</span>
                  </div>
                  <div className="flex justify-between border-t border-border/60 pt-3">
                    <span className="text-muted">Currency:</span>
                    <span className="font-semibold text-foreground">{order?.currency}</span>
                  </div>
                  <div className="flex justify-between border-b border-border/60 pb-3">
                    <span className="text-muted">Total Price:</span>
                    <span className="text-lg font-bold text-primary">₱{order?.total_amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
