"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingCart, AlertCircle, ShoppingBag } from "lucide-react";

export default function StoreCatalog() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await fetch("/api/v1/store/products");
        const payload = await res.json();
        if (res.ok && payload.success) {
          setProducts(payload.data || []);
        } else {
          setError(payload.detail || "Failed to load products list");
        }
        setLoading(false);
      } catch (err) {
        setError("Store API offline");
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="py-16 sm:py-24 bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mb-16">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-foreground mb-4">
            Premium Store
          </h1>
          <p className="text-lg text-muted">
            Acquire premium software templates, comprehensive educational books, and specialized outline guides to master systems engineering.
          </p>
        </div>

        {error && (
          <div className="p-4 mb-8 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl flex items-center space-x-2 text-sm max-w-xl">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {products.length === 0 ? (
          <div className="text-center p-12 text-muted text-sm border border-dashed border-border rounded-xl">
            No premium products are currently available. Check back soon!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((prod) => (
              <div key={prod.id} className="glass-card p-6 sm:p-8 rounded-xl border border-border/60 flex flex-col justify-between hover-lift">
                <div>
                  <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                    <ShoppingBag className="h-6 w-6" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">{prod.name}</h3>
                  <p className="text-sm text-muted mb-6 leading-relaxed">
                    {prod.description || "Detailed guide containing production blueprints."}
                  </p>
                </div>

                <div className="border-t border-border/60 pt-6 flex items-center justify-between">
                  <span className="text-xl font-bold text-foreground">
                    ₱{prod.price.toFixed(2)}
                  </span>
                  
                  <Link
                    href={`/store/checkout?product_id=${prod.id}`}
                    className="flex items-center space-x-2 rounded-lg bg-primary hover:bg-primary-dark px-4 py-2.5 text-xs font-semibold text-white transition"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    <span>Purchase</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
