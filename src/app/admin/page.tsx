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
} from '@/table';
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
  AlertCircle
} from 'lucide-react';
import { ProductDialog } from '@/components/admin/product-dialog';
import { formatRupiah } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

const ADMIN_EMAIL = 'matchboxdevelopment@gmail.com';

export default function AdminPage() {
  const { user, loading: authLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  const productsRef = db ? collection(db, 'products') : null;
  const productsQuery = productsRef ? query(productsRef, orderBy('name', 'asc')) : null;
  const { data: products, loading: productsLoading } = useCollection(productsQuery);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setAuthError(null);

    if (loginEmail.trim() !== ADMIN_EMAIL) {
      setAuthError(`Email harus tepat: ${ADMIN_EMAIL}`);
      setIsLoggingIn(false);
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      toast({ title: 'Welcome back!', description: 'Logged in successfully.' });
    } catch (error: any) {
      if (loginEmail === ADMIN_EMAIL && (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential')) {
        try {
          await createUserWithEmailAndPassword(auth, loginEmail, loginPassword);
          toast({ title: 'Akun Admin Dibuat', description: 'Selamat datang di dashboard Anda!' });
        } catch (regError: any) {
          if (regError.code === 'auth/operation-not-allowed') {
            setAuthError('Metode Email/Password belum diaktifkan di Firebase Console.');
          } else if (regError.code === 'auth/weak-password') {
            setAuthError('Password terlalu lemah. Gunakan minimal 6 karakter.');
          } else {
            setAuthError(regError.message || 'Gagal masuk.');
          }
        }
      } else {
        setAuthError('Gagal masuk. Pastikan email dan password sudah benar.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setAuthError(null);
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
        <Card className="w-full max-w-md shadow-2xl border-none rounded-[2rem] overflow-hidden">
          <CardHeader className="bg-primary text-primary-foreground p-10 text-center">
            <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-6 backdrop-blur-md">
              <Lock size={40} />
            </div>
            <CardTitle className="text-3xl font-bold tracking-tight">Admin MonoStore</CardTitle>
            <CardDescription className="text-primary-foreground/70 mt-2">
              Kelola aset digital Anda dengan mudah.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-10 space-y-6">
            {authError && (
              <Alert variant="destructive" className="rounded-2xl border-none bg-destructive/10 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Kesalahan</AlertTitle>
                <AlertDescription>{authError}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Admin Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="admin@monostore.com" 
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  className="rounded-2xl h-14 px-5 bg-slate-50 border-none focus-visible:ring-primary/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" title="admin123" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  className="rounded-2xl h-14 px-5 bg-slate-50 border-none focus-visible:ring-primary/20"
                />
              </div>

              <Button type="submit" className="w-full h-14 rounded-2xl text-base font-bold shadow-xl shadow-primary/20 transition-all active:scale-[0.98]" disabled={isLoggingIn}>
                {isLoggingIn ? <Loader2 className="animate-spin mr-2" /> : null}
                {isLoggingIn ? 'Memproses...' : 'Sign In / Daftar Admin'}
              </Button>
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

  const handleDelete = (id: string) => {
    if (!db || !window.confirm('Hapus produk ini secara permanen?')) return;
    
    const docRef = doc(db, 'products', id);
    deleteDoc(docRef)
      .then(() => {
        toast({ title: 'Berhasil', description: 'Produk telah dihapus.' });
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'delete',
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary/20">
              <LayoutDashboard size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[#212529]">Dashboard Admin</h1>
              <p className="text-sm text-muted-foreground font-medium">Mengelola {products?.length || 0} produk aktif</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={() => setIsDialogOpen(true)} className="rounded-2xl h-12 px-6 shadow-lg shadow-primary/20 font-bold">
              <Plus size={20} className="mr-2" />
              Tambah Produk
            </Button>
            <Button variant="outline" onClick={handleLogout} className="rounded-2xl h-12 border-none bg-white shadow-sm hover:bg-destructive/10 hover:text-destructive font-bold px-4">
              <LogOut size={20} />
            </Button>
          </div>
        </div>

        <div className="grid gap-6">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5 transition-colors group-focus-within:text-primary" />
            <Input 
              placeholder="Cari produk berdasarkan nama, kategori, atau deskripsi..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-14 bg-white border-none shadow-sm rounded-2xl text-base focus-visible:ring-primary/10"
            />
          </div>

          <div className="bg-white rounded-[2rem] border-none shadow-sm overflow-hidden p-2">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="w-[100px] font-bold text-xs uppercase tracking-widest text-muted-foreground py-6 pl-8">Preview</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Info Produk</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Kategori</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Harga</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-widest text-muted-foreground text-right pr-8">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productsLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-60 text-center">
                      <div className="flex flex-col items-center gap-3 text-muted-foreground">
                        <Loader2 className="animate-spin text-primary" size={32} />
                        <span className="font-medium">Sinkronisasi data...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-60 text-center">
                      <div className="max-w-xs mx-auto space-y-4">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                          <Search size={32} />
                        </div>
                        <p className="text-muted-foreground font-medium">
                          {searchTerm ? `Tidak ada hasil untuk "${searchTerm}"` : 'Belum ada produk yang ditambahkan.'}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id} className="group hover:bg-slate-50/50 transition-colors border-slate-50">
                      <TableCell className="pl-8 py-4">
                        <div className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden relative border border-slate-100 shadow-sm">
                          <Image 
                            src={product.image || 'https://picsum.photos/seed/placeholder/200/200'} 
                            alt={product.name}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="font-bold text-base text-[#212529]">{product.name}</div>
                          <div className="flex gap-2 items-center">
                            {product.isBestSeller && (
                              <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">BEST SELLER</span>
                            )}
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">{product.sold || 0} Terjual</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-600">
                          {product.category}
                        </span>
                      </TableCell>
                      <TableCell className="font-bold text-primary">{formatRupiah(product.price)}</TableCell>
                      <TableCell className="text-right pr-8">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            asChild
                            className="rounded-xl hover:bg-blue-50 hover:text-blue-600"
                            title="Lihat"
                          >
                            <Link href={`/product/${product.id}`} target="_blank">
                              <ExternalLink size={18} />
                            </Link>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => { setEditingProduct(product); setIsDialogOpen(true); }}
                            className="rounded-xl text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                            title="Edit"
                          >
                            <Pencil size={18} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDelete(product.id)}
                            className="rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10"
                            title="Hapus"
                          >
                            <Trash2 size={18} />
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