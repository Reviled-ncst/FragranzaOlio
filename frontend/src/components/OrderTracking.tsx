import { motion } from 'framer-motion';
import { 
  ShoppingBag, 
  CreditCard, 
  Package, 
  Truck, 
  MapPin, 
  CheckCircle, 
  XCircle, 
  RotateCcw,
  Clock,
  ExternalLink,
  Store
} from 'lucide-react';
import { Order, OrderStatus, ORDER_STATUS_CONFIG } from '../services/orderService';

interface OrderTrackingProps {
  order: Order;
  onClose?: () => void;
}

// Define the flow steps based on shipping method
const DELIVERY_STEPS: OrderStatus[] = [
  'ordered',
  'paid_waiting_approval', // or cod_waiting_approval
  'processing',
  'in_transit',
  'delivered',
  'completed'
];

const PICKUP_STEPS: OrderStatus[] = [
  'ordered',
  'paid_waiting_approval', // or cod_waiting_approval
  'paid_ready_pickup',
  'picked_up',
  'completed'
];

const getStepIcon = (status: OrderStatus) => {
  switch (status) {
    case 'ordered':
      return ShoppingBag;
    case 'paid_waiting_approval':
    case 'cod_waiting_approval':
      return CreditCard;
    case 'paid_ready_pickup':
      return Store;
    case 'processing':
      return Package;
    case 'in_transit':
    case 'waiting_client':
      return Truck;
    case 'delivered':
    case 'picked_up':
      return MapPin;
    case 'completed':
      return CheckCircle;
    case 'cancelled':
      return XCircle;
    case 'return_requested':
    case 'return_approved':
    case 'returned':
    case 'refund_requested':
    case 'refunded':
      return RotateCcw;
    default:
      return Clock;
  }
};

const getStatusColor = (status: OrderStatus, isActive: boolean, isPast: boolean) => {
  if (status === 'cancelled') return 'text-red-400 bg-red-500/20 border-red-500';
  if (status.includes('return') || status.includes('refund')) return 'text-orange-400 bg-orange-500/20 border-orange-500';
  
  if (isActive) return 'text-gold-400 bg-gold-500/20 border-gold-500';
  if (isPast) return 'text-green-400 bg-green-500/20 border-green-500';
  return 'text-gray-500 bg-gray-700/20 border-gray-600';
};

