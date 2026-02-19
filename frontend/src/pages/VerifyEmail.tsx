import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2, Mail, ArrowRight, RefreshCw } from 'lucide-react';
import { applyActionCode } from 'firebase/auth';
import { auth } from '../config/firebase';
import { firebaseEmailService } from '../services/firebaseEmailService';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  // Firebase uses 'oobCode' for action code, also support legacy 'token'
  const oobCode = searchParams.get('oobCode');
  const mode = searchParams.get('mode');
  const legacyToken = searchParams.get('token');
  const actionCode = oobCode || legacyToken;
  // Email param is passed in continueUrl when Firebase handles verification
  const emailParam = searchParams.get('email');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'no-token'>('loading');
  const [message, setMessage] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resendPassword, setResendPassword] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [resendMessage, setResendMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      // If mode is not verifyEmail, show appropriate message
      if (mode && mode !== 'verifyEmail') {
        setStatus('error');
        setMessage('This link is for a different action. Please use the correct verification link.');
        return;
      }

      // If we have an email param but no action code, this means Firebase already
      // verified the email (handleCodeInApp: false) and redirected here via continueUrl
      if (emailParam && !actionCode) {
        const email = decodeURIComponent(emailParam);
        // Sync verification status with PHP backend
        try {
          await firebaseEmailService.syncVerificationStatus(email);
        } catch (e) {
          console.error('Failed to sync verification with backend:', e);
        }
        setStatus('success');
        setMessage(`Your email (${email}) has been verified successfully! You can now log in.`);
        return;
      }

      if (!actionCode) {
        setStatus('no-token');
        setMessage('No verification code provided');
        return;
      }

      try {
        // Apply the action code to verify the email (for handleCodeInApp: true flow)
        await applyActionCode(auth, actionCode);
        setStatus('success');
        setMessage('Your email has been verified successfully! You can now log in.');
      } catch (error: unknown) {
        setStatus('error');
        let errorMessage = 'Verification failed. The link may be expired or invalid.';
        const firebaseError = error as { code?: string };
        if (firebaseError.code === 'auth/invalid-action-code') {
          errorMessage = 'Verification link is invalid or has expired.';
        } else if (firebaseError.code === 'auth/expired-action-code') {
          errorMessage = 'Verification link has expired. Please request a new one.';
        }
        setMessage(errorMessage);
      }
    };

    verifyEmail();
  }, [actionCode, mode, emailParam]);

  const handleResendVerification = async () => {
    if (!resendEmail) {
      setResendStatus('error');
      setResendMessage('Please enter your email address');
      return;
    }

    if (!resendPassword) {
      setResendStatus('error');
      setResendMessage('Please enter your password');
      return;
    }

    setIsResending(true);
    setResendStatus('idle');
    
    try {
      const response = await firebaseEmailService.resendVerification(resendEmail, resendPassword);
      
      if (response.success) {
        setResendStatus('success');
        setResendMessage(response.message || 'Verification email sent!');
      } else {
        setResendStatus('error');
        setResendMessage(response.message || 'Failed to send verification email');
      }
    } catch (error) {
      setResendStatus('error');
      setResendMessage('An error occurred. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-black-950 flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        {/* Success State */}
        {status === 'success' && (
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle className="w-10 h-10 text-green-500" />
            </motion.div>
            
            <h1 className="text-2xl font-display font-bold text-white mb-3">Email Verified!</h1>
            <p className="text-gray-400 mb-8">{message}</p>
            
            <Link
              to="/login"
              className="inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-600 text-black font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Continue to Login
              <ArrowRight size={18} />
            </Link>
          </div>
        )}

        {/* Error State */}
        {status === 'error' && (
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <XCircle className="w-10 h-10 text-red-500" />
            </motion.div>
            
            <h1 className="text-2xl font-display font-bold text-white mb-3">Verification Failed</h1>
            <p className="text-gray-400 mb-8">{message}</p>
            
            {/* Resend Form */}
            <div className="bg-black-900 border border-gold-500/20 rounded-xl p-6 text-left">
              <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                <RefreshCw size={18} className="text-gold-500" />
                Resend Verification Email
              </h3>
              
              <div className="space-y-4">
                <input
                  type="email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full bg-black-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-gold-500/50 focus:outline-none"
                />

                <input
                  type="password"
                  value={resendPassword}
                  onChange={(e) => setResendPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-black-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-gold-500/50 focus:outline-none"
                />
                
                <button
                  onClick={handleResendVerification}
                  disabled={isResending}
                  className="w-full flex items-center justify-center gap-2 bg-gold-500 hover:bg-gold-600 disabled:bg-gold-500/50 text-black font-semibold px-6 py-3 rounded-lg transition-colors"
                >
                  {isResending ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail size={18} />
                      Resend Email
                    </>
                  )}
                </button>
                
                {resendStatus !== 'idle' && (
                  <p className={`text-sm ${resendStatus === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                    {resendMessage}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* No Token State */}
        {status === 'no-token' && (
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <Mail className="w-10 h-10 text-yellow-500" />
            </motion.div>
            
            <h1 className="text-2xl font-display font-bold text-white mb-3">Email Verification</h1>
            <p className="text-gray-400 mb-8">
              Please check your email for a verification link, or request a new one below.
            </p>
            
            {/* Resend Form */}
            <div className="bg-black-900 border border-gold-500/20 rounded-xl p-6 text-left">
              <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                <RefreshCw size={18} className="text-gold-500" />
                Request Verification Email
              </h3>
              
              <div className="space-y-4">
                <input
                  type="email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full bg-black-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-gold-500/50 focus:outline-none"
                />
                
                <button
                  onClick={handleResendVerification}
                  disabled={isResending}
                  className="w-full flex items-center justify-center gap-2 bg-gold-500 hover:bg-gold-600 disabled:bg-gold-500/50 text-black font-semibold px-6 py-3 rounded-lg transition-colors"
                >
                  {isResending ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail size={18} />
                      Send Verification Email
                    </>
                  )}
                </button>
                
                {resendStatus !== 'idle' && (
                  <p className={`text-sm ${resendStatus === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                    {resendMessage}
                  </p>
                )}
              </div>
            </div>
            
            <p className="mt-6 text-gray-500 text-sm">
              Already verified?{' '}
              <Link to="/login" className="text-gold-500 hover:text-gold-400">
                Sign in
              </Link>
            </p>
          </div>
        )}

        {/* Loading State */}
        {status === 'loading' && (
          <div className="text-center">
            <div className="w-20 h-20 bg-gold-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-10 h-10 text-gold-500 animate-spin" />
            </div>
            
            <h1 className="text-2xl font-display font-bold text-white mb-3">Verifying Your Email...</h1>
            <p className="text-gray-400">Please wait while we verify your email address.</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default VerifyEmail;
