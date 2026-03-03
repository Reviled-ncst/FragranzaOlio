import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, CheckCircle, Loader2, Scan, AlertCircle, RefreshCw } from 'lucide-react';
import * as faceapi from 'face-api.js';
import { directApiFetch } from '../../services/api';

const MODEL_URL = '/models';

interface FaceEnrollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type Step = 'loading' | 'instructions' | 'capturing' | 'processing' | 'done' | 'error';

const CAPTURE_COUNT = 5; // capture multiple samples for better accuracy

const FaceEnrollModal = ({ isOpen, onClose, onSuccess }: FaceEnrollModalProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [step, setStep] = useState<Step>('loading');
  const [statusMsg, setStatusMsg] = useState('');
  const [capturedCount, setCapturedCount] = useState(0);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const descriptorsRef = useRef<Float32Array[]>([]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  const handleClose = useCallback(() => {
    stopCamera();
    onClose();
  }, [stopCamera, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const load = async () => {
      try {
        setStep('loading');
        setStatusMsg('Loading face recognition models...');
        if (!modelsLoaded) {
          await Promise.all([
            faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
            faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
          ]);
          setModelsLoaded(true);
        }
        setStep('instructions');
      } catch {
        setStep('error');
        setStatusMsg('Failed to load face recognition models.');
      }
    };
    load();
    return () => stopCamera();
  }, [isOpen]);

  const startCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setStep('capturing');
      setStatusMsg('Look directly at the camera and stay still...');
      setCapturedCount(0);
      descriptorsRef.current = [];
      captureLoop();
    } catch {
      setStep('error');
      setStatusMsg('Camera access denied. Please allow camera access and try again.');
    }
  };

  const captureLoop = () => {
    let count = 0;
    let enrolling = false;
    const interval = setInterval(async () => {
      if (!videoRef.current || videoRef.current.readyState < 2) return;
      if (enrolling) return; // prevent duplicate enrollFace calls
      try {
        const detection = await faceapi
          .detectSingleFace(videoRef.current, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.6 }))
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (!detection) {
          setStatusMsg(`No face detected (${count}/${CAPTURE_COUNT}). Make sure your face is clearly visible.`);
          return;
        }

        descriptorsRef.current.push(detection.descriptor);
        count++;
        setCapturedCount(count);
        setStatusMsg(`Captured sample ${count}/${CAPTURE_COUNT}... Keep still!`);

        if (count >= CAPTURE_COUNT) {
          enrolling = true;
          clearInterval(interval);
          stopCamera();
          await enrollFace();
        }
      } catch (err) {
        console.error(err);
      }
    }, 700);
  };

  const enrollFace = async () => {
    setStep('processing');
    setStatusMsg('Processing your face data...');
    try {
      // Average the descriptors for a more robust embedding
      const avg = new Float32Array(128);
      for (const d of descriptorsRef.current) {
        for (let i = 0; i < 128; i++) avg[i] += d[i];
      }
      for (let i = 0; i < 128; i++) avg[i] /= descriptorsRef.current.length;

      const res = await directApiFetch('face.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'enroll', descriptor: Array.from(avg) }),
      });
      if (!res.ok) {
        setStep('error');
        setStatusMsg(`Server returned ${res.status}. Backend may still be deploying — please try again in a minute.`);
        return;
      }
      const data = await res.json();

      if (data.success) {
        setStep('done');
        setStatusMsg('Face ID enrolled successfully! You can now log in with your face.');
        onSuccess?.();
      } else {
        setStep('error');
        setStatusMsg(data.message || 'Failed to enroll face. Please try again.');
      }
    } catch (err) {
      console.error('Face enroll error:', err);
      const msg = err instanceof Error ? err.message : String(err);
      setStep('error');
      setStatusMsg(`Server connection failed: ${msg}`);
    }
  };

  const reset = () => {
    stopCamera();
    descriptorsRef.current = [];
    setCapturedCount(0);
    setStep('instructions');
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
                  <Scan className="text-gold-400" size={18} />
                </div>
                <div>
                  <h2 className="text-white font-bold text-lg">Set Up Face ID</h2>
                  <p className="text-gray-500 text-xs">OJT Biometric Enrollment</p>
                </div>
              </div>
              <button onClick={handleClose} className="text-gray-400 hover:text-white transition-colors p-1">
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              {/* Loading */}
              {step === 'loading' && (
                <div className="flex flex-col items-center py-10 gap-4">
                  <Loader2 className="animate-spin text-gold-400" size={40} />
                  <p className="text-gray-400 text-sm">Loading face recognition models...</p>
                </div>
              )}

              {/* Instructions */}
              {step === 'instructions' && (
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-gold-500/20 flex items-center justify-center mx-auto mb-5">
                    <Camera className="text-gold-400" size={36} />
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-2">Enroll Your Face</h3>
                  <p className="text-gray-400 text-sm mb-6">
                    We'll capture several samples of your face to create a secure biometric profile.
                    Once enrolled, you can log in just by looking at the camera.
                  </p>
                  <ul className="text-left text-sm text-gray-400 space-y-2 mb-6 bg-black-800 rounded-xl p-4">
                    <li className="flex items-center gap-2">
                      <span className="text-gold-400">•</span> Ensure good, even lighting on your face
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-gold-400">•</span> Remove glasses or hats if possible
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-gold-400">•</span> Look directly at the camera
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-gold-400">•</span> Stay still while {CAPTURE_COUNT} samples are taken
                    </li>
                  </ul>
                  <button
                    onClick={startCapture}
                    className="w-full py-3 rounded-xl bg-gold-500 hover:bg-gold-400 text-black font-bold text-sm transition-colors"
                  >
                    Start Face Enrollment
                  </button>
                </div>
              )}

              {/* Video always mounted so videoRef is never null when startCapture() runs */}
              <div className={step === 'capturing' ? 'block' : 'hidden'}>
                <div className="relative bg-black rounded-xl overflow-hidden mb-4" style={{ aspectRatio: '4/3' }}>
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                    {/* Guide frame */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="relative w-40 h-48">
                        <div className="absolute top-0 left-0 w-7 h-7 border-t-2 border-l-2 border-gold-400 rounded-tl-lg" />
                        <div className="absolute top-0 right-0 w-7 h-7 border-t-2 border-r-2 border-gold-400 rounded-tr-lg" />
                        <div className="absolute bottom-0 left-0 w-7 h-7 border-b-2 border-l-2 border-gold-400 rounded-bl-lg" />
                        <div className="absolute bottom-0 right-0 w-7 h-7 border-b-2 border-r-2 border-gold-400 rounded-br-lg" />
                        <motion.div
                          className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gold-400 to-transparent"
                          animate={{ top: ['10%', '90%', '10%'] }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="mb-3">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-gray-400">Samples captured</span>
                      <span className="text-xs text-gold-400 font-bold">{capturedCount}/{CAPTURE_COUNT}</span>
                    </div>
                    <div className="h-2 bg-black-700 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-gold-600 to-gold-400 rounded-full"
                        animate={{ width: `${(capturedCount / CAPTURE_COUNT) * 100}%` }}
                      />
                    </div>
                  </div>

                  <p className="text-gray-400 text-xs text-center">{statusMsg}</p>
              </div>

              {/* Processing */}
              {step === 'processing' && (
                <div className="flex flex-col items-center py-10 gap-4">
                  <Loader2 className="animate-spin text-gold-400" size={40} />
                  <p className="text-white font-medium">Saving your Face ID...</p>
                  <p className="text-gray-500 text-xs text-center">This will only take a moment</p>
                </div>
              )}

              {/* Done */}
              {step === 'done' && (
                <div className="text-center py-6">
                  <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-5">
                    <CheckCircle className="text-green-400" size={40} />
                  </div>
                  <h3 className="text-white font-bold text-xl mb-2">Face ID Ready!</h3>
                  <p className="text-gray-400 text-sm mb-6">{statusMsg}</p>
                  <button
                    onClick={handleClose}
                    className="w-full py-3 rounded-xl bg-gold-500 hover:bg-gold-400 text-black font-bold transition-colors"
                  >
                    Done
                  </button>
                </div>
              )}

              {/* Error */}
              {step === 'error' && (
                <div className="text-center py-6">
                  <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-5">
                    <AlertCircle className="text-red-400" size={40} />
                  </div>
                  <h3 className="text-white font-bold text-xl mb-2">Enrollment Failed</h3>
                  <p className="text-gray-400 text-sm mb-6">{statusMsg}</p>
                  <div className="flex gap-3">
                    <button
                      onClick={reset}
                      className="flex-1 py-3 rounded-xl bg-gold-500 hover:bg-gold-400 text-black font-bold flex items-center justify-center gap-2 transition-colors"
                    >
                      <RefreshCw size={16} /> Try Again
                    </button>
                    <button
                      onClick={handleClose}
                      className="flex-1 py-3 rounded-xl bg-black-800 border border-gold-500/30 text-gray-300 font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FaceEnrollModal;
