
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useFirestore, useCollection, useUser, useAuth, useMemoFirebase, useDoc } from '@/firebase';
import { 
  collection, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  setDoc, 
  serverTimestamp, 
  arrayUnion, 
  getDocs, 
  writeBatch,
  updateDoc
} from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  LayoutDashboard, 
  Loader2,
  Lock,
  Ticket,
  Package,
  Image as ImageIcon,
  ShoppingCart,
  LogOut,
  X,
  Settings as SettingsIcon,
  BarChart3,
  TrendingUp,
  Layers,
  Bell,
  Volume2,
  Wallet,
  Eye,
  Menu,
  AlertTriangle,
  Zap,
  Clock
} from 'lucide-react';
import { ProductDialog } from '@/components/admin/product-dialog';
import { BannerDialog } from '@/components/admin/banner-dialog';
import { VoucherDialog } from '@/components/admin/voucher-dialog';
import { BundleDialog } from '@/components/admin/bundle-dialog';
import { FlashSaleDialog } from '@/components/admin/flash-sale-dialog';
import { PaymentKeyDetailsDialog } from '@/components/admin/payment-key-details-dialog';
import { formatRupiah, cn } from '@/lib/utils';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';
import { getVapidPublicKey } from '@/lib/push-notifications';

const ADMIN_EMAIL = 'matchboxdevelopment@gmail.com';

type AdminSection = 'analytics' | 'products' | 'flash-sale' | 'payment-keys' | 'bundles' | 'vouchers' | 'banners' | 'orders' | 'settings';

