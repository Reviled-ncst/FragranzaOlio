import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, Loader2, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { API_BASE_URL } from '../services/api';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token. Please request a new password reset.');
    }
  }, [token]);

  const validatePassword = () => {
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    if (!/[A-Z]/.test(password)) {
      setError('Password must contain at least one uppercase letter');
      return false;
    }
    if (!/[a-z]/.test(password)) {
      setError('Password must contain at least one lowercase letter');
      return false;
    }
    if (!/[0-9]/.test(password)) {
      setError('Password must contain at least one number');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!validatePassword()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset-password',
          token,
          password,
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/');
        }, 3000);
      } else {
        setError(result.message || 'Failed to reset password. Please try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black-900 via-black-800 to-black-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-black-900/90 border border-gold-500/20 rounded-2xl shadow-2xl overflow-hidden">
          {/* Gold accent line */}
          <div className="h-1 bg-gradient-to-r from-gold-600 via-gold-400 to-gold-600" />
          
          <div className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gold-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                {success ? (
                  <CheckCircle className="w-8 h-8 text-green-400" />
                ) : (
                  <Lock className="w-8 h-8 text-gold-400" />
                )}
              </div>
              <h1 className="text-2xl font-display font-bold text-white mb-2">
                {success ? 'Password Reset!' : 'Reset Your Password'}
              </h1>
              <p className="text-gray-400 text-sm">
                {success 
                  ? 'Your password has been successfully reset. Redirecting to login...'
                  : 'Enter your new password below'}
              </p>
            </div>

            {/* Success State */}
            {success ? (
              <div className="text-center">
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg mb-6">
                  <p className="text-green-400 text-sm">
                    You will be redirected to the login page in a few seconds.
                  </p>
                </div>
                <Link 
                  to="/"
                  className="inline-flex items-center gap-2 text-gold-400 hover:text-gold-300 transition-colors"
                >
                  <ArrowLeft size={16} />
                  Go to Login Now
                </Link>
              </div>
            ) : (
              <>
                {/* Error Message */}
                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg mb-6">
                    <div className="flex items-center gap-2">
                      <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
                      <p className="text-red-400 text-sm">{error}</p>
                    </div>
                  </div>
                )}

                {/* Form */}
                {token && (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* New Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">
                        New Password
                      </label>
                      <div className="relative">
                        <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter new password"
                          className="w-full pl-10 pr-10 py-2.5 bg-black-800 border border-gold-500/20 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/50 transition-all"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm new password"
                          className="w-full pl-10 pr-10 py-2.5 bg-black-800 border border-gold-500/20 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/50 transition-all"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                        >
                          {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* Password Requirements */}
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>Password must:</p>
                      <ul className="list-disc list-inside space-y-0.5">
                        <li className={password.length >= 8 ? 'text-green-400' : ''}>Be at least 8 characters</li>
                        <li className={/[A-Z]/.test(password) ? 'text-green-400' : ''}>Contain an uppercase letter</li>
                        <li className={/[a-z]/.test(password) ? 'text-green-400' : ''}>Contain a lowercase letter</li>
                        <li className={/[0-9]/.test(password) ? 'text-green-400' : ''}>Contain a number</li>
                      </ul>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-2.5 bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-black font-semibold rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Resetting Password...
                        </>
                      ) : (
                        'Reset Password'
                      )}
                    </button>
                  </form>
                )}

                {/* Back to Login */}
                <div className="mt-6 text-center">
                  <Link 
                    to="/"
                    className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors"
                  >
                    <ArrowLeft size={16} />
                    Back to Login
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
