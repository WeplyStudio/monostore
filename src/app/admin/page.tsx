
'use client';

import React, { useState } from 'react';
import { useFirestore, useCollection, useUser, useAuth } from '@/firebase';
import { collection, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Search, 
  LayoutDashboard, 
  ExternalLink,
  Loader2,
  LogOut,
  Lock,
  UserPlus
} from 'lucide-react';
import { ProductDialog } from '@/components/admin/product-dialog';
import { formatRupiah } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

const ADMIN_EMAIL = 'matchboxdevelopment@gmail.com';

export default function AdminPage() {
  const { user, loading: authLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  const productsRef = db ? collection(db, 'products') : null;
  const productsQuery = productsRef ? query(productsRef, orderBy('name', 'asc')) : null;
  const { data: products, loading: productsLoading } = useCollection(productsQuery);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      toast({ title: 'Welcome back!', description: 'Logged in successfully.' });
    } catch (error: any) {
      // Jika user tidak ditemukan, tawarkan untuk membuat akun (khusus untuk admin email ini)
      if (loginEmail === ADMIN_EMAIL && (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential')) {
        toast({ 
          title: 'Mencoba Login...', 
          description: 'Jika akun belum ada, kami akan mencoba mendaftarkannya.' 
        });
        
        try {
          await createUserWithEmailAndPassword(auth, loginEmail, loginPassword);
          toast({ title: 'Akun Admin Dibuat', description: 'Selamat datang di dashboard Anda!' });
          setIsLoggingIn(false);
          return;
        } catch (regError: any) {
          console.error(regError);
        }
      }

      toast({ 
        variant: 'destructive', 
        title: 'Login Gagal', 
        description: 'Email atau password salah. Pastikan Email/Password Auth sudah aktif di Firebase Console.' 
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    toast({ title: 'Logged out', description: 'See you next time!' });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  if (!user || user.email !== ADMIN_EMAIL) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border-none rounded-3xl overflow-hidden">
          <CardHeader className="bg-primary text-primary-foreground p-8 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <Lock size={32} />
            </div>
            <CardTitle className="text-2xl font-bold">Admin Portal</CardTitle>
            <CardDescription className="text-primary-foreground/70">
              Gunakan kredensial admin untuk mengelola produk.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Admin Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="admin@example.com" 
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  className="rounded-xl h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  className="rounded-xl h-12"
                />
              </div>
              {user && user.email !== ADMIN_EMAIL && (
                <p className="text-xs text-destructive font-bold text-center">
                  Akun {user.email} tidak memiliki akses admin.
                </p>
              )}
              <Button type="submit" className="w-full h-12 rounded-xl text-base font-bold" disabled={isLoggingIn}>
                {isLoggingIn ? <Loader2 className="animate-spin mr-2" /> : null}
                Sign In / Daftar Admin
              </Button>
              {user && user.email !== ADMIN_EMAIL && (
                <Button variant="ghost" onClick={handleLogout} className="w-full">
                  Logout & Ganti Akun
                </Button>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredProducts = products?.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleDelete = async (id: string) => {
    if (!db || !window.confirm('Hapus produk ini?')) return;
    
    try {
      await deleteDoc(doc(db, 'products', id));
      toast({ title: 'Berhasil', description: 'Produk telah dihapus.' });
    } catch (error) {
      toast({ 
        variant: 'destructive', 
        title: 'Error', 
        description: 'Gagal menghapus produk.' 
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <LayoutDashboard size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">Logged in as {user.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setIsDialogOpen(true)} className="rounded-xl h-11 px-6 shadow-lg shadow-primary/20">
              <Plus size={18} className="mr-2" />
              Tambah Produk
            </Button>
            <Button variant="outline" onClick={handleLogout} className="rounded-xl h-11 border-none shadow-sm hover:bg-destructive/10 hover:text-destructive">
              <LogOut size={18} className="mr-2" />
              Logout
            </Button>
          </div>
        </div>

        <div className="grid gap-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input 
              placeholder="Cari berdasarkan nama atau kategori..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 bg-white border-none shadow-sm rounded-xl"
            />
          </div>

          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-[80px]">Gambar</TableHead>
                  <TableHead>Nama Produk</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Harga</TableHead>
                  <TableHead>Terjual</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productsLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-40 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Loader2 className="animate-spin" />
                        <span>Memuat produk...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-40 text-center text-muted-foreground">
                      Belum ada produk. Tambahkan produk pertama Anda!
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden relative border">
                          <Image 
                            src={product.image || 'https://picsum.photos/seed/placeholder/200/200'} 
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-bold">{product.name}</div>
                        {product.isBestSeller && (
                          <span className="text-[10px] bg-yellow-100 text-yellow-700 font-bold px-1.5 py-0.5 rounded">TERLARIS</span>
                        )}
                      </TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell className="font-medium">{formatRupiah(product.price)}</TableCell>
                      <TableCell className="text-muted-foreground">{product.sold || 0}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            asChild
                            title="Lihat"
                          >
                            <Link href={`/product/${product.id}`} target="_blank">
                              <ExternalLink size={16} />
                            </Link>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => { setEditingProduct(product); setIsDialogOpen(true); }}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            title="Edit"
                          >
                            <Pencil size={16} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDelete(product.id)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            title="Hapus"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <ProductDialog 
        isOpen={isDialogOpen}
        onClose={() => { setIsDialogOpen(false); setEditingProduct(null); }}
        product={editingProduct}
      />
    </div>
  );
}
