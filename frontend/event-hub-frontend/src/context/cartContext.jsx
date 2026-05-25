import { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem("cart");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (item) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.ticketTypeId === item.ticketTypeId && i.eventId === item.eventId);
      if (existing) {
        return prev.map(i => 
          i.ticketTypeId === item.ticketTypeId && i.eventId === item.eventId
            ? { ...i, count: i.count + item.count }
            : i
        );
      }
      return [...prev, item];
    });
  };

  const removeFromCart = (ticketTypeId, eventId) => {
    setCartItems(prev => prev.filter(i => !(i.ticketTypeId === ticketTypeId && i.eventId === eventId)));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getCartItemCount = () => {
    return cartItems.reduce((sum, item) => sum + item.count, 0);
  };

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, clearCart, getCartItemCount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);