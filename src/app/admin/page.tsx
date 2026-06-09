'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast, Toaster as SonnerToaster } from 'sonner'
import {
  ChefHat,
  LogIn,
  Plus,
  Pencil,
  Trash2,
  ArrowUp,
  ArrowDown,
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  Settings as SettingsIcon,
  Tag,
  Save,
  Loader2,
} from 'lucide-react'

interface MenuCategory {
  id: string
  name: string
  slug: string
  icon: string
  order: number
  items: MenuItem[]
  createdAt: string
  updatedAt: string
}

interface MenuItem {
  id: string
  name: string
  price: number
  badge: string | null
  variantTag: string | null
  description: string | null
  categoryId: string
  order: number
  isAvailable: boolean
  createdAt: string
  updatedAt: string
}

interface SettingItem {
  id: string
  key: string
  value: string
  label: string
}

interface Coupon {
  id: string
  code: string
  discount: number
  type: 'FLAT' | 'PERCENT'
  minOrder: number
  maxUses: number
  usedCount: number
  isActive: boolean
  expiresAt: string | null
}

type ActiveTab = 'menu' | 'settings' | 'coupons'

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<ActiveTab>('menu')

  // Category form state
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null)
  const [catName, setCatName] = useState('')
  const [catSlug, setCatSlug] = useState('')
  const [catIcon, setCatIcon] = useState('')
  const [catOrder, setCatOrder] = useState(0)

  // Item form state
  const [itemDialogOpen, setItemDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [itemName, setItemName] = useState('')
  const [itemPrice, setItemPrice] = useState(0)
  const [itemBadge, setItemBadge] = useState('')
  const [itemVariantTag, setItemVariantTag] = useState('')
  const [itemDescription, setItemDescription] = useState('')
  const [itemCategoryId, setItemCategoryId] = useState('')
  const [itemOrder, setItemOrder] = useState(0)
  const [itemIsAvailable, setItemIsAvailable] = useState(true)

  // Delete confirmation
  const [deleteType, setDeleteType] = useState<'category' | 'item' | null>(null)
  const [deleteId, setDeleteId] = useState('')

  // Settings state
  const [settings, setSettings] = useState<SettingItem[]>([])
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [packagingCharge, setPackagingCharge] = useState('')
  const [deliveryCharge, setDeliveryCharge] = useState('')
  const [gstPercentage, setGstPercentage] = useState('')

  // Coupons state
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [couponsLoading, setCouponsLoading] = useState(false)
  const [couponDialogOpen, setCouponDialogOpen] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
  const [couponCode, setCouponCode] = useState('')
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [couponType, setCouponType] = useState<'FLAT' | 'PERCENT'>('FLAT')
  const [couponMinOrder, setCouponMinOrder] = useState(0)
  const [couponMaxUses, setCouponMaxUses] = useState(0)
  const [couponIsActive, setCouponIsActive] = useState(true)
  const [couponExpiresAt, setCouponExpiresAt] = useState('')
  const [couponSaving, setCouponSaving] = useState(false)
  const [deleteCouponId, setDeleteCouponId] = useState<string | null>(null)

  const authHeaders = useCallback(() => ({
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }), [token])

  const fetchMenu = useCallback(async () => {
    try {
      const res = await fetch('/api/menu')
      const data = await res.json()
      setCategories(data)
      if (data.length > 0 && !selectedCategoryId) {
        setSelectedCategoryId(data[0].id)
      }
    } catch (error) {
      console.error('Failed to fetch menu:', error)
      toast.error('Failed to load menu data')
    }
  }, [selectedCategoryId])

  // Fetch settings
  const fetchSettings = useCallback(async () => {
    setSettingsLoading(true)
    try {
      const res = await fetch('/api/settings')
      const data = await res.json()
      if (data.success) {
        setSettings(data.settings)
        // Populate individual fields
        const pack = data.settings.find((s: SettingItem) => s.key === 'packaging_charge')
        const del = data.settings.find((s: SettingItem) => s.key === 'delivery_charge')
        const gst = data.settings.find((s: SettingItem) => s.key === 'gst_percent')
        setPackagingCharge(pack?.value || '0')
        setDeliveryCharge(del?.value || '0')
        setGstPercentage(gst?.value || '0')
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
      toast.error('Failed to load settings')
    } finally {
      setSettingsLoading(false)
    }
  }, [])

  // Save settings
  const saveSettings = async () => {
    setSettingsSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({
          settings: [
            { key: 'packaging_charge', value: packagingCharge, label: 'Packaging Charge' },
            { key: 'delivery_charge', value: deliveryCharge, label: 'Delivery Charge' },
            { key: 'gst_percent', value: gstPercentage, label: 'GST Percentage' },
          ],
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Settings saved successfully')
        fetchSettings()
      } else {
        toast.error(data.error || 'Failed to save settings')
      }
    } catch {
      toast.error('Failed to save settings')
    } finally {
      setSettingsSaving(false)
    }
  }

  // Fetch coupons
  const fetchCoupons = useCallback(async () => {
    setCouponsLoading(true)
    try {
      const res = await fetch('/api/coupons', { headers: authHeaders() })
      const data = await res.json()
      if (data.success) {
        setCoupons(data.coupons)
      }
    } catch (error) {
      console.error('Failed to fetch coupons:', error)
      toast.error('Failed to load coupons')
    } finally {
      setCouponsLoading(false)
    }
  }, [authHeaders])

  // Open coupon dialog
  const openCouponDialog = (coupon?: Coupon) => {
    if (coupon) {
      setEditingCoupon(coupon)
      setCouponCode(coupon.code)
      setCouponDiscount(coupon.discount)
      setCouponType(coupon.type)
      setCouponMinOrder(coupon.minOrder)
      setCouponMaxUses(coupon.maxUses)
      setCouponIsActive(coupon.isActive)
      setCouponExpiresAt(coupon.expiresAt ? coupon.expiresAt.split('T')[0] : '')
    } else {
      setEditingCoupon(null)
      setCouponCode('')
      setCouponDiscount(0)
      setCouponType('FLAT')
      setCouponMinOrder(0)
      setCouponMaxUses(0)
      setCouponIsActive(true)
      setCouponExpiresAt('')
    }
    setCouponDialogOpen(true)
  }

  // Save coupon
  const saveCoupon = async () => {
    if (!couponCode || couponDiscount <= 0) {
      toast.error('Code and discount are required')
      return
    }
    if (couponType === 'PERCENT' && couponDiscount > 100) {
      toast.error('Percentage discount cannot exceed 100%')
      return
    }

    setCouponSaving(true)
    try {
      const body = {
        code: couponCode.toUpperCase(),
        discount: couponDiscount,
        type: couponType,
        minOrder: couponMinOrder,
        maxUses: couponMaxUses,
        isActive: couponIsActive,
        expiresAt: couponExpiresAt || null,
      }

      if (editingCoupon) {
        const res = await fetch(`/api/coupons/${editingCoupon.id}`, {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify(body),
        })
        const data = await res.json()
        if (data.success) {
          toast.success('Coupon updated')
        } else {
          toast.error(data.error || 'Failed to update coupon')
        }
      } else {
        const res = await fetch('/api/coupons', {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify(body),
        })
        const data = await res.json()
        if (data.success) {
          toast.success('Coupon created')
        } else {
          toast.error(data.error || 'Failed to create coupon')
        }
      }
      setCouponDialogOpen(false)
      fetchCoupons()
    } catch {
      toast.error('Failed to save coupon')
    } finally {
      setCouponSaving(false)
    }
  }

  // Delete coupon
  const deleteCoupon = async (id: string) => {
    try {
      await fetch(`/api/coupons/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      toast.success('Coupon deleted')
      fetchCoupons()
    } catch {
      toast.error('Failed to delete coupon')
    }
    setDeleteCouponId(null)
  }

  // Toggle coupon active status
  const toggleCouponActive = async (coupon: Coupon) => {
    try {
      const res = await fetch(`/api/coupons/${coupon.id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({
          code: coupon.code,
          discount: coupon.discount,
          type: coupon.type,
          minOrder: coupon.minOrder,
          maxUses: coupon.maxUses,
          isActive: !coupon.isActive,
          expiresAt: coupon.expiresAt,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(coupon.isActive ? 'Coupon deactivated' : 'Coupon activated')
        fetchCoupons()
      } else {
        toast.error(data.error || 'Failed to toggle coupon')
      }
    } catch {
      toast.error('Failed to toggle coupon')
    }
  }

  // Check auth on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('admin-token')
    if (savedToken) {
      fetch('/api/admin/verify', {
        headers: { Authorization: `Bearer ${savedToken}` },
      })
        .then(res => res.json())
        .then(data => {
          if (data.valid) {
            setToken(savedToken)
          } else {
            localStorage.removeItem('admin-token')
          }
        })
        .catch(() => localStorage.removeItem('admin-token'))
        .finally(() => setIsLoading(false))
    } else {
      Promise.resolve().then(() => setIsLoading(false))
    }
  }, [])

  // Fetch menu when token changes (separate effect for data fetching)
  useEffect(() => {
    if (!token) return
    let cancelled = false
    fetch('/api/menu')
      .then(res => res.json())
      .then(data => {
        if (cancelled) return
        setCategories(data)
        if (data.length > 0) {
          setSelectedCategoryId(prev => prev || data[0].id)
        }
      })
      .catch(error => {
        if (cancelled) return
        console.error('Failed to fetch menu:', error)
        toast.error('Failed to load menu data')
      })
    return () => { cancelled = true }
  }, [token])

  // Fetch settings when Settings tab is active
  useEffect(() => {
    if (!token || activeTab !== 'settings') return
    fetchSettings()
  }, [token, activeTab, fetchSettings])

  // Fetch coupons when Coupons tab is active
  useEffect(() => {
    if (!token || activeTab !== 'coupons') return
    fetchCoupons()
  }, [token, activeTab, fetchCoupons])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      const data = await res.json()

      if (res.ok) {
        setToken(data.token)
        localStorage.setItem('admin-token', data.token)
        toast.success('Login successful!')
      } else {
        setLoginError(data.error || 'Login failed')
      }
    } catch {
      setLoginError('Network error')
    }
  }

  const handleLogout = () => {
    setToken(null)
    localStorage.removeItem('admin-token')
    setCategories([])
    setSelectedCategoryId(null)
    setActiveTab('menu')
    toast.success('Logged out')
  }

  // Category CRUD
  const openCategoryDialog = (category?: MenuCategory) => {
    if (category) {
      setEditingCategory(category)
      setCatName(category.name)
      setCatSlug(category.slug)
      setCatIcon(category.icon)
      setCatOrder(category.order)
    } else {
      setEditingCategory(null)
      setCatName('')
      setCatSlug('')
      setCatIcon('🍽️')
      setCatOrder(categories.length + 1)
    }
    setCategoryDialogOpen(true)
  }

  const saveCategory = async () => {
    if (!catName || !catSlug || !catIcon) {
      toast.error('All fields are required')
      return
    }

    try {
      if (editingCategory) {
        await fetch(`/api/menu/categories/${editingCategory.id}`, {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify({ name: catName, slug: catSlug, icon: catIcon, order: catOrder }),
        })
        toast.success('Category updated')
      } else {
        await fetch('/api/menu/categories', {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ name: catName, slug: catSlug, icon: catIcon, order: catOrder }),
        })
        toast.success('Category created')
      }
      setCategoryDialogOpen(false)
      fetchMenu()
    } catch {
      toast.error('Failed to save category')
    }
  }

  const deleteCategory = async (id: string) => {
    try {
      await fetch(`/api/menu/categories/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      toast.success('Category deleted')
      if (selectedCategoryId === id) {
        setSelectedCategoryId(categories[0]?.id || null)
      }
      fetchMenu()
    } catch {
      toast.error('Failed to delete category')
    }
  }

  const moveCategory = async (id: string, direction: 'up' | 'down') => {
    const catIndex = categories.findIndex(c => c.id === id)
    if (catIndex < 0) return

    const swapIndex = direction === 'up' ? catIndex - 1 : catIndex + 1
    if (swapIndex < 0 || swapIndex >= categories.length) return

    const cat1 = categories[catIndex]
    const cat2 = categories[swapIndex]

    try {
      await Promise.all([
        fetch(`/api/menu/categories/${cat1.id}`, {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify({ order: cat2.order }),
        }),
        fetch(`/api/menu/categories/${cat2.id}`, {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify({ order: cat1.order }),
        }),
      ])
      fetchMenu()
    } catch {
      toast.error('Failed to reorder categories')
    }
  }

  // Item CRUD
  const openItemDialog = (item?: MenuItem, categoryId?: string) => {
    if (item) {
      setEditingItem(item)
      setItemName(item.name)
      setItemPrice(item.price)
      setItemBadge(item.badge || '')
      setItemVariantTag(item.variantTag || '')
      setItemDescription(item.description || '')
      setItemCategoryId(item.categoryId)
      setItemOrder(item.order)
      setItemIsAvailable(item.isAvailable)
    } else {
      const catId = categoryId || selectedCategoryId || ''
      const cat = categories.find(c => c.id === catId)
      setEditingItem(null)
      setItemName('')
      setItemPrice(0)
      setItemBadge('')
      setItemVariantTag('')
      setItemDescription('')
      setItemCategoryId(catId)
      setItemOrder(cat ? cat.items.length + 1 : 1)
      setItemIsAvailable(true)
    }
    setItemDialogOpen(true)
  }

  const saveItem = async () => {
    if (!itemName || itemPrice <= 0 || !itemCategoryId) {
      toast.error('Name, price, and category are required')
      return
    }

    try {
      if (editingItem) {
        await fetch(`/api/menu/items/${editingItem.id}`, {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify({
            name: itemName,
            price: itemPrice,
            badge: itemBadge,
            variantTag: itemVariantTag,
            description: itemDescription,
            categoryId: itemCategoryId,
            order: itemOrder,
            isAvailable: itemIsAvailable,
          }),
        })
        toast.success('Item updated')
      } else {
        await fetch('/api/menu/items', {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({
            name: itemName,
            price: itemPrice,
            badge: itemBadge,
            variantTag: itemVariantTag,
            description: itemDescription,
            categoryId: itemCategoryId,
            order: itemOrder,
            isAvailable: itemIsAvailable,
          }),
        })
        toast.success('Item created')
      }
      setItemDialogOpen(false)
      fetchMenu()
    } catch {
      toast.error('Failed to save item')
    }
  }

  const deleteItem = async (id: string) => {
    try {
      await fetch(`/api/menu/items/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      toast.success('Item deleted')
      fetchMenu()
    } catch {
      toast.error('Failed to delete item')
    }
  }

  const toggleItemAvailability = async (item: MenuItem) => {
    try {
      await fetch(`/api/menu/items/${item.id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ isAvailable: !item.isAvailable }),
      })
      fetchMenu()
    } catch {
      toast.error('Failed to toggle availability')
    }
  }

  const moveItem = async (item: MenuItem, direction: 'up' | 'down') => {
    const cat = categories.find(c => c.id === item.categoryId)
    if (!cat) return

    const items = cat.items
    const itemIndex = items.findIndex(i => i.id === item.id)
    if (itemIndex < 0) return

    const swapIndex = direction === 'up' ? itemIndex - 1 : itemIndex + 1
    if (swapIndex < 0 || swapIndex >= items.length) return

    const item1 = items[itemIndex]
    const item2 = items[swapIndex]

    try {
      await Promise.all([
        fetch(`/api/menu/items/${item1.id}`, {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify({ order: item2.order }),
        }),
        fetch(`/api/menu/items/${item2.id}`, {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify({ order: item1.order }),
        }),
      ])
      fetchMenu()
    } catch {
      toast.error('Failed to reorder items')
    }
  }

  const selectedCategory = categories.find(c => c.id === selectedCategoryId)

  // Loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-green-50">
        <div className="flex items-center gap-3">
          <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full" />
          <span className="text-lg text-gray-600">Loading...</span>
        </div>
      </div>
    )
  }

  // Login screen
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-green-50 px-4">
        <Card className="w-full max-w-md shadow-2xl border-0">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-orange-500 to-green-600 rounded-full flex items-center justify-center mb-4">
              <ChefHat className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-green-600 bg-clip-text text-transparent">
              Bawarchi Admin
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1">The Indian Cuisine Restaurant, Diu</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <LogIn className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
              {loginError && (
                <div className="text-red-500 text-sm text-center bg-red-50 py-2 px-3 rounded-md">
                  {loginError}
                </div>
              )}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-500 to-green-600 hover:from-orange-600 hover:to-green-700 text-white font-semibold"
              >
                Sign In
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Dashboard
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-green-600 rounded-lg flex items-center justify-center">
                  <ChefHat className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-gray-900 text-sm">Bawarchi Admin</h1>
                  <p className="text-xs text-gray-500">Menu Management</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Categories list */}
          <ScrollArea className="flex-1">
            <div className="p-3">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Categories</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                  onClick={() => openCategoryDialog()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-1">
                {categories.map((cat, index) => (
                  <div
                    key={cat.id}
                    className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${
                      selectedCategoryId === cat.id && activeTab === 'menu'
                        ? 'bg-gradient-to-r from-orange-500 to-green-600 text-white shadow-md'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                    onClick={() => {
                      setSelectedCategoryId(cat.id)
                      setActiveTab('menu')
                      setSidebarOpen(false)
                    }}
                  >
                    <span className="text-lg flex-shrink-0">{cat.icon}</span>
                    <span className="text-sm font-medium flex-1 truncate">{cat.name}</span>
                    <span className={`text-xs ${selectedCategoryId === cat.id && activeTab === 'menu' ? 'text-white/70' : 'text-gray-400'}`}>
                      {cat.items.length}
                    </span>
                    <div className={`flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ${
                      selectedCategoryId === cat.id && activeTab === 'menu' ? 'text-white/80' : 'text-gray-400'
                    }`}>
                      <button
                        className="p-0.5 hover:bg-black/10 rounded"
                        onClick={e => { e.stopPropagation(); moveCategory(cat.id, 'up') }}
                        disabled={index === 0}
                      >
                        <ArrowUp className="h-3 w-3" />
                      </button>
                      <button
                        className="p-0.5 hover:bg-black/10 rounded"
                        onClick={e => { e.stopPropagation(); moveCategory(cat.id, 'down') }}
                        disabled={index === categories.length - 1}
                      >
                        <ArrowDown className="h-3 w-3" />
                      </button>
                      <button
                        className="p-0.5 hover:bg-black/10 rounded"
                        onClick={e => { e.stopPropagation(); openCategoryDialog(cat) }}
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            className="p-0.5 hover:bg-black/10 rounded"
                            onClick={e => e.stopPropagation()}
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete &ldquo;{cat.name}&rdquo;?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the category and all {cat.items.length} item(s) in it. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-red-600 hover:bg-red-700"
                              onClick={() => deleteCategory(cat.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>

              {/* Settings & Coupons navigation */}
              <Separator className="my-4" />
              <div className="space-y-1">
                <div
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${
                    activeTab === 'settings'
                      ? 'bg-gradient-to-r from-orange-500 to-green-600 text-white shadow-md'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                  onClick={() => {
                    setActiveTab('settings')
                    setSidebarOpen(false)
                  }}
                >
                  <SettingsIcon className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm font-medium">Settings</span>
                </div>
                <div
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${
                    activeTab === 'coupons'
                      ? 'bg-gradient-to-r from-orange-500 to-green-600 text-white shadow-md'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                  onClick={() => {
                    setActiveTab('coupons')
                    setSidebarOpen(false)
                  }}
                >
                  <Tag className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm font-medium">Coupons</span>
                </div>
              </div>
            </div>
          </ScrollArea>

          {/* Sidebar footer */}
          <div className="p-3 border-t border-gray-200">
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-500 hover:text-red-600"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        {activeTab === 'menu' && (
          <>
            {/* Top bar */}
            <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden"
                    onClick={() => setSidebarOpen(true)}
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                  <div>
                    <div className="flex items-center gap-2">
                      <LayoutDashboard className="h-4 w-4 text-gray-400" />
                      <h2 className="font-semibold text-gray-900">
                        {selectedCategory ? `${selectedCategory.icon} ${selectedCategory.name}` : 'Select a Category'}
                      </h2>
                    </div>
                    {selectedCategory && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {selectedCategory.items.length} item{selectedCategory.items.length !== 1 ? 's' : ''} • Slug: {selectedCategory.slug}
                      </p>
                    )}
                  </div>
                </div>
                {selectedCategory && (
                  <Button
                    onClick={() => openItemDialog(undefined, selectedCategoryId!)}
                    className="bg-gradient-to-r from-orange-500 to-green-600 hover:from-orange-600 hover:to-green-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                )}
              </div>
            </header>

            {/* Content area */}
            <div className="p-4 sm:p-6">
              {!selectedCategory ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <ChefHat className="h-16 w-16 mb-4" />
                  <p className="text-lg">Select a category from the sidebar</p>
                </div>
              ) : selectedCategory.items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <div className="text-5xl mb-4">{selectedCategory.icon}</div>
                  <p className="text-lg mb-2">No items in this category</p>
                  <Button
                    onClick={() => openItemDialog(undefined, selectedCategoryId!)}
                    variant="outline"
                    className="border-orange-300 text-orange-600 hover:bg-orange-50"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Item
                  </Button>
                </div>
              ) : (
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50/80">
                          <TableHead className="w-10">Order</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead className="w-24">Price</TableHead>
                          <TableHead className="w-28">Badge</TableHead>
                          <TableHead className="w-32">Variant</TableHead>
                          <TableHead className="w-28">Available</TableHead>
                          <TableHead className="w-28 text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedCategory.items.map((item, index) => (
                          <TableRow key={item.id} className={!item.isAvailable ? 'opacity-50' : ''}>
                            <TableCell className="font-mono text-xs text-gray-400">{item.order}</TableCell>
                            <TableCell>
                              <div>
                                <span className={`font-medium ${!item.isAvailable ? 'line-through text-gray-400' : ''}`}>
                                  {item.name}
                                </span>
                                {item.description && (
                                  <p className="text-xs text-gray-500 mt-0.5 max-w-xs truncate">{item.description}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="font-semibold text-green-700">₹{item.price}</TableCell>
                            <TableCell>
                              {item.badge ? (
                                <Badge
                                  className={`text-xs ${
                                    item.badge === 'best-seller'
                                      ? 'bg-orange-100 text-orange-700 border-orange-200'
                                      : item.badge === 'signature'
                                      ? 'bg-purple-100 text-purple-700 border-purple-200'
                                      : item.badge === 'must-try'
                                      ? 'bg-green-100 text-green-700 border-green-200'
                                      : 'bg-gray-100 text-gray-700'
                                  }`}
                                  variant="outline"
                                >
                                  {item.badge}
                                </Badge>
                              ) : (
                                <span className="text-gray-300 text-xs">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-xs text-gray-500">
                              {item.variantTag || <span className="text-gray-300">—</span>}
                            </TableCell>
                            <TableCell>
                              <Switch
                                checked={item.isAvailable}
                                onCheckedChange={() => toggleItemAvailability(item)}
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => moveItem(item, 'up')}
                                  disabled={index === 0}
                                >
                                  <ArrowUp className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => moveItem(item, 'down')}
                                  disabled={index === selectedCategory.items.length - 1}
                                >
                                  <ArrowDown className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-orange-600 hover:text-orange-700"
                                  onClick={() => openItemDialog(item)}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600">
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete &ldquo;{item.name}&rdquo;?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This will permanently remove this item from the menu. This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        className="bg-red-600 hover:bg-red-700"
                                        onClick={() => deleteItem(item.id)}
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        )}

        {activeTab === 'settings' && (
          <>
            {/* Top bar */}
            <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden"
                    onClick={() => setSidebarOpen(true)}
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                  <div>
                    <div className="flex items-center gap-2">
                      <SettingsIcon className="h-4 w-4 text-gray-400" />
                      <h2 className="font-semibold text-gray-900">Restaurant Settings</h2>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">Manage charges and tax configuration</p>
                  </div>
                </div>
              </div>
            </header>

            {/* Settings content */}
            <div className="p-4 sm:p-6">
              {settingsLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="flex items-center gap-3 text-gray-400">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Loading settings...</span>
                  </div>
                </div>
              ) : (
                <Card className="border-0 shadow-sm max-w-lg">
                  <CardHeader>
                    <CardTitle className="text-lg">Charges & Tax</CardTitle>
                    <CardDescription>Configure the packaging, delivery, and GST charges applied to orders.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="packaging-charge">Packaging Charge (₹)</Label>
                      <Input
                        id="packaging-charge"
                        type="number"
                        min="0"
                        step="1"
                        placeholder="0"
                        value={packagingCharge}
                        onChange={e => setPackagingCharge(e.target.value)}
                      />
                      <p className="text-xs text-gray-500">Added to every order for packaging costs</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="delivery-charge">Delivery Charge (₹)</Label>
                      <Input
                        id="delivery-charge"
                        type="number"
                        min="0"
                        step="1"
                        placeholder="0"
                        value={deliveryCharge}
                        onChange={e => setDeliveryCharge(e.target.value)}
                      />
                      <p className="text-xs text-gray-500">Delivery fee added to orders requiring delivery</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gst-percentage">GST Percentage (%)</Label>
                      <Input
                        id="gst-percentage"
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        placeholder="0"
                        value={gstPercentage}
                        onChange={e => setGstPercentage(e.target.value)}
                      />
                      <p className="text-xs text-gray-500">Goods & Services Tax percentage applied to the subtotal</p>
                    </div>
                    <Separator />
                    <Button
                      onClick={saveSettings}
                      disabled={settingsSaving}
                      className="bg-gradient-to-r from-orange-500 to-green-600 hover:from-orange-600 hover:to-green-700 text-white"
                    >
                      {settingsSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Settings
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        )}

        {activeTab === 'coupons' && (
          <>
            {/* Top bar */}
            <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden"
                    onClick={() => setSidebarOpen(true)}
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                  <div>
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-gray-400" />
                      <h2 className="font-semibold text-gray-900">Discount Coupons</h2>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {coupons.length} coupon{coupons.length !== 1 ? 's' : ''} configured
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => openCouponDialog()}
                  className="bg-gradient-to-r from-orange-500 to-green-600 hover:from-orange-600 hover:to-green-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Coupon
                </Button>
              </div>
            </header>

            {/* Coupons content */}
            <div className="p-4 sm:p-6">
              {couponsLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="flex items-center gap-3 text-gray-400">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Loading coupons...</span>
                  </div>
                </div>
              ) : coupons.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <Tag className="h-16 w-16 mb-4" />
                  <p className="text-lg mb-2">No coupons yet</p>
                  <Button
                    onClick={() => openCouponDialog()}
                    variant="outline"
                    className="border-orange-300 text-orange-600 hover:bg-orange-50"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Coupon
                  </Button>
                </div>
              ) : (
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50/80">
                          <TableHead>Code</TableHead>
                          <TableHead className="w-24">Discount</TableHead>
                          <TableHead className="w-20">Type</TableHead>
                          <TableHead className="w-24">Min Order</TableHead>
                          <TableHead className="w-24">Max Uses</TableHead>
                          <TableHead className="w-24">Used</TableHead>
                          <TableHead className="w-24">Status</TableHead>
                          <TableHead className="w-28">Expiry</TableHead>
                          <TableHead className="w-32 text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {coupons.map(coupon => (
                          <TableRow key={coupon.id} className={!coupon.isActive ? 'opacity-50' : ''}>
                            <TableCell>
                              <span className="font-mono font-semibold text-sm bg-gray-100 px-2 py-0.5 rounded">
                                {coupon.code}
                              </span>
                            </TableCell>
                            <TableCell className="font-semibold text-green-700">
                              {coupon.type === 'FLAT' ? `₹${coupon.discount}` : `${coupon.discount}%`}
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={`text-xs ${
                                  coupon.type === 'FLAT'
                                    ? 'bg-blue-100 text-blue-700 border-blue-200'
                                    : 'bg-purple-100 text-purple-700 border-purple-200'
                                }`}
                                variant="outline"
                              >
                                {coupon.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              {coupon.minOrder > 0 ? `₹${coupon.minOrder}` : <span className="text-gray-300">—</span>}
                            </TableCell>
                            <TableCell className="text-sm">
                              {coupon.maxUses > 0 ? coupon.maxUses : <span className="text-gray-400 text-xs">Unlimited</span>}
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">{coupon.usedCount}</TableCell>
                            <TableCell>
                              <Switch
                                checked={coupon.isActive}
                                onCheckedChange={() => toggleCouponActive(coupon)}
                              />
                            </TableCell>
                            <TableCell className="text-xs text-gray-500">
                              {coupon.expiresAt
                                ? new Date(coupon.expiresAt).toLocaleDateString('en-IN', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                  })
                                : <span className="text-gray-300">—</span>}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-orange-600 hover:text-orange-700"
                                  onClick={() => openCouponDialog(coupon)}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <AlertDialog
                                  open={deleteCouponId === coupon.id}
                                  onOpenChange={(open) => {
                                    if (!open) setDeleteCouponId(null)
                                  }}
                                >
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-red-500 hover:text-red-600"
                                      onClick={() => setDeleteCouponId(coupon.id)}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete coupon &ldquo;{coupon.code}&rdquo;?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This will permanently remove this coupon. This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        className="bg-red-600 hover:bg-red-700"
                                        onClick={() => deleteCoupon(coupon.id)}
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        )}
      </main>

      {/* Category Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Edit Category' : 'Add Category'}</DialogTitle>
            <DialogDescription>
              {editingCategory ? 'Update the category details below.' : 'Create a new menu category.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Category Name</Label>
              <Input
                placeholder="e.g., Chinese"
                value={catName}
                onChange={e => {
                  setCatName(e.target.value)
                  if (!editingCategory) {
                    setCatSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''))
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                placeholder="e.g., chinese"
                value={catSlug}
                onChange={e => setCatSlug(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Icon (Emoji)</Label>
                <Input
                  placeholder="🥡"
                  value={catIcon}
                  onChange={e => setCatIcon(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Order</Label>
                <Input
                  type="number"
                  value={catOrder}
                  onChange={e => setCatOrder(Number(e.target.value))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={saveCategory}
              className="bg-gradient-to-r from-orange-500 to-green-600 hover:from-orange-600 hover:to-green-700 text-white"
            >
              {editingCategory ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Coupon Dialog */}
      <Dialog open={couponDialogOpen} onOpenChange={setCouponDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingCoupon ? 'Edit Coupon' : 'Add Coupon'}</DialogTitle>
            <DialogDescription>
              {editingCoupon ? 'Update the coupon details below.' : 'Create a new discount coupon.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Coupon Code</Label>
                <Input
                  placeholder="e.g., SAVE20"
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value.toUpperCase())}
                  className="uppercase"
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={couponType} onValueChange={(v: 'FLAT' | 'PERCENT') => setCouponType(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FLAT">Flat (₹)</SelectItem>
                    <SelectItem value="PERCENT">Percent (%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Discount {couponType === 'FLAT' ? '(₹)' : '(%)'}</Label>
                <Input
                  type="number"
                  min="0"
                  max={couponType === 'PERCENT' ? 100 : undefined}
                  step={couponType === 'PERCENT' ? 1 : 1}
                  placeholder="0"
                  value={couponDiscount || ''}
                  onChange={e => setCouponDiscount(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Min Order (₹) <span className="text-gray-400 font-normal">optional</span></Label>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={couponMinOrder || ''}
                  onChange={e => setCouponMinOrder(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Max Uses <span className="text-gray-400 font-normal">(0 = unlimited)</span></Label>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={couponMaxUses || ''}
                  onChange={e => setCouponMaxUses(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Expires At <span className="text-gray-400 font-normal">optional</span></Label>
                <Input
                  type="date"
                  value={couponExpiresAt}
                  onChange={e => setCouponExpiresAt(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={couponIsActive}
                onCheckedChange={setCouponIsActive}
              />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCouponDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={saveCoupon}
              disabled={couponSaving}
              className="bg-gradient-to-r from-orange-500 to-green-600 hover:from-orange-600 hover:to-green-700 text-white"
            >
              {couponSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : editingCoupon ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sonner Toaster */}
      <SonnerToaster richColors position="top-right" />

      {/* Item Dialog */}
      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Item' : 'Add Item'}</DialogTitle>
            <DialogDescription>
              {editingItem ? 'Update the menu item details below.' : 'Add a new item to the menu.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label>Item Name</Label>
              <Input
                placeholder="e.g., Paneer Butter Masala"
                value={itemName}
                onChange={e => setItemName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price (₹)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={itemPrice || ''}
                  onChange={e => setItemPrice(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={itemCategoryId} onValueChange={setItemCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Badge</Label>
                <Select value={itemBadge || "none"} onValueChange={v => setItemBadge(v === "none" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="best-seller">Best Seller</SelectItem>
                    <SelectItem value="signature">Signature</SelectItem>
                    <SelectItem value="must-try">Must Try</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Order</Label>
                <Input
                  type="number"
                  value={itemOrder}
                  onChange={e => setItemOrder(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Variant Tag</Label>
              <Input
                placeholder="e.g., Hakka or Szechwan"
                value={itemVariantTag}
                onChange={e => setItemVariantTag(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="e.g., One Veg. Kathol Dal, Rice, Butter Milk..."
                value={itemDescription}
                onChange={e => setItemDescription(e.target.value)}
                rows={2}
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={itemIsAvailable}
                onCheckedChange={setItemIsAvailable}
              />
              <Label>Available</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setItemDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={saveItem}
              className="bg-gradient-to-r from-orange-500 to-green-600 hover:from-orange-600 hover:to-green-700 text-white"
            >
              {editingItem ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
