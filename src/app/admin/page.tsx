'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useFirestore, useCollection, useUser, useAuth, useMemoFirebase, useDoc } from '@/firebase';
import { collection, deleteDoc, doc, query, orderBy, setDoc, serverTimestamp, onSnapshot, limit, addDoc, getDocs } from 'firebase/firestore';
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
  Store,
  Phone,
  Mail,
  BarChart3,
  TrendingUp,
  Layers,
  Bell,
  BellRing,
  Volume2
} from 'lucide-react';
import { ProductDialog } from '@/components/admin/product-dialog';
import { BannerDialog } from '@/components/admin/banner-dialog';
import { VoucherDialog } from '@/components/admin/voucher-dialog';
import { FlashSaleDialog } from '@/components/admin/flash-sale-dialog';
import { BundleDialog } from '@/components/admin/bundle-dialog';
import { formatRupiah } from '@/lib/utils';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';

const ADMIN_EMAIL = 'matchboxdevelopment@gmail.com';

type AdminSection = 'analytics' | 'products' | 'flash-sale' | 'bundles' | 'vouchers' | 'banners' | 'orders' | 'settings';

export default function AdminPage() {
  const { user, loading: authLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [activeSection, setActiveSection] = useState<AdminSection>('analytics');
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
  const [isBundleDialogOpen, setIsBundleDialogOpen] = useState(false);
  const [editingBundle, setEditingBundle] = useState<any>(null);
  const [isFlashSaleDialogOpen, setIsFlashSaleDialogOpen] = useState(false);
  const [selectedFlashSaleProduct, setSelectedFlashSaleProduct] = useState<any>(null);

  // Settings State
  const [shopName, setShopName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
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

  const bundlesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'bundles'), orderBy('createdAt', 'desc'));
  }, [db]);

  const settingsRef = useMemoFirebase(() => {
    if (!db) return null;
    return doc(db, 'settings', 'shop');
  }, [db]);

  const { data: products, loading: productsLoading } = useCollection(productsQuery);
  const { data: orders, loading: ordersLoading } = useCollection(ordersQuery);
  const { data: banners, loading: bannersLoading } = useCollection(bannersQuery);
  const { data: vouchers, loading: vouchersLoading } = useCollection(vouchersQuery);
  const { data: bundles, loading: bundlesLoading } = useCollection(bundlesQuery);
  const { data: settings, loading: settingsLoading } = useDoc<any>(settingsRef);

  const prevOrdersCount = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Real-time Notification for New Orders
  useEffect(() => {
    if (orders && orders.length > prevOrdersCount.current) {
      if (prevOrdersCount.current !== 0) {
        const newOrder = orders[0];
        if (newOrder.status === 'completed') {
          toast({
            title: "Pesanan Baru Masuk! 🔥",
            description: `${newOrder.customerName} baru saja membeli template.`,
          });
          // Play notification sound
          if (audioRef.current) {
            audioRef.current.play().catch(() => {});
          }
        }
      }
      prevOrdersCount.current = orders.length;
    }
  }, [orders, toast]);

  useEffect(() => {
    if (settings) {
      setShopName(settings.shopName || '');
      setWhatsapp(settings.whatsapp || '');
      setSupportEmail(settings.supportEmail || '');
    }
  }, [settings]);

  // Analytics Data Calculation
  const stats = useMemo(() => {
    if (!orders) return { revenue: 0, count: 0, pending: 0, success: 0 };
    const successOrders = orders.filter(o => o.status === 'completed');
    return {
      revenue: successOrders.reduce((acc, o) => acc + (o.totalAmount || 0), 0),
      count: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      success: successOrders.length
    };
  }, [orders]);

  const revenueData = useMemo(() => {
    if (!orders) return [];
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => {
      const dayTotal = orders
        .filter(o => o.status === 'completed' && o.createdAt?.toDate().toISOString().startsWith(date))
        .reduce((acc, o) => acc + (o.totalAmount || 0), 0);
      return { 
        name: new Date(date).toLocaleDateString('id-ID', { weekday: 'short' }), 
        revenue: dayTotal / 1000 
      };
    });
  }, [orders]);

  const topProducts = useMemo(() => {
    if (!products) return [];
    return [...products]
      .sort((a, b) => (b.sold || 0) - (a.sold || 0))
      .slice(0, 5)
      .map(p => ({ name: p.name, sold: p.sold || 0 }));
  }, [products]);

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
    const data = { 
      shopName: shopName.trim(), 
      whatsapp: whatsapp.trim(),
      supportEmail: supportEmail.trim(),
      updatedAt: serverTimestamp() 
    };
    
    setDoc(docRef, data, { merge: true })
      .then(() => {
        toast({ title: 'Pengaturan Disimpan', description: 'Pengaturan toko Anda telah diperbarui.' });
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
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const navItems = [
    { id: 'analytics', label: 'Dashboard', icon: BarChart3 },
    { id: 'products', label: 'Produk', icon: Package },
    { id: 'flash-sale', label: 'Flash Sale', icon: Zap, color: 'text-red-600' },
    { id: 'bundles', label: 'Bundling', icon: Layers },
    { id: 'vouchers', label: 'Voucher', icon: Ticket },
    { id: 'banners', label: 'Banner', icon: ImageIcon },
    { id: 'orders', label: 'Pesanan', icon: ShoppingCart },
    { id: 'settings', label: 'Pengaturan', icon: SettingsIcon },
  ];

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#F8F9FA] overflow-hidden">
      {/* Sound for notifications */}
      <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" preload="auto" />

      {/* Sidebar */}
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
          <Button variant="ghost" size="icon" className="md:hidden rounded-full" onClick={() => setIsSidebarOpen(false)}>
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
          <Button variant="ghost" onClick={handleLogout} className="w-full justify-start text-destructive hover:text-destructive hover:bg-red-50 rounded-xl font-bold gap-3 px-4 h-12">
            <LogOut size={18} />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-slate-200 bg-white sticky top-0 z-30 px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="rounded-xl hover:bg-slate-50 text-slate-500">
              <Menu size={20} />
            </Button>
            <div className="h-6 w-px bg-slate-200 mx-2" />
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              <span className="text-primary">{activeSection.replace('-', ' ')}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-green-500 bg-green-50 px-3 py-1.5 rounded-full border border-green-100">
            <Bell size={14} className="animate-bounce" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Monitor Aktif</span>
          </div>
        </header>

        <div className="flex-1 p-6 md:p-10 overflow-y-auto">
          <div className="max-w-6xl mx-auto space-y-8">
            
            {activeSection === 'analytics' && (
              <div className="space-y-8 animate-fadeIn">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h2 className="text-3xl font-bold tracking-tight">Analisa Penjualan</h2>
                    <p className="text-sm text-muted-foreground">Ringkasan performa toko Anda secara keseluruhan.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="rounded-3xl border-none shadow-sm bg-white p-6 space-y-4">
                    <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center"><TrendingUp size={24} /></div>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Pendapatan</p>
                      <h3 className="text-2xl font-black">{formatRupiah(stats.revenue)}</h3>
                    </div>
                  </Card>
                  <Card className="rounded-3xl border-none shadow-sm bg-white p-6 space-y-4">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center"><ShoppingCart size={24} /></div>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Pesanan</p>
                      <h3 className="text-2xl font-black">{stats.count}</h3>
                    </div>
                  </Card>
                  <Card className="rounded-3xl border-none shadow-sm bg-white p-6 space-y-4">
                    <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center"><Clock size={24} /></div>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Pesanan Pending</p>
                      <h3 className="text-2xl font-black">{stats.pending}</h3>
                    </div>
                  </Card>
                  <Card className="rounded-3xl border-none shadow-sm bg-white p-6 space-y-4">
                    <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center"><CheckCircle2 size={24} /></div>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Pesanan Berhasil</p>
                      <h3 className="text-2xl font-black">{stats.success}</h3>
                    </div>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <Card className="rounded-[2rem] border-none shadow-sm bg-white p-8">
                    <CardTitle className="text-lg font-bold mb-6">Pendapatan 7 Hari Terakhir</CardTitle>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={revenueData}>
                          <defs>
                            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                          <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                          <RechartsTooltip />
                          <Area type="monotone" dataKey="revenue" stroke="#2563eb" fillOpacity={1} fill="url(#colorRev)" strokeWidth={3} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-[10px] text-center text-muted-foreground mt-4">*Nilai dalam ribuan Rupiah (K)</p>
                  </Card>

                  <Card className="rounded-[2rem] border-none shadow-sm bg-white p-8">
                    <CardTitle className="text-lg font-bold mb-6">Produk Terlaris</CardTitle>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={topProducts} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                          <XAxis type="number" hide />
                          <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 10, fill: '#64748b'}} axisLine={false} tickLine={false} />
                          <RechartsTooltip />
                          <Bar dataKey="sold" fill="#2563eb" radius={[0, 10, 10, 0]} barSize={20} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                </div>
              </div>
            )}

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

            {activeSection === 'bundles' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight">Bundling Produk</h2>
                    <p className="text-sm text-muted-foreground">Buat paket hemat dengan beberapa produk sekaligus.</p>
                  </div>
                  <Button onClick={() => setIsBundleDialogOpen(true)} className="h-12 px-6 rounded-xl font-bold shadow-lg shadow-primary/20"><Plus size={18} className="mr-2" /> Buat Bundle</Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {bundlesLoading ? <div className="col-span-full py-20 text-center"><Loader2 className="animate-spin mx-auto" /></div> :
                    bundles?.map((b: any) => (
                      <Card key={b.id} className="rounded-[2rem] border-none shadow-sm bg-white overflow-hidden group hover:shadow-xl transition-all duration-300">
                        <div className={cn("h-3 w-full", b.isActive ? 'bg-primary' : 'bg-slate-200')} />
                        <CardContent className="p-8 space-y-5">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="text-xl font-black text-slate-800">{b.name}</div>
                              <div className="text-[10px] text-muted-foreground font-bold uppercase mt-1">{b.productIds?.length} Produk Terpilih</div>
                            </div>
                            <Badge variant={b.isActive ? "default" : "secondary"} className="font-bold text-[9px]">
                              {b.isActive ? 'AKTIF' : 'OFF'}
                            </Badge>
                          </div>
                          <div className="bg-primary/5 p-4 rounded-2xl flex items-center justify-between border border-primary/10">
                            <span className="text-xs font-bold text-primary">Diskon Paket</span>
                            <span className="text-xl font-black text-primary">{b.discountPercentage}%</span>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" className="flex-1 rounded-xl font-bold border-slate-100 h-11" onClick={() => { setEditingBundle(b); setIsBundleDialogOpen(true); }}>Edit</Button>
                            <Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl text-destructive hover:bg-red-50" onClick={() => handleDelete(b.id, 'bundles')}><Trash2 size={18} /></Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  }
                </div>
              </div>
            )}

            {activeSection === 'orders' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight">Riwayat Pesanan</h2>
                    <p className="text-sm text-muted-foreground">Pantau semua transaksi masuk secara real-time.</p>
                  </div>
                </div>
                <Card className="rounded-2xl border-none shadow-sm overflow-hidden bg-white">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="pl-8 font-bold">PELANGGAN</TableHead>
                        <TableHead className="font-bold">TOTAL</TableHead>
                        <TableHead className="font-bold">WAKTU</TableHead>
                        <TableHead className="pr-8 font-bold">STATUS</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ordersLoading ? <TableRow><TableCell colSpan={4} className="text-center h-40"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow> :
                        orders?.map((o: any) => (
                          <TableRow key={o.id} className="hover:bg-slate-50/50 transition-colors">
                            <TableCell className="pl-8 py-5">
                              <div className="flex flex-col">
                                <span className="font-bold text-sm">{o.customerName}</span>
                                <span className="text-[10px] text-muted-foreground font-medium">{o.customerEmail}</span>
                              </div>
                            </TableCell>
                            <TableCell className="font-black text-primary">{formatRupiah(o.totalAmount)}</TableCell>
                            <TableCell className="text-[10px] font-bold text-slate-400 uppercase">{o.createdAt?.toDate().toLocaleString('id-ID')}</TableCell>
                            <TableCell className="pr-8">{getOrderStatusBadge(o.status)}</TableCell>
                          </TableRow>
                        ))
                      }
                    </TableBody>
                  </Table>
                </Card>
              </div>
            )}

            {activeSection === 'settings' && (
              <div className="space-y-6 animate-fadeIn max-w-2xl">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Pengaturan Toko</h2>
                  <p className="text-sm text-muted-foreground">Sesuaikan identitas dan kontak toko Anda di sini.</p>
                </div>
                <Card className="rounded-[2rem] border-none shadow-sm bg-white p-8 space-y-6">
                    <form onSubmit={handleSaveSettings} className="space-y-6">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-gray-400">Nama Toko</Label>
                        <Input value={shopName} onChange={(e) => setShopName(e.target.value)} className="h-12 rounded-xl bg-slate-50 border-none font-bold text-lg" required />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase text-gray-400">WhatsApp Support</Label>
                          <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="h-12 rounded-xl bg-slate-50 border-none font-bold" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase text-gray-400">Email Support</Label>
                          <Input type="email" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} className="h-12 rounded-xl bg-slate-50 border-none font-bold" />
                        </div>
                      </div>
                      <Button type="submit" disabled={isSavingSettings} className="w-full h-12 rounded-xl font-bold">Simpan Perubahan</Button>
                    </form>
                </Card>
              </div>
            )}

          </div>
        </div>
      </main>

      <ProductDialog isOpen={isDialogOpen} onClose={() => { setIsDialogOpen(false); setEditingProduct(null); }} product={editingProduct} />
      <BannerDialog isOpen={isBannerDialogOpen} onClose={() => { setIsBannerDialogOpen(false); setEditingBanner(null); }} banner={editingBanner} />
      <VoucherDialog isOpen={isVoucherDialogOpen} onClose={() => { setIsVoucherDialogOpen(false); setEditingVoucher(null); }} voucher={editingVoucher} />
      <BundleDialog isOpen={isBundleDialogOpen} onClose={() => { setIsBundleDialogOpen(false); setEditingBundle(null); }} bundle={editingBundle} products={products || []} />
      <FlashSaleDialog isOpen={isFlashSaleDialogOpen} onClose={() => { setIsFlashSaleDialogOpen(false); setSelectedFlashSaleProduct(null); }} product={selectedFlashSaleProduct} />
    </div>
  );
}
