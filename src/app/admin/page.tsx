
'use client';

import React, { useState } from 'react';
import { useFirestore, useCollection, useUser, useAuth, useMemoFirebase } from '@/firebase';
import { collection, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
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
  Loader2,
  LogOut,
  Lock,
  AlertCircle,
  ShoppingBag,
  Clock,
  User as UserIcon,
  Image as ImageIcon
} from 'lucide-react';
import { ProductDialog } from '@/components/admin/product-dialog';
import { BannerDialog } from '@/components/admin/banner-dialog';
import { formatRupiah } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

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

  const [isBannerDialogOpen, setIsBannerDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any>(null);

  // Queries
  const productsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'products'), orderBy('name', 'asc'));
  }, [db]);

  const ordersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
  }, [db]);

  const bannersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'banners'), orderBy('order', 'asc'));
  }, [db]);

  const { data: products, loading: productsLoading } = useCollection(productsQuery);
  const { data: orders, loading: ordersLoading } = useCollection(ordersQuery);
  const { data: banners, loading: bannersLoading } = useCollection(bannersQuery);

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
          toast({ title: 'Akun Admin Dibuat', description: 'Selamat datang!' });
        } catch (regError: any) {
          setAuthError(regError.message || 'Gagal masuk.');
        }
      } else {
        setAuthError('Gagal masuk. Periksa email/password.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setAuthError(null);
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  if (!user || user.email !== ADMIN_EMAIL) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl rounded-[2rem] overflow-hidden">
          <CardHeader className="bg-primary text-primary-foreground p-10 text-center">
            <Lock size={40} className="mx-auto mb-4" />
            <CardTitle className="text-3xl font-bold">Admin MonoStore</CardTitle>
          </CardHeader>
          <CardContent className="p-10">
            {authError && <Alert variant="destructive" className="mb-6"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{authError}</AlertDescription></Alert>}
            <form onSubmit={handleLogin} className="space-y-6">
              <Input placeholder="Admin Email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required className="h-12 rounded-xl" />
              <Input type="password" placeholder="Password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required className="h-12 rounded-xl" />
              <Button type="submit" className="w-full h-12 rounded-xl" disabled={isLoggingIn}>
                {isLoggingIn ? <Loader2 className="animate-spin" /> : 'Sign In'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredProducts = products?.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())) || [];

  const handleDelete = (id: string) => {
    if (!db || !window.confirm('Hapus produk ini?')) return;
    const docRef = doc(db, 'products', id);
    deleteDoc(docRef).catch(err => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'delete' })));
  };

  const handleDeleteBanner = (id: string) => {
    if (!db || !window.confirm('Hapus banner ini?')) return;
    const docRef = doc(db, 'banners', id);
    deleteDoc(docRef).catch(err => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'delete' })));
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-4">
            <LayoutDashboard size={32} className="text-primary" />
            <h1 className="text-3xl font-bold">Panel Admin</h1>
          </div>
          <Button variant="outline" onClick={handleLogout} className="rounded-xl">Logout</Button>
        </div>

        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="bg-white p-1 rounded-2xl h-14 w-full md:w-auto shadow-sm flex overflow-x-auto no-scrollbar">
            <TabsTrigger value="products" className="rounded-xl h-12 px-8 font-bold data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
              Produk
            </TabsTrigger>
            <TabsTrigger value="banners" className="rounded-xl h-12 px-8 font-bold data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
              Banner
            </TabsTrigger>
            <TabsTrigger value="orders" className="rounded-xl h-12 px-8 font-bold data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
              Pesanan
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Cari produk..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-12 h-14 rounded-2xl bg-white border-none shadow-sm" />
              </div>
              <Button onClick={() => setIsDialogOpen(true)} className="h-14 px-8 rounded-2xl font-bold">
                <Plus size={20} className="mr-2" /> Tambah Produk
              </Button>
            </div>

            <Card className="rounded-[2rem] border-none shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-8">Produk</TableHead>
                    <TableHead>Harga</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Stok</TableHead>
                    <TableHead className="text-right pr-8">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productsLoading ? <TableRow><TableCell colSpan={5} className="text-center h-40"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow> :
                    filteredProducts.map(p => (
                      <TableRow key={p.id}>
                        <TableCell className="pl-8">
                          <div className="flex items-center gap-3 font-bold">{p.name}</div>
                        </TableCell>
                        <TableCell>{formatRupiah(p.price)}</TableCell>
                        <TableCell><Badge variant="secondary">{p.category}</Badge></TableCell>
                        <TableCell>
                          <Badge variant={p.stock <= 10 ? "destructive" : "secondary"}>{p.stock}</Badge>
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <Button variant="ghost" size="icon" onClick={() => { setEditingProduct(p); setIsDialogOpen(true); }}><Pencil size={18} /></Button>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(p.id)}><Trash2 size={18} /></Button>
                        </TableCell>
                      </TableRow>
                    ))
                  }
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="banners" className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground font-medium">Maksimal 10 banner aktif. Urutkan berdasarkan angka (0 terkecil).</div>
              <Button onClick={() => setIsBannerDialogOpen(true)} className="h-14 px-8 rounded-2xl font-bold" disabled={banners?.length >= 10}>
                <Plus size={20} className="mr-2" /> Tambah Banner
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bannersLoading ? (
                <div className="col-span-full flex justify-center py-20"><Loader2 className="animate-spin" /></div>
              ) : banners?.map((banner: any) => (
                <Card key={banner.id} className="rounded-3xl border-none shadow-sm overflow-hidden group">
                  <div className="relative aspect-[21/9] bg-slate-100">
                    <Image src={banner.image} alt="Banner" fill className="object-cover" />
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-primary text-white font-bold">#{banner.order}</Badge>
                    </div>
                  </div>
                  <CardContent className="p-4 flex justify-between items-center">
                    <div className="truncate flex-1 mr-4">
                      <div className="font-bold text-sm truncate">{banner.title || 'Tanpa Judul'}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{banner.link || 'Tanpa Link'}</div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingBanner(banner); setIsBannerDialogOpen(true); }}><Pencil size={14} /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteBanner(banner.id)}><Trash2 size={14} /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {!bannersLoading && banners?.length === 0 && (
                <div className="col-span-full text-center py-20 bg-white rounded-[2rem] border border-dashed text-muted-foreground font-bold">
                  Belum ada banner promo.
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="orders">
            <Card className="rounded-[2rem] border-none shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-8">Pelanggan</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Waktu</TableHead>
                    <TableHead className="pr-8">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ordersLoading ? <TableRow><TableCell colSpan={5} className="text-center h-40"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow> :
                    orders?.map((order: any) => (
                      <TableRow key={order.id}>
                        <TableCell className="pl-8 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold">{order.customerName}</span>
                            <span className="text-xs text-muted-foreground">{order.customerEmail}</span>
                            {order.whatsapp && <span className="text-[10px] text-green-600 font-medium">WA: {order.whatsapp}</span>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1 max-w-[200px]">
                            {order.items?.map((item: any, i: number) => (
                              <div key={i} className="text-xs bg-slate-100 p-1 px-2 rounded-md truncate" title={item.name}>
                                {item.name}
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="font-bold text-primary">{formatRupiah(order.totalAmount)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          <div className="flex items-center gap-1"><Clock size={12} /> {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString('id-ID') : 'Baru saja'}</div>
                        </TableCell>
                        <TableCell className="pr-8">
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 uppercase text-[10px]">BERHASIL</Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  }
                  {!ordersLoading && orders?.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center h-40 text-muted-foreground">Belum ada transaksi.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <ProductDialog isOpen={isDialogOpen} onClose={() => { setIsDialogOpen(false); setEditingProduct(null); }} product={editingProduct} />
      <BannerDialog isOpen={isBannerDialogOpen} onClose={() => { setIsBannerDialogOpen(false); setEditingBanner(null); }} banner={editingBanner} />
    </div>
  );
}
