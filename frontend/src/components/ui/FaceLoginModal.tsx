import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, AlertCircle, CheckCircle, Loader2, Scan } from 'lucide-react';
import * as faceapi from 'face-api.js';
import { apiFetch, API_BASE_URL } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { getDashboardForRole } from '../utils/RoleBasedRoute';

const MODEL_URL = '/models';

interface FaceLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Status = 'loading-models' | 'ready' | 'detecting' | 'match-found' | 'no-match' | 'error' | 'no-face';

const FaceLoginModal = ({ isOpen, onClose }: FaceLoginModalProps) => {
  const { login } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectIntervalRef = useRef<number | null>(null);
  const [status, setStatus] = useState<Status>('loading-models');
  const [statusMsg, setStatusMsg] = useState('Loading face recognition models...');
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const stopCamera = useCallback(() => {
    if (detectIntervalRef.current) {
      clearInterval(detectIntervalRef.current);
      detectIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  const handleClose = useCallback(() => {
    stopCamera();
    onClose();
  }, [stopCamera, onClose]);

  // Load models once
  useEffect(() => {
    if (!isOpen) return;
    const load = async () => {
      try {
        if (!modelsLoaded) {
          setStatus('loading-models');
          setStatusMsg('Loading face recognition models...');
          await Promise.all([
            faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
            faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
          ]);
          setModelsLoaded(true);
        }
        setStatus('ready');
        setStatusMsg('Models ready. Position your face in the camera.');
        startCamera();
      } catch (err) {
        console.error('Model load error:', err);
        setStatus('error');
        setStatusMsg('Failed to load face recognition models.');
      }
    };
    load();
    return () => stopCamera();
  }, [isOpen]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => { /* play() interrupted — safe to ignore */ });
      }
      startDetectionLoop();
    } catch {
      setStatus('error');
      setStatusMsg('Camera access denied. Please allow camera access and try again.');
    }
  };

  const startDetectionLoop = () => {
    setIsScanning(true);
    setStatus('detecting');
    setStatusMsg('Scanning for your face...');
    let attempts = 0;
    detectIntervalRef.current = window.setInterval(async () => {
      if (!videoRef.current || videoRef.current.readyState < 2) return;
      attempts++;
      try {
        const detection = await faceapi
          .detectSingleFace(videoRef.current, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (!detection) {
          if (attempts > 15) {
            setStatusMsg('No face detected. Ensure good lighting and look at the camera.');
          }
          return;
        }

        // Face detected — stop loop and attempt login
        clearInterval(detectIntervalRef.current!);
        detectIntervalRef.current = null;
        setIsScanning(false);
        setStatus('detecting');
        setStatusMsg('Face detected! Verifying identity...');

        const descriptor = Array.from(detection.descriptor);
        await attemptFaceLogin(descriptor);
      } catch (err) {
        console.error('Detection error:', err);
      }
    }, 500);
  };

  const attemptFaceLogin = async (descriptor: number[]) => {
    try {
      const res = await apiFetch(`${API_BASE_URL}/face.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'face-login', descriptor }),
      });
      const data = await res.json();

      if (data.success && data.user && data.token) {
        setStatus('match-found');
        setStatusMsg(`Welcome back, ${data.user.first_name}!`);
        login(data.user, data.token);
        setTimeout(() => {
          handleClose();
          window.location.href = getDashboardForRole(data.user.role);
        }, 1500);
      } else {
        setStatus('no-match');
        setStatusMsg(data.message || 'Face not recognized. Please use email login or enroll your face first.');
      }
    } catch {
      setStatus('error');
      setStatusMsg('Network error during face authentication. Please try again.');
    }
  };

  const handleRetry = () => {
    setStatus('detecting');
    startDetectionLoop();
  };

  const statusColor = {
    'loading-models': 'text-blue-400',
    'ready': 'text-gray-400',
    'detecting': 'text-gold-400',
    'match-found': 'text-green-400',
    'no-match': 'text-red-400',
    'error': 'text-red-400',
    'no-face': 'text-yellow-400',
  }[status];

  const StatusIcon = () => {
    if (status === 'loading-models') return <Loader2 className="animate-spin text-blue-400" size={20} />;
    if (status === 'detecting' || status === 'ready') return <Scan className={`text-gold-400 ${isScanning ? 'animate-pulse' : ''}`} size={20} />;
    if (status === 'match-found') return <CheckCircle className="text-green-400" size={20} />;
    if (status === 'no-match' || status === 'error') return <AlertCircle className="text-red-400" size={20} />;
    return <Camera className="text-gray-400" size={20} />;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-black-900 border border-gold-500/30 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gold-500/20">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gold-500/20 flex items-center justify-center">
                  <Camera className="text-gold-400" size={18} />
                </div>
                <div>
                  <h2 className="text-white font-bold text-lg">Face ID Login</h2>
                  <p className="text-gray-500 text-xs">OJT Biometric Authentication</p>
                </div>
              </div>
              <button onClick={handleClose} className="text-gray-400 hover:text-white transition-colors p-1">
                <X size={20} />
              </button>
            </div>

            {/* Camera Feed */}
            <div className="relative bg-black mx-6 mt-5 rounded-xl overflow-hidden" style={{ aspectRatio: '4/3' }}>
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover scale-x-[-1]"
              />
              <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

              {/* Scan overlay */}
              {isScanning && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  {/* Face guide frame */}
                  <div className="relative w-48 h-56">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-gold-400 rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-gold-400 rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-gold-400 rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-gold-400 rounded-br-lg" />
                    {/* Scan line animation */}
                    <motion.div
                      className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gold-400 to-transparent"
                      animate={{ top: ['10%', '90%', '10%'] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                    />
                  </div>
                </div>
              )}

              {/* Loading overlay */}
              {status === 'loading-models' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60">
                  <Loader2 className="animate-spin text-gold-400 mb-3" size={36} />
                  <p className="text-white text-sm">Loading models...</p>
                </div>
              )}

              {/* Success overlay */}
              {status === 'match-found' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-green-900/40">
                  <CheckCircle className="text-green-400 mb-3" size={48} />
                  <p className="text-green-300 font-bold text-lg">Identity Verified!</p>
                </div>
              )}
            </div>

            {/* Status */}
            <div className="px-6 py-4">
              <div className="flex items-center gap-2 mb-4">
                <StatusIcon />
                <p className={`text-sm ${statusColor}`}>{statusMsg}</p>
              </div>

              {/* Retry or dismiss */}
              <div className="flex gap-3">
                {(status === 'no-match' || status === 'error' || status === 'no-face') && (
                  <button
                    onClick={handleRetry}
                    className="flex-1 py-2.5 rounded-lg bg-gold-500 hover:bg-gold-400 text-black font-semibold text-sm transition-colors"
                  >
                    Try Again
                  </button>
                )}
                <button
                  onClick={handleClose}
                  className="flex-1 py-2.5 rounded-lg bg-black-800 hover:bg-black-700 border border-gold-500/30 text-gray-300 font-medium text-sm transition-colors"
                >
                  {status === 'match-found' ? 'Logging in...' : 'Use Email Instead'}
                </button>
              </div>

              <p className="text-center text-gray-600 text-xs mt-3">
                Face data is never stored on this device
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FaceLoginModal;
