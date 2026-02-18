'use client';

import React, { useState } from 'react';
import { useFirestore, useCollection, useUser, useAuth, useMemoFirebase } from '@/firebase';
import { collection, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Lock,
  AlertCircle,
  Clock,
  Ticket,
  Zap,
  Tag
} from 'lucide-react';
import { ProductDialog } from '@/components/admin/product-dialog';
import { BannerDialog } from '@/components/admin/banner-dialog';
import { VoucherDialog } from '@/components/admin/voucher-dialog';
import { formatRupiah } from '@/lib/utils';
import Image from 'next/image';
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

  const [isVoucherDialogOpen, setIsVoucherDialogOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<any>(null);

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

  const vouchersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'vouchers'), orderBy('code', 'asc'));
  }, [db]);

  const { data: products, loading: productsLoading } = useCollection(productsQuery);
  const { data: orders, loading: ordersLoading } = useCollection(ordersQuery);
  const { data: banners, loading: bannersLoading } = useCollection(bannersQuery);
  const { data: vouchers, loading: vouchersLoading } = useCollection(vouchersQuery);

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
      toast({ title: 'Logged in', description: 'Welcome back Admin.' });
    } catch (error: any) {
      setAuthError('Gagal masuk. Periksa email/password.');
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
        <Card className="w-full max-w-md shadow-xl rounded-2xl overflow-hidden">
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

  const handleDelete = (id: string, collectionName: string) => {
    if (!db || !window.confirm(`Hapus item ini dari ${collectionName}?`)) return;
    const docRef = doc(db, collectionName, id);
    deleteDoc(docRef).catch(err => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'delete' })));
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white"><LayoutDashboard size={24} /></div>
            <h1 className="text-3xl font-bold">Admin Panel</h1>
          </div>
          <Button variant="outline" onClick={handleLogout} className="rounded-xl">Logout</Button>
        </div>

        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="bg-white p-1 rounded-xl h-14 w-full md:w-auto shadow-sm flex overflow-x-auto no-scrollbar">
            <TabsTrigger value="products" className="rounded-lg h-12 px-6 font-bold data-[state=active]:bg-primary data-[state=active]:text-white">Produk</TabsTrigger>
            <TabsTrigger value="vouchers" className="rounded-lg h-12 px-6 font-bold data-[state=active]:bg-primary data-[state=active]:text-white">Voucher</TabsTrigger>
            <TabsTrigger value="banners" className="rounded-lg h-12 px-6 font-bold data-[state=active]:bg-primary data-[state=active]:text-white">Banner</TabsTrigger>
            <TabsTrigger value="orders" className="rounded-lg h-12 px-6 font-bold data-[state=active]:bg-primary data-[state=active]:text-white">Pesanan</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Cari produk..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-12 h-14 rounded-xl bg-white border-none shadow-sm" />
              </div>
              <Button onClick={() => setIsDialogOpen(true)} className="h-14 px-8 rounded-xl font-bold"><Plus size={20} className="mr-2" /> Tambah Produk</Button>
            </div>
            <Card className="rounded-xl border-none shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-8">Produk</TableHead>
                    <TableHead>Harga</TableHead>
                    <TableHead>Promo</TableHead>
                    <TableHead>Stok</TableHead>
                    <TableHead className="text-right pr-8">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productsLoading ? <TableRow><TableCell colSpan={5} className="text-center h-40"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow> :
                    products?.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(p => (
                      <TableRow key={p.id}>
                        <TableCell className="pl-8 py-4 font-bold">{p.name}</TableCell>
                        <TableCell>{formatRupiah(p.price)}</TableCell>
                        <TableCell>
                          {p.originalPrice && p.originalPrice > p.price && <Badge className="bg-green-100 text-green-700">-{Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)}%</Badge>}
                          {p.flashSaleEnd && new Date(p.flashSaleEnd).getTime() > Date.now() && <Badge className="ml-1 bg-red-100 text-red-700">FLASH SALE</Badge>}
                        </TableCell>
                        <TableCell><Badge variant={p.stock <= 5 ? "destructive" : "secondary"}>{p.stock}</Badge></TableCell>
                        <TableCell className="text-right pr-8">
                          <Button variant="ghost" size="icon" onClick={() => { setEditingProduct(p); setIsDialogOpen(true); }}><Pencil size={18} /></Button>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(p.id, 'products')}><Trash2 size={18} /></Button>
                        </TableCell>
                      </TableRow>
                    ))
                  }
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="vouchers" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold flex items-center gap-2"><Ticket className="text-primary" /> Kelola Kode Voucher</h2>
              <Button onClick={() => setIsVoucherDialogOpen(true)} className="h-12 px-6 rounded-xl font-bold"><Plus size={18} className="mr-2" /> Tambah Voucher</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vouchersLoading ? <div className="col-span-full py-20 text-center"><Loader2 className="animate-spin mx-auto" /></div> :
                vouchers?.map((v: any) => (
                  <Card key={v.id} className="rounded-xl border-none shadow-sm bg-white overflow-hidden group">
                    <div className={`h-2 w-full ${v.isActive ? 'bg-green-500' : 'bg-slate-300'}`} />
                    <CardContent className="p-6 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-xl font-black tracking-widest text-primary">{v.code}</div>
                          <div className="text-xs text-muted-foreground font-medium">Min. Belanja: {formatRupiah(v.minPurchase)}</div>
                        </div>
                        <Badge variant={v.isActive ? "default" : "secondary"}>{v.isActive ? 'AKTIF' : 'NONAKTIF'}</Badge>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-600">Diskon</span>
                        <span className="text-lg font-black text-primary">{v.type === 'percentage' ? `${v.value}%` : formatRupiah(v.value)}</span>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" className="flex-1 rounded-lg" onClick={() => { setEditingVoucher(v); setIsVoucherDialogOpen(true); }}>Edit</Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(v.id, 'vouchers')}><Trash2 size={18} /></Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              }
            </div>
          </TabsContent>

          <TabsContent value="banners" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold">Banner Promo</h2>
              <Button onClick={() => setIsBannerDialogOpen(true)} className="h-12 px-6 rounded-xl font-bold" disabled={banners?.length >= 10}><Plus size={18} className="mr-2" /> Tambah Banner</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {bannersLoading ? <div className="col-span-full py-20 text-center"><Loader2 className="animate-spin mx-auto" /></div> :
                banners?.map((b: any) => (
                  <Card key={b.id} className="rounded-xl border-none shadow-sm overflow-hidden bg-white">
                    <div className="aspect-[21/9] relative bg-slate-100">
                      <Image src={b.image} alt="Banner" fill className="object-cover" />
                      <Badge className="absolute top-2 left-2 bg-primary">#{b.order}</Badge>
                    </div>
                    <CardContent className="p-4 flex justify-between items-center">
                      <div className="truncate font-bold text-sm">{b.title || 'Banner'}</div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingBanner(b); setIsBannerDialogOpen(true); }}><Pencil size={14} /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(b.id, 'banners')}><Trash2 size={14} /></Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              }
            </div>
          </TabsContent>

          <TabsContent value="orders">
            <Card className="rounded-xl border-none shadow-sm overflow-hidden bg-white">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-8">Pelanggan</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Voucher</TableHead>
                    <TableHead>Waktu</TableHead>
                    <TableHead className="pr-8">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ordersLoading ? <TableRow><TableCell colSpan={5} className="text-center h-40"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow> :
                    orders?.map((o: any) => (
                      <TableRow key={o.id}>
                        <TableCell className="pl-8 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold">{o.customerName}</span>
                            <span className="text-[10px] text-muted-foreground">{o.customerEmail}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-bold text-primary">{formatRupiah(o.totalAmount)}</TableCell>
                        <TableCell>{o.voucherCode ? <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">{o.voucherCode}</Badge> : '-'}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{o.createdAt?.toDate ? o.createdAt.toDate().toLocaleString('id-ID') : '...'}</TableCell>
                        <TableCell className="pr-8"><Badge className="bg-green-500">BERHASIL</Badge></TableCell>
                      </TableRow>
                    ))
                  }
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <ProductDialog isOpen={isDialogOpen} onClose={() => { setIsDialogOpen(false); setEditingProduct(null); }} product={editingProduct} />
      <BannerDialog isOpen={isBannerDialogOpen} onClose={() => { setIsBannerDialogOpen(false); setEditingBanner(null); }} banner={editingBanner} />
      <VoucherDialog isOpen={isVoucherDialogOpen} onClose={() => { setIsVoucherDialogOpen(false); setEditingVoucher(null); }} voucher={editingVoucher} />
    </div>
  );
}