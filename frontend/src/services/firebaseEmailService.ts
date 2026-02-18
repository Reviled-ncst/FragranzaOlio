/**
 * Firebase Email Service
 * Uses Firebase only for email verification delivery
 * Authentication remains with PHP backend
 */

import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  deleteUser,
  signInWithEmailAndPassword,
  sendPasswordResetEmail as firebaseSendPasswordReset,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { API_BASE_URL, apiFetch } from './api';

/**
 * Generate a deterministic service password for Firebase
 * Since we only use Firebase for email, not auth, we use a consistent password
 * This avoids password mismatch issues between PHP and Firebase
 */
const getServicePassword = (email: string): string => {
  // Use a consistent password based on email - Firebase requires 6+ chars
  return `firebase-email-service-${email.toLowerCase().replace(/[^a-z0-9]/g, '')}-secure`;
};

/**
 * Firebase Email Service - Only for email delivery
 * Auth remains with PHP backend
 */
export const firebaseEmailService = {
  /**
   * Send verification email using Firebase
   * Creates a Firebase user for email delivery using service password
   */
  async sendVerificationEmail(email: string, _password?: string): Promise<{ success: boolean; message: string }> {
    const servicePassword = getServicePassword(email);
    
    try {
      // First try to sign in (user might already exist with service password)
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, servicePassword);
        const firebaseUser = userCredential.user;

        if (firebaseUser.emailVerified) {
          await signOut(auth);
          return { success: true, message: 'Email already verified!' };
        }

        await sendEmailVerification(firebaseUser, {
          url: `${window.location.origin}/verify-email?email=${encodeURIComponent(email)}`,
          handleCodeInApp: false,
        });
        await signOut(auth);
        return { success: true, message: 'Verification email sent! Please check your inbox.' };
      } catch (signInError: any) {
        // User doesn't exist, create new account
        if (signInError.code === 'auth/user-not-found' || signInError.code === 'auth/invalid-credential') {
          const userCredential = await createUserWithEmailAndPassword(auth, email, servicePassword);
          const firebaseUser = userCredential.user;

          await sendEmailVerification(firebaseUser, {
            url: `${window.location.origin}/verify-email?email=${encodeURIComponent(email)}`,
            handleCodeInApp: false,
          });

          console.log('📧 Firebase verification email sent to:', email);
          await signOut(auth);
          return { success: true, message: 'Verification email sent! Please check your inbox.' };
        }
        throw signInError;
      }
    } catch (error: any) {
      console.error('❌ Firebase email error:', error);

      // Handle email-already-in-use with different password (legacy issue)
      if (error.code === 'auth/email-already-in-use') {
        return { 
          success: false, 
          message: 'Account exists with different credentials. Please contact support.' 
        };
      }

      let message = 'Failed to send verification email';
      if (error.code === 'auth/invalid-email') {
        message = 'Invalid email address';
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Too many requests. Please wait a few minutes before trying again.';
      }

      return { success: false, message };
    }
  },

  /**
   * Check if email is verified in Firebase
   * Returns true if: user doesn't exist in Firebase (legacy user), or user is verified
   * Returns false only if: user exists in Firebase but is not verified
   */
  async checkEmailVerified(email: string, _password?: string): Promise<boolean> {
    const servicePassword = getServicePassword(email);
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, servicePassword);
      // Force reload user to get fresh emailVerified status from server
      await userCredential.user.reload();
      const isVerified = userCredential.user.emailVerified;
      console.log(`🔐 Firebase email verified status for ${email}: ${isVerified}`);
      await signOut(auth);
      return isVerified;
    } catch (error: any) {
      console.log('🔐 Firebase checkEmailVerified error:', error.code, error.message);
      // If user doesn't exist in Firebase, treat as verified (legacy user)
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        return true;
      }
      // For other errors (network, etc.), allow login to proceed
      return true;
    }
  },

  /**
   * Resend verification email
   * Uses service password - no need for user password
   */
  async resendVerification(email: string, _password?: string): Promise<{ success: boolean; message: string }> {
    // Just call sendVerificationEmail which handles everything
    return this.sendVerificationEmail(email);
  },

  /**
   * Send password reset email using Firebase
   */
  async sendPasswordResetEmail(email: string): Promise<{ success: boolean; message: string }> {
    try {
      await firebaseSendPasswordReset(auth, email, {
        url: `${window.location.origin}/login`,
        handleCodeInApp: false,
      });

      return {
        success: true,
        message: 'Password reset email sent! Check your inbox.',
      };
    } catch (error: any) {
      console.error('❌ Password reset error:', error);

      let message = 'Failed to send password reset email';
      if (error.code === 'auth/user-not-found') {
        // Don't reveal if user exists
        return {
          success: true,
          message: 'If an account exists, you will receive a password reset email.',
        };
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Too many requests. Please wait before trying again.';
      }

      return { success: false, message };
    }
  },

  /**
   * Delete Firebase user (cleanup)
   */
  async deleteFirebaseUser(email: string): Promise<void> {
    const servicePassword = getServicePassword(email);
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, servicePassword);
      await deleteUser(userCredential.user);
    } catch (error) {
      console.error('Failed to delete Firebase user:', error);
    }
  },

  /**
   * Check Firebase verification status and sync with PHP backend
   * Returns true if email is verified (either in Firebase or no Firebase account exists)
   */
  async syncVerificationStatus(email: string): Promise<{ verified: boolean; synced: boolean }> {
    const servicePassword = getServicePassword(email);
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, servicePassword);
      const isVerified = userCredential.user.emailVerified;
      await signOut(auth);
      
      if (isVerified) {
        // Sync with PHP backend
        try {
          await apiFetch(`${API_BASE_URL}/auth.php`, {
            method: 'POST',
            body: JSON.stringify({
              action: 'mark-email-verified',
              email: email,
            }),
          });
          console.log('✅ Email verification synced with backend');
          return { verified: true, synced: true };
        } catch (syncError) {
          console.error('Failed to sync verification with backend:', syncError);
          return { verified: true, synced: false };
        }
      }
      
      return { verified: false, synced: false };
    } catch (error: any) {
      // If user doesn't exist in Firebase, treat as needing verification
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        // No Firebase account - need to send verification
        return { verified: false, synced: false };
      }
      console.error('Error checking verification status:', error);
      // On error, assume not verified to be safe
      return { verified: false, synced: false };
    }
  },
};

export default firebaseEmailService;
