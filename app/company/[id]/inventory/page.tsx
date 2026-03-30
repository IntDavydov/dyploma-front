"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import AIChat from "@/app/components/AIChat";

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
}

export default function InventoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
        const res = await fetch(`${apiUrl}/api/products/${id}`);
        if (!res.ok) throw new Error("Failed to fetch products");
        const data = await res.json();
        setProducts(data);
      } catch {
        setProducts([
          { id: 101, name: "Premium Device", price: 999.99, stock: 10 },
          { id: 102, name: "Standard Model", price: 499.99, stock: 50 },
        ]);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [id]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-32">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href={`/company/${id}`} className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-accent transition-colors">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground">
            Inventory <span className="text-accent">Management</span>
          </h1>
        </div>
        <div className="flex gap-2">
           <button className="bg-accent text-accent-foreground px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider">Sync All</button>
           <button className="bg-muted text-foreground px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider border border-border">Export</button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
           {[1, 2, 3].map(i => <div key={i} className="h-16 animate-pulse rounded-xl bg-card border border-border" />)}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-lg">
          <table className="min-w-full divide-y divide-border">
            <thead>
              <tr className="bg-muted/50">
                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">ID Reference</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Product Identification</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Market Value</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Current Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-muted/20 transition-colors">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-mono text-accent">#{product.id}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-foreground">{product.name}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-mono text-foreground">${product.price.toFixed(2)}</td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center gap-2">
                       <span className={`h-1.5 w-1.5 rounded-full ${product.stock < 20 ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`} />
                       <span className="text-sm font-medium text-foreground">{product.stock} Units Available</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AIChat 
        context={`Inventory for Company ID ${id}`} 
        data={products} 
      />
    </div>
  );
}
