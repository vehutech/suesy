// app/(dashboard)/admin-panel/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { toast } from 'sonner';
import Image from 'next/image';

export default function AdminPanelPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [exchanges, setExchanges] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [matricNumber, setMatricNumber] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  
  useEffect(() => {
    fetchData();
  }, []);
  
  const fetchData = async () => {
  try {
    const [studentsRes, productsRes, exchangesRes] = await Promise.all([
      fetch('/api/students'),
      fetch('/api/admin/products'),
      fetch('/api/exchanges?type=all'),
    ]);
    
    // Only try to parse JSON if the response is OK
    if (studentsRes.ok) {
      const studentsData = await studentsRes.json();
      setStudents(studentsData.students || []);
    } else {
      console.error('Failed to fetch students:', studentsRes.status);
      setStudents([]);
    }
    
    if (productsRes.ok) {
      const productsData = await productsRes.json();
      setProducts(productsData.products || []);
    } else {
      console.error('Failed to fetch products:', productsRes.status);
      setProducts([]);
    }
    
    if (exchangesRes.ok) {
      const exchangesData = await exchangesRes.json();
      setExchanges(exchangesData.exchanges || []);
    } else {
      console.error('Failed to fetch exchanges:', exchangesRes.status);
      setExchanges([]);
    }
  } catch (error) {
    console.error('Fetch data error:', error);
    // Set empty arrays on error
    setStudents([]);
    setProducts([]);
    setExchanges([]);
  }
};
  
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!matricNumber || !email || !name || !imageFile) {
      toast.error('All fields are required');
      return;
    }
    
    const formData = new FormData();
    formData.append('matricNumber', matricNumber);
    formData.append('email', email);
    formData.append('name', name);
    formData.append('image', imageFile);
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/students', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success('Student registered successfully');
        setShowAddForm(false);
        resetForm();
        fetchData();
      } else {
        toast.error(data.error || 'Failed to register student');
      }
    } catch (error) {
      console.error('Register student error:', error);
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  const handleBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!csvFile) {
      toast.error('Please select a CSV file');
      return;
    }
    
    const formData = new FormData();
    formData.append('file', csvFile);
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/students/bulk', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success(`Imported ${data.results.success} students. Failed: ${data.results.failed}`);
        setShowBulkUpload(false);
        setCsvFile(null);
        fetchData();
      } else {
        toast.error(data.error || 'Bulk upload failed');
      }
    } catch (error) {
      console.error('Bulk upload error:', error);
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteStudent = async (id: string) => {
    if (!confirm('Are you sure? This will delete all associated products and exchanges.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/students?id=${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        toast.success('Student deleted');
        fetchData();
      } else {
        toast.error('Failed to delete student');
      }
    } catch (error) {
      console.error('Delete student error:', error);
      toast.error('An error occurred');
    }
  };
  
  const handleDeleteProduct = async (id: string) => {
    const reason = prompt('Enter reason for deletion:');
    if (!reason) return;
    
    try {
      const response = await fetch(`/api/admin/products?id=${id}&reason=${encodeURIComponent(reason)}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        toast.success('Product deleted and owner notified');
        fetchData();
      } else {
        toast.error('Failed to delete product');
      }
    } catch (error) {
      console.error('Delete product error:', error);
      toast.error('An error occurred');
    }
  };
  
  const resetForm = () => {
    setMatricNumber('');
    setEmail('');
    setName('');
    setImageFile(null);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <div className="flex gap-2">
          <Button onClick={() => setShowBulkUpload(!showBulkUpload)} variant="outline">
            Bulk Upload
          </Button>
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            Add Student
          </Button>
        </div>
      </div>
      
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-primary">{students.length}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-secondary">{products.length}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Exchanges</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-accent">{exchanges.length}</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Add Student Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Register New Student</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddStudent} className="space-y-4">
              <Input
                label="Matric Number"
                placeholder="SCI/21/CSC/228"
                value={matricNumber}
                onChange={(e) => setMatricNumber(e.target.value.toUpperCase())}
                required
              />
              
              <Input
                label="Email"
                type="email"
                placeholder="student@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              
              <Input
                label="Full Name"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              
              <div>
                <label className="block text-sm font-medium mb-2">Profile Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  required
                  className="w-full"
                />
              </div>
              
              <Button type="submit" isLoading={loading} className="w-full">
                Register Student
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
      
      {/* Bulk Upload Form */}
      {showBulkUpload && (
        <Card>
          <CardHeader>
            <CardTitle>Bulk Upload Students (CSV)</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleBulkUpload} className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  CSV format: matricNumber, email, name, imageUrl (optional)
                </p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                  required
                  className="w-full"
                />
              </div>
              
              <Button type="submit" isLoading={loading} className="w-full">
                Upload CSV
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
      
      {/* Students List */}
      <Card>
        <CardHeader>
          <CardTitle>Registered Students</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {students.map((student) => (
              <div
                key={student.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <Image
                    src={student.imageUrl}
                    alt={student.name}
                    width={50}
                    height={50}
                    className="rounded-full object-cover"
                  />
                  <div>
                    <h3 className="font-semibold">{student.name}</h3>
                    <p className="text-sm text-muted-foreground">{student.matricNumber}</p>
                    <p className="text-xs text-muted-foreground">{student.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {student._count?.products || 0} products
                  </span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteStudent(student.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Products List */}
      <Card>
        <CardHeader>
          <CardTitle>All Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <div key={product.id} className="border border-border rounded-lg p-4 space-y-2">
                <h3 className="font-semibold">{product.title}</h3>
                <p className="text-sm text-muted-foreground">
                  By: {product.student.name} ({product.student.matricNumber})
                </p>
                <p className="text-sm">Worth: ₦{product.monetaryWorth.toLocaleString()}</p>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteProduct(product.id)}
                >
                  Delete & Notify
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}