import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, XCircle, Loader2, X } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'danger' | 'success' | 'warning';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

const variantConfig = {
  default: {
    iconBg: 'bg-gold-500/20',
    iconColor: 'text-gold-500',
    buttonBg: 'bg-gold-500 hover:bg-gold-400',
    buttonText: 'text-black',
    Icon: AlertCircle,
  },
  danger: {
    iconBg: 'bg-red-500/20',
    iconColor: 'text-red-500',
    buttonBg: 'bg-red-500 hover:bg-red-400',
    buttonText: 'text-white',
    Icon: XCircle,
  },
  success: {
    iconBg: 'bg-green-500/20',
    iconColor: 'text-green-500',
    buttonBg: 'bg-green-500 hover:bg-green-400',
    buttonText: 'text-white',
    Icon: CheckCircle,
  },
  warning: {
    iconBg: 'bg-yellow-500/20',
    iconColor: 'text-yellow-500',
    buttonBg: 'bg-yellow-500 hover:bg-yellow-400',
    buttonText: 'text-black',
    Icon: AlertCircle,
  },
};

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  isLoading = false,
  icon,
}: ConfirmDialogProps) => {
  const config = variantConfig[variant];
  const IconComponent = config.Icon;

  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-black-900 border border-gold-500/20 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              {/* Header */}
              <div className="relative p-6 pb-4">
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="absolute top-4 right-4 p-2 rounded-full hover:bg-black-800 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                >
                  <X size={18} />
                </button>

                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`flex-shrink-0 w-12 h-12 rounded-full ${config.iconBg} flex items-center justify-center`}>
                    {icon || <IconComponent size={24} className={config.iconColor} />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pt-1">
                    <h3 className="text-lg font-semibold text-white">
                      {title}
                    </h3>
                    <p className="mt-2 text-sm text-gray-400 leading-relaxed">
                      {message}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 p-6 pt-2 bg-black-900">
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 rounded-xl bg-black-800 text-gray-300 font-medium hover:bg-black-700 transition-colors disabled:opacity-50"
                >
                  {cancelText}
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isLoading}
                  className={`flex-1 px-4 py-3 rounded-xl ${config.buttonBg} ${config.buttonText} font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Processing...
                    </>
                  ) : (
                    confirmText
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ConfirmDialog;
