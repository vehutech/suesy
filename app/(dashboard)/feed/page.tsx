'use client';

import { useEffect, useState, useRef } from 'react';
import { Product } from '@/types';
import { Card, CardContent } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { toast } from 'sonner';
import Image from 'next/image';

const PRODUCT_CATEGORIES = [
  'All',
  'Electronics',
  'Books',
  'Furniture',
  'Clothing',
  'Sports Equipment',
  'Musical Instruments',
  'Stationery',
  'Kitchen Items',
  'Decorations',
  'Other',
];

export default function FeedPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  const observerTarget = useRef(null);
  
  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [search]);
  
  // Reset when filters change
  useEffect(() => {
    setProducts([]);
    setCursor(null);
    setHasMore(true);
    fetchProducts(null);
  }, [category, debouncedSearch]);
  
  const fetchProducts = async (nextCursor: string | null) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: '20',
        ...(nextCursor && { cursor: nextCursor }),
        ...(category !== 'All' && { category }),
        ...(debouncedSearch && { search: debouncedSearch }),
      });
      
      const response = await fetch(`/api/products?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setProducts((prev) =>
          nextCursor ? [...prev, ...data.products] : data.products
        );
        setCursor(data.nextCursor || null);
        setHasMore(!!data.nextCursor);
      }
    } catch (error) {
      console.error('Fetch products error:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };
  
  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          fetchProducts(cursor);
        }
      },
      { threshold: 0.5 }
    );
    
    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }
    
    return () => observer.disconnect();
  }, [cursor, hasMore, loading]);
  
  const handleRequestExchange = (productId: string) => {
    toast.info('Exchange request feature - Navigate to product detail');
    // Implementation in next section
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <Input
          type="search"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {PRODUCT_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>
      
      {products.length === 0 && !loading ? (
        <div className="text-center py-12 text-muted-foreground">
          No products found
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative h-48 bg-muted">
                {product.images[0] && (
                  <Image
                    src={product.images[0]}
                    alt={product.title}
                    fill
                    className="object-cover"
                  />
                )}
              </div>
              
              <CardContent className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold text-lg line-clamp-1">
                    {product.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {product.description}
                  </p>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Worth</span>
                  <span className="font-semibold text-primary">
                    ₦{product.monetaryWorth.toLocaleString()}
                  </span>
                </div>
                
                {product.forSale && product.salePrice && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Cash Price</span>
                    <span className="font-semibold text-secondary">
                      ₦{product.salePrice.toLocaleString()}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Image
                    src={product.student?.imageUrl || ''}
                    alt={product.student?.name || ''}
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                  <span>{product.student?.name}</span>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => handleRequestExchange(product.id)}
                  >
                    Request Exchange
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Infinite scroll trigger */}
      <div ref={observerTarget} className="h-10 flex items-center justify-center">
        {loading && (
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        )}
      </div>
    </div>
  );
}