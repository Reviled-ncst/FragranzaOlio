import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, ShoppingCart, Check, Square, CheckSquare } from 'lucide-react';
import { useCart } from '../context/CartContext';

// Helper to get full image URL
const getImageUrl = (imagePath: string | null | undefined): string => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  if (imagePath.startsWith('/uploads')) {
    return `http://localhost/FragranzaWeb/backend${imagePath}`;
  }
  return imagePath;
};

const Cart = () => {
  const { items, updateQuantity, removeFromCart } = useCart();
  const navigate = useNavigate();
  const [selectedItems, setSelectedItems] = useState<number[]>([]);

  // Calculate totals based on selected items only
  const { subtotal, selectedCount } = useMemo(() => {
    const selected = items.filter(item => selectedItems.includes(item.id));
    return {
      subtotal: selected.reduce((sum, item) => sum + item.price * item.quantity, 0),
      selectedCount: selected.length
    };
  }, [items, selectedItems]);

  const shipping = subtotal > 2000 ? 0 : subtotal > 0 ? 150 : 0; // Free shipping over ₱2,000
  const total = subtotal + shipping;

  const allSelected = items.length > 0 && selectedItems.length === items.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedItems([]);
    } else {
      setSelectedItems(items.map(item => item.id));
    }
  };

  const toggleSelectItem = (itemId: number) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleCheckout = () => {
    if (selectedItems.length === 0) return;
    // Store selected items for checkout
    sessionStorage.setItem('checkoutItems', JSON.stringify(selectedItems));
    navigate('/checkout');
  };

  return (
    <div className="min-h-screen bg-black-950 pt-20 sm:pt-24 pb-12 sm:pb-16">
      <div className="container-custom px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-6 h-6 sm:w-8 sm:h-8 text-gold-500" />
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">Shopping Cart</h1>
          </div>
          {items.length > 0 && (
            <span className="bg-gold-500/20 text-gold-500 text-xs sm:text-sm px-3 py-1 rounded-full w-fit">
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </span>
          )}
        </div>

        {items.length === 0 ? (
          /* Empty Cart */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12 sm:py-20"
          >
            <ShoppingCart className="w-16 h-16 sm:w-24 sm:h-24 text-gray-600 mx-auto mb-4 sm:mb-6" />
            <h2 className="text-xl sm:text-2xl font-display text-white mb-3 sm:mb-4">Your cart is empty</h2>
            <p className="text-gray-400 mb-6 sm:mb-8 max-w-md mx-auto text-sm sm:text-base px-4">
              Looks like you haven't added any fragrances yet. Explore our collection and find your signature scent.
            </p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-600 text-black font-semibold px-6 sm:px-8 py-3 rounded-lg transition-colors text-sm sm:text-base"
            >
              Browse Products
              <ArrowRight size={18} />
            </Link>
          </motion.div>
        ) : (
          /* Cart with Items */
          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-3 sm:space-y-4">
              {/* Select All Header */}
              <div className="bg-black-900/50 border border-gold-500/10 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between">
                <button
                  onClick={toggleSelectAll}
                  className="flex items-center gap-2 sm:gap-3 text-gray-300 hover:text-white transition-colors"
                >
                  {allSelected ? (
                    <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5 text-gold-500" />
                  ) : (
                    <Square className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                  <span className="text-xs sm:text-sm font-medium">
                    {allSelected ? 'Deselect All' : 'Select All'}
                  </span>
                </button>
                {selectedItems.length > 0 && (
                  <span className="text-xs sm:text-sm text-gold-500">
                    {selectedItems.length} selected
                  </span>
                )}
              </div>

              {items.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`bg-black-900 border rounded-xl p-3 sm:p-4 transition-all ${
                    selectedItems.includes(item.id) 
                      ? 'border-gold-500/50 ring-1 ring-gold-500/20' 
                      : 'border-gold-500/20 hover:border-gold-500/30'
                  }`}
                >
                  {/* Mobile Layout */}
                  <div className="flex gap-3 sm:gap-4">
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleSelectItem(item.id)}
                      className="flex-shrink-0 self-start mt-1 sm:self-center sm:mt-0"
                    >
                      {selectedItems.includes(item.id) ? (
                        <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gold-500 rounded-md flex items-center justify-center">
                          <Check className="w-3 h-3 sm:w-4 sm:h-4 text-black" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-gray-600 hover:border-gold-500/50 rounded-md transition-colors" />
                      )}
                    </button>

                    {/* Clickable Image & Details */}
                    <Link 
                      to={`/products/${item.productId}`}
                      className="flex gap-3 sm:gap-4 flex-grow cursor-pointer group min-w-0"
                    >
                      {/* Image */}
                      <div className="w-16 h-16 sm:w-24 sm:h-24 bg-black-800 rounded-lg overflow-hidden flex-shrink-0 group-hover:ring-2 ring-gold-500/30 transition-all">
                        <img
                          src={getImageUrl(item.image)}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>

                      {/* Details */}
                      <div className="flex-grow min-w-0">
                        <h3 className="text-white font-semibold text-sm sm:text-base group-hover:text-gold-400 transition-colors truncate">{item.name}</h3>
                        <p className="text-gray-400 text-xs sm:text-sm truncate">{item.variation}</p>
                        <p className="text-gold-500 font-semibold mt-0.5 sm:mt-1 text-sm sm:text-base">₱{item.price.toLocaleString()}</p>
                      </div>
                    </Link>
                  </div>
                  
                  {/* Bottom row with quantity and actions */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gold-500/10">
                    {/* Quantity Controls */}
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-black-800 hover:bg-black-700 text-white rounded-lg transition-colors"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-6 sm:w-8 text-center text-white text-sm sm:text-base">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={item.maxStock !== undefined && item.quantity >= item.maxStock}
                        className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-black-800 hover:bg-black-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <p className="text-gray-400 text-xs sm:text-sm">
                        ₱{(item.price * item.quantity).toLocaleString()}
                      </p>
                      {/* Remove Button */}
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-1.5 sm:p-2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Order Summary - Sticky on mobile */}
            <div className="lg:col-span-1">
              <div className="bg-black-900 border border-gold-500/20 rounded-xl p-4 sm:p-6 lg:sticky lg:top-24 fixed bottom-0 left-0 right-0 lg:relative z-40 lg:z-auto border-t lg:border-t-0 rounded-t-2xl lg:rounded-xl shadow-2xl lg:shadow-none">
                <h2 className="text-lg sm:text-xl font-display font-bold text-white mb-4 sm:mb-6 hidden lg:block">Order Summary</h2>
                
                {selectedItems.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-gray-400 text-sm">Select items to checkout</p>
                  </div>
                ) : (
                  <>
                    <div className="bg-gold-500/10 border border-gold-500/20 rounded-lg px-3 py-2 mb-4">
                      <p className="text-gold-500 text-sm font-medium">
                        {selectedCount} {selectedCount === 1 ? 'item' : 'items'} selected
                      </p>
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between text-gray-400">
                        <span>Subtotal</span>
                        <span>₱{subtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-gray-400">
                        <span>Shipping</span>
                        <span>{shipping === 0 ? 'FREE' : `₱${shipping}`}</span>
                      </div>
                      {shipping > 0 && subtotal > 0 && (
                        <p className="text-xs text-gray-500">Free shipping on orders over ₱2,000</p>
                      )}
                      <div className="border-t border-gold-500/20 pt-3 flex justify-between text-white font-semibold">
                        <span>Total</span>
                        <span className="text-gold-500">₱{total.toLocaleString()}</span>
                      </div>
                    </div>
                  </>
                )}

                <button 
                  onClick={handleCheckout}
                  disabled={selectedItems.length === 0}
                  className="w-full bg-gold-500 hover:bg-gold-600 disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed text-black font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {selectedItems.length === 0 ? 'Select Items to Checkout' : (
                    <>
                      Checkout ({selectedCount})
                      <ArrowRight size={20} />
                    </>
                  )}
                </button>

                <Link
                  to="/products"
                  className="block text-center text-gray-400 hover:text-gold-500 mt-4 text-sm transition-colors"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
