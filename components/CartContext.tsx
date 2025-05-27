"use client";
import React, { createContext, useContext, useReducer, ReactNode, useEffect } from "react";

export interface CartItem {
  id: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  category: string;
  note?: string;
  oldPrice?: number;
  discount?: number;
  addOns?: { id: string; name: string; price: number }[];
  specialRequest?: string;
}

export interface CartState {
  items: CartItem[];
  promoCode?: string;
  discount?: number;
}

const CartContext = createContext<{
  cart: CartState;
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  applyPromoCode: (code: string, discount: number) => void;
  removePromoCode: () => void;
} | undefined>(undefined);

function cartReducer(state: CartState, action: any): CartState {
  switch (action.type) {
    case "LOAD":
      return { items: action.items };
    case "ADD": {
      // If item exists (same id and addOns and specialRequest), increase quantity
      const idx = state.items.findIndex(
        (i) =>
          i.id === action.item.id &&
          JSON.stringify(i.addOns) === JSON.stringify(action.item.addOns) &&
          i.specialRequest === action.item.specialRequest
      );
      if (idx > -1) {
        const items = [...state.items];
        items[idx].quantity += action.item.quantity;
        return { items };
      }
      // Create a unique ID for items with different add-ons
      const uniqueId = `${action.item.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newItem = { ...action.item, id: uniqueId };
      return { items: [...state.items, newItem] };
    }
    case "REMOVE":
      return { items: state.items.filter((i) => i.id !== action.id) };
    case "UPDATE_QTY":
      return {
        items: state.items.map((i) =>
          i.id === action.id ? { ...i, quantity: action.quantity } : i
        ),
      };
    case "CLEAR":
      return { items: [] };
    case "APPLY_PROMO":
      return { ...state, promoCode: action.code, discount: action.discount };
    case "REMOVE_PROMO":
      return { ...state, promoCode: undefined, discount: undefined };
    default:
      return state;
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, dispatch] = useReducer(cartReducer, { items: [] });

  // Load cart from sessionStorage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem('cart');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && Array.isArray(parsed.items)) {
          dispatch({ type: 'LOAD', items: parsed.items });
        }
      } catch {}
    }
  }, []);

  // Save cart to sessionStorage on change
  useEffect(() => {
    sessionStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item: CartItem) => dispatch({ type: "ADD", item });
  const removeFromCart = (id: string) => dispatch({ type: "REMOVE", id });
  const updateQuantity = (id: string, quantity: number) =>
    dispatch({ type: "UPDATE_QTY", id, quantity });
  const clearCart = () => dispatch({ type: "CLEAR" });
  const applyPromoCode = (code: string, discount: number) => dispatch({ type: "APPLY_PROMO", code, discount });
  const removePromoCode = () => dispatch({ type: "REMOVE_PROMO" });

  return (
    <CartContext.Provider
      value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, applyPromoCode, removePromoCode }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
} 