export default function AdminPage() {
  const { user, loading: authLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [activeSection, setActiveSection] = useState<AdminSection>('analytics');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

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
  const [selectedFsProduct, setSelectedFsProduct] = useState<any>(null);
  const [isKeyDetailsOpen, setIsKeyDetailsOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState<any>(null);

  // Settings State
  const [shopName, setShopName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Queries
  const productsQuery = useMemoFirebase(() => db ? query(collection(db, 'products'), orderBy('name', 'asc')) : null, [db]);
  const ordersQuery = useMemoFirebase(() => db ? query(collection(db, 'orders'), orderBy('createdAt', 'desc')) : null, [db]);
  const bannersQuery = useMemoFirebase(() => db ? query(collection(db, 'banners'), orderBy('order', 'asc')) : null, [db]);
  const vouchersQuery = useMemoFirebase(() => db ? query(collection(db, 'vouchers'), orderBy('code', 'asc')) : null, [db]);
  const bundlesQuery = useMemoFirebase(() => db ? query(collection(db, 'bundles'), orderBy('createdAt', 'desc')) : null, [db]);
  const keysQuery = useMemoFirebase(() => db ? query(collection(db, 'payment_keys'), orderBy('createdAt', 'desc')) : null, [db]);
  const settingsRef = useMemoFirebase(() => db ? doc(db, 'settings', 'shop') : null, [db]);

  const { data: products } = useCollection(productsQuery);
  const { data: orders } = useCollection(ordersQuery);
  const { data: banners, loading: bannersLoading } = useCollection(bannersQuery);
  const { data: vouchers, loading: vouchersLoading } = useCollection(vouchersQuery);
  const { data: bundles, loading: bundlesLoading } = useCollection(bundlesQuery);
  const { data: paymentKeys, loading: keysLoading } = useCollection(keysQuery);
  const { data: settings } = useDoc<any>(settingsRef);

  const prevOrdersCount = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Filter products that are currently in flash sale
  const activeFlashSales = useMemo(() => {
    if (!products) return [];
    return products.filter(p => p.flashSaleEnd && new Date(p.flashSaleEnd).getTime() > Date.now());
  }, [products]);

  // Register Push Subscription when admin logs in
  useEffect(() => {
    if (user && user.email === ADMIN_EMAIL && db) {
      const setupPush = async () => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
        
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          let subscription = await registration.pushManager.getSubscription();
          
          if (!subscription) {
            const key = await getVapidPublicKey();
            subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: key
            });
          }

          if (subscription) {
            const pushConfigRef = doc(db, 'settings', 'push_config');
            await setDoc(pushConfigRef, {
              adminSubscriptions: arrayUnion(JSON.parse(JSON.stringify(subscription)))
            }, { merge: true });
          }
        } catch (error) {
          console.error("Gagal mendaftarkan push notification:", error);
        }
      };

      setupPush();
      
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission !== 'granted') {
          Notification.requestPermission();
        }
      }
    }
  }, [user, db]);

  useEffect(() => {
    if (orders && orders.length > prevOrdersCount.current) {
      if (prevOrdersCount.current !== 0) {
        const newOrder = orders[0];
        if (newOrder.status === 'completed') {
          toast({ 
            title: "🔔 Pesanan Baru!", 
            description: `${newOrder.customerName} baru saja membeli template.` 
          });
          
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setAuthError(null);
    if (loginEmail.trim() !== ADMIN_EMAIL) {
      setAuthError(`Akses ditolak.`);
      setIsLoggingIn(false);
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      toast({ title: 'Logged in', description: 'Welcome Admin.' });
    } catch (error: any) {
      setAuthError('Login gagal.');
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
    if (!db) return;
    setIsSavingSettings(true);
    const docRef = doc(db, 'settings', 'shop');
    setDoc(docRef, { shopName, whatsapp, supportEmail, updatedAt: serverTimestamp() }, { merge: true })
      .then(() => toast({ title: 'Tersimpan' }))
      .finally(() => setIsSavingSettings(false));
  };

  const handleResetAllData = async () => {
    if (!db || !window.confirm("PERINGATAN KERAS: Semua data (Produk, Payment Key, Saldo, Pesanan, Promo) akan dihapus secara permanen. Akun Admin tetap aman. Lanjutkan?")) return;
    
    setIsResetting(true);
    try {
      const collectionsToClear = [
        'products', 
        'payment_keys', 
        'wallet_transactions', 
        'banners', 
        'vouchers', 
        'orders', 
        'bundles'
      ];

      for (const colName of collectionsToClear) {
        const snap = await getDocs(collection(db, colName));
        const batch = writeBatch(db);
        snap.docs.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
      }

      toast({ title: "Reset Berhasil", description: "Semua data operasional telah dibersihkan." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Reset Gagal", description: error.message });
    } finally {
      setIsResetting(false);
    }
  };

  const handleDelete = (id: string, collectionName: string) => {
    if (!db || !window.confirm(`Hapus item ini?`)) return;
    deleteDoc(doc(db, collectionName, id));
  };

  const handleDisableFlashSale = async (productId: string) => {
    if (!db) return;
    const product = products?.find(p => p.id === productId);
    if (!product) return;

    try {
      await updateDoc(doc(db, 'products', productId), {
        price: product.originalPrice || product.price,
        originalPrice: null,
        flashSaleEnd: null,
        flashSaleStock: null,
        flashSaleInitialStock: null,
        updatedAt: serverTimestamp()
      });
      toast({ title: "Flash Sale Dinonaktifkan" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal", description: err.message });
    }
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  if (!user || user.email !== ADMIN_EMAIL) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl rounded-2xl">
          <CardHeader className="bg-primary text-white p-10 text-center rounded-t-2xl">
            <Lock size={40} className="mx-auto mb-4" />
            <CardTitle className="text-3xl font-bold">Admin Panel</CardTitle>
          </CardHeader>
          <CardContent className="p-10">
            <form onSubmit={handleLogin} className="space-y-6">
              <Input placeholder="Email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required />
              <Input type="password" placeholder="Password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required />
              <Button type="submit" className="w-full h-12" disabled={isLoggingIn}>Login</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const navItems = [
    { id: 'analytics', label: 'Dashboard', icon: BarChart3 },
    { id: 'products', label: 'Produk', icon: Package },
    { id: 'flash-sale', label: 'Flash Sale', icon: Zap },
    { id: 'payment-keys', label: 'Payment Keys', icon: Wallet },
    { id: 'bundles', label: 'Bundling', icon: Layers },
    { id: 'vouchers', label: 'Voucher', icon: Ticket },
    { id: 'banners', label: 'Banner', icon: ImageIcon },
    { id: 'orders', label: 'Pesanan', icon: ShoppingCart },
    { id: 'settings', label: 'Pengaturan', icon: SettingsIcon },
  ];

  return (
    <div className="relative min-h-screen bg-[#F8F9FA] flex flex-col">
      <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" preload="auto" />
      
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[60] transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={cn(
        "fixed inset-y-0 left-0 bg-white border-r border-slate-200 w-72 flex flex-col z-[70] transition-transform duration-300 ease-in-out shadow-2xl",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-8 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white"><LayoutDashboard size={20} /></div>
            <h1 className="text-lg font-bold">Mono Admin</h1>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)} className="lg:hidden">
            <X size={20} />
          </Button>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => (
            <button 
              key={item.id} 
              onClick={() => {
                setActiveSection(item.id as AdminSection);
                setIsSidebarOpen(false);
              }} 
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all", 
                activeSection === item.id ? "bg-primary text-white" : "text-slate-500 hover:bg-slate-50"
              )}
            >
              <item.icon size={18} />
              <span className="text-sm font-bold">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t">
          <Button variant="ghost" onClick={handleLogout} className="w-full text-destructive font-bold gap-3">
            <LogOut size={18} /> Logout
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b bg-white px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)} className="rounded-xl hover:bg-slate-100">
              <Menu size={20} />
            </Button>
            <div className="text-xs font-black uppercase tracking-widest text-primary hidden sm:block">
              {activeSection.replace('-', ' ')}
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="hidden md:flex flex-col items-end">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Administrator</span>
                <span className="text-xs font-bold text-slate-900">{ADMIN_EMAIL}</span>
             </div>
             <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-primary font-bold">
                M
             </div>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-10 overflow-y-auto">
          <div className="max-w-6xl mx-auto space-y-8">
            {activeSection === 'analytics' && (
              <div className="space-y-8 animate-fadeIn">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                  <Card className="p-6 space-y-4 border-none shadow-sm rounded-2xl">
                    <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center"><TrendingUp size={24} /></div>
                    <div><p className="text-[10px] font-bold text-muted-foreground uppercase">Revenue</p><h3 className="text-2xl font-black">{formatRupiah(stats.revenue)}</h3></div>
                  </Card>
                  <Card className="p-6 space-y-4 border-none shadow-sm rounded-2xl">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center"><ShoppingCart size={24} /></div>
                    <div><p className="text-[10px] font-bold text-muted-foreground uppercase">Orders</p><h3 className="text-2xl font-black">{stats.count}</h3></div>
                  </Card>
                  <Card className="p-6 space-y-4 border-none shadow-sm rounded-2xl">
                    <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center"><Wallet size={24} /></div>
                    <div><p className="text-[10px] font-bold text-muted-foreground uppercase">Payment Keys</p><h3 className="text-2xl font-black">{paymentKeys?.length || 0}</h3></div>
                  </Card>
                  <Card className="p-6 space-y-4 border-none shadow-sm rounded-2xl">
                    <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center"><Package size={24} /></div>
                    <div><p className="text-[10px] font-bold text-muted-foreground uppercase">Active Products</p><h3 className="text-2xl font-black">{products?.length || 0}</h3></div>
                  </Card>
                </div>

                <Card className="p-8 border-none shadow-sm rounded-3xl">
                  <div className="flex items-center justify-between mb-8">
                    <CardTitle className="text-lg font-bold">Revenue 7 Days (IDR in K)</CardTitle>
                    <Badge variant="secondary" className="bg-primary/5 text-primary">Live Data</Badge>
                  </div>
                  <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={revenueData}>
                        <defs><linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/><stop offset="95%" stopColor="#2563eb" stopOpacity={0}/></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 700, fill: '#64748b'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 700, fill: '#64748b'}} />
                        <RechartsTooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}} />
                        <Area type="monotone" dataKey="revenue" stroke="#2563eb" fill="url(#colorRev)" strokeWidth={4} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>
            )}

            {activeSection === 'payment-keys' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Payment Keys</h2>
                </div>
                <Card className="rounded-[2.5rem] overflow-hidden border-none shadow-sm bg-white">
                  <Table>
                    <TableHeader className="bg-slate-50"><TableRow><TableHead>KEY / EMAIL</TableHead><TableHead>SALDO</TableHead><TableHead>STATUS 2SV</TableHead><TableHead className="text-right">AKSI</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {keysLoading ? <TableRow><TableCell colSpan={4} className="text-center h-40"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow> :
                        paymentKeys?.map((k: any) => (
                          <TableRow key={k.id}>
                            <TableCell>
                              <div className="font-black font-mono tracking-widest text-primary">{k.key}</div>
                              <div className="text-[10px] text-muted-foreground font-bold">{k.email}</div>
                            </TableCell>
                            <TableCell className="font-bold">{formatRupiah(k.balance)}</TableCell>
                            <TableCell>
                              <Badge variant={k.is2SVEnabled ? 'default' : 'outline'} className="rounded-lg text-[9px]">
                                {k.is2SVEnabled ? '2SV AKTIF' : 'NONAKTIF'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" className="rounded-xl mr-1 text-blue-600" onClick={() => { setSelectedKey(k); setIsKeyDetailsOpen(true); }}><Eye size={16} /></Button>
                              <Button variant="ghost" size="icon" className="text-destructive rounded-xl" onClick={() => handleDelete(k.id, 'payment_keys')}><Trash2 size={16} /></Button>
                            </TableCell>
                          </TableRow>
                        ))
                      }
                    </TableBody>
                  </Table>
                </Card>
              </div>
            )}

            {activeSection === 'products' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Produk</h2>
                  <Button onClick={() => setIsDialogOpen(true)} className="rounded-xl font-bold h-11 shadow-lg shadow-primary/20"><Plus size={20} className="mr-2" /> Tambah Produk</Button>
                </div>
                <Card className="rounded-[2.5rem] overflow-hidden border-none shadow-sm bg-white">
                  <Table>
                    <TableHeader className="bg-slate-50"><TableRow><TableHead>PRODUK</TableHead><TableHead>HARGA</TableHead><TableHead>STOK</TableHead><TableHead className="text-right">AKSI</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {products?.map(p => (
                        <TableRow key={p.id}>
                          <TableCell className="font-bold">{p.name}</TableCell>
                          <TableCell>{formatRupiah(p.price)}</TableCell>
                          <TableCell><Badge variant="outline" className="rounded-lg">{p.stock}</Badge></TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" className="rounded-xl mr-1" onClick={() => { setEditingProduct(p); setIsDialogOpen(true); }}><Pencil size={16} /></Button>
                            <Button variant="ghost" size="icon" className="text-destructive rounded-xl" onClick={() => handleDelete(p.id, 'products')}><Trash2 size={16} /></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              </div>
            )}

            {activeSection === 'flash-sale' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center"><Zap size={24} className="fill-red-600" /></div>
                    <h2 className="text-2xl font-bold">Manajemen Flash Sale</h2>
                  </div>
                  <Button onClick={() => { setSelectedFsProduct(null); setIsFlashSaleDialogOpen(true); }} className="rounded-xl font-bold h-11 bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200">
                    <Plus size={20} className="mr-2" /> Tambah Promo Kilat
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeFlashSales.length === 0 ? (
                    <Card className="col-span-full py-20 bg-white border-dashed border-2 border-slate-100 flex flex-col items-center justify-center text-center">
                      <Zap size={48} className="text-slate-100 mb-4" />
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Belum ada Flash Sale aktif</p>
                    </Card>
                  ) : (
                    activeFlashSales.map(fs => (
                      <Card key={fs.id} className="rounded-3xl border-none shadow-sm bg-white overflow-hidden group">
                        <div className="relative h-40 bg-slate-50">
                          <Image src={fs.image} alt="" fill className="object-cover" />
                          <div className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg">
                            ACTIVE
                          </div>
                        </div>
                        <div className="p-6 space-y-4">
                          <div>
                            <h3 className="font-bold text-base line-clamp-1">{fs.name}</h3>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase">{fs.category}</p>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="text-xs font-bold text-red-600">{formatRupiah(fs.price)}</div>
                            <div className="text-[10px] text-slate-400 line-through">{formatRupiah(fs.originalPrice)}</div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest text-slate-400">
                              <span>Progress Terjual</span>
                              <span>{fs.flashSaleInitialStock! - fs.flashSaleStock!} / {fs.flashSaleInitialStock}</span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-red-500 to-orange-500 transition-all duration-1000"
                                style={{ width: `${((fs.flashSaleInitialStock! - fs.flashSaleStock!) / fs.flashSaleInitialStock!) * 100}%` }}
                              />
                            </div>
                          </div>

                          <div className="pt-2 flex gap-2">
                            <Button variant="outline" size="sm" className="flex-1 rounded-xl font-bold text-xs" onClick={() => { setSelectedFsProduct(fs); setIsFlashSaleDialogOpen(true); }}>
                              <SettingsIcon size={14} className="mr-2" /> Atur
                            </Button>
                            <Button variant="ghost" size="sm" className="rounded-xl font-bold text-xs text-destructive hover:bg-red-50" onClick={() => handleDisableFlashSale(fs.id)}>
                              Berhenti
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeSection === 'banners' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Promo Banners</h2>
                  <Button onClick={() => setIsBannerDialogOpen(true)} className="rounded-xl font-bold h-11 shadow-lg shadow-primary/20"><Plus size={20} className="mr-2" /> Tambah Banner</Button>
                </div>
                <Card className="rounded-[2.5rem] overflow-hidden border-none shadow-sm bg-white">
                  <Table>
                    <TableHeader className="bg-slate-50"><TableRow><TableHead>GAMBAR</TableHead><TableHead>JUDUL</TableHead><TableHead>URUTAN</TableHead><TableHead className="text-right">AKSI</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {bannersLoading ? <TableRow><TableCell colSpan={4} className="text-center h-20"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow> :
                        banners?.map((b: any) => (
                          <TableRow key={b.id}>
                            <TableCell><div className="relative w-20 h-10 rounded-lg overflow-hidden border border-slate-100"><Image src={b.image} alt="" fill className="object-cover" /></div></TableCell>
                            <TableCell className="font-bold">{b.title || '-'}</TableCell>
                            <TableCell><Badge variant="outline">{b.order}</Badge></TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" className="rounded-xl mr-1" onClick={() => { setEditingBanner(b); setIsBannerDialogOpen(true); }}><Pencil size={16} /></Button>
                              <Button variant="ghost" size="icon" className="text-destructive rounded-xl" onClick={() => handleDelete(b.id, 'banners')}><Trash2 size={16} /></Button>
                            </TableCell>
                          </TableRow>
                        ))
                      }
                    </TableBody>
                  </Table>
                </Card>
              </div>
            )}

            {activeSection === 'vouchers' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Vouchers</h2>
                  <Button onClick={() => setIsVoucherDialogOpen(true)} className="rounded-xl font-bold h-11 shadow-lg shadow-primary/20"><Plus size={20} className="mr-2" /> Tambah Voucher</Button>
                </div>
                <Card className="rounded-[2.5rem] overflow-hidden border-none shadow-sm bg-white">
                  <Table>
                    <TableHeader className="bg-slate-50"><TableRow><TableHead>KODE</TableHead><TableHead>POTONGAN</TableHead><TableHead>EXPIRED</TableHead><TableHead>STATUS</TableHead><TableHead className="text-right">AKSI</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {vouchersLoading ? <TableRow><TableCell colSpan={5} className="text-center h-20"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow> :
                        vouchers?.map((v: any) => (
                          <TableRow key={v.id}>
                            <TableCell><code className="font-black text-primary bg-slate-50 px-2 py-1 rounded">{v.code}</code></TableCell>
                            <TableCell className="font-bold">{v.type === 'percentage' ? `${v.value}%` : formatRupiah(v.value)}</TableCell>
                            <TableCell className="text-xs font-medium text-slate-400">{v.expiryDate ? new Date(v.expiryDate).toLocaleDateString('id-ID') : 'Lifetime'}</TableCell>
                            <TableCell><Badge variant={v.isActive ? 'default' : 'secondary'} className="rounded-lg">{v.isActive ? 'AKTIF' : 'OFF'}</Badge></TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" className="rounded-xl mr-1" onClick={() => { setEditingVoucher(v); setIsVoucherDialogOpen(true); }}><Pencil size={16} /></Button>
                              <Button variant="ghost" size="icon" className="text-destructive rounded-xl" onClick={() => handleDelete(v.id, 'vouchers')}><Trash2 size={16} /></Button>
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
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Bundling Produk</h2>
                  <Button onClick={() => setIsBundleDialogOpen(true)} className="rounded-xl font-bold h-11 shadow-lg shadow-primary/20"><Plus size={20} className="mr-2" /> Tambah Bundle</Button>
                </div>
                <Card className="rounded-[2.5rem] overflow-hidden border-none shadow-sm bg-white">
                  <Table>
                    <TableHeader className="bg-slate-50"><TableRow><TableHead>NAMA BUNDLE</TableHead><TableHead>DISKON</TableHead><TableHead>PRODUK</TableHead><TableHead>STATUS</TableHead><TableHead className="text-right">AKSI</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {bundlesLoading ? <TableRow><TableCell colSpan={5} className="text-center h-20"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow> :
                        bundles?.map((b: any) => (
                          <TableRow key={b.id}>
                            <TableCell className="font-bold">{b.name}</TableCell>
                            <TableCell className="text-green-600 font-black">{b.discountPercentage}%</TableCell>
                            <TableCell><Badge variant="outline" className="rounded-lg">{b.productIds?.length || 0} Items</Badge></TableCell>
                            <TableCell><Badge variant={b.isActive ? 'default' : 'secondary'} className="rounded-lg">{b.isActive ? 'AKTIF' : 'OFF'}</Badge></TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" className="rounded-xl mr-1" onClick={() => { setEditingBundle(b); setIsBundleDialogOpen(true); }}><Pencil size={16} /></Button>
                              <Button variant="ghost" size="icon" className="text-destructive rounded-xl" onClick={() => handleDelete(b.id, 'bundles')}><Trash2 size={16} /></Button>
                            </TableCell>
                          </TableRow>
                        ))
                      }
                    </TableBody>
                  </Table>
                </Card>
              </div>
            )}
            
            {activeSection === 'orders' && (
              <div className="space-y-6 animate-fadeIn">
                <h2 className="text-2xl font-bold">Pesanan</h2>
                <Card className="rounded-[2.5rem] overflow-hidden border-none shadow-sm bg-white">
                  <Table>
                    <TableHeader className="bg-slate-50"><TableRow><TableHead>PELANGGAN</TableHead><TableHead>TOTAL</TableHead><TableHead>KEY</TableHead><TableHead>STATUS</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {orders?.map((o: any) => (
                        <TableRow key={o.id}>
                          <TableCell><div><div className="font-bold">{o.customerName}</div><div className="text-[10px] text-muted-foreground">{o.customerEmail}</div></div></TableCell>
                          <TableCell className="font-bold text-primary">{formatRupiah(o.totalAmount)}</TableCell>
                          <TableCell className="font-mono text-[10px] tracking-widest">{o.paymentKey || '-'}</TableCell>
                          <TableCell><Badge className={cn("rounded-lg", o.status === 'completed' ? 'bg-green-500 hover:bg-green-600' : 'bg-orange-500 hover:bg-orange-600')}>{o.status.toUpperCase()}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              </div>
            )}

            {activeSection === 'settings' && (
              <div className="space-y-6 animate-fadeIn max-w-2xl">
                <h2 className="text-2xl font-bold">Pengaturan Toko</h2>
                <Card className="rounded-[2.5rem] border-none shadow-sm bg-white p-8">
                  <form onSubmit={handleSaveSettings} className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-400 uppercase">Nama Toko</Label>
                      <Input value={shopName} onChange={e => setShopName(e.target.value)} required className="h-12 rounded-xl bg-slate-50 border-none" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-400 uppercase">WhatsApp (Contoh: 62888...)</Label>
                      <Input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} required className="h-12 rounded-xl bg-slate-50 border-none" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-400 uppercase">Email Dukungan</Label>
                      <Input type="email" value={supportEmail} onChange={e => setSupportEmail(e.target.value)} required className="h-12 rounded-xl bg-slate-50 border-none" />
                    </div>
                    
                    <div className="pt-6 border-t border-slate-50">
                      <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Bell size={16} className="text-primary" /> Notifikasi Transaksi
                      </h4>
                      <p className="text-[10px] text-muted-foreground mb-4 uppercase tracking-widest leading-relaxed">
                        HP Admin Anda telah didaftarkan untuk menerima Push Notifications. Pastikan browser mengizinkan notifikasi untuk MonoStore.
                      </p>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                          if (audioRef.current) audioRef.current.play();
                          toast({ title: "Sound Test", description: "Jika Anda mendengar suara, notifikasi suara aktif." });
                        }}
                        className="rounded-xl h-11 px-6 font-bold gap-2"
                      >
                        <Volume2 size={18} /> Test Suara Notifikasi
                      </Button>
                    </div>

                    <Button type="submit" disabled={isSavingSettings} className="w-full h-12 rounded-xl font-bold mt-4">
                      {isSavingSettings ? <Loader2 className="animate-spin mr-2" /> : 'Simpan Perubahan'}
                    </Button>
                  </form>

                  {/* Danger Zone */}
                  <div className="pt-10 border-t border-red-100 mt-10">
                    <div className="flex items-center gap-2 mb-4 text-destructive">
                      <AlertTriangle size={20} />
                      <h4 className="text-sm font-black uppercase tracking-widest">Danger Zone</h4>
                    </div>
                    <Card className="border-2 border-red-50 bg-red-50/30 p-6 rounded-[2rem]">
                      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="text-center md:text-left">
                          <p className="text-sm font-bold text-red-900">Reset Seluruh Data Toko</p>
                          <p className="text-[10px] text-red-600 font-medium max-w-sm uppercase tracking-tight mt-1 leading-relaxed">
                            Menghapus secara permanen semua produk, payment key, saldo user, transaksi, dan pesanan. Akun Admin tetap aman.
                          </p>
                        </div>
                        <Button 
                          type="button"
                          variant="destructive" 
                          onClick={handleResetAllData}
                          disabled={isResetting}
                          className="rounded-xl h-12 px-8 font-bold shadow-lg shadow-destructive/20"
                        >
                          {isResetting ? <Loader2 className="animate-spin mr-2" /> : <Trash2 size={18} className="mr-2" />}
                          Hapus Semua Data
                        </Button>
                      </div>
                    </Card>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>

      <ProductDialog isOpen={isDialogOpen} onClose={() => { setIsDialogOpen(false); setEditingProduct(null); }} product={editingProduct} />
      <BannerDialog isOpen={isBannerDialogOpen} onClose={() => { setIsBannerDialogOpen(false); setEditingBanner(null); }} banner={editingBanner} />
      <VoucherDialog isOpen={isVoucherDialogOpen} onClose={() => { setIsVoucherDialogOpen(false); setEditingVoucher(null); }} voucher={editingVoucher} />
      <BundleDialog isOpen={isBundleDialogOpen} onClose={() => { setIsBundleDialogOpen(false); setEditingBundle(null); }} bundle={editingBundle} products={products || []} />
      <FlashSaleDialog isOpen={isFlashSaleDialogOpen} onClose={() => { setIsFlashSaleDialogOpen(false); setSelectedFsProduct(null); }} product={selectedFsProduct} allProducts={products || []} />
      <PaymentKeyDetailsDialog isOpen={isKeyDetailsOpen} onClose={() => { setIsKeyDetailsOpen(false); setSelectedKey(null); }} paymentKey={selectedKey} />
    </div>
  );
}
