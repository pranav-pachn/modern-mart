import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartProduct = {
  id: string;
  name: string;
  category: string;
  unit: string;
  price: number;
  rating: number;
  image?: string;
  stock?: number;
};

export type CartItem = CartProduct & {
  quantity: number;
};

type CartState = {
  cart: CartItem[];
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  deliveryFee: number;
  total: number;
  addToCart: (product: CartProduct) => void;
  addItem: (product: CartProduct) => void;
  increaseQuantity: (id: string) => void;
  increaseQty: (id: string) => void;
  decreaseQuantity: (id: string) => void;
  decreaseQty: (id: string) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
};

const DELIVERY_FEE = 30;

function withTotals(cart: CartItem[]) {
  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const deliveryFee = cart.length > 0 ? DELIVERY_FEE : 0;

  return {
    cart,
    items: cart,
    totalItems,
    subtotal,
    deliveryFee,
    total: subtotal + deliveryFee,
  };
}

function addProduct(cart: CartItem[], product: CartProduct) {
  const existingItem = cart.find((item) => item.id === product.id);

  if (existingItem) {
    return cart.map((item) =>
      item.id === product.id ? { ...item, ...product, quantity: item.quantity + 1 } : item,
    );
  }

  return [
    ...cart,
    {
      ...product,
      quantity: 1,
    },
  ];
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      cart: [],
      items: [],
      totalItems: 0,
      subtotal: 0,
      deliveryFee: 0,
      total: 0,
      addToCart: (product) =>
        set((state) => withTotals(addProduct(state.cart, product))),
      addItem: (product) =>
        set((state) => withTotals(addProduct(state.cart, product))),
      increaseQuantity: (id) =>
        set((state) =>
          withTotals(
            state.cart.map((item) =>
              item.id === id ? { ...item, quantity: item.quantity + 1 } : item,
            ),
          ),
        ),
      increaseQty: (id) =>
        set((state) =>
          withTotals(
            state.cart.map((item) =>
              item.id === id ? { ...item, quantity: item.quantity + 1 } : item,
            ),
          ),
        ),
      decreaseQuantity: (id) =>
        set((state) =>
          withTotals(
            state.cart
              .map((item) =>
                item.id === id ? { ...item, quantity: Math.max(0, item.quantity - 1) } : item,
              )
              .filter((item) => item.quantity > 0),
          ),
        ),
      decreaseQty: (id) =>
        set((state) =>
          withTotals(
            state.cart
              .map((item) =>
                item.id === id ? { ...item, quantity: Math.max(0, item.quantity - 1) } : item,
              )
              .filter((item) => item.quantity > 0),
          ),
        ),
      removeItem: (id) => set((state) => withTotals(state.cart.filter((item) => item.id !== id))),
      clearCart: () => set(withTotals([])),
    }),
    {
      name: "panchavati_cart_v1",
    },
  ),
);
