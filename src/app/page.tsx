'use client'

import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  X,
  MapPin,
  Phone,
  Clock,
  MessageCircle,
  ChevronRight,
  UtensilsCrossed,
  Star,
  Leaf,
  Flame,
  ArrowUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { menuCategories } from "@/lib/menu-data";
import type { MenuItem, MenuCategory } from "@/lib/menu-data";
import { useCartStore } from "@/lib/cart-store";
import { useToast } from "@/hooks/use-toast";

const WHATSAPP_NUMBER = "917574033599";

function generateWhatsAppMessage(items: { item: MenuItem; quantity: number }[], total: number): string {
  let message = "🪷 *Kankeshwar - Order*\n\n";
  message += "━━━━━━━━━━━━━━━━━━━━\n\n";
  
  items.forEach((ci, index) => {
    message += `${index + 1}. *${ci.item.name}*\n`;
    message += `   ${ci.quantity} × ₹${ci.item.price} = ₹${ci.quantity * ci.item.price}\n\n`;
  });

  message += "━━━━━━━━━━━━━━━━━━━━\n";
  message += `*Total: ₹${total}*\n\n`;
  message += "Please confirm my order. Thank you! 🙏";
  
  return encodeURIComponent(message);
}

// ─── Category Tab Component ─────────────────────────────────────────
function CategoryTabs({
  categories,
  activeCategory,
  onCategoryChange,
}: {
  categories: MenuCategory[];
  activeCategory: string;
  onCategoryChange: (id: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="sticky top-0 z-30 bg-cream/95 backdrop-blur-md indian-border-bottom shadow-sm">
      <div
        ref={scrollRef}
        className="hide-scrollbar flex overflow-x-auto gap-2 px-4 py-3 max-w-7xl mx-auto"
      >
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onCategoryChange(cat.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full whitespace-nowrap text-sm font-medium transition-all duration-200 shrink-0 ${
              activeCategory === cat.id
                ? "bg-saffron text-white shadow-lg shadow-saffron/30 scale-105"
                : "bg-white text-rich-brown border border-saffron/20 hover:bg-saffron/10 hover:border-saffron/40"
            }`}
          >
            <span className="text-base">{cat.icon}</span>
            <span>{cat.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Menu Item Card ─────────────────────────────────────────────────
function MenuItemCard({
  item,
  cartQuantity,
  onAdd,
  onRemove,
  onIncrement,
  onDecrement,
}: {
  item: MenuItem;
  cartQuantity: number;
  onAdd: () => void;
  onRemove: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
}) {
  const isInCart = cartQuantity > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`group relative bg-white rounded-2xl border transition-all duration-300 hover:shadow-lg ${
        isInCart
          ? "border-saffron/40 shadow-md shadow-saffron/10 ring-1 ring-saffron/20"
          : "border-saffron/10 hover:border-saffron/30"
      }`}
    >
      <div className="p-4 flex items-center justify-between gap-3">
        {/* Item Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-rich-brown text-[15px] leading-tight">
            {item.name}
          </h3>
          {(item.subOptions || item.description) && (
            <p className="text-xs text-muted-foreground mt-1 leading-snug">
              {item.subOptions || item.description}
            </p>
          )}
          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-lg font-bold text-saffron-dark">₹{item.price}</span>
            {item.price > 200 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-gold-light/20 text-saffron-dark border-0">
                Popular
              </Badge>
            )}
          </div>
        </div>

        {/* Add / Quantity Control */}
        <div className="shrink-0">
          {isInCart ? (
            <div className="flex items-center gap-1 bg-saffron/10 rounded-xl p-1">
              <button
                onClick={onDecrement}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white text-saffron hover:bg-saffron/20 transition-colors shadow-sm"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-7 text-center font-bold text-saffron text-sm">
                {cartQuantity}
              </span>
              <button
                onClick={onIncrement}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-saffron text-white hover:bg-saffron-dark transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onAdd}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-saffron text-white hover:bg-saffron-dark transition-all duration-200 shadow-md shadow-saffron/25 hover:shadow-lg hover:shadow-saffron/30 hover:scale-105 active:scale-95"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Cart Drawer ────────────────────────────────────────────────────
function CartDrawer({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { items, updateQuantity, removeItem, clearCart, getTotalPrice } = useCartStore();
  const total = getTotalPrice();

  const handleWhatsAppOrder = () => {
    if (items.length === 0) return;
    const message = generateWhatsAppMessage(items, total);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, "_blank");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-[420px] bg-cream z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-saffron-dark via-saffron to-saffron-light p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-white font-bold text-lg">Your Order</h2>
                    <p className="text-white/80 text-sm">
                      {items.length} {items.length === 1 ? "item" : "items"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <div className="w-20 h-20 bg-saffron/10 rounded-full flex items-center justify-center mb-4">
                    <ShoppingBag className="w-10 h-10 text-saffron/40" />
                  </div>
                  <p className="text-muted-foreground font-medium text-lg">Your cart is empty</p>
                  <p className="text-muted-foreground/70 text-sm mt-1">
                    Add items from the menu to get started
                  </p>
                </div>
              ) : (
                <AnimatePresence>
                  {items.map((ci) => (
                    <motion.div
                      key={ci.item.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95, x: 50 }}
                      className="bg-white rounded-xl border border-saffron/10 p-3 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-rich-brown text-sm leading-tight">
                            {ci.item.name}
                          </h4>
                          <p className="text-saffron-dark font-bold text-sm mt-1">
                            ₹{ci.item.price} × {ci.quantity} = ₹{ci.item.price * ci.quantity}
                          </p>
                        </div>
                        <button
                          onClick={() => removeItem(ci.item.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center justify-end gap-1 mt-2">
                        <button
                          onClick={() => updateQuantity(ci.item.id, ci.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-saffron/10 text-saffron hover:bg-saffron/20 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center font-bold text-saffron text-sm">
                          {ci.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(ci.item.id, ci.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-saffron text-white hover:bg-saffron-dark transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-saffron/20 bg-white p-4 space-y-3">
                {/* Clear cart */}
                <button
                  onClick={clearCart}
                  className="w-full text-sm text-red-500 hover:text-red-600 font-medium flex items-center justify-center gap-1.5 py-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear Cart
                </button>

                {/* Total */}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-medium">Total</span>
                  <span className="text-2xl font-bold text-saffron-dark">₹{total}</span>
                </div>

                {/* WhatsApp Order Button */}
                <button
                  onClick={handleWhatsAppOrder}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-all duration-200 shadow-lg shadow-green-600/30 hover:shadow-xl hover:shadow-green-600/40 active:scale-[0.98]"
                >
                  <MessageCircle className="w-5 h-5" />
                  Order via WhatsApp
                </button>
                <p className="text-center text-xs text-muted-foreground">
                  Your order will be sent to our WhatsApp for confirmation
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Hero Section ───────────────────────────────────────────────────
function HeroSection() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-deep-maroon via-rich-brown to-deep-maroon">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src="/restaurant-bg.jpg"
          alt="Kankeshwar Restaurant Interior"
          fill
          className="object-cover opacity-30"
          priority
        />
      </div>

      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-4 left-8 w-32 h-32 border border-gold/40 rounded-full" />
        <div className="absolute top-12 right-12 w-20 h-20 border border-gold/30 rounded-full" />
        <div className="absolute bottom-8 left-1/4 w-16 h-16 border border-gold/20 rounded-full" />
        <div className="absolute -bottom-4 right-1/3 w-40 h-40 border border-gold/15 rounded-full" />
      </div>

      {/* Top decorative line */}
      <div className="h-1 bg-gradient-to-r from-transparent via-gold to-transparent" />

      <div className="relative max-w-7xl mx-auto px-4 py-12 sm:py-16 text-center">
        {/* Ornament */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-gold" />
          <Star className="w-4 h-4 text-gold fill-gold" />
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-gold" />
        </div>

        {/* Restaurant Name */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white tracking-tight">
          Kankeshwar
        </h1>
        <div className="mt-2 flex items-center justify-center gap-2">
          <div className="h-px w-8 bg-gold/60" />
          <p className="text-gold-light text-lg sm:text-xl font-light tracking-widest uppercase">
            The Indian Culture Restaurant
          </p>
          <div className="h-px w-8 bg-gold/60" />
        </div>

        {/* Location */}
        <div className="mt-5 flex items-center justify-center gap-2 text-white/70">
          <MapPin className="w-4 h-4" />
          <span className="text-sm font-medium">Diu</span>
        </div>

        {/* Veg indicator */}
        <div className="mt-5 flex items-center justify-center gap-4">
          <div className="flex items-center gap-2 text-white/60 text-xs">
            <div className="w-4 h-4 border-2 border-green-500 rounded-sm flex items-center justify-center">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
            </div>
            <span>Pure Vegetarian</span>
          </div>
        </div>

        {/* Contact & Hours */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm">
          <a
            href={`tel:+91${WHATSAPP_NUMBER.slice(2)}`}
            className="flex items-center gap-1.5 text-gold-light hover:text-white transition-colors"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>+91 {WHATSAPP_NUMBER.slice(2)}</span>
          </a>
          <div className="flex items-center gap-1.5 text-white/50">
            <Clock className="w-3.5 h-3.5" />
            <span>Open Daily</span>
          </div>
        </div>

        {/* Bottom ornament */}
        <div className="flex items-center justify-center gap-3 mt-8">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-gold/60" />
          <Leaf className="w-5 h-5 text-gold/60" />
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-gold/60" />
        </div>
      </div>

      {/* Bottom decorative line */}
      <div className="h-1 bg-gradient-to-r from-transparent via-gold to-transparent" />
    </div>
  );
}

// ─── Floating Cart Button ───────────────────────────────────────────
function FloatingCartButton({ onClick, itemCount }: { onClick: () => void; itemCount: number }) {
  return (
    <AnimatePresence>
      {itemCount > 0 && (
        <motion.button
          initial={{ scale: 0, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0, y: 20 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClick}
          className="fixed bottom-6 right-6 z-30 bg-saffron hover:bg-saffron-dark text-white rounded-2xl shadow-xl shadow-saffron/40 flex items-center gap-3 pl-5 pr-4 py-4 transition-colors"
        >
          <ShoppingBag className="w-5 h-5" />
          <span className="font-bold text-sm">View Cart</span>
          <span className="bg-white text-saffron font-bold text-xs min-w-[22px] h-[22px] flex items-center justify-center rounded-full">
            {itemCount}
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}

// ─── Scroll to Top ──────────────────────────────────────────────────
function ScrollToTopButton() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShow(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!show) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-6 left-6 z-30 w-11 h-11 bg-white border border-saffron/20 text-saffron rounded-full shadow-lg flex items-center justify-center hover:bg-saffron hover:text-white transition-all"
    >
      <ArrowUp className="w-4 h-4" />
    </button>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────
export default function Home() {
  const [activeCategory, setActiveCategory] = useState("chinese");
  const [cartOpen, setCartOpen] = useState(false);
  const { items, addItem, updateQuantity, removeItem, getTotalItems } = useCartStore();
  const { toast } = useToast();

  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const totalItems = getTotalItems();

  const handleCategoryChange = (id: string) => {
    setActiveCategory(id);
    const el = categoryRefs.current[id];
    if (el) {
      const offset = 70; // account for sticky tabs
      const y = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  // Track active category based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY + 100;
      for (const cat of menuCategories) {
        const el = categoryRefs.current[cat.id];
        if (el && el.offsetTop <= scrollY) {
          setActiveCategory(cat.id);
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const getCartQuantity = (itemId: string) => {
    const found = items.find((ci) => ci.item.id === itemId);
    return found ? found.quantity : 0;
  };

  const handleAddItem = (item: MenuItem) => {
    addItem(item);
    toast({
      title: "Added to cart",
      description: `${item.name} added to your order`,
      duration: 1500,
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-cream mandala-pattern">
      {/* Hero */}
      <HeroSection />

      {/* Menu Section */}
      <section className="flex-1">
        {/* Section Header */}
        <div className="text-center py-8 px-4">
          <div className="flex items-center justify-center gap-2 mb-3">
            <UtensilsCrossed className="w-5 h-5 text-saffron" />
            <h2 className="text-2xl sm:text-3xl font-bold text-rich-brown">Our Menu</h2>
            <Flame className="w-5 h-5 text-indian-red" />
          </div>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Explore our authentic Indian vegetarian dishes, crafted with love and tradition
          </p>
        </div>

        {/* Category Tabs */}
        <CategoryTabs
          categories={menuCategories}
          activeCategory={activeCategory}
          onCategoryChange={handleCategoryChange}
        />

        {/* Menu Items by Category */}
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-8">
          {menuCategories.map((category) => (
            <div
              key={category.id}
              ref={(el) => { categoryRefs.current[category.id] = el; }}
              id={`category-${category.id}`}
            >
              {/* Category Header */}
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{category.icon}</span>
                <h3 className="text-xl font-bold text-rich-brown">{category.name}</h3>
                <div className="flex-1 h-px bg-gradient-to-r from-saffron/30 to-transparent" />
              </div>

              {/* Items Grid */}
              <div className="grid gap-3 sm:grid-cols-2">
                {category.items.map((item) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    cartQuantity={getCartQuantity(item.id)}
                    onAdd={() => handleAddItem(item)}
                    onRemove={() => removeItem(item.id)}
                    onIncrement={() => updateQuantity(item.id, getCartQuantity(item.id) + 1)}
                    onDecrement={() => updateQuantity(item.id, getCartQuantity(item.id) - 1)}
                  />
                ))}
              </div>

              <Separator className="mt-8 bg-saffron/10" />
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-deep-maroon via-rich-brown to-deep-maroon text-white mt-8">
        <div className="h-1 bg-gradient-to-r from-transparent via-gold to-transparent" />
        <div className="max-w-7xl mx-auto px-4 py-10 text-center">
          {/* Ornament */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-gold/60" />
            <Star className="w-3 h-3 text-gold fill-gold" />
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-gold/60" />
          </div>

          <h3 className="text-2xl font-bold">Kankeshwar</h3>
          <p className="text-gold-light text-sm tracking-widest uppercase mt-1">
            The Indian Culture Restaurant
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-sm text-white/60">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              <span>Diu</span>
            </div>
            <a
              href={`tel:+91${WHATSAPP_NUMBER.slice(2)}`}
              className="flex items-center gap-1.5 hover:text-gold-light transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>+91 {WHATSAPP_NUMBER.slice(2)}</span>
            </a>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-green-400 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>
          </div>

          <div className="mt-5 flex items-center justify-center gap-2 text-white/40 text-xs">
            <div className="w-3 h-3 border-2 border-green-500 rounded-sm flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
            </div>
            <span>Pure Vegetarian</span>
          </div>

          <p className="mt-6 text-white/30 text-xs">
            &copy; {new Date().getFullYear()} Kankeshwar - The Indian Culture Restaurant, Diu. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Floating Cart */}
      <FloatingCartButton onClick={() => setCartOpen(true)} itemCount={totalItems} />

      {/* Scroll to Top */}
      <ScrollToTopButton />

      {/* Cart Drawer */}
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
