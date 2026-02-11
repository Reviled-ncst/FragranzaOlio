import { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CreditCard, 
  Truck, 
  MapPin, 
  ChevronLeft, 
  Check, 
  Lock,
  Wallet,
  Building2,
  ShoppingBag,
  Plus,
  Home,
  Briefcase,
  Star,
  Edit2,
  Clock,
  Bike,
  Car,
  Package,
  Loader2,
  Store,
  AlertCircle,
  QrCode,
  Navigation2,
  Phone,
  ExternalLink,
  Bell,
  Info
} from 'lucide-react';
import { useCart, CartItem } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { 
  getDeliveryQuotes, 
  DeliveryQuote
} from '../services/deliveryService';
import orderService, { CreateOrderData, PaymentMethod as OrderPaymentMethod } from '../services/orderService';

type PaymentMethod = 'cod' | 'store_pickup';

interface SavedAddress {
  id: number;
  label: string;
  type: 'home' | 'office' | 'other';
  fullName: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  zipCode: string;
  isDefault: boolean;
  lat?: number;
  lng?: number;
}

const Checkout = () => {
  const navigate = useNavigate();
  const { items, removeFromCart } = useCart();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [orderError, setOrderError] = useState<string | null>(null);
  const [checkoutItems, setCheckoutItems] = useState<CartItem[]>([]);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [deliveryQuotes, setDeliveryQuotes] = useState<{
    quotes: DeliveryQuote[];
    recommended: DeliveryQuote;
    pickupOption: DeliveryQuote;
  } | null>(null);
  const [selectedDeliveryType, setSelectedDeliveryType] = useState<'motorcycle' | 'sedan' | 'mpv' | 'pickup_truck' | 'store_pickup'>('motorcycle');
  const [isStorePickup, setIsStorePickup] = useState(false);
  const [isLoadingQuotes, setIsLoadingQuotes] = useState(false);
  
  // Load selected items and saved addresses
  useEffect(() => {
    const selectedIds = sessionStorage.getItem('checkoutItems');
    if (selectedIds) {
      const ids: number[] = JSON.parse(selectedIds);
      const selected = items.filter(item => ids.includes(item.id));
      setCheckoutItems(selected);
    } else {
      setCheckoutItems(items);
    }

    // Load saved addresses
    if (user) {
      const stored = localStorage.getItem(`addresses_${user.id}`);
      if (stored) {
        const addresses: SavedAddress[] = JSON.parse(stored);
        setSavedAddresses(addresses);
        
        // Auto-select default address
        const defaultAddr = addresses.find(a => a.isDefault);
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr.id);
          setUseNewAddress(false);
        } else if (addresses.length > 0) {
          setSelectedAddressId(addresses[0].id);
          setUseNewAddress(false);
        } else {
          setUseNewAddress(true);
        }
      } else {
        setUseNewAddress(true);
      }
    }
  }, [items, user]);

  const selectedAddress = useMemo(() => 
    savedAddresses.find(a => a.id === selectedAddressId),
    [savedAddresses, selectedAddressId]
  );

  // Calculate delivery quotes when address changes
  useEffect(() => {
    const calculateDelivery = async () => {
      if (!selectedAddress || useNewAddress) {
        setDeliveryQuotes(null);
        return;
      }

      setIsLoadingQuotes(true);
      try {
        const quotes = await getDeliveryQuotes({
          address: selectedAddress.address,
          city: selectedAddress.city,
          province: selectedAddress.province,
          zipCode: selectedAddress.zipCode,
          lat: selectedAddress.lat,
          lng: selectedAddress.lng,
        });
        setDeliveryQuotes(quotes);
        setSelectedDeliveryType(quotes.recommended.vehicleType);
      } catch (error) {
        console.error('Failed to calculate delivery:', error);
      } finally {
        setIsLoadingQuotes(false);
      }
    };

    calculateDelivery();
  }, [selectedAddress, useNewAddress]);

  const [shippingInfo, setShippingInfo] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: user?.city || '',
    province: user?.province || '',
    zipCode: user?.zipCode || '',
    notes: '',
  });

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');

  const subtotal = useMemo(() => 
    checkoutItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [checkoutItems]
  );

  // Get selected delivery quote
  const selectedQuote = useMemo(() => {
    if (!deliveryQuotes) return null;
    
    // If store pickup is selected
    if (isStorePickup) {
      return deliveryQuotes.pickupOption;
    }
    
    if (!deliveryQuotes.quotes) return null;
    return deliveryQuotes.quotes.find(q => q.vehicleType === selectedDeliveryType) || deliveryQuotes.recommended;
  }, [deliveryQuotes, selectedDeliveryType, isStorePickup]);

  // Calculate shipping based on delivery quote or fallback
  const shipping = useMemo(() => {
    // Store pickup is free
    if (isStorePickup) {
      return 0;
    }
    
    if (selectedQuote) {
      return selectedQuote.totalFare;
    }
    
    // Fallback pricing if no quote available
    return 150;
  }, [selectedQuote, isStorePickup]);

  const total = subtotal + shipping;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setShippingInfo(prev => ({ ...prev, [name]: value }));
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setOrderError(null);

    try {
      // Prepare order data
      const shippingAddress = useNewAddress ? shippingInfo : selectedAddress;
      
      // Map payment method to order service format
      const mappedPaymentMethod: OrderPaymentMethod = paymentMethod === 'store_pickup' ? 'store_payment' : 'cod';

      const orderData: CreateOrderData = {
        customer_email: useNewAddress ? shippingInfo.email : user?.email || shippingInfo.email,
        customer_name: useNewAddress 
          ? `${shippingInfo.firstName} ${shippingInfo.lastName}` 
          : `${selectedAddress?.fullName || `${shippingInfo.firstName} ${shippingInfo.lastName}`}`,
        customer_phone: useNewAddress ? shippingInfo.phone : selectedAddress?.phone || shippingInfo.phone,
        user_id: user?.id,
        
        // Shipping
        shipping_address: useNewAddress 
          ? `${shippingInfo.address}, ${shippingInfo.city}, ${shippingInfo.province} ${shippingInfo.zipCode}`
          : `${selectedAddress?.address}, ${selectedAddress?.city}, ${selectedAddress?.province} ${selectedAddress?.zipCode}`,
        shipping_city: useNewAddress ? shippingInfo.city : selectedAddress?.city,
        shipping_province: useNewAddress ? shippingInfo.province : selectedAddress?.province,
        shipping_zip: useNewAddress ? shippingInfo.zipCode : selectedAddress?.zipCode,
        shipping_method: isStorePickup ? 'store_pickup' : 'delivery',
        vehicle_type: isStorePickup ? undefined : selectedDeliveryType,
        
        // Amounts
        subtotal: subtotal,
        shipping_fee: shipping,
        tax_amount: 0,
        discount_amount: 0,
        total_amount: total,
        
        // Payment
        payment_method: mappedPaymentMethod,
        
        // Items
        items: checkoutItems.map(item => ({
          product_id: item.productId || item.id,
          product_name: item.name,
          variation: item.variation || undefined,
          quantity: item.quantity,
          price: item.price,
          image: item.image
        })),
        
        notes: shippingInfo.notes || undefined
      };

      // Submit order to backend
      const result = await orderService.createOrder(orderData);

      if (result.success) {
        setOrderNumber(result.order_number || '');
        setInvoiceNumber(result.invoice_number || '');
        setOrderPlaced(true);

        // Remove checked out items from cart
        checkoutItems.forEach(item => removeFromCart(item.id));
        
        // Clear session storage
        sessionStorage.removeItem('checkoutItems');
      } else {
        setOrderError(result.message || 'Failed to place order. Please try again.');
      }
    } catch (error) {
      console.error('Order placement error:', error);
      setOrderError('An unexpected error occurred. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'home': return Home;
      case 'office': return Building2;
      default: return Briefcase;
    }
  };

  const getVehicleIcon = (type: string) => {
    switch (type) {
      case 'motorcycle': return Bike;
      case 'sedan': return Car;
      case 'mpv': return Car;
      case 'pickup_truck': return Truck;
      case 'store_pickup': return Store;
      default: return Package;
    }
  };

  // Redirect if no items to checkout
  if (checkoutItems.length === 0 && !orderPlaced) {
    return (
      <div className="min-h-screen bg-black-950 pt-16 sm:pt-20 lg:pt-24 pb-8 sm:pb-12 lg:pb-16">
        <div className="container-custom text-center py-10 sm:py-16 lg:py-20 px-4 sm:px-6">
          <ShoppingBag className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 text-gray-600 mx-auto mb-4 sm:mb-6" />
          <h2 className="text-xl sm:text-2xl font-display text-white mb-3 sm:mb-4">No items to checkout</h2>
          <p className="text-sm sm:text-base text-gray-400 mb-6 sm:mb-8">Select items from your cart to proceed with checkout.</p>
          <Link
            to="/cart"
            className="inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-600 text-black font-semibold px-6 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg transition-colors"
          >
            Go to Cart
          </Link>
        </div>
      </div>
    );
  }

  // Order Success View
  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-black-950 pt-16 sm:pt-20 lg:pt-24 pb-8 sm:pb-12 lg:pb-16">
        <div className="container-custom px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-lg mx-auto text-center py-10 sm:py-16 lg:py-20"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <Check className="w-8 h-8 sm:w-10 sm:h-10 text-green-500" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-white mb-3 sm:mb-4">Order Placed!</h1>
            <p className="text-sm sm:text-base text-gray-400 mb-1 sm:mb-2">Thank you for your order.</p>
            <p className="text-gold-500 font-semibold text-base sm:text-lg mb-2">Order #{orderNumber}</p>
            {invoiceNumber && (
              <p className="text-gray-400 text-sm mb-6 sm:mb-8">Invoice: {invoiceNumber}</p>
            )}
            
            {isStorePickup ? (
              <div className="bg-black-800 border border-green-500/20 rounded-lg p-4 mb-6 text-left">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                    <Store className="text-green-500 w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-white font-medium block">Store Pickup</span>
                    <span className="text-green-400 text-xs">Free pickup available</span>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">Blk 16 Lot1-A Brgy San Dionisio, Dasmariñas, Cavite</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-gray-400" />
                    <span className="text-gray-300">Mon-Sat: 9AM-7PM, Sun: 10AM-5PM</span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gold-500/10 flex items-start gap-2">
                  <Bell size={14} className="text-gold-400 mt-0.5" />
                  <p className="text-gray-400 text-xs">
                    We'll notify you when your order is ready for pickup. Please bring a valid ID.
                  </p>
                </div>
                <a
                  href="https://www.google.com/maps/search/?api=1&query=14.3294,120.9367"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-black font-medium text-xs px-4 py-2 rounded-lg transition-colors"
                >
                  <Navigation2 size={14} />
                  Get Directions
                  <ExternalLink size={12} />
                </a>
              </div>
            ) : (
              <div className="bg-black-800 border border-blue-500/20 rounded-lg p-4 mb-6 text-left">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <Truck className="text-blue-400 w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-white font-medium block">Cash on Delivery</span>
                    <span className="text-blue-400 text-xs">Delivered via Lalamove</span>
                  </div>
                </div>
                <p className="text-gray-400 text-sm mb-3">
                  Your order will be delivered to your address. Have the exact amount ready: <span className="text-gold-500 font-semibold">₱{total.toLocaleString()}</span>
                </p>
                <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20 mb-3">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-blue-400" />
                    <p className="text-blue-400 text-xs font-medium">
                      Estimated Delivery: <span className="text-white">Within 24 hours</span>
                    </p>
                  </div>
                  <p className="text-gray-400 text-xs mt-1 ml-5">
                    We need time to prepare your order and find an available Lalamove rider.
                  </p>
                </div>
                <div className="p-3 bg-gold-500/10 rounded-lg border border-gold-500/20">
                  <div className="flex items-start gap-2">
                    <Bell size={14} className="text-gold-400 mt-0.5" />
                    <div>
                      <p className="text-gold-400 text-xs font-medium mb-1">Tracking Link Coming Soon!</p>
                      <p className="text-gray-400 text-xs">
                        Once your order is ready for delivery, we'll send you the Lalamove tracking link via notification so you can track your package in real-time.
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-gray-500 text-xs mt-3">
                  Confirmation sent to: <span className="text-white">{useNewAddress ? shippingInfo.email : user?.email || shippingInfo.email}</span>
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Link
                to="/orders"
                className="bg-gold-500 hover:bg-gold-600 text-black font-semibold px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg transition-colors"
              >
                View Orders
              </Link>
              <Link
                to="/products"
                className="bg-black-800 hover:bg-black-700 text-white font-semibold px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg transition-colors border border-gold-500/30"
              >
                Continue Shopping
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Store location details
  const storeLocation = {
    name: 'Fragranza Olio Store',
    address: 'Blk 16 Lot1-A Brgy San Dionisio, Dasmariñas, Cavite',
    phone: '+63 912 345 6789',
    hours: 'Mon-Sat: 9AM-7PM, Sun: 10AM-5PM',
    lat: 14.3294,
    lng: 120.9367,
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=14.3294,120.9367'
  };

  const paymentMethods = [
    { id: 'cod' as const, name: 'Cash on Delivery via Lalamove', icon: Truck, description: 'Delivered within 24 hours. Tracking link sent via notification.' },
    { id: 'store_pickup' as const, name: 'Store Pickup', icon: Store, description: 'Pick up your order at our store and pay in cash or via QR' },
  ];

  return (
    <div className="min-h-screen bg-black-950 pt-16 sm:pt-20 lg:pt-24 pb-8 sm:pb-12 lg:pb-16">
      <div className="container-custom px-4 sm:px-6">
        {/* Back Button */}
        <Link
          to="/cart"
          className="inline-flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base text-gray-400 hover:text-gold-500 mb-4 sm:mb-6 lg:mb-8 transition-colors"
        >
          <ChevronLeft size={18} className="sm:w-5 sm:h-5" />
          Back to Cart
        </Link>

        <h1 className="text-2xl sm:text-3xl font-display font-bold text-white mb-4 sm:mb-6 lg:mb-8">Checkout</h1>

        <form onSubmit={handlePlaceOrder}>
          <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {/* Left Column - Forms */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6 lg:space-y-8">
              
              {/* Saved Addresses Section */}
              {savedAddresses.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-black-900 border border-gold-500/20 rounded-xl p-4 sm:p-6"
                >
                  <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <MapPin className="text-gold-500 w-5 h-5 sm:w-6 sm:h-6" />
                      <h2 className="text-lg sm:text-xl font-display font-bold text-white">Delivery Address</h2>
                    </div>
                    <Link
                      to="/addresses"
                      className="text-gold-500 hover:text-gold-400 text-sm flex items-center gap-1"
                    >
                      <Edit2 size={14} />
                      Manage
                    </Link>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    {savedAddresses.map(address => {
                      const TypeIcon = getTypeIcon(address.type);
                      const isSelected = selectedAddressId === address.id && !useNewAddress;
                      
                      return (
                        <label
                          key={address.id}
                          className={`relative flex cursor-pointer p-4 rounded-xl border transition-all ${
                            isSelected
                              ? 'border-gold-500 bg-gold-500/10 ring-2 ring-gold-500/20'
                              : 'border-gold-500/20 bg-black-800 hover:border-gold-500/50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="selectedAddress"
                            checked={isSelected}
                            onChange={() => {
                              setSelectedAddressId(address.id);
                              setUseNewAddress(false);
                            }}
                            className="sr-only"
                          />
                          
                          {/* Default Badge */}
                          {address.isDefault && (
                            <span className="absolute -top-2 -right-2 flex items-center gap-0.5 bg-gold-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full">
                              <Star size={8} fill="currentColor" />
                              Default
                            </span>
                          )}

                          <div className="flex gap-3 w-full">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              isSelected ? 'bg-gold-500 text-black' : 'bg-black-700 text-gold-500'
                            }`}>
                              <TypeIcon size={18} />
                            </div>
                            <div className="flex-grow min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-white text-sm">{address.label}</span>
                                <span className="text-xs text-gray-500 capitalize">({address.type})</span>
                              </div>
                              <p className="text-xs text-gray-400 mb-1">{address.fullName} • {address.phone}</p>
                              <p className="text-xs text-gray-500 line-clamp-2">
                                {address.address}, {address.city}, {address.province} {address.zipCode}
                              </p>
                            </div>
                            {isSelected && (
                              <Check className="text-gold-500 flex-shrink-0" size={20} />
                            )}
                          </div>
                        </label>
                      );
                    })}

                    {/* Add New Address Option */}
                    <label
                      className={`flex items-center justify-center cursor-pointer p-4 rounded-xl border border-dashed transition-all ${
                        useNewAddress
                          ? 'border-gold-500 bg-gold-500/10'
                          : 'border-gold-500/30 hover:border-gold-500/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="selectedAddress"
                        checked={useNewAddress}
                        onChange={() => {
                          setUseNewAddress(true);
                          setSelectedAddressId(null);
                        }}
                        className="sr-only"
                      />
                      <div className="text-center">
                        <Plus className="w-8 h-8 text-gold-500/50 mx-auto mb-2" />
                        <span className="text-sm text-gray-400">Use different address</span>
                      </div>
                    </label>
                  </div>

                  {/* Delivery Quote Display */}
                  {selectedAddress && !useNewAddress && (
                    <AnimatePresence mode="wait">
                      {isLoadingQuotes ? (
                        <motion.div
                          key="loading"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 pt-4 border-t border-gold-500/10"
                        >
                          <div className="flex items-center justify-center gap-2 py-4">
                            <Loader2 className="animate-spin text-gold-500" size={20} />
                            <span className="text-gray-400 text-sm">Calculating delivery...</span>
                          </div>
                        </motion.div>
                      ) : deliveryQuotes ? (
                        <motion.div
                          key="quotes"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 pt-4 border-t border-gold-500/10"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm text-gray-400">Delivery Options</span>
                            <span className="text-xs text-gray-500">
                              From: {deliveryQuotes.recommended.nearestStore.name}
                            </span>
                          </div>
                          
                          {/* Store Pickup Option */}
                          <button
                            type="button"
                            onClick={() => {
                              setIsStorePickup(true);
                              setSelectedDeliveryType('store_pickup');
                            }}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg border mb-3 transition-all ${
                              isStorePickup
                                ? 'border-green-500 bg-green-500/10'
                                : 'border-gold-500/20 bg-black-800 hover:border-gold-500/40'
                            }`}
                          >
                            <Store size={24} className={isStorePickup ? 'text-green-500' : 'text-gray-500'} />
                            <div className="flex-grow text-left">
                              <span className="text-sm text-white font-medium">Store Pickup</span>
                              <p className="text-xs text-gray-500">{deliveryQuotes.pickupOption.nearestStore.address}</p>
                            </div>
                            <div className="text-right">
                              <span className="text-green-500 font-bold">FREE</span>
                              {isStorePickup && <Check size={16} className="text-green-500 ml-2 inline" />}
                            </div>
                          </button>
                          
                          <p className="text-xs text-gray-500 mb-2">Or choose delivery:</p>
                          
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {deliveryQuotes.quotes.map(quote => {
                              const VehicleIcon = getVehicleIcon(quote.vehicleType);
                              const isSelected = !isStorePickup && selectedDeliveryType === quote.vehicleType;
                              
                              return (
                                <button
                                  key={quote.vehicleType}
                                  type="button"
                                  onClick={() => {
                                    setIsStorePickup(false);
                                    setSelectedDeliveryType(quote.vehicleType as any);
                                  }}
                                  className={`flex flex-col items-center p-3 rounded-lg border transition-all ${
                                    isSelected
                                      ? 'border-gold-500 bg-gold-500/10'
                                      : 'border-gold-500/20 bg-black-800 hover:border-gold-500/40'
                                  }`}
                                >
                                  <VehicleIcon size={20} className={isSelected ? 'text-gold-500' : 'text-gray-500'} />
                                  <span className="text-xs text-white mt-1">{quote.vehicleLabel}</span>
                                  <span className="text-xs font-semibold mt-0.5 text-gold-500">
                                    ₱{quote.totalFare.toLocaleString()}
                                  </span>
                                  <span className="text-[10px] text-gray-500 flex items-center gap-0.5 mt-0.5">
                                    <Clock size={8} />
                                    {quote.estimatedTime} min
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                          
                          {selectedQuote && !isStorePickup && (
                            <p className="text-gray-500 text-xs mt-2">
                              Distance: {selectedQuote.distance}km • Zone: {selectedQuote.zoneName}
                            </p>
                          )}
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  )}
                </motion.div>
              )}

              {/* Manual Shipping Information - Show if no saved addresses or using new address */}
              <AnimatePresence>
                {(savedAddresses.length === 0 || useNewAddress) && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-black-900 border border-gold-500/20 rounded-xl p-4 sm:p-6"
                  >
                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <MapPin className="text-gold-500 w-5 h-5 sm:w-6 sm:h-6" />
                        <h2 className="text-lg sm:text-xl font-display font-bold text-white">Shipping Information</h2>
                      </div>
                      <Link
                        to="/addresses"
                        className="text-gold-500 hover:text-gold-400 text-sm flex items-center gap-1"
                      >
                        <Plus size={14} />
                        Save Address
                      </Link>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-xs sm:text-sm text-gray-400 mb-1.5 sm:mb-2">First Name</label>
                        <input
                          type="text"
                          name="firstName"
                          value={shippingInfo.firstName}
                          onChange={handleInputChange}
                          required={useNewAddress || savedAddresses.length === 0}
                          className="w-full bg-black-800 border border-gold-500/30 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white focus:outline-none focus:border-gold-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm text-gray-400 mb-1.5 sm:mb-2">Last Name</label>
                        <input
                          type="text"
                          name="lastName"
                          value={shippingInfo.lastName}
                          onChange={handleInputChange}
                          required={useNewAddress || savedAddresses.length === 0}
                          className="w-full bg-black-800 border border-gold-500/30 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white focus:outline-none focus:border-gold-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm text-gray-400 mb-1.5 sm:mb-2">Email</label>
                        <input
                          type="email"
                          name="email"
                          value={shippingInfo.email}
                          onChange={handleInputChange}
                          required={useNewAddress || savedAddresses.length === 0}
                          className="w-full bg-black-800 border border-gold-500/30 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white focus:outline-none focus:border-gold-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm text-gray-400 mb-1.5 sm:mb-2">Phone</label>
                        <input
                          type="tel"
                          name="phone"
                          value={shippingInfo.phone}
                          onChange={handleInputChange}
                          required={useNewAddress || savedAddresses.length === 0}
                          className="w-full bg-black-800 border border-gold-500/30 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white focus:outline-none focus:border-gold-500"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs sm:text-sm text-gray-400 mb-1.5 sm:mb-2">Address</label>
                        <input
                          type="text"
                          name="address"
                          value={shippingInfo.address}
                          onChange={handleInputChange}
                          required={useNewAddress || savedAddresses.length === 0}
                          placeholder="Street address, building, unit"
                          className="w-full bg-black-800 border border-gold-500/30 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white placeholder-gray-600 focus:outline-none focus:border-gold-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm text-gray-400 mb-1.5 sm:mb-2">City</label>
                        <input
                          type="text"
                          name="city"
                          value={shippingInfo.city}
                          onChange={handleInputChange}
                          required={useNewAddress || savedAddresses.length === 0}
                          className="w-full bg-black-800 border border-gold-500/30 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white focus:outline-none focus:border-gold-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm text-gray-400 mb-1.5 sm:mb-2">Province</label>
                        <input
                          type="text"
                          name="province"
                          value={shippingInfo.province}
                          onChange={handleInputChange}
                          required={useNewAddress || savedAddresses.length === 0}
                          className="w-full bg-black-800 border border-gold-500/30 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white focus:outline-none focus:border-gold-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm text-gray-400 mb-1.5 sm:mb-2">ZIP Code</label>
                        <input
                          type="text"
                          name="zipCode"
                          value={shippingInfo.zipCode}
                          onChange={handleInputChange}
                          required={useNewAddress || savedAddresses.length === 0}
                          className="w-full bg-black-800 border border-gold-500/30 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white focus:outline-none focus:border-gold-500"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs sm:text-sm text-gray-400 mb-1.5 sm:mb-2">Order Notes (Optional)</label>
                        <textarea
                          name="notes"
                          value={shippingInfo.notes}
                          onChange={handleInputChange}
                          rows={3}
                          placeholder="Special instructions for delivery..."
                          className="w-full bg-black-800 border border-gold-500/30 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white placeholder-gray-600 focus:outline-none focus:border-gold-500 resize-none"
                        />
                      </div>
                    </div>

                    {/* Flat rate notice for manual entry */}
                    <div className="mt-4 p-3 bg-gold-500/10 border border-gold-500/20 rounded-lg">
                      <p className="text-gold-500 text-xs flex items-center gap-2">
                        <Truck size={14} />
                        Tip: Save your address with location for accurate delivery pricing!
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Order Notes for saved address */}
              {!useNewAddress && selectedAddress && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-black-900 border border-gold-500/20 rounded-xl p-4 sm:p-6"
                >
                  <label className="block text-xs sm:text-sm text-gray-400 mb-1.5 sm:mb-2">Order Notes (Optional)</label>
                  <textarea
                    name="notes"
                    value={shippingInfo.notes}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Special instructions for delivery..."
                    className="w-full bg-black-800 border border-gold-500/30 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white placeholder-gray-600 focus:outline-none focus:border-gold-500 resize-none"
                  />
                </motion.div>
              )}

              {/* Payment Method */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-black-900 border border-gold-500/20 rounded-xl p-4 sm:p-6"
              >
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <CreditCard className="text-gold-500 w-5 h-5 sm:w-6 sm:h-6" />
                  <h2 className="text-lg sm:text-xl font-display font-bold text-white">Payment Method</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {paymentMethods.map(method => (
                    <label
                      key={method.id}
                      className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border cursor-pointer transition-all ${
                        paymentMethod === method.id
                          ? 'border-gold-500 bg-gold-500/10'
                          : 'border-gold-500/20 bg-black-800 hover:border-gold-500/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.id}
                        checked={paymentMethod === method.id}
                        onChange={() => setPaymentMethod(method.id)}
                        className="sr-only"
                      />
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        paymentMethod === method.id ? 'bg-gold-500 text-black' : 'bg-black-700 text-gold-500'
                      }`}>
                        <method.icon size={16} className="sm:w-5 sm:h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm sm:text-base text-white font-medium">{method.name}</p>
                        <p className="text-gray-400 text-xs sm:text-sm truncate">{method.description}</p>
                      </div>
                      {paymentMethod === method.id && (
                        <Check className="ml-auto text-gold-500 flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5" />
                      )}
                    </label>
                  ))}
                </div>

                {/* COD - Lalamove Info Banner */}
                <AnimatePresence>
                  {paymentMethod === 'cod' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                          <Truck className="text-blue-400" size={20} />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-white font-medium text-sm mb-1">Delivery via Lalamove</h4>
                          <p className="text-gray-400 text-xs leading-relaxed">
                            Your order will be delivered by our trusted partner <span className="text-blue-400 font-semibold">Lalamove</span>. 
                            Once your order is confirmed and ready for pickup, we'll send you the tracking link via 
                            <span className="text-gold-400 font-medium"> notification </span> 
                            so you can track your package in real-time.
                          </p>
                          <div className="flex items-center gap-2 mt-2 p-2 bg-black-900/50 rounded">
                            <Clock size={14} className="text-blue-400" />
                            <span className="text-blue-300 text-xs">Estimated Delivery: <span className="text-white font-medium">Within 24 hours</span></span>
                          </div>
                          <p className="text-gray-500 text-xs mt-1">
                            We need time to prepare your order and find an available rider.
                          </p>
                          <div className="flex items-center gap-2 mt-3 text-xs">
                            <Bell size={12} className="text-gold-400" />
                            <span className="text-gold-400">Check your notifications for tracking updates</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Store Pickup - Map and Location Details */}
                <AnimatePresence>
                  {paymentMethod === 'store_pickup' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4"
                    >
                      {/* Store Map */}
                      <div className="rounded-lg overflow-hidden border border-gold-500/20 mb-4">
                        <iframe
                          src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${storeLocation.lat},${storeLocation.lng}&zoom=16`}
                          width="100%"
                          height="200"
                          style={{ border: 0 }}
                          allowFullScreen
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          className="w-full"
                          title="Fragranza Store Location"
                        />
                      </div>

                      {/* Store Details Card */}
                      <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <Store className="text-green-400" size={20} />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-white font-medium text-sm mb-2">{storeLocation.name}</h4>
                            
                            <div className="space-y-2 text-xs">
                              <div className="flex items-start gap-2">
                                <MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                                <span className="text-gray-300">{storeLocation.address}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone size={14} className="text-gray-400" />
                                <span className="text-gray-300">{storeLocation.phone}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock size={14} className="text-gray-400" />
                                <span className="text-gray-300">{storeLocation.hours}</span>
                              </div>
                            </div>

                            {/* Get Directions Button */}
                            <a
                              href={storeLocation.googleMapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-3 inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-black font-medium text-xs px-4 py-2 rounded-lg transition-colors"
                            >
                              <Navigation2 size={14} />
                              Get Directions
                              <ExternalLink size={12} />
                            </a>
                          </div>
                        </div>

                        {/* Info Banner */}
                        <div className="mt-4 pt-3 border-t border-green-500/20">
                          <div className="flex items-start gap-2">
                            <Info size={14} className="text-green-400 mt-0.5 flex-shrink-0" />
                            <p className="text-gray-400 text-xs leading-relaxed">
                              Once your order is ready, we'll notify you. Please bring a valid ID and your order confirmation when picking up.
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-black-900 border border-gold-500/20 rounded-xl p-4 sm:p-6 lg:sticky lg:top-24"
              >
                <h2 className="text-lg sm:text-xl font-display font-bold text-white mb-4 sm:mb-6">Order Summary</h2>

                {/* Selected Delivery Address Preview */}
                {isStorePickup && deliveryQuotes ? (
                  <div className="mb-4 p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                    <p className="text-xs text-green-500 mb-1 flex items-center gap-1">
                      <Store size={12} />
                      Store Pickup
                    </p>
                    <p className="text-sm text-white font-medium">{deliveryQuotes.pickupOption.nearestStore.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {deliveryQuotes.pickupOption.nearestStore.address}
                    </p>
                  </div>
                ) : selectedAddress && !useNewAddress ? (
                  <div className="mb-4 p-3 bg-black-800 rounded-lg border border-gold-500/10">
                    <p className="text-xs text-gray-500 mb-1">Delivering to</p>
                    <p className="text-sm text-white font-medium">{selectedAddress.label}</p>
                    <p className="text-xs text-gray-400 line-clamp-2 mt-0.5">
                      {selectedAddress.address}, {selectedAddress.city}
                    </p>
                  </div>
                ) : null}

                {/* Items */}
                <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6 max-h-48 sm:max-h-64 overflow-y-auto">
                  {checkoutItems.map(item => (
                    <div key={item.id} className="flex gap-2 sm:gap-3">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-black-800 rounded-lg overflow-hidden flex-shrink-0">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-grow min-w-0">
                        <h4 className="text-white text-xs sm:text-sm font-medium truncate">{item.name}</h4>
                        <p className="text-gray-400 text-xs">{item.variation}</p>
                        <p className="text-gray-400 text-xs">Qty: {item.quantity}</p>
                      </div>
                      <div className="text-gold-500 text-xs sm:text-sm font-medium flex-shrink-0">
                        ₱{(item.price * item.quantity).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="space-y-2 sm:space-y-3 border-t border-gold-500/20 pt-3 sm:pt-4 mb-4 sm:mb-6">
                  <div className="flex justify-between text-sm sm:text-base text-gray-400">
                    <span>Subtotal</span>
                    <span>₱{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm sm:text-base text-gray-400">
                    <div className="flex items-center gap-1">
                      <span>Shipping</span>
                      {isStorePickup ? (
                        <span className="text-xs text-green-500">(Store Pickup)</span>
                      ) : selectedQuote && (
                        <span className="text-xs text-gray-500">{selectedQuote.vehicleLabel}</span>
                      )}
                    </div>
                    <span className={shipping === 0 ? 'text-green-500' : ''}>
                      {shipping === 0 ? 'FREE' : `₱${shipping.toLocaleString()}`}
                    </span>
                  </div>
                  {selectedQuote && !isStorePickup && (
                    <div className="flex justify-between text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        Est. delivery
                      </span>
                      <span>Within 24 hours</span>
                    </div>
                  )}
                  <div className="flex justify-between text-white font-semibold text-base sm:text-lg pt-2 border-t border-gold-500/20">
                    <span>Total</span>
                    <span className="text-gold-500">₱{total.toLocaleString()}</span>
                  </div>
                </div>

                {/* Error Display */}
                {orderError && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4 flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-red-400 text-sm">{orderError}</p>
                  </div>
                )}

                {/* Place Order Button */}
                <button
                  type="submit"
                  disabled={isProcessing || (!selectedAddress && !useNewAddress && savedAddresses.length > 0)}
                  className="w-full bg-gold-500 hover:bg-gold-600 disabled:bg-gold-500/50 disabled:cursor-not-allowed text-black font-semibold py-3 sm:py-4 text-sm sm:text-base rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Lock size={16} className="sm:w-[18px] sm:h-[18px]" />
                      Place Order • ₱{total.toLocaleString()}
                    </>
                  )}
                </button>

                <p className="text-center text-gray-500 text-xs mt-3 sm:mt-4">
                  <Lock size={10} className="inline mr-1 sm:w-3 sm:h-3" />
                  Your payment information is secure
                </p>
              </motion.div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Checkout;
