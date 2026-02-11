import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  MapPin,
  Clock,
  Coffee,
  LogIn,
  LogOut,
  AlertCircle,
  CheckCircle,
  Loader2,
  X,
  RefreshCw,
  User
} from 'lucide-react';
import { API_BASE_URL } from '../services/api';

interface AttendanceClockProps {
  userId: number;
  onClockAction?: () => void;
}

interface ClockStatus {
  has_record: boolean;
  clocked_in: boolean;
  clocked_out: boolean;
  on_break: boolean;
  record: any;
}

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
}

const AttendanceClock = ({ userId, onClockAction }: AttendanceClockProps) => {
  const [status, setStatus] = useState<ClockStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Camera state
  const [showCamera, setShowCamera] = useState(false);
  const [cameraAction, setCameraAction] = useState<'in' | 'out' | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  // Location state
  const [location, setLocation] = useState<LocationData | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  
  // Face detection state
  const [faceDetected, setFaceDetected] = useState(false);
  const [faceConfidence, setFaceConfidence] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const faceDetectionInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Real-time clock update
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch current status
  const fetchStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/ojt_attendance.php/status?trainee_id=${userId}`);
      const data = await response.json();
      if (data.success) {
        setStatus(data.data);
      }
    } catch (err) {
      console.error('Error fetching status:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Get current location
  const getCurrentLocation = async (): Promise<LocationData | null> => {
    setIsGettingLocation(true);
    setLocationError(null);
    
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setLocationError('Geolocation is not supported');
        setIsGettingLocation(false);
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          // Try to get address using reverse geocoding (free service)
          let address = '';
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
            );
            const data = await response.json();
            address = data.display_name || '';
          } catch (err) {
            console.log('Could not get address');
          }
          
          const locationData = { latitude, longitude, address };
          setLocation(locationData);
          setIsGettingLocation(false);
          resolve(locationData);
        },
        (err) => {
          setLocationError(err.message);
          setIsGettingLocation(false);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  };

  // Start camera (camera only, no gallery)
  const startCamera = async (action: 'in' | 'out') => {
    setCameraAction(action);
    setShowCamera(true);
    setCameraError(null);
    setCapturedPhoto(null);
    setFaceDetected(false);
    
    try {
      // Request camera only - no file picker
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setIsCameraReady(true);
          startFaceDetection();
        };
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      setCameraError(err.message || 'Could not access camera');
    }
  };

  // Face detection using canvas (simple face detection without external library)
  const startFaceDetection = () => {
    // Simple face detection using brightness analysis
    // For production, you can use face-api.js (free) for better detection
    faceDetectionInterval.current = setInterval(() => {
      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        if (ctx && video.readyState === 4) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0);
          
          // Get image data from center of frame (where face should be)
          const centerX = canvas.width / 2 - 100;
          const centerY = canvas.height / 2 - 100;
          const imageData = ctx.getImageData(centerX, centerY, 200, 200);
          const data = imageData.data;
          
          // Simple skin tone detection for face presence
          let skinPixels = 0;
          const totalPixels = data.length / 4;
          
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Check for skin tone (simplified)
            if (r > 60 && g > 40 && b > 20 &&
                r > g && r > b &&
                Math.abs(r - g) > 15 &&
                r - b > 15) {
              skinPixels++;
            }
          }
          
          const skinRatio = skinPixels / totalPixels;
          const confidence = Math.min(100, Math.round(skinRatio * 300));
          
          setFaceDetected(skinRatio > 0.15);
          setFaceConfidence(confidence);
        }
      }
    }, 500);
  };

  // Stop camera
  const stopCamera = () => {
    if (faceDetectionInterval.current) {
      clearInterval(faceDetectionInterval.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
    setIsCameraReady(false);
    setCameraAction(null);
    setCapturedPhoto(null);
    setFaceDetected(false);
  };

  // Capture photo
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      
      const photoData = canvas.toDataURL('image/jpeg', 0.8);
      setCapturedPhoto(photoData);
      
      // Stop video stream after capture
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (faceDetectionInterval.current) {
        clearInterval(faceDetectionInterval.current);
      }
    }
  };

  // Retake photo
  const retakePhoto = async () => {
    setCapturedPhoto(null);
    if (cameraAction) {
      await startCamera(cameraAction);
    }
  };

  // Submit clock action
  const submitClockAction = async () => {
    if (!capturedPhoto || !cameraAction) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      // Get location first
      const loc = await getCurrentLocation();
      
      const endpoint = cameraAction === 'in' ? 'clock-in' : 'clock-out';
      
      const response = await fetch(`${API_BASE_URL}/ojt_attendance.php/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trainee_id: userId,
          photo: capturedPhoto,
          latitude: loc?.latitude,
          longitude: loc?.longitude,
          location: loc?.address,
          face_verified: faceDetected,
          face_confidence: faceConfidence
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(data.message);
        stopCamera();
        fetchStatus();
        onClockAction?.();
        
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Failed to process clock action');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Break actions
  const handleBreakStart = async () => {
    setIsProcessing(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/ojt_attendance.php/break-start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trainee_id: userId })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('Break started');
        fetchStatus();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBreakEnd = async () => {
    setIsProcessing(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/ojt_attendance.php/break-end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trainee_id: userId })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('Break ended');
        fetchStatus();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Format time
  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return '--:--';
    return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  if (isLoading) {
    return (
      <div className="bg-black-900 border border-blue-500/20 rounded-xl p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin text-blue-500" size={32} />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black-900 border border-blue-500/20 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Clock className="text-blue-400" size={20} />
          Today's Attendance
        </h2>
        {/* Real-time Clock */}
        <div className="text-right">
          <p className="text-2xl font-bold text-white font-mono">
            {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
          </p>
          <p className="text-xs text-gray-400">
            {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Current Status Badge */}
      <div className="mb-4">
        {status?.clocked_out ? (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-500/20 text-gray-400 rounded-full text-sm">
            <CheckCircle size={14} />
            Shift Completed
          </div>
        ) : status?.on_break ? (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-yellow-500/20 text-yellow-400 rounded-full text-sm animate-pulse">
            <Coffee size={14} />
            On Break
          </div>
        ) : status?.clocked_in ? (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/20 text-green-400 rounded-full text-sm">
            <Clock size={14} />
            Currently Working
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-full text-sm">
            <LogIn size={14} />
            Ready to Clock In
          </div>
        )}
      </div>
      
      {/* Status Messages */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-400"
          >
            <AlertCircle size={16} />
            {error}
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center gap-2 text-green-400"
          >
            <CheckCircle size={16} />
            {success}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Current Status Display */}
      {status?.record && (
        <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-black-800 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-400 mb-1">Time In</p>
            <p className="text-lg font-bold text-green-400">
              {formatTime(status.record.time_in)}
            </p>
          </div>
          <div className="bg-black-800 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-400 mb-1">Break</p>
            <p className="text-sm text-yellow-400">
              {status.record.break_start 
                ? `${formatTime(status.record.break_start)} - ${formatTime(status.record.break_end) || 'Ongoing'}`
                : '--'}
            </p>
          </div>
          <div className="bg-black-800 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-400 mb-1">Time Out</p>
            <p className="text-lg font-bold text-red-400">
              {formatTime(status.record.time_out)}
            </p>
          </div>
          <div className="bg-black-800 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-400 mb-1">Work Hours</p>
            <p className="text-lg font-bold text-blue-400">
              {status.record.work_hours ? `${status.record.work_hours}h` : '--'}
            </p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Clock In Button */}
        <button
          onClick={() => startCamera('in')}
          disabled={isProcessing || status?.clocked_in || status?.clocked_out}
          className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all ${
            status?.clocked_in || status?.clocked_out
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          <LogIn size={24} />
          <span className="text-sm mt-1">Clock In</span>
        </button>

        {/* Break Button */}
        {status?.on_break ? (
          <button
            onClick={handleBreakEnd}
            disabled={isProcessing}
            className="flex flex-col items-center justify-center p-4 rounded-xl bg-yellow-600 hover:bg-yellow-700 text-white transition-all"
          >
            <Coffee size={24} />
            <span className="text-sm mt-1">End Break</span>
          </button>
        ) : (
          <button
            onClick={handleBreakStart}
            disabled={isProcessing || !status?.clocked_in || status?.clocked_out || (status?.record?.break_start && status?.record?.break_end)}
            className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all ${
              !status?.clocked_in || status?.clocked_out || (status?.record?.break_start && status?.record?.break_end)
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-yellow-600 hover:bg-yellow-700 text-white'
            }`}
          >
            <Coffee size={24} />
            <span className="text-sm mt-1">Start Break</span>
          </button>
        )}

        {/* Clock Out Button */}
        <button
          onClick={() => startCamera('out')}
          disabled={isProcessing || !status?.clocked_in || status?.clocked_out || status?.on_break}
          className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all ${
            !status?.clocked_in || status?.clocked_out || status?.on_break
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
        >
          <LogOut size={24} />
          <span className="text-sm mt-1">Clock Out</span>
        </button>

        {/* Refresh Button */}
        <button
          onClick={fetchStatus}
          disabled={isProcessing}
          className="flex flex-col items-center justify-center p-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all"
        >
          <RefreshCw size={24} className={isProcessing ? 'animate-spin' : ''} />
          <span className="text-sm mt-1">Refresh</span>
        </button>
      </div>

      {/* Overtime Notice */}
      {status?.record?.overtime_hours && status.record.overtime_hours > 0 && (
        <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 ${
          status.record.overtime_approved 
            ? 'bg-green-500/20 border border-green-500/30 text-green-400'
            : 'bg-yellow-500/20 border border-yellow-500/30 text-yellow-400'
        }`}>
          <Clock size={16} />
          <span>
            Overtime: {status.record.overtime_hours}h
            {status.record.overtime_approved ? ' (Approved)' : ' (Pending Approval)'}
          </span>
        </div>
      )}

      {/* Camera Modal */}
      <AnimatePresence>
        {showCamera && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-black-900 rounded-2xl p-6 w-full max-w-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">
                  {cameraAction === 'in' ? 'Clock In' : 'Clock Out'} Verification
                </h3>
                <button
                  onClick={stopCamera}
                  className="p-2 hover:bg-black-700 rounded-lg transition-colors"
                >
                  <X className="text-gray-400" size={20} />
                </button>
              </div>

              {cameraError ? (
                <div className="text-center py-8">
                  <AlertCircle className="mx-auto mb-4 text-red-400" size={48} />
                  <p className="text-red-400 mb-4">{cameraError}</p>
                  <button
                    onClick={() => cameraAction && startCamera(cameraAction)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Try Again
                  </button>
                </div>
              ) : (
                <>
                  {/* Camera View or Captured Photo */}
                  <div className="relative aspect-video bg-black rounded-xl overflow-hidden mb-4">
                    {!capturedPhoto ? (
                      <>
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover"
                        />
                        {/* Face detection overlay */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className={`w-48 h-48 border-4 rounded-full ${
                            faceDetected ? 'border-green-500' : 'border-gray-500'
                          } transition-colors`}>
                            {faceDetected && (
                              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                                <User size={14} />
                                Face Detected ({faceConfidence}%)
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    ) : (
                      <img src={capturedPhoto} alt="Captured" className="w-full h-full object-cover" />
                    )}
                  </div>
                  
                  {/* Hidden canvas for capture */}
                  <canvas ref={canvasRef} className="hidden" />

                  {/* Location Status */}
                  <div className="mb-4 p-3 bg-black-800 rounded-lg">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin size={16} className={location ? 'text-green-400' : 'text-gray-400'} />
                      {isGettingLocation ? (
                        <span className="text-gray-400">Getting location...</span>
                      ) : location ? (
                        <span className="text-green-400 truncate">
                          {location.address || `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`}
                        </span>
                      ) : locationError ? (
                        <span className="text-red-400">{locationError}</span>
                      ) : (
                        <span className="text-gray-400">Location will be captured</span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    {!capturedPhoto ? (
                      <button
                        onClick={capturePhoto}
                        disabled={!isCameraReady}
                        className="flex-1 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <Camera size={20} />
                        Capture Photo
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={retakePhoto}
                          className="flex-1 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                        >
                          <RefreshCw size={20} />
                          Retake
                        </button>
                        <button
                          onClick={submitClockAction}
                          disabled={isProcessing}
                          className="flex-1 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {isProcessing ? (
                            <Loader2 className="animate-spin" size={20} />
                          ) : (
                            <CheckCircle size={20} />
                          )}
                          Confirm {cameraAction === 'in' ? 'Clock In' : 'Clock Out'}
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AttendanceClock;
