
'use client';

import React, { useState, useEffect } from 'react';
import { useFirestore, useCollection, useUser, useAuth, useMemoFirebase, useDoc } from '@/firebase';
import { collection, deleteDoc, doc, query, orderBy, setDoc, serverTimestamp } from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  Ticket,
  Zap,
  Tag,
  Clock,
  Timer,
  CheckCircle2,
  AlertTriangle,
  Package,
  Image as ImageIcon,
  ShoppingCart,
  LogOut,
  ChevronRight,
  Menu,
  X,
  Settings as SettingsIcon,
  Store
} from 'lucide-react';
import { ProductDialog } from '@/components/admin/product-dialog';
import { BannerDialog } from '@/components/admin/banner-dialog';
import { VoucherDialog } from '@/components/admin/voucher-dialog';
import { FlashSaleDialog } from '@/components/admin/flash-sale-dialog';
import { formatRupiah } from '@/lib/utils';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

const ADMIN_EMAIL = 'matchboxdevelopment@gmail.com';

type AdminSection = 'products' | 'flash-sale' | 'vouchers' | 'banners' | 'orders' | 'settings';

export default function AdminPage() {
  const { user, loading: authLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [activeSection, setActiveSection] = useState<AdminSection>('products');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  
  // Dialog States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isBannerDialogOpen, setIsBannerDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any>(null);
  const [isVoucherDialogOpen, setIsVoucherDialogOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<any>(null);
  const [isFlashSaleDialogOpen, setIsFlashSaleDialogOpen] = useState(false);
  const [selectedFlashSaleProduct, setSelectedFlashSaleProduct] = useState<any>(null);

  // Settings State
  const [shopName, setShopName] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

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

  const settingsRef = useMemoFirebase(() => {
    if (!db) return null;
    return doc(db, 'settings', 'shop');
  }, [db]);

  const { data: products, loading: productsLoading } = useCollection(productsQuery);
  const { data: orders, loading: ordersLoading } = useCollection(ordersQuery);
  const { data: banners, loading: bannersLoading } = useCollection(bannersQuery);
  const { data: vouchers, loading: vouchersLoading } = useCollection(vouchersQuery);
  const { data: settings, loading: settingsLoading } = useDoc<any>(settingsRef);

  useEffect(() => {
    if (settings?.shopName) {
      setShopName(settings.shopName);
    }
  }, [settings]);

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

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !shopName.trim()) return;
    setIsSavingSettings(true);
    const docRef = doc(db, 'settings', 'shop');
    const data = { shopName: shopName.trim(), updatedAt: serverTimestamp() };
    
    setDoc(docRef, data, { merge: true })
      .then(() => {
        toast({ title: 'Pengaturan Disimpan', description: 'Nama toko Anda telah diperbarui.' });
      })
      .catch((error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: docRef.path,
          operation: 'write',
          requestResourceData: data
        }));
      })
      .finally(() => {
        setIsSavingSettings(false);
      });
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

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500 text-white gap-1"><CheckCircle2 size={10} /> BERHASIL</Badge>;
      case 'pending':
        return <Badge className="bg-orange-500 text-white gap-1"><Clock size={10} /> PENDING</Badge>;
      case 'failed':
        return <Badge variant="destructive" className="gap-1"><AlertTriangle size={10} /> GAGAL</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const navItems = [
    { id: 'products', label: 'Produk', icon: Package },
    { id: 'flash-sale', label: 'Flash Sale', icon: Zap, color: 'text-red-600' },
    { id: 'vouchers', label: 'Voucher', icon: Ticket },
    { id: 'banners', label: 'Banner', icon: ImageIcon },
    { id: 'orders', label: 'Pesanan', icon: ShoppingCart },
    { id: 'settings', label: 'Pengaturan', icon: SettingsIcon },
  ];

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#F8F9FA] overflow-hidden">
      {/* Sidebar Navigasi */}
      <aside className={cn(
        "bg-white border-r border-slate-200 transition-all duration-300 ease-in-out flex flex-col z-40 fixed md:sticky md:top-0 md:h-screen h-full shrink-0",
        isSidebarOpen ? "w-72 left-0" : "-left-72 md:left-0 md:w-0 overflow-hidden border-none"
      )}>
        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <LayoutDashboard size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Admin Panel</h1>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{settings?.shopName || 'MonoStore'}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden rounded-full" 
            onClick={() => setIsSidebarOpen(false)}
          >
            <X size={20} />
          </Button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto no-scrollbar">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveSection(item.id as AdminSection);
                if (window.innerWidth < 768) setIsSidebarOpen(false);
              }}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-200 group",
                activeSection === item.id 
                  ? "bg-primary text-white shadow-md shadow-primary/10" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-primary"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon size={18} className={cn(activeSection === item.id ? "text-white" : (item.color || "text-slate-400 group-hover:text-primary"))} />
                <span className="text-sm font-bold">{item.label}</span>
              </div>
              {activeSection === item.id && <ChevronRight size={14} className="text-white/50" />}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-50 mt-auto">
          <div className="bg-slate-50 rounded-2xl p-4 mb-4">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                {ADMIN_EMAIL.charAt(0).toUpperCase()}
              </div>
              <div className="truncate flex-1">
                <p className="text-xs font-bold truncate">Administrator</p>
                <p className="text-[10px] text-muted-foreground truncate">{ADMIN_EMAIL}</p>
              </div>
            </div>
          </div>
          <Button 
            variant="ghost" 
            onClick={handleLogout} 
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-red-50 rounded-xl font-bold gap-3 px-4 h-12"
          >
            <LogOut size={18} />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Navbar / Top Bar */}
        <header className="h-16 border-b border-slate-200 bg-white sticky top-0 z-30 px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="rounded-xl hover:bg-slate-50 text-slate-500"
            >
              <Menu size={20} />
            </Button>
            <div className="h-6 w-px bg-slate-200 mx-2" />
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
              <span>Admin</span>
              <ChevronRight size={12} />
              <span className="text-primary">{activeSection.replace('-', ' ')}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter leading-none">System Status</span>
              <span className="text-[10px] font-bold text-green-500 flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Operational
              </span>
            </div>
          </div>
        </header>

        <div className="flex-1 p-6 md:p-10 overflow-y-auto">
          <div className="max-w-6xl mx-auto space-y-8">
            
            {/* Section: Products */}
            {activeSection === 'products' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight">Manajemen Produk</h2>
                    <p className="text-sm text-muted-foreground">Kelola semua koleksi template website Anda.</p>
                  </div>
                  <Button onClick={() => setIsDialogOpen(true)} className="h-12 px-6 rounded-xl font-bold shadow-lg shadow-primary/20"><Plus size={20} className="mr-2" /> Tambah Produk</Button>
                </div>

                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <Input placeholder="Cari berdasarkan nama produk..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-12 h-14 rounded-2xl bg-white border-none shadow-sm" />
                </div>

                <Card className="rounded-2xl border-none shadow-sm overflow-hidden bg-white">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="pl-8 font-bold">PRODUK</TableHead>
                        <TableHead className="font-bold">HARGA</TableHead>
                        <TableHead className="font-bold">STATUS</TableHead>
                        <TableHead className="font-bold">STOK</TableHead>
                        <TableHead className="text-right pr-8 font-bold">AKSI</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productsLoading ? <TableRow><TableCell colSpan={5} className="text-center h-40"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow> :
                        products?.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(p => (
                          <TableRow key={p.id} className="hover:bg-slate-50/50 transition-colors">
                            <TableCell className="pl-8 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl overflow-hidden relative bg-slate-100 shrink-0 border border-slate-100 shadow-sm">
                                  <Image src={p.image.startsWith('http') ? p.image : '/api/placeholder/100/100'} alt="" fill className="object-cover" />
                                </div>
                                <div>
                                  <span className="font-bold block text-sm">{p.name}</span>
                                  <span className="text-[10px] text-muted-foreground font-bold uppercase">{p.category}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">{formatRupiah(p.price)}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {p.originalPrice && p.originalPrice > p.price && <Badge className="bg-green-100 text-green-700 border-none font-bold text-[9px]">-{Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)}%</Badge>}
                                {p.flashSaleEnd && new Date(p.flashSaleEnd).getTime() > Date.now() && <Badge className="bg-red-100 text-red-700 flex items-center gap-1 border-none font-bold text-[9px]"><Zap size={8} /> FLASH SALE</Badge>}
                              </div>
                            </TableCell>
                            <TableCell><Badge variant={p.stock <= 5 ? "destructive" : "secondary"} className="font-bold">{p.stock}</Badge></TableCell>
                            <TableCell className="text-right pr-8">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-primary/10 hover:text-primary" onClick={() => { setEditingProduct(p); setIsDialogOpen(true); }}><Pencil size={16} /></Button>
                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-destructive hover:bg-red-50 hover:text-destructive" onClick={() => handleDelete(p.id, 'products')}><Trash2 size={16} /></Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      }
                    </TableBody>
                  </Table>
                </Card>
              </div>
            )}

            {/* Section: Flash Sale */}
            {activeSection === 'flash-sale' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-red-600 p-8 rounded-3xl text-white shadow-xl shadow-red-200">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-white backdrop-blur-md border border-white/10"><Zap size={28} className="fill-white" /></div>
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight">Pusat Aktivasi Flash Sale</h2>
                      <p className="text-red-100 font-medium">Ubah produk menjadi promo kilat dalam sekejap untuk meningkatkan penjualan.</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {productsLoading ? <div className="col-span-full py-20 text-center"><Loader2 className="animate-spin mx-auto" /></div> :
                    products?.map((p: any) => {
                      const isFlashSaleActive = p.flashSaleEnd && new Date(p.flashSaleEnd).getTime() > Date.now();
                      return (
                        <Card key={p.id} className={cn(
                          "rounded-[2rem] border-none shadow-sm overflow-hidden bg-white transition-all duration-300 hover:shadow-xl",
                          isFlashSaleActive ? 'ring-2 ring-red-500' : ''
                        )}>
                          <div className="aspect-[16/10] relative bg-slate-100">
                            <Image src={p.image.startsWith('http') ? p.image : '/api/placeholder/400/225'} alt={p.name} fill className="object-cover" />
                            {isFlashSaleActive && (
                              <div className="absolute inset-0 bg-red-600/10 backdrop-blur-[1px] flex items-center justify-center">
                                <Badge className="bg-red-600 text-white text-[10px] font-black animate-pulse py-1.5 px-4 rounded-full border-none">SEDANG FLASH SALE</Badge>
                              </div>
                            )}
                          </div>
                          <CardContent className="p-6 space-y-5">
                            <div>
                              <h3 className="font-bold text-base truncate mb-1">{p.name}</h3>
                              <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Normal: {formatRupiah(p.originalPrice || p.price)}</div>
                            </div>
                            
                            {isFlashSaleActive ? (
                              <div className="bg-red-50 p-4 rounded-2xl space-y-3 border border-red-100/50">
                                <div className="flex justify-between items-center">
                                  <span className="text-[9px] font-black text-red-400 uppercase tracking-widest">Harga Promo</span>
                                  <span className="text-base font-black text-red-600">{formatRupiah(p.price)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-[9px] font-black text-red-400 uppercase tracking-widest">Selesai Pada</span>
                                  <span className="text-[10px] font-bold text-red-600">{new Date(p.flashSaleEnd).toLocaleString('id-ID')}</span>
                                </div>
                              </div>
                            ) : (
                              <div className="h-16 flex items-center justify-center border-2 border-dashed border-slate-100 rounded-2xl text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
                                Status: Non-Aktif
                              </div>
                            )}

                            <Button 
                              onClick={() => { setSelectedFlashSaleProduct(p); setIsFlashSaleDialogOpen(true); }}
                              className={cn(
                                "w-full h-12 rounded-xl font-bold transition-all",
                                isFlashSaleActive 
                                  ? 'bg-white border-2 border-red-100 text-red-600 hover:bg-red-50 hover:border-red-200' 
                                  : 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-100'
                              )}
                            >
                              {isFlashSaleActive ? 'Edit Pengaturan' : 'Aktifkan Flash Sale'}
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })
                  }
                </div>
              </div>
            )}

            {/* Section: Vouchers */}
            {activeSection === 'vouchers' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight">Kupon & Voucher</h2>
                    <p className="text-sm text-muted-foreground">Buat kode promo spesial untuk pelanggan Anda.</p>
                  </div>
                  <Button onClick={() => setIsVoucherDialogOpen(true)} className="h-12 px-6 rounded-xl font-bold shadow-lg shadow-primary/20"><Plus size={18} className="mr-2" /> Tambah Voucher</Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {vouchersLoading ? <div className="col-span-full py-20 text-center"><Loader2 className="animate-spin mx-auto" /></div> :
                    vouchers?.map((v: any) => (
                      <Card key={v.id} className="rounded-[2rem] border-none shadow-sm bg-white overflow-hidden group hover:shadow-xl transition-all duration-300">
                        <div className={cn("h-3 w-full", v.isActive ? 'bg-green-500' : 'bg-slate-200')} />
                        <CardContent className="p-8 space-y-5">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="text-2xl font-black tracking-[0.1em] text-primary">{v.code}</div>
                              <div className="text-[10px] text-muted-foreground font-bold uppercase mt-1">Min. Belanja: {formatRupiah(v.minPurchase)}</div>
                            </div>
                            <Badge variant={v.isActive ? "default" : "secondary"} className={cn("font-bold text-[9px] px-3 py-1 rounded-full", v.isActive ? "bg-green-100 text-green-700 hover:bg-green-100" : "")}>
                              {v.isActive ? 'AKTIF' : 'OFF'}
                            </Badge>
                          </div>
                          <div className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between border border-slate-100/50">
                            <span className="text-xs font-bold text-slate-500">Nilai Potongan</span>
                            <span className="text-xl font-black text-primary">{v.type === 'percentage' ? `${v.value}%` : formatRupiah(v.value)}</span>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" className="flex-1 rounded-xl font-bold border-slate-100 h-11" onClick={() => { setEditingVoucher(v); setIsVoucherDialogOpen(true); }}>Edit</Button>
                            <Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl text-destructive hover:bg-red-50" onClick={() => handleDelete(v.id, 'vouchers')}><Trash2 size={18} /></Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  }
                </div>
              </div>
            )}

            {/* Section: Banners */}
            {activeSection === 'banners' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight">Banner Promosi</h2>
                    <p className="text-sm text-muted-foreground">Atur visual promo yang tampil di carousel beranda.</p>
                  </div>
                  <Button onClick={() => setIsBannerDialogOpen(true)} className="h-12 px-6 rounded-xl font-bold shadow-lg shadow-primary/20" disabled={banners?.length >= 10}><Plus size={18} className="mr-2" /> Tambah Banner</Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {bannersLoading ? <div className="col-span-full py-20 text-center"><Loader2 className="animate-spin mx-auto" /></div> :
                    banners?.map((b: any) => (
                      <Card key={b.id} className="rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-white group hover:shadow-xl transition-all duration-300">
                        <div className="aspect-[21/9] relative bg-slate-100 border-b border-slate-50">
                          <Image src={b.image} alt="Banner" fill className="object-cover" />
                          <Badge className="absolute top-4 left-4 bg-black/60 backdrop-blur-md border-none font-black text-xs px-4 py-1.5 rounded-full">URUTAN #{b.order}</Badge>
                        </div>
                        <CardContent className="p-6 flex justify-between items-center">
                          <div className="flex-1 min-w-0">
                            <div className="truncate font-bold text-base text-slate-800">{b.title || 'Tanpa Judul'}</div>
                            <p className="text-[10px] text-muted-foreground font-medium truncate">{b.link || 'Tidak ada link tujuan'}</p>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-primary/10 hover:text-primary" onClick={() => { setEditingBanner(b); setIsBannerDialogOpen(true); }}><Pencil size={16} /></Button>
                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-destructive hover:bg-red-50" onClick={() => handleDelete(b.id, 'banners')}><Trash2 size={16} /></Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  }
                </div>
              </div>
            )}

            {/* Section: Orders */}
            {activeSection === 'orders' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight">Riwayat Pesanan</h2>
                    <p className="text-sm text-muted-foreground">Pantau semua transaksi masuk baik pending maupun berhasil.</p>
                  </div>
                </div>

                <Card className="rounded-2xl border-none shadow-sm overflow-hidden bg-white">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="pl-8 font-bold">PELANGGAN</TableHead>
                        <TableHead className="font-bold">TOTAL</TableHead>
                        <TableHead className="font-bold">VOUCHER</TableHead>
                        <TableHead className="font-bold">WAKTU</TableHead>
                        <TableHead className="pr-8 font-bold">STATUS</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ordersLoading ? <TableRow><TableCell colSpan={5} className="text-center h-40"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow> :
                        orders?.map((o: any) => (
                          <TableRow key={o.id} className="hover:bg-slate-50/50 transition-colors">
                            <TableCell className="pl-8 py-5">
                              <div className="flex flex-col">
                                <span className="font-bold text-sm">{o.customerName}</span>
                                <span className="text-[10px] text-muted-foreground font-medium">{o.customerEmail}</span>
                              </div>
                            </TableCell>
                            <TableCell className="font-black text-primary">{formatRupiah(o.totalAmount)}</TableCell>
                            <TableCell>{o.voucherCode ? <Badge variant="outline" className="bg-green-50 text-green-700 border-green-100 font-bold text-[9px]">{o.voucherCode}</Badge> : '-'}</TableCell>
                            <TableCell className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{o.createdAt?.toDate ? o.createdAt.toDate().toLocaleString('id-ID') : 'Baru saja'}</TableCell>
                            <TableCell className="pr-8">{getOrderStatusBadge(o.status)}</TableCell>
                          </TableRow>
                        ))
                      }
                    </TableBody>
                  </Table>
                </Card>
              </div>
            )}

            {/* Section: Settings */}
            {activeSection === 'settings' && (
              <div className="space-y-6 animate-fadeIn max-w-2xl">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Pengaturan Toko</h2>
                  <p className="text-sm text-muted-foreground">Sesuaikan identitas toko Anda di sini.</p>
                </div>

                <Card className="rounded-[2rem] border-none shadow-sm bg-white overflow-hidden">
                  <CardHeader className="p-8 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                        <Store size={24} />
                      </div>
                      <div>
                        <CardTitle className="text-xl">Identitas Visual</CardTitle>
                        <CardDescription>Nama toko akan muncul di header, footer, dan invoice.</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 space-y-6">
                    <form onSubmit={handleSaveSettings} className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="shopName" className="text-xs font-bold uppercase text-gray-400">Nama Toko</Label>
                        <Input 
                          id="shopName"
                          placeholder="Masukkan nama toko Anda..."
                          value={shopName}
                          onChange={(e) => setShopName(e.target.value)}
                          className="h-12 rounded-xl bg-slate-50 border-none font-bold text-lg"
                          required
                        />
                      </div>

                      <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-3">
                        <AlertCircle className="text-blue-500 shrink-0" size={20} />
                        <p className="text-xs text-blue-600 leading-relaxed font-medium">
                          Mengubah nama toko akan secara otomatis memperbarui logo teks di seluruh halaman situs (Header & Footer). Pastikan nama tidak terlalu panjang agar tampilan tetap rapi.
                        </p>
                      </div>

                      <Button 
                        type="submit" 
                        disabled={isSavingSettings || settingsLoading} 
                        className="w-full h-12 rounded-xl font-bold shadow-lg shadow-primary/20"
                      >
                        {isSavingSettings ? <Loader2 className="animate-spin mr-2" /> : 'Simpan Perubahan'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            )}

          </div>
        </div>
      </main>

      {/* Dialogs */}
      <ProductDialog isOpen={isDialogOpen} onClose={() => { setIsDialogOpen(false); setEditingProduct(null); }} product={editingProduct} />
      <BannerDialog isOpen={isBannerDialogOpen} onClose={() => { setIsBannerDialogOpen(false); setEditingBanner(null); }} banner={editingBanner} />
      <VoucherDialog isOpen={isVoucherDialogOpen} onClose={() => { setIsVoucherDialogOpen(false); setEditingVoucher(null); }} voucher={editingVoucher} />
      <FlashSaleDialog isOpen={isFlashSaleDialogOpen} onClose={() => { setIsFlashSaleDialogOpen(false); setSelectedFlashSaleProduct(null); }} product={selectedFlashSaleProduct} />
    </div>
  );
}
