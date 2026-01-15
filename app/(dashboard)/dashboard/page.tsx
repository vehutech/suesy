'use client';

import { useEffect, useState } from 'react';
import { Product, CreateProductInput } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { toast } from 'sonner';
import Image from 'next/image';

const PRODUCT_CATEGORIES = [
  'Electronics', 'Books', 'Furniture', 'Clothing',
  'Sports Equipment', 'Musical Instruments', 'Stationery',
  'Kitchen Items', 'Decorations', 'Other',
];

const PRODUCT_CONDITIONS = [
  'Brand New', 'Like New', 'Good', 'Fair', 'Poor',
];

export default function DashboardPage() {
  const [student, setStudent] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<Partial<CreateProductInput>>({
    title: '',
    description: '',
    category: 'Electronics',
    condition: 'Good',
    monetaryWorth: 0,
    forSale: false,
    salePrice: undefined,
  });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  
  useEffect(() => {
    fetchStudent();
    fetchMyProducts();
  }, []);
  
  const fetchStudent = async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();
      if (response.ok) {
        setStudent(data.student);
      }
    } catch (error) {
      console.error('Fetch student error:', error);
    }
  };
  
  const fetchMyProducts = async () => {
    try {
      const response = await fetch('/api/products/my');
      const data = await response.json();
      if (response.ok) {
        setProducts(data.products);
      }
    } catch (error) {
      console.error('Fetch products error:', error);
    }
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 4) {
      toast.error('Maximum 4 images allowed');
      return;
    }
    
    setImageFiles(files);
    
    // Generate previews
    const previews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews(previews);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || imageFiles.length === 0) {
      toast.error('Please fill in all required fields and upload at least one image');
      return;
    }
    
    setLoading(true);
    
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description!);
      formDataToSend.append('category', formData.category!);
      formDataToSend.append('condition', formData.condition!);
      formDataToSend.append('monetaryWorth', formData.monetaryWorth!.toString());
      formDataToSend.append('forSale', formData.forSale!.toString());
      if (formData.salePrice) {
        formDataToSend.append('salePrice', formData.salePrice.toString());
      }
      
      imageFiles.forEach((file, index) => {
        formDataToSend.append(`image${index}`, file);
      });
      
      const response = await fetch('/api/products', {
        method: editingProduct ? 'PUT' : 'POST',
        body: formDataToSend,
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success(editingProduct ? 'Product updated!' : 'Product created!');
        setShowForm(false);
        setEditingProduct(null);
        resetForm();
        fetchMyProducts();
      } else {
        toast.error(data.error || 'Failed to save product');
      }
    } catch (error) {
      console.error('Save product error:', error);
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
      const response = await fetch(`/api/products?id=${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        toast.success('Product deleted');
        fetchMyProducts();
      } else {
        toast.error('Failed to delete product');
      }
    } catch (error) {
      console.error('Delete product error:', error);
      toast.error('An error occurred');
    }
  };
  
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'Electronics',
      condition: 'Good',
      monetaryWorth: 0,
      forSale: false,
      salePrice: undefined,
    });
    setImageFiles([]);
    setImagePreviews([]);
  };
  
  return (
    <div className="space-y-6">
      {student && (
        <Card>
          <CardHeader>
            <CardTitle>My Profile</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <Image
              src={student.imageUrl}
              alt={student.name}
              width={80}
              height={80}
              className="rounded-full object-cover border-2 border-primary"
            />
            <div>
              <h2 className="text-xl font-semibold">{student.name}</h2>
              <p className="text-muted-foreground">{student.matricNumber}</p>
              <p className="text-sm text-muted-foreground">{student.email}</p>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">My Products</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Add Product'}
        </Button>
      </div>
      
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingProduct ? 'Edit' : 'Create'} Product</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
              
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  className="w-full min-h-[100px] rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <select
                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  >
                    {PRODUCT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Condition</label>
                  <select
                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    value={formData.condition}
                    onChange={(e) => setFormData({ ...formData, condition: e.target.value as any })}
                  >
                    {PRODUCT_CONDITIONS.map((cond) => (
                      <option key={cond} value={cond}>{cond}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <Input
                type="number"
                label="Monetary Worth (₦)"
                value={formData.monetaryWorth}
                onChange={(e) => setFormData({ ...formData, monetaryWorth: parseFloat(e.target.value) })}
                required
              />
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="forSale"
                  checked={formData.forSale}
                  onChange={(e) => setFormData({ ...formData, forSale: e.target.checked })}
                  className="rounded border-input"
                />
                <label htmlFor="forSale" className="text-sm">Available for cash sale</label>
              </div>
              
              {formData.forSale && (
                <Input
                  type="number"
                  label="Sale Price (₦)"
                  value={formData.salePrice || ''}
                  onChange={(e) => setFormData({ ...formData, salePrice: parseFloat(e.target.value) })}
                />
              )}
              
              <div>
                <label className="block text-sm font-medium mb-2">Images (Max 4)</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="w-full"
                />
                {imagePreviews.length > 0 && (
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    {imagePreviews.map((preview, index) => (
                      <Image
                        key={index}
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                )}
              </div>
              
              <Button type="submit" isLoading={loading} className="w-full">
                {editingProduct ? 'Update' : 'Create'} Product
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <Card key={product.id}>
            <div className="relative h-48 bg-muted">
              {product.images[0] && (
                <Image src={product.images[0]} alt={product.title} fill className="object-cover" />
              )}
            </div>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold">{product.title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleDelete(product.id)}>
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}