export default function OrderTracking({ order, onClose }: OrderTrackingProps) {
  const isPickup = order.shipping_method === 'store_pickup';
  const steps = isPickup ? PICKUP_STEPS : DELIVERY_STEPS;
  
  // Adjust steps based on payment method
  const adjustedSteps = steps.map(step => {
    if (step === 'paid_waiting_approval' && (order.payment_method === 'cod' || order.payment_method === 'cop')) {
      return 'cod_waiting_approval';
    }
    return step;
  });
  
  const currentStepIndex = adjustedSteps.findIndex(s => s === order.status);
  const config = ORDER_STATUS_CONFIG[order.status];

  // Check for special statuses (cancelled, return, refund)
  const isSpecialStatus = order.status === 'cancelled' || 
    order.status.includes('return') || 
    order.status.includes('refund');

  return (
    <div className="bg-black-800 rounded-xl border border-gold-500/20 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Order Status</h3>
          <p className="text-gray-400 text-sm">Order #{order.order_number}</p>
        </div>
        <div className={`px-3 py-1.5 rounded-full text-sm font-medium ${
          config.color === 'green' ? 'bg-green-500/20 text-green-400' :
          config.color === 'yellow' ? 'bg-yellow-500/20 text-yellow-400' :
          config.color === 'red' ? 'bg-red-500/20 text-red-400' :
          config.color === 'blue' ? 'bg-blue-500/20 text-blue-400' :
          config.color === 'purple' ? 'bg-purple-500/20 text-purple-400' :
          config.color === 'orange' ? 'bg-orange-500/20 text-orange-400' :
          config.color === 'emerald' ? 'bg-emerald-500/20 text-emerald-400' :
          'bg-gray-500/20 text-gray-400'
        }`}>
          {config.label}
        </div>
      </div>

      {/* Tracking Link (if available) */}
      {order.tracking_url && (
        <motion.a
          href={order.tracking_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between p-4 mb-6 bg-blue-500/10 border border-blue-500/30 rounded-xl hover:bg-blue-500/20 transition-colors"
          whileHover={{ scale: 1.01 }}
        >
          <div className="flex items-center gap-3">
            <Truck className="text-blue-400" size={24} />
            <div>
              <p className="text-white font-medium">
                {order.courier_name || 'Live Tracking Available'}
              </p>
              {order.tracking_number && (
                <p className="text-gray-400 text-sm">Tracking: {order.tracking_number}</p>
              )}
            </div>
          </div>
          <ExternalLink className="text-blue-400" size={20} />
        </motion.a>
      )}

      {/* Progress Timeline */}
      <div className="relative">
        {/* Progress Line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-700" />
        {!isSpecialStatus && currentStepIndex >= 0 && (
          <motion.div 
            className="absolute left-6 top-0 w-0.5 bg-gradient-to-b from-gold-500 to-green-500"
            initial={{ height: 0 }}
            animate={{ height: `${(currentStepIndex / (adjustedSteps.length - 1)) * 100}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        )}

        {/* Steps */}
        <div className="space-y-6">
          {adjustedSteps.map((step, index) => {
            const stepConfig = ORDER_STATUS_CONFIG[step];
            const Icon = getStepIcon(step);
            const isPast = index < currentStepIndex;
            const isActive = index === currentStepIndex;
            const colorClass = getStatusColor(step, isActive, isPast);
            
            // Find history entry for this step
            const historyEntry = order.status_history?.find(h => h.status === step);

            return (
              <motion.div
                key={step}
                className="relative flex items-start gap-4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                {/* Icon */}
                <div className={`relative z-10 w-12 h-12 rounded-full border-2 flex items-center justify-center ${colorClass}`}>
                  <Icon size={20} />
                </div>

                {/* Content */}
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-2">
                    <h4 className={`font-medium ${isPast || isActive ? 'text-white' : 'text-gray-500'}`}>
                      {stepConfig.label}
                    </h4>
                    {isActive && (
                      <span className="px-2 py-0.5 bg-gold-500/20 text-gold-400 text-xs rounded-full animate-pulse">
                        Current
                      </span>
                    )}
                  </div>
                  <p className={`text-sm ${isPast || isActive ? 'text-gray-400' : 'text-gray-600'}`}>
                    {stepConfig.description}
                  </p>
                  {historyEntry && (
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(historyEntry.timestamp).toLocaleString()}
                      {historyEntry.note && ` - ${historyEntry.note}`}
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Special Status (if applicable) */}
        {isSpecialStatus && (
          <motion.div
            className="relative flex items-start gap-4 mt-6 pt-6 border-t border-gray-700"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className={`relative z-10 w-12 h-12 rounded-full border-2 flex items-center justify-center ${
              order.status === 'cancelled' ? 'text-red-400 bg-red-500/20 border-red-500' :
              'text-orange-400 bg-orange-500/20 border-orange-500'
            }`}>
              {order.status === 'cancelled' ? <XCircle size={20} /> : <RotateCcw size={20} />}
            </div>
            <div className="flex-1 pt-1">
              <h4 className="font-medium text-white">{config.label}</h4>
              <p className="text-sm text-gray-400">{config.description}</p>
              {order.notes && (
                <p className="text-sm text-gray-500 mt-1">Reason: {order.notes}</p>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Estimated Delivery */}
      {order.estimated_delivery && !isSpecialStatus && order.status !== 'completed' && (
        <div className="mt-6 pt-6 border-t border-gray-700">
          <div className="flex items-center gap-2 text-gray-400">
            <Clock size={16} />
            <span className="text-sm">
              Estimated {isPickup ? 'Ready' : 'Delivery'}: {' '}
              <span className="text-white">{new Date(order.estimated_delivery).toLocaleDateString()}</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
