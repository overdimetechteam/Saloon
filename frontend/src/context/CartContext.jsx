import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const CartContext = createContext(null);

const STORAGE_KEY = 'cosCart';

function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCart(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart);
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    saveCart(items);
  }, [items]);

  const addItem = useCallback((product, quantity = 1, variantNote = '') => {
    setItems(prev => {
      const key = `${product.id}__${variantNote}`;
      const existing = prev.find(i => i._key === key);
      if (existing) {
        return prev.map(i =>
          i._key === key ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, {
        _key: key,
        productId: product.id,
        salonId: product.salon_id ?? product.salonId,
        salonName: product.salon_name ?? product.salonName,
        name: product.name,
        brand: product.brand,
        sku: product.sku,
        category: product.category,
        shade_variant: product.shade_variant,
        size: product.size,
        unit_of_measure: product.unit_of_measure,
        selling_price: product.selling_price,
        current_stock: product.current_stock,
        first_image_url: product.first_image_url,
        quantity,
        variantNote,
      }];
    });
  }, []);

  const removeItem = useCallback((key) => {
    setItems(prev => prev.filter(i => i._key !== key));
  }, []);

  const updateQty = useCallback((key, qty) => {
    if (qty < 1) return;
    setItems(prev => prev.map(i => i._key === key ? { ...i, quantity: qty } : i));
  }, []);

  const updateVariant = useCallback((key, variantNote) => {
    setItems(prev => prev.map(i => i._key === key ? { ...i, variantNote, _key: `${i.productId}__${variantNote}` } : i));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + Number(i.selling_price) * i.quantity, 0);

  return (
    <CartContext.Provider value={{
      items, cartOpen, setCartOpen,
      addItem, removeItem, updateQty, updateVariant, clearCart,
      totalItems, subtotal,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
