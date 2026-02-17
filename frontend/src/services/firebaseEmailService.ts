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
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from '../config/firebase';

/**
 * Firebase Email Service - Only for email delivery
 * Auth remains with PHP backend
 */
export const firebaseEmailService = {
  /**
   * Send verification email using Firebase
   * Creates a temporary Firebase user just for email delivery
   */
  async sendVerificationEmail(email: string, password: string): Promise<{ success: boolean; message: string }> {
    try {
      // Create Firebase user (just for email delivery)
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Send verification email
      await sendEmailVerification(firebaseUser, {
        url: `${window.location.origin}/verify-email?email=${encodeURIComponent(email)}`,
        handleCodeInApp: false,
      });

      console.log('📧 Firebase verification email sent to:', email);

      // Sign out immediately (we only use Firebase for email delivery)
      await signOut(auth);

      return {
        success: true,
        message: 'Verification email sent! Please check your inbox.',
      };
    } catch (error: any) {
      console.error('❌ Firebase email error:', error);

      // Handle case where Firebase user already exists
      if (error.code === 'auth/email-already-in-use') {
        // Try to resend verification to existing Firebase user
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          const firebaseUser = userCredential.user;

          if (!firebaseUser.emailVerified) {
            await sendEmailVerification(firebaseUser, {
              url: `${window.location.origin}/verify-email?email=${encodeURIComponent(email)}`,
              handleCodeInApp: false,
            });
            await signOut(auth);
            return {
              success: true,
              message: 'Verification email resent! Please check your inbox.',
            };
          } else {
            await signOut(auth);
            return {
              success: true,
              message: 'Email already verified!',
            };
          }
        } catch (signInError: any) {
          return {
            success: false,
            message: signInError.code === 'auth/wrong-password' 
              ? 'Invalid credentials for resending verification'
              : 'Failed to send verification email',
          };
        }
      }

      let message = 'Failed to send verification email';
      if (error.code === 'auth/invalid-email') {
        message = 'Invalid email address';
      } else if (error.code === 'auth/weak-password') {
        message = 'Password is too weak';
      }

      return { success: false, message };
    }
  },

  /**
   * Check if email is verified in Firebase
   * Returns true if: user doesn't exist in Firebase (legacy user), or user is verified
   * Returns false only if: user exists in Firebase but is not verified
   */
  async checkEmailVerified(email: string, password: string): Promise<boolean> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const isVerified = userCredential.user.emailVerified;
      await signOut(auth);
      return isVerified;
    } catch (error: any) {
      // If user doesn't exist in Firebase, treat as verified (legacy user)
      // Only return false if we know they exist but aren't verified
      if (error.code === 'auth/user-not-found') {
        // Legacy user - no Firebase account, allow login
        return true;
      }
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        // User exists but wrong password - they may have a Firebase account
        // We can't check verification, so allow PHP to handle auth
        return true;
      }
      // For other errors (network, etc.), allow login to proceed
      return true;
    }
  },

  /**
   * Resend verification email
   */
  async resendVerification(email: string, password: string): Promise<{ success: boolean; message: string }> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      if (firebaseUser.emailVerified) {
        await signOut(auth);
        return {
          success: true,
          message: 'Your email is already verified! You can log in now.',
        };
      }

      await sendEmailVerification(firebaseUser, {
        url: `${window.location.origin}/verify-email?email=${encodeURIComponent(email)}`,
        handleCodeInApp: false,
      });

      await signOut(auth);

      return {
        success: true,
        message: 'Verification email sent! Check your inbox.',
      };
    } catch (error: any) {
      console.error('❌ Resend verification error:', error);

      let message = 'Failed to send verification email';
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        message = 'Invalid password';
      } else if (error.code === 'auth/user-not-found') {
        message = 'No account found with this email';
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Too many requests. Please wait before trying again.';
      }

      return { success: false, message };
    }
  },

  /**
   * Send password reset email using Firebase
   */
  async sendPasswordResetEmail(email: string): Promise<{ success: boolean; message: string }> {
    try {
      await sendPasswordResetEmail(auth, email, {
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
  async deleteFirebaseUser(email: string, password: string): Promise<void> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await deleteUser(userCredential.user);
    } catch (error) {
      console.error('Failed to delete Firebase user:', error);
    }
  },
};

export default firebaseEmailService;
