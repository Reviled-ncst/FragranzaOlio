import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  Plus, 
  Edit2, 
  Trash2, 
  Check, 
  X, 
  Home, 
  Building2, 
  Briefcase,
  Star,
  Phone,
  User,
  Navigation,
  Loader2,
  Search,
  Layers,
  ZoomIn,
  ZoomOut,
  Truck,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap, Popup, Circle as LeafletCircle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getDeliveryQuotes, findNearestStore, DeliveryQuote, STORE_LOCATIONS } from '../services/deliveryService';

// Fix for default marker icon in Leaflet with Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

L.Marker.prototype.options.icon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Custom gold marker for selected location
const GoldIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="
    background: linear-gradient(135deg, #D4AF37, #B8860B);
    width: 32px;
    height: 32px;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    border: 3px solid white;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  "><div style="
    width: 12px;
    height: 12px;
    background: white;
    border-radius: 50%;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  "></div></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

// Store marker icon
const StoreIcon = L.divIcon({
  className: 'store-marker',
  html: `<div style="
    background: linear-gradient(135deg, #10b981, #059669);
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 2px solid white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
  "><span style="font-size: 12px;">🏪</span></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

interface Address {
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

// Map click handler component
const MapClickHandler = ({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click: (e) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

// Recenter map component
const RecenterMap = ({ lat, lng }: { lat: number; lng: number }) => {
  const map = useMap();
  const prevRef = useRef({ lat, lng });
  
  useEffect(() => {
    if (prevRef.current.lat !== lat || prevRef.current.lng !== lng) {
      map.flyTo([lat, lng], 16, { duration: 1 });
      prevRef.current = { lat, lng };
    }
  }, [lat, lng, map]);
  
  return null;
};

const Addresses = () => {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<{ display_name: string; lat: string; lon: string }>>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [selectedMapLayer, setSelectedMapLayer] = useState<'dark' | 'streets'>('dark');
  const [deliveryQuote, setDeliveryQuote] = useState<DeliveryQuote | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const defaultCenter = { lat: 14.5995, lng: 120.9842 }; // Manila
  
  const [formData, setFormData] = useState({
    label: '',
    type: 'home' as 'home' | 'office' | 'other',
    fullName: '',
    phone: '',
    address: '',
    city: '',
    province: '',
    zipCode: '',
    isDefault: false,
    lat: defaultCenter.lat,
    lng: defaultCenter.lng,
  });

  // Load addresses from localStorage
  useEffect(() => {
    if (user) {
      const stored = localStorage.getItem(`addresses_${user.id}`);
      if (stored) {
        setAddresses(JSON.parse(stored));
      }
    }
  }, [user]);

  const saveAddresses = (newAddresses: Address[]) => {
    if (user) {
      localStorage.setItem(`addresses_${user.id}`, JSON.stringify(newAddresses));
      setAddresses(newAddresses);
    }
  };

  const openAddModal = () => {
    setEditingAddress(null);
    setFormData({
      label: '',
      type: 'home',
      fullName: user ? `${user.firstName} ${user.lastName}` : '',
      phone: user?.phone || '',
      address: '',
      city: '',
      province: '',
      zipCode: '',
      isDefault: addresses.length === 0,
      lat: defaultCenter.lat,
      lng: defaultCenter.lng,
    });
    setSearchQuery('');
    setDeliveryQuote(null);
    setShowModal(true);
  };

  const openEditModal = (address: Address) => {
    setEditingAddress(address);
    setFormData({
      label: address.label,
      type: address.type,
      fullName: address.fullName,
      phone: address.phone,
      address: address.address,
      city: address.city,
      province: address.province,
      zipCode: address.zipCode,
      isDefault: address.isDefault,
      lat: address.lat || defaultCenter.lat,
      lng: address.lng || defaultCenter.lng,
    });
    setSearchQuery('');
    setShowModal(true);
    
    // Calculate delivery quote for this address
    if (address.lat && address.lng) {
      calculateDeliveryQuote(address.lat, address.lng, address.province || address.city);
    }
  };

  const calculateDeliveryQuote = async (lat: number, lng: number, province: string) => {
    try {
      const quotes = await getDeliveryQuotes({
        address: formData.address,
        city: formData.city,
        province: province,
        zipCode: formData.zipCode,
        lat,
        lng,
      });
      setDeliveryQuote(quotes.recommended);
    } catch (err) {
      console.error('Failed to calculate delivery:', err);
    }
  };

  // Reverse geocode to get address from coordinates
  const reverseGeocode = async (lat: number, lng: number) => {
    setIsReverseGeocoding(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );
      const data = await response.json();
      
      if (data && data.address) {
        const addr = data.address;
        const city = addr.city || addr.town || addr.municipality || addr.county || '';
        const province = addr.state || addr.region || addr.province || '';
        
        setFormData(prev => ({
          ...prev,
          lat,
          lng,
          address: [
            addr.house_number,
            addr.road || addr.street,
            addr.suburb || addr.neighbourhood || addr.village
          ].filter(Boolean).join(', ') || data.display_name?.split(',')[0] || '',
          city,
          province,
          zipCode: addr.postcode || '',
        }));
        
        // Calculate delivery quote
        calculateDeliveryQuote(lat, lng, province || city);
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    setFormData(prev => ({ ...prev, lat, lng }));
    reverseGeocode(lat, lng);
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setFormData(prev => ({ ...prev, lat: latitude, lng: longitude }));
        reverseGeocode(latitude, longitude);
        setIsLocating(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Unable to get your location. Please allow location access or pick manually on the map.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const searchLocations = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}, Philippines&limit=5&addressdetails=1`
      );
      const data = await response.json();
      setSearchResults(data || []);
      setShowSearchDropdown(data && data.length > 0);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      searchLocations(value);
    }, 300);
  };

  const selectSearchResult = (result: { display_name: string; lat: string; lon: string }) => {
    const latitude = parseFloat(result.lat);
    const longitude = parseFloat(result.lon);
    
    setFormData(prev => ({ ...prev, lat: latitude, lng: longitude }));
    reverseGeocode(latitude, longitude);
    setSearchQuery(result.display_name.split(',')[0]);
    setShowSearchDropdown(false);
    setSearchResults([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingAddress) {
      let updatedAddresses = addresses.map(addr => 
        addr.id === editingAddress.id 
          ? { ...addr, ...formData }
          : formData.isDefault ? { ...addr, isDefault: false } : addr
      );
      saveAddresses(updatedAddresses);
    } else {
      const newAddress: Address = {
        id: Date.now(),
        ...formData,
      };
      
      let updatedAddresses = formData.isDefault
        ? addresses.map(addr => ({ ...addr, isDefault: false }))
        : [...addresses];
      
      updatedAddresses.push(newAddress);
      saveAddresses(updatedAddresses);
    }
    
    setShowModal(false);
  };

  const handleDelete = (id: number) => {
    const addressToDelete = addresses.find(addr => addr.id === id);
    let updatedAddresses = addresses.filter(addr => addr.id !== id);
    
    if (addressToDelete?.isDefault && updatedAddresses.length > 0) {
      updatedAddresses[0].isDefault = true;
    }
    
    saveAddresses(updatedAddresses);
    setDeleteConfirm(null);
  };

  const setAsDefault = (id: number) => {
    const updatedAddresses = addresses.map(addr => ({
      ...addr,
      isDefault: addr.id === id,
    }));
    saveAddresses(updatedAddresses);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'home': return Home;
      case 'office': return Building2;
      default: return Briefcase;
    }
  };

  const getGoogleMapsLink = (address: Address) => {
    if (address.lat && address.lng) {
      return `https://www.google.com/maps?q=${address.lat},${address.lng}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${address.address}, ${address.city}, ${address.province} ${address.zipCode}`
    )}`;
  };

  const mapLayers = {
    dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    streets: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black-950 via-black-900 to-black-950 pt-20 pb-8 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-gold-400 to-gold-600 rounded-2xl flex items-center justify-center shadow-lg shadow-gold-500/20">
                <MapPin className="w-6 h-6 text-black" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">My Addresses</h1>
                <p className="text-sm text-gray-400">Manage your delivery locations</p>
              </div>
            </div>
            
            <button
              onClick={openAddModal}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-gold-400 to-gold-600 hover:from-gold-500 hover:to-gold-700 text-black font-semibold px-6 py-3 rounded-xl transition-all shadow-lg shadow-gold-500/20 hover:shadow-gold-500/30"
            >
              <Plus size={20} />
              <span>Add Address</span>
            </button>
          </div>
        </motion.div>

        {/* Empty State */}
        {addresses.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-gold-500/20 to-gold-600/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <MapPin className="w-12 h-12 text-gold-500/60" />
            </div>
            <h2 className="text-xl font-display text-white mb-3">No addresses saved</h2>
            <p className="text-gray-400 mb-8 max-w-sm mx-auto">
              Add your shipping addresses for faster checkout and accurate delivery cost calculation.
            </p>
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-gold-400 to-gold-600 hover:from-gold-500 hover:to-gold-700 text-black font-semibold px-8 py-4 rounded-xl transition-all shadow-lg shadow-gold-500/20"
            >
              <Plus size={20} />
              Add Your First Address
            </button>
          </motion.div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {addresses.map((address, index) => {
              const TypeIcon = getTypeIcon(address.type);
              
              return (
                <motion.div
                  key={address.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`relative bg-gradient-to-br from-black-900 to-black-800 border rounded-2xl overflow-hidden ${
                    address.isDefault 
                      ? 'border-gold-500 ring-2 ring-gold-500/20' 
                      : 'border-gold-500/20 hover:border-gold-500/50'
                  }`}
                >
                  {/* Default Badge */}
                  {address.isDefault && (
                    <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-gold-500 text-black text-xs font-bold px-2 py-1 rounded-full">
                      <Star size={10} fill="currentColor" />
                      Default
                    </div>
                  )}

                  {/* Mini Map */}
                  {address.lat && address.lng && (
                    <div className="h-32 relative">
                      <MapContainer
                        center={[address.lat, address.lng]}
                        zoom={15}
                        scrollWheelZoom={false}
                        dragging={false}
                        zoomControl={false}
                        attributionControl={false}
                        className="h-full w-full"
                        style={{ background: '#1a1a1a' }}
                      >
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                        <Marker position={[address.lat, address.lng]} icon={GoldIcon} />
                      </MapContainer>
                      <div className="absolute inset-0 bg-gradient-to-t from-black-900 via-transparent to-transparent pointer-events-none" />
                    </div>
                  )}

                  <div className="p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 bg-gradient-to-br from-gold-500/20 to-gold-600/10 rounded-xl flex items-center justify-center">
                          <TypeIcon size={18} className="text-gold-500" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{address.label}</h3>
                          <span className="text-xs text-gray-500 capitalize">{address.type}</span>
                        </div>
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-gray-300">
                        <User size={14} className="text-gray-500" />
                        <span className="text-sm truncate">{address.fullName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-300">
                        <Phone size={14} className="text-gray-500" />
                        <span className="text-sm">{address.phone}</span>
                      </div>
                      <div className="flex items-start gap-2 text-gray-300">
                        <MapPin size={14} className="text-gray-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm line-clamp-2">
                          {address.address}, {address.city}, {address.province} {address.zipCode}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons - Always Visible */}
                    <div className="flex flex-wrap gap-2 pt-3 border-t border-gold-500/10">
                      {!address.isDefault && (
                        <button
                          onClick={() => setAsDefault(address.id)}
                          className="flex-1 min-w-[80px] flex items-center justify-center gap-1 text-xs text-gold-500 hover:text-gold-400 py-2 px-3 rounded-lg bg-gold-500/10 hover:bg-gold-500/20 transition-all"
                        >
                          <Star size={12} />
                          Set Default
                        </button>
                      )}
                      
                      <button
                        onClick={() => openEditModal(address)}
                        className="flex-1 min-w-[60px] flex items-center justify-center gap-1 text-xs text-gray-400 hover:text-white py-2 px-3 rounded-lg bg-black-700 hover:bg-black-600 transition-all"
                      >
                        <Edit2 size={12} />
                        Edit
                      </button>
                      
                      <a
                        href={getGoogleMapsLink(address)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 min-w-[60px] flex items-center justify-center gap-1 text-xs text-gray-400 hover:text-white py-2 px-3 rounded-lg bg-black-700 hover:bg-black-600 transition-all"
                      >
                        <ExternalLink size={12} />
                        Open
                      </a>
                      
                      {deleteConfirm === address.id ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleDelete(address.id)}
                            className="flex items-center justify-center text-xs text-white py-2 px-3 rounded-lg bg-red-500 hover:bg-red-600 transition-all"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="flex items-center justify-center text-xs text-gray-400 py-2 px-3 rounded-lg bg-black-700 hover:bg-black-600 transition-all"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(address.id)}
                          className="flex items-center justify-center text-xs text-gray-400 hover:text-red-400 py-2 px-3 rounded-lg bg-black-700 hover:bg-red-500/20 transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Delivery Info Banner */}
        {addresses.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 bg-gradient-to-r from-gold-500/10 to-gold-600/5 border border-gold-500/20 rounded-2xl p-6"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-12 h-12 bg-gold-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Truck className="text-gold-500" size={24} />
              </div>
              <div className="flex-grow">
                <h3 className="text-white font-semibold mb-1">Delivery Cost Calculation</h3>
                <p className="text-gray-400 text-sm">
                  We calculate delivery costs based on your location using Lalamove-style rates. 
                  Orders over ₱2,000 qualify for free shipping within Metro Manila.
                </p>
              </div>
              <Link
                to="/checkout"
                className="flex-shrink-0 bg-gold-500 hover:bg-gold-600 text-black font-semibold px-6 py-2.5 rounded-lg transition-colors"
              >
                Proceed to Checkout
              </Link>
            </div>
          </motion.div>
        )}

        {/* Add/Edit Modal */}
        <AnimatePresence>
          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowModal(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-2xl bg-gradient-to-br from-black-900 to-black-800 border border-gold-500/30 rounded-2xl overflow-hidden max-h-[90vh] flex flex-col"
              >
                {/* Modal Header */}
                <div className="p-4 border-b border-gold-500/20 flex items-center justify-between flex-shrink-0">
                  <h2 className="text-xl font-display font-bold text-white">
                    {editingAddress ? 'Edit Address' : 'Add New Address'}
                  </h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto">
                  {/* Map Section */}
                  <div className="relative h-56 sm:h-64 bg-black-800">
                    <MapContainer
                      center={[formData.lat, formData.lng]}
                      zoom={15}
                      className="h-full w-full"
                      style={{ background: '#1a1a1a' }}
                      zoomControl={false}
                      ref={(map) => { if (map) mapRef.current = map; }}
                    >
                      <TileLayer url={mapLayers[selectedMapLayer]} />
                      
                      <Marker position={[formData.lat, formData.lng]} icon={GoldIcon}>
                        <Popup>
                          <div className="text-center">
                            <p className="font-semibold text-sm">📍 Your Location</p>
                            <p className="text-xs text-gray-600">{formData.address || 'Tap to select'}</p>
                          </div>
                        </Popup>
                      </Marker>
                      
                      {/* Store Markers */}
                      {STORE_LOCATIONS.map(store => (
                        <Marker 
                          key={store.id}
                          position={[store.lat, store.lng]} 
                          icon={StoreIcon}
                        >
                          <Popup>
                            <div className="text-center">
                              <p className="font-bold text-sm text-green-600">🏪 {store.name}</p>
                              <p className="text-xs text-gray-600">{store.city}</p>
                            </div>
                          </Popup>
                        </Marker>
                      ))}

                      {/* Delivery Radius */}
                      <LeafletCircle
                        center={[formData.lat, formData.lng]}
                        radius={3000}
                        pathOptions={{
                          color: '#D4AF37',
                          fillColor: '#D4AF37',
                          fillOpacity: 0.05,
                          weight: 1,
                          dashArray: '5, 5'
                        }}
                      />
                      
                      <MapClickHandler onLocationSelect={handleLocationSelect} />
                      <RecenterMap lat={formData.lat} lng={formData.lng} />
                    </MapContainer>

                    {/* Search Box */}
                    <div className="absolute top-3 left-3 right-3 z-[1000]">
                      <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={handleSearchInputChange}
                          onFocus={() => searchResults.length > 0 && setShowSearchDropdown(true)}
                          placeholder="Search for a location..."
                          className="w-full bg-black-900/95 backdrop-blur-sm border border-gold-500/30 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-gold-500"
                        />
                        {isSearching && (
                          <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gold-500" />
                        )}
                      </div>

                      {/* Search Results */}
                      <AnimatePresence>
                        {showSearchDropdown && searchResults.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute top-full left-0 right-0 mt-1 bg-black-900/95 backdrop-blur-sm border border-gold-500/30 rounded-xl overflow-hidden shadow-xl max-h-48 overflow-y-auto"
                          >
                            {searchResults.map((result, index) => (
                              <button
                                key={index}
                                onClick={() => selectSearchResult(result)}
                                className="w-full px-4 py-3 text-left hover:bg-gold-500/10 transition-colors border-b border-gold-500/10 last:border-b-0"
                              >
                                <div className="flex items-start gap-2">
                                  <MapPin size={14} className="text-gold-500 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <p className="text-white text-sm font-medium">
                                      {result.display_name.split(',')[0]}
                                    </p>
                                    <p className="text-gray-400 text-xs truncate">
                                      {result.display_name.split(',').slice(1, 3).join(',')}
                                    </p>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Map Controls */}
                    <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-1">
                      <button
                        onClick={() => mapRef.current?.zoomIn()}
                        className="p-2 bg-black-900/90 border border-gold-500/30 rounded-lg text-gold-500 hover:bg-gold-500/20"
                      >
                        <ZoomIn size={16} />
                      </button>
                      <button
                        onClick={() => mapRef.current?.zoomOut()}
                        className="p-2 bg-black-900/90 border border-gold-500/30 rounded-lg text-gold-500 hover:bg-gold-500/20"
                      >
                        <ZoomOut size={16} />
                      </button>
                      <button
                        onClick={() => setSelectedMapLayer(prev => prev === 'dark' ? 'streets' : 'dark')}
                        className="p-2 bg-black-900/90 border border-gold-500/30 rounded-lg text-gold-500 hover:bg-gold-500/20"
                      >
                        <Layers size={16} />
                      </button>
                    </div>

                    {/* Location Button */}
                    <div className="absolute bottom-3 right-3 z-[1000]">
                      <button
                        onClick={getCurrentLocation}
                        disabled={isLocating}
                        className="flex items-center gap-2 bg-black-900/90 border border-gold-500/30 hover:border-gold-500 text-gold-500 px-3 py-2 rounded-lg transition-all"
                      >
                        {isLocating ? <Loader2 size={16} className="animate-spin" /> : <Navigation size={16} />}
                        <span className="text-sm">My Location</span>
                      </button>
                    </div>

                    {/* Delivery Quote Preview */}
                    {deliveryQuote && (
                      <div className="absolute bottom-3 left-3 z-[1000] bg-black-900/95 border border-gold-500/30 rounded-lg px-3 py-2">
                        <p className="text-xs text-gray-400">Est. Delivery</p>
                        <p className="text-sm text-gold-500 font-medium">
                          ₱{deliveryQuote.totalFare} • {deliveryQuote.estimatedTime} mins
                        </p>
                        <p className="text-xs text-gray-500">from {deliveryQuote.nearestStore.name}</p>
                      </div>
                    )}

                    {/* Loading Overlay */}
                    {isReverseGeocoding && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-[1001]">
                        <div className="flex items-center gap-2 bg-black-900 px-4 py-2 rounded-lg">
                          <Loader2 size={20} className="animate-spin text-gold-500" />
                          <span className="text-white text-sm">Getting address...</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Instruction */}
                  <div className="bg-gradient-to-r from-gold-500/20 to-gold-600/10 border-b border-gold-500/20 px-4 py-3">
                    <p className="text-gold-500 text-sm flex items-center gap-2">
                      <MapPin size={14} />
                      <span>Tap on the map to select your delivery location</span>
                    </p>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
                    {/* Label & Type */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Address Label</label>
                        <input
                          type="text"
                          name="label"
                          value={formData.label}
                          onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                          placeholder="e.g., My Home"
                          required
                          className="w-full bg-black-800 border border-gold-500/30 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-gold-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Type</label>
                        <select
                          name="type"
                          value={formData.type}
                          onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                          className="w-full bg-black-800 border border-gold-500/30 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold-500"
                        >
                          <option value="home">🏠 Home</option>
                          <option value="office">🏢 Office</option>
                          <option value="other">📍 Other</option>
                        </select>
                      </div>
                    </div>

                    {/* Name & Phone */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Full Name</label>
                        <input
                          type="text"
                          value={formData.fullName}
                          onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                          placeholder="Enter full name"
                          required
                          className="w-full bg-black-800 border border-gold-500/30 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-gold-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Phone Number</label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="+63 XXX XXX XXXX"
                          required
                          className="w-full bg-black-800 border border-gold-500/30 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-gold-500"
                        />
                      </div>
                    </div>

                    {/* Street Address */}
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Street Address</label>
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                        placeholder="House/Unit No., Street, Barangay"
                        required
                        className="w-full bg-black-800 border border-gold-500/30 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-gold-500"
                      />
                    </div>

                    {/* City, Province, Zip */}
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">City</label>
                        <input
                          type="text"
                          value={formData.city}
                          onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                          placeholder="City"
                          required
                          className="w-full bg-black-800 border border-gold-500/30 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-gold-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Province</label>
                        <input
                          type="text"
                          value={formData.province}
                          onChange={(e) => setFormData(prev => ({ ...prev, province: e.target.value }))}
                          placeholder="Province"
                          required
                          className="w-full bg-black-800 border border-gold-500/30 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-gold-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">ZIP</label>
                        <input
                          type="text"
                          value={formData.zipCode}
                          onChange={(e) => setFormData(prev => ({ ...prev, zipCode: e.target.value }))}
                          placeholder="ZIP"
                          required
                          className="w-full bg-black-800 border border-gold-500/30 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-gold-500"
                        />
                      </div>
                    </div>

                    {/* Set as Default */}
                    <label className="flex items-center gap-3 cursor-pointer py-3 px-4 bg-black-800/50 rounded-xl border border-gold-500/10 hover:border-gold-500/30 transition-colors">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={formData.isDefault}
                          onChange={(e) => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-6 h-6 rounded-lg border-2 border-gold-500/50 bg-black-900 peer-checked:bg-gold-500 peer-checked:border-gold-500 transition-all flex items-center justify-center">
                          {formData.isDefault && <Check size={14} className="text-black" />}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-200 text-sm font-medium">Set as default address</span>
                        <p className="text-xs text-gray-500">This will be pre-selected at checkout</p>
                      </div>
                    </label>
                  </form>
                </div>

                {/* Modal Footer - Fixed */}
                <div className="p-4 border-t border-gold-500/20 flex gap-3 flex-shrink-0 bg-black-900">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-black-800 hover:bg-black-700 text-white font-semibold py-3 rounded-xl transition-all border border-gold-500/30"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="flex-1 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-black font-bold py-3 rounded-xl transition-all shadow-lg shadow-gold-500/25"
                  >
                    {editingAddress ? 'Save Changes' : 'Add Address'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Addresses;
