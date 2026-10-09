import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { AuthContext } from "./AuthContext";

import {
  getCartApi,
  addToCartApi,
  updateCartItemApi,
  removeCartItemApi,
  clearCartApi,
} from "../api/cartApi";

export const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { user, loading: authLoading } = useContext(AuthContext);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // ---------------------------------------------------------
  // NORMALIZE CART
  // ---------------------------------------------------------

  const normalizeCart = useCallback((cart) => {
    const rawItems = Array.isArray(cart?.items) ? cart.items : [];

    return rawItems
      .filter((item) => item?.menuItem)
      .map((item) => ({
        cartItemId: item._id,

        menuItemId: item.menuItem._id,

        name: item.menuItem.name,

        description: item.menuItem.description || "",

        price: Number(item.menuItem.price || 0),

        imageUrl: item.menuItem.imageUrl || "",

        category: item.menuItem.category || "",

        quantity: Number(item.quantity || 1),

        restaurantId: item.restaurant?._id || item.menuItem.restaurant || null,

        restaurantName: item.restaurant?.name || "",
      }));
  }, []);

  // ---------------------------------------------------------
  // LOAD CART
  // ---------------------------------------------------------

  const loadCart = useCallback(async () => {
    if (!user) {
      setItems([]);
      return;
    }

    try {
      setLoading(true);

      const res = await getCartApi();

      if (res.success) {
        setItems(normalizeCart(res.cart));
      }
    } catch (error) {
      console.error("Failed to load cart:", error);

      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [user, normalizeCart]);

  // ---------------------------------------------------------
  // INITIAL / AUTH CHANGE
  // ---------------------------------------------------------

  useEffect(() => {
    if (!authLoading) {
      loadCart();
    }
  }, [authLoading, loadCart]);

  // ---------------------------------------------------------
  // ADD ITEM
  // ---------------------------------------------------------

  const addItem = async (item) => {
    if (!user) {
      throw new Error("Please login before adding items to cart.");
    }

    const menuItemId = item.menuItemId || item._id;

    if (!menuItemId) {
      throw new Error("Menu item ID is missing.");
    }

    const quantity = Math.min(99, Math.max(1, Number(item.quantity || 1)));

    const res = await addToCartApi({
      menuItemId,
      quantity,
    });

    if (res.success) {
      setItems(normalizeCart(res.cart));
    }

    return res;
  };

  // ---------------------------------------------------------
  // UPDATE QUANTITY
  // ---------------------------------------------------------

  const updateQuantity = async (menuItemId, quantity) => {
    const res = await updateCartItemApi(menuItemId, quantity);

    if (res.success) {
      setItems(normalizeCart(res.cart));
    }

    return res;
  };

  // ---------------------------------------------------------
  // REMOVE ITEM
  // ---------------------------------------------------------

  const removeItem = async (menuItemId) => {
    const res = await removeCartItemApi(menuItemId);

    if (res.success) {
      setItems(normalizeCart(res.cart));
    }

    return res;
  };

  // ---------------------------------------------------------
  // CLEAR ALL CART
  // ---------------------------------------------------------

  const clearCart = async () => {
    await clearCartApi();

    setItems([]);
  };

  // ---------------------------------------------------------
  // RESET LOCAL CART
  // ---------------------------------------------------------

  const resetLocalCart = () => {
    setItems([]);
  };

  // ---------------------------------------------------------
  // REFRESH
  // ---------------------------------------------------------

  const refreshCart = async () => {
    await loadCart();
  };

  // ---------------------------------------------------------
  // CART COUNT
  // ---------------------------------------------------------

  const cartCount = useMemo(() => {
    return items.reduce((total, item) => total + Number(item.quantity || 0), 0);
  }, [items]);

  // ---------------------------------------------------------
  // CART SUBTOTAL
  // ---------------------------------------------------------

  const cartSubtotal = useMemo(() => {
    return items.reduce(
      (total, item) =>
        total + Number(item.price || 0) * Number(item.quantity || 0),
      0,
    );
  }, [items]);

  // ---------------------------------------------------------
  // GROUP ITEMS BY RESTAURANT
  //
  // This is important for Cart.jsx
  // ---------------------------------------------------------

  const restaurantGroups = useMemo(() => {
    const groups = {};

    items.forEach((item) => {
      const restaurantId = item.restaurantId || "unknown";

      if (!groups[restaurantId]) {
        groups[restaurantId] = {
          restaurantId,
          restaurantName: item.restaurantName || "Restaurant",
          items: [],
          subtotal: 0,
        };
      }

      groups[restaurantId].items.push(item);

      groups[restaurantId].subtotal +=
        Number(item.price || 0) * Number(item.quantity || 0);
    });

    return Object.values(groups);
  }, [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        loading,

        cartCount,
        cartSubtotal,

        restaurantGroups,

        addItem,
        updateQuantity,
        removeItem,
        clearCart,

        resetLocalCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
