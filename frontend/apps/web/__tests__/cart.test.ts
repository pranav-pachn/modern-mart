import { describe, it, expect, beforeEach } from 'vitest';
import { useCart } from '../store/cart';

describe('Cart Store', () => {
  beforeEach(() => {
    useCart.getState().clearCart();
  });

  const mockProduct = {
    id: 'p1',
    name: 'Apple',
    category: 'Fruits',
    unit: '1 kg',
    price: 100,
    rating: 5,
    stock: 10,
  };

  it('adds a product to the cart', () => {
    useCart.getState().addToCart(mockProduct);
    const state = useCart.getState();
    expect(state.items.length).toBe(1);
    expect(state.items[0]?.id).toBe('p1');
    expect(state.items[0]?.quantity).toBe(1);
    expect(state.subtotal).toBe(100);
    expect(state.deliveryFee).toBe(30);
    expect(state.total).toBe(130);
  });

  it('increases quantity when adding the same product', () => {
    useCart.getState().addToCart(mockProduct);
    useCart.getState().addToCart(mockProduct);
    const state = useCart.getState();
    expect(state.items.length).toBe(1);
    expect(state.items[0]?.quantity).toBe(2);
    expect(state.subtotal).toBe(200);
  });

  it('respects stock limits when adding', () => {
    const lowStockProduct = { ...mockProduct, stock: 1 };
    useCart.getState().addToCart(lowStockProduct);
    useCart.getState().addToCart(lowStockProduct); // Should not increase
    const state = useCart.getState();
    expect(state.items[0]?.quantity).toBe(1);
  });

  it('decreases quantity and removes item when quantity is 0', () => {
    useCart.getState().addToCart(mockProduct);
    useCart.getState().addToCart(mockProduct);
    
    useCart.getState().decreaseQuantity('p1');
    expect(useCart.getState().items[0]?.quantity).toBe(1);

    useCart.getState().decreaseQuantity('p1');
    expect(useCart.getState().items.length).toBe(0);
    expect(useCart.getState().deliveryFee).toBe(0); // Free delivery when cart is empty
  });

  it('removes item directly', () => {
    useCart.getState().addToCart(mockProduct);
    useCart.getState().removeItem('p1');
    expect(useCart.getState().items.length).toBe(0);
  });
});
