import { useState, useEffect, useCallback, useRef } from 'react';
import { API_BASE_URL, apiFetch } from '../services/api';
import { useAuth } from '../context/AuthContext';
import OJTLayout from '../components/layout/OJTLayout';
import { loadModels, detectFace, areModelsLoaded, FaceDetectionResult } from '../services/faceRecognitionService';
import { Shield, Loader2, CheckCircle, User, AlertTriangle, MapPin } from 'lucide-react';
import AttendanceLocationMap, { AttendanceLocationData, LocationButton } from '../components/AttendanceLocationMap';

interface AttendanceRecord {
  id: number;
  user_id: number;
  date: string;
  time_in: string | null;
  time_out: string | null;
  break_start: string | null;
  break_end: string | null;
  work_hours: number;
  overtime_hours: number;
  status: string;
  late_minutes: number;
  penalty_hours: number;
  photo_in: string | null;
  photo_out: string | null;
  latitude_in?: number;
  longitude_in?: number;
  location_in?: string;
  latitude_out?: number;
  longitude_out?: number;
  location_out?: string;
}

interface CameraModalProps {
  isOpen: boolean;
  onCapture: (photo: string) => void;
  onClose: () => void;
  title: string;
}

// Camera Modal Component with Face Recognition
function CameraModal({ isOpen, onCapture, onClose, title }: CameraModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError] = useState<string>('');
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [faceConfidence, setFaceConfidence] = useState(0);
  const [faceBox, setFaceBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const lastFaceDetectedRef = useRef(false);
  const detectionCountRef = useRef(0);
  const autoCaptureTriggeredRef = useRef(false);
  const highConfidenceCountRef = useRef(0);
  // Smoothing for confidence - rolling average of last 10 values
  const confidenceHistoryRef = useRef<number[]>([]);
  const smoothedConfidenceRef = useRef(0);

  // Load face detection models
  useEffect(() => {
    const initModels = async () => {
      if (!areModelsLoaded() && !modelsLoading) {
        setModelsLoading(true);
        try {
          await loadModels();
          setModelsLoaded(true);
        } catch (err) {
          console.error('Failed to load face detection models:', err);
        } finally {
          setModelsLoading(false);
        }
      } else if (areModelsLoaded()) {
        setModelsLoaded(true);
      }
    };
    initModels();
  }, []);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setCameraReady(false);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: 640, height: 480 } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setCameraReady(true);
          if (modelsLoaded) {
            startFaceDetection();
          }
        };
      }
      setError('');
    } catch {
      setError('Camera access denied. Please enable camera permissions.');
    }
  };

  // Start face detection when models are loaded
  useEffect(() => {
    if (modelsLoaded && stream && videoRef.current) {
      startFaceDetection();
    }
  }, [modelsLoaded, stream]);

  const startFaceDetection = () => {
    if (!modelsLoaded) return;
    
    const runDetection = async () => {
      if (!videoRef.current || videoRef.current.readyState !== 4) {
        animationFrameRef.current = requestAnimationFrame(runDetection);
        return;
      }
      
      try {
        const result: FaceDetectionResult = await detectFace(videoRef.current);
        const video = videoRef.current;
        
        // Debounce face detection state changes to reduce flickering
        if (result.detected !== lastFaceDetectedRef.current) {
          detectionCountRef.current++;
          // Only change state after 3 consecutive same results
          if (detectionCountRef.current >= 3) {
            setFaceDetected(result.detected);
            lastFaceDetectedRef.current = result.detected;
            detectionCountRef.current = 0;
            // Reset confidence history when face detection changes
            if (!result.detected) {
              confidenceHistoryRef.current = [];
              smoothedConfidenceRef.current = 0;
              setFaceConfidence(0);
            }
          }
        } else {
          detectionCountRef.current = 0;
        }
        
        // Calculate quality score based on face size and position
        if (result.detected && result.box && video) {
          const frameWidth = video.videoWidth;
          const frameHeight = video.videoHeight;
          const faceWidth = result.box.width;
          const faceHeight = result.box.height;
          const faceCenterX = result.box.x + faceWidth / 2;
          const faceCenterY = result.box.y + faceHeight / 2;
          const frameCenterX = frameWidth / 2;
          const frameCenterY = frameHeight / 2;
          
          // Size score: face should be at least 10% of frame width
          // More forgiving - any reasonably sized face is good
          const sizeRatio = faceWidth / frameWidth;
          let sizeScore = 1;
          if (sizeRatio < 0.10) {
            // Too small - face too far
            sizeScore = sizeRatio / 0.10;
          } else if (sizeRatio >= 0.10) {
            // Good size or close - full score
            sizeScore = 1;
          }
          
          // Position score: face should be reasonably centered (more forgiving)
          const maxDistX = frameWidth / 2;
          const maxDistY = frameHeight / 2;
          const distX = Math.abs(faceCenterX - frameCenterX) / maxDistX;
          const distY = Math.abs(faceCenterY - frameCenterY) / maxDistY;
          // More forgiving - only penalize if very off-center
          const positionScore = Math.max(0, 1 - (distX * 0.5 + distY * 0.5));
          
          // Combined score - base 50% just for detecting, rest from quality
          // Size 30%, Position 20%
          const qualityScore = 50 + (sizeScore * 30) + (positionScore * 20);
          
          // Very slow smooth transition - only move 5% toward target per frame
          const targetScore = Math.min(99, Math.max(30, qualityScore));
          if (smoothedConfidenceRef.current === 0) {
            smoothedConfidenceRef.current = targetScore; // Initialize
          } else {
            smoothedConfidenceRef.current = smoothedConfidenceRef.current + (targetScore - smoothedConfidenceRef.current) * 0.05;
          }
          
          // Only update display when value changes by at least 1
          const displayValue = Math.round(smoothedConfidenceRef.current);
          if (displayValue !== faceConfidence) {
            setFaceConfidence(displayValue);
          }
        }
        
        setFaceBox(result.box || null);
        
        // Get smoothed confidence for auto-capture check
        const currentConfidence = smoothedConfidenceRef.current;
        
        // Auto-capture when smoothed confidence >= 90% for 5 consecutive frames
        if (result.detected && currentConfidence >= 90 && !autoCaptureTriggeredRef.current) {
          highConfidenceCountRef.current++;
          if (highConfidenceCountRef.current >= 5) {
            autoCaptureTriggeredRef.current = true;
            // Trigger auto-capture
            if (videoRef.current && canvasRef.current) {
              const canvas = canvasRef.current;
              const video = videoRef.current;
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              const ctx = canvas.getContext('2d', { willReadFrequently: true });
              if (ctx) {
                ctx.drawImage(video, 0, 0);
                const photoData = canvas.toDataURL('image/jpeg', 0.8);
                // Stop detection and capture
                if (animationFrameRef.current) {
                  cancelAnimationFrame(animationFrameRef.current);
                  animationFrameRef.current = null;
                }
                onCapture(photoData);
                stopCamera();
                return;
              }
            }
          }
        } else {
          highConfidenceCountRef.current = 0;
        }
        
        // Draw overlay on canvas
        if (overlayCanvasRef.current && videoRef.current) {
          const canvas = overlayCanvasRef.current;
          const video = videoRef.current;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          
          if (ctx) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            if (result.box) {
              // Draw face bounding box
              ctx.strokeStyle = result.detected ? '#22c55e' : '#ef4444';
              ctx.lineWidth = 3;
              ctx.strokeRect(result.box.x, result.box.y, result.box.width, result.box.height);
              
              // Draw corner accents
              const cornerLength = 20;
              ctx.lineWidth = 4;
              ctx.strokeStyle = '#22c55e';
              
              // Top-left
              ctx.beginPath();
              ctx.moveTo(result.box.x, result.box.y + cornerLength);
              ctx.lineTo(result.box.x, result.box.y);
              ctx.lineTo(result.box.x + cornerLength, result.box.y);
              ctx.stroke();
              
              // Top-right
              ctx.beginPath();
              ctx.moveTo(result.box.x + result.box.width - cornerLength, result.box.y);
              ctx.lineTo(result.box.x + result.box.width, result.box.y);
              ctx.lineTo(result.box.x + result.box.width, result.box.y + cornerLength);
              ctx.stroke();
              
              // Bottom-left
              ctx.beginPath();
              ctx.moveTo(result.box.x, result.box.y + result.box.height - cornerLength);
              ctx.lineTo(result.box.x, result.box.y + result.box.height);
              ctx.lineTo(result.box.x + cornerLength, result.box.y + result.box.height);
              ctx.stroke();
              
              // Bottom-right
              ctx.beginPath();
              ctx.moveTo(result.box.x + result.box.width - cornerLength, result.box.y + result.box.height);
              ctx.lineTo(result.box.x + result.box.width, result.box.y + result.box.height);
              ctx.lineTo(result.box.x + result.box.width, result.box.y + result.box.height - cornerLength);
              ctx.stroke();
            }
          }
        }
      } catch (err) {
        console.error('Face detection error:', err);
      }
      
      animationFrameRef.current = requestAnimationFrame(runDetection);
    };
    
    runDetection();
  };

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setFaceDetected(false);
    setFaceConfidence(0);
    setFaceBox(null);
    setCameraReady(false);
    lastFaceDetectedRef.current = false;
    detectionCountRef.current = 0;
    autoCaptureTriggeredRef.current = false;
    highConfidenceCountRef.current = 0;
    confidenceHistoryRef.current = [];
    smoothedConfidenceRef.current = 0;
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const photoData = canvas.toDataURL('image/jpeg', 0.8);
        onCapture(photoData);
        stopCamera();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-black-900 border border-gold-500/30 rounded-2xl p-6 max-w-lg w-full mx-4">
        <h3 className="text-xl font-bold text-white mb-4">{title}</h3>
        
        {error ? (
          <div className="text-center py-8">
            <p className="text-red-500 mb-4">{error}</p>
            <button onClick={onClose} className="px-6 py-2 bg-black-800 rounded-lg hover:bg-black-700 text-white">
              Close
            </button>
          </div>
        ) : (
          <>
            {/* Model Loading Status */}
            {modelsLoading && (
              <div className="mb-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg flex items-center gap-2">
                <Loader2 className="animate-spin text-blue-400" size={16} />
                <span className="text-blue-400 text-sm">Loading AI Face Recognition...</span>
              </div>
            )}
            
            {modelsLoaded && (
              <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center gap-2">
                <Shield className="text-green-400" size={16} />
                <span className="text-green-400 text-sm">AI Face Recognition Active</span>
              </div>
            )}

            <div className="relative rounded-xl overflow-hidden bg-black mb-4">
              <video ref={videoRef} autoPlay playsInline muted className="w-full" />
              {/* Face detection overlay canvas */}
              <canvas
                ref={overlayCanvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
              />
              {/* Face detection status badge */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none">
                {faceDetected && faceConfidence >= 90 ? (
                  <div className="bg-green-500 text-white px-4 py-2 rounded-full text-sm flex items-center gap-2 shadow-lg animate-pulse">
                    <Loader2 className="animate-spin" size={16} />
                    Auto-capturing... ({faceConfidence}%)
                  </div>
                ) : faceDetected ? (
                  <div className="bg-green-500/90 text-white px-4 py-2 rounded-full text-sm flex items-center gap-2 shadow-lg">
                    <CheckCircle size={16} />
                    Face Detected ({faceConfidence}%)
                  </div>
                ) : modelsLoaded && cameraReady ? (
                  <div className="bg-gray-700/90 text-gray-200 px-4 py-2 rounded-full text-sm flex items-center gap-2 shadow-lg">
                    <User size={16} />
                    Position your face in frame
                  </div>
                ) : null}
              </div>
            </div>
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Face detection status - fixed height to prevent layout shifts */}
            <div className="mb-4 h-12 flex items-center">
              {modelsLoaded && cameraReady && !faceDetected ? (
                <div className="w-full p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg flex items-center gap-2">
                  <AlertTriangle className="text-yellow-400 flex-shrink-0" size={16} />
                  <span className="text-yellow-400 text-sm">No face detected - you can still capture</span>
                </div>
              ) : modelsLoaded && cameraReady && faceDetected && faceConfidence >= 90 ? (
                <div className="w-full p-3 bg-green-500/30 border border-green-500/50 rounded-lg flex items-center gap-2 animate-pulse">
                  <Loader2 className="text-green-400 flex-shrink-0 animate-spin" size={16} />
                  <span className="text-green-400 text-sm font-semibold">Auto-capturing photo...</span>
                </div>
              ) : modelsLoaded && cameraReady && faceDetected ? (
                <div className="w-full p-3 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center gap-2">
                  <CheckCircle className="text-green-400 flex-shrink-0" size={16} />
                  <span className="text-green-400 text-sm">Face verified ({faceConfidence}%) - auto-capture at 90%</span>
                </div>
              ) : null}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={capturePhoto}
                disabled={!cameraReady}
                className={`flex-1 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                  faceDetected 
                    ? 'bg-green-500 text-white hover:bg-green-400' 
                    : 'bg-gold-500 text-black hover:bg-gold-400'
                } disabled:opacity-50`}
              >
                {faceDetected && <CheckCircle size={18} />}
                📸 Capture Photo
              </button>
              <button
                onClick={() => { stopCamera(); onClose(); }}
                className="px-6 py-3 bg-black-800 rounded-xl font-semibold hover:bg-black-700 text-white"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// OJT Schedule Configuration
const OJT_SCHEDULE = {
  START_TIME: 9,      // 9:00 AM
  END_TIME: 18,       // 6:00 PM
  LUNCH_START: 12,    // 12:00 PM
  LUNCH_END: 13,      // 1:00 PM
  LUNCH_DURATION: 1,  // 1 hour (automatically deducted)
  DAILY_WORK_HOURS: 8, // 9 hours total - 1 hour lunch = 8 hours
};

// Calculate late penalty
function calculateLatePenalty(timeIn: string | null): { lateMinutes: number; penaltyHours: number } {
  if (!timeIn) return { lateMinutes: 0, penaltyHours: 0 };
  
  const [hours, minutes] = timeIn.split(':').map(Number);
  const clockInMinutes = hours * 60 + minutes;
  const startTimeMinutes = OJT_SCHEDULE.START_TIME * 60; // 9:00 AM
  
  if (clockInMinutes <= startTimeMinutes) {
    return { lateMinutes: 0, penaltyHours: 0 };
  }
  
  const lateMinutes = clockInMinutes - startTimeMinutes;
  
  // Penalty calculation: 1 min - 1hr 59min late = 30 min penalty, 2+ hours late = 4 hours penalty
  let penaltyHours = 0;
  if (lateMinutes >= 120) {
    penaltyHours = 4;
  } else if (lateMinutes >= 1) {
    penaltyHours = 0.5;
  }
  
  return { lateMinutes, penaltyHours };
}

// Format time for display
function formatTime(time: string | null): string {
  if (!time) return '--:--';
  const [hours, minutes] = time.split(':');
  const h = parseInt(hours);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayHour = h % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

// Format hours to HH:MM
function formatHours(hours: number): string {
  if (!hours || hours <= 0) return '0:00';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}:${m.toString().padStart(2, '0')}`;
}

// Get date string in local timezone
function getLocalDateString(date: Date = new Date()): string {
  return date.toLocaleDateString('en-CA'); // YYYY-MM-DD format
}

export default function OJTTimesheet() {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);
  const [weekRecords, setWeekRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraAction, setCameraAction] = useState<'in' | 'out'>('in');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showLocationMap, setShowLocationMap] = useState(false);
  const [selectedLocationData, setSelectedLocationData] = useState<AttendanceLocationData | null>(null);

  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Reset state when user changes
  useEffect(() => {
    setTodayAttendance(null);
    setWeekRecords([]);
    setIsLoading(true);
    setMessage(null);
  }, [user?.id]);

  // Fetch attendance data
  const fetchAttendance = useCallback(async () => {
    if (!user) return;
    
    // Reset state for new user
    setTodayAttendance(null);
    setWeekRecords([]);
    
    try {
      const today = getLocalDateString();
      
      // Get today's attendance
      const todayRes = await apiFetch(`${API_BASE_URL}/ojt_attendance.php/today?trainee_id=${user.id}`);
      const todayData = await todayRes.json();
      if (todayData.success && todayData.data) {
        // Handle array or single object
        const records: AttendanceRecord[] = Array.isArray(todayData.data) ? todayData.data : [todayData.data];
        // Find record for THIS user only - normalize both sides to String for comparison
        const userId = String(user.id);
        const userRecord = records.find((r) => {
          const recUserId = String(r.user_id ?? '');
          const recTraineeId = String((r as { trainee_id?: number }).trainee_id ?? '');
          return recUserId === userId || recTraineeId === userId;
        });
        if (userRecord) {
          setTodayAttendance({
            ...userRecord,
            time_in: userRecord.time_in?.split(' ').pop() || null,
            time_out: userRecord.time_out?.split(' ').pop() || null,
            break_start: userRecord.break_start?.split(' ').pop() || null,
            break_end: userRecord.break_end?.split(' ').pop() || null,
          });
        } else {
          setTodayAttendance(null);
        }
      } else {
        setTodayAttendance(null);
      }

      // Get week records (history)
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const weekRes = await apiFetch(
        `${API_BASE_URL}/ojt_attendance.php/history?trainee_id=${user.id}&start_date=${getLocalDateString(weekStart)}&end_date=${getLocalDateString(weekEnd)}`
      );
      const weekData = await weekRes.json();
      if (weekData.success && Array.isArray(weekData.data)) {
        // Map attendance_date to date for consistency - filter by user ID
        const userId = String(user.id);
        const mapped: AttendanceRecord[] = (weekData.data as (AttendanceRecord & { trainee_id?: number; attendance_date?: string })[])
          .filter((r) => {
            const recUserId = String(r.user_id ?? '');
            const recTraineeId = String(r.trainee_id ?? '');
            return recTraineeId === userId || recUserId === userId;
          })
          .map((r) => ({
            ...r,
            date: r.attendance_date || r.date,
            time_in: r.time_in?.split(' ').pop() || null,
            time_out: r.time_out?.split(' ').pop() || null,
        }));
        setWeekRecords(mapped);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  // Clock In
  // Helper to get current position
  const getCurrentLocation = (): Promise<{latitude: number; longitude: number; location: string} | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          // Try to get address from coordinates using reverse geocoding
          let location = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await response.json();
            if (data.display_name) {
              location = data.display_name;
            }
          } catch {
            // Keep coordinates as fallback
          }
          resolve({ latitude, longitude, location });
        },
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  };

  const handleClockIn = async (photo: string) => {
    if (!user) return;
    setActionLoading(true);
    setShowCamera(false);

    try {
      const now = new Date();
      const timeIn = now.toTimeString().slice(0, 8);
      const { lateMinutes, penaltyHours } = calculateLatePenalty(timeIn);
      
      // Get current location
      const locationData = await getCurrentLocation();

      const res = await apiFetch(`${API_BASE_URL}/ojt_attendance.php/clock-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trainee_id: user.id,
          photo: photo,
          late_minutes: lateMinutes,
          penalty_hours: penaltyHours,
          latitude: locationData?.latitude || null,
          longitude: locationData?.longitude || null,
          location: locationData?.location || null
        })
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: lateMinutes > 0 
          ? `Clocked in! You are ${lateMinutes} min late. Penalty: ${penaltyHours}h`
          : 'Clocked in successfully!' 
        });
        await fetchAttendance();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to clock in' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Clock Out
  const handleClockOut = async (photo: string) => {
    if (!user || !todayAttendance) return;
    setActionLoading(true);
    setShowCamera(false);

    try {
      // Get current location
      const locationData = await getCurrentLocation();

      const res = await apiFetch(`${API_BASE_URL}/ojt_attendance.php/clock-out`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trainee_id: user.id,
          photo: photo,
          latitude: locationData?.latitude || null,
          longitude: locationData?.longitude || null,
          location: locationData?.location || null
        })
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: `Clocked out! Work hours: ${formatHours(data.data?.work_hours || 0)}` });
        await fetchAttendance();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to clock out' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Break Start
  const handleBreakStart = async () => {
    if (!user || !todayAttendance) return;
    setActionLoading(true);

    try {
      const res = await apiFetch(`${API_BASE_URL}/ojt_attendance.php/break-start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trainee_id: user.id
        })
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Break started!' });
        await fetchAttendance();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to start break' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Break End
  const handleBreakEnd = async () => {
    if (!user || !todayAttendance) return;
    setActionLoading(true);

    try {
      const res = await apiFetch(`${API_BASE_URL}/ojt_attendance.php/break-end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trainee_id: user.id
        })
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Break ended!' });
        await fetchAttendance();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to end break' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Get current status
  const getStatus = () => {
    if (!todayAttendance || !todayAttendance.time_in) return 'not_clocked';
    if (todayAttendance.time_out) return 'complete';
    if (todayAttendance.break_start && !todayAttendance.break_end) return 'on_break';
    return 'working';
  };

  const status = getStatus();

  // Calculate week totals
  const weekTotals = weekRecords.reduce((acc, r) => ({
    workHours: acc.workHours + (Number(r.work_hours) || 0),
    overtime: acc.overtime + (Number(r.overtime_hours) || 0),
    penalty: acc.penalty + (Number(r.penalty_hours) || 0),
    late: acc.late + (Number(r.late_minutes) || 0)
  }), { workHours: 0, overtime: 0, penalty: 0, late: 0 });

  const netHours = weekTotals.workHours - weekTotals.penalty + weekTotals.overtime;

  // Get week dates
  const getWeekDates = () => {
    const dates = [];
    const start = new Date();
    start.setDate(start.getDate() - start.getDay());
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  const weekDates = getWeekDates();

  if (isLoading) {
    return (
      <OJTLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gold-500 border-t-transparent"></div>
        </div>
      </OJTLayout>
    );
  }

  return (
    <OJTLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header with Clock */}
        <div className="bg-gradient-to-r from-gold-600 to-gold-500 rounded-2xl p-6 text-black">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">⏰ My Timesheet</h1>
              <p className="text-gold-900/80 mt-1">
                {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold font-mono">
                {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
              <div className="mt-2">
                {status === 'not_clocked' && (
                  <span className="px-3 py-1 bg-black/20 text-black rounded-full text-sm">Not Clocked In</span>
                )}
                {status === 'working' && (
                  <span className="px-3 py-1 bg-green-500/30 text-green-900 rounded-full text-sm animate-pulse">🟢 Working</span>
                )}
                {status === 'on_break' && (
                  <span className="px-3 py-1 bg-amber-500/30 text-amber-900 rounded-full text-sm">☕ On Break</span>
                )}
                {status === 'complete' && (
                  <span className="px-3 py-1 bg-black/20 text-black rounded-full text-sm">✅ Shift Complete</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`p-4 rounded-xl ${message.type === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
            {message.text}
            <button onClick={() => setMessage(null)} className="float-right font-bold">×</button>
          </div>
        )}

        {/* OJT Schedule Info */}
        <div className="bg-black-900/50 border border-gold-500/10 rounded-xl p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6 text-sm">
              <div>
                <span className="text-gray-400">Schedule:</span>
                <span className="text-white ml-2 font-medium">9:00 AM - 6:00 PM</span>
              </div>
              <div>
                <span className="text-gray-400">Lunch:</span>
                <span className="text-white ml-2 font-medium">12:00 PM - 1:00 PM</span>
                <span className="text-gray-500 text-xs ml-1">(auto-deducted)</span>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Daily target: 8 hours
            </div>
          </div>
        </div>

        {/* Today's Attendance Card */}
        <div className="bg-black-900 border border-gold-500/20 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">Today's Attendance</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-black-800 rounded-xl p-4 text-center">
              <p className="text-sm text-gray-400">Clock In</p>
              <p className="text-xl font-bold text-white">{formatTime(todayAttendance?.time_in || null)}</p>
              {todayAttendance?.late_minutes && todayAttendance.late_minutes > 0 && (
                <p className="text-xs text-red-500 mt-1">Late {todayAttendance.late_minutes} min</p>
              )}
            </div>
            <div className="bg-black-800 rounded-xl p-4 text-center">
              <p className="text-sm text-gray-400">Clock Out</p>
              <p className="text-xl font-bold text-white">{formatTime(todayAttendance?.time_out || null)}</p>
            </div>
            <div className="bg-black-800 rounded-xl p-4 text-center">
              <p className="text-sm text-gray-400">Work Hours</p>
              <p className="text-xl font-bold text-gold-400">{formatHours(Number(todayAttendance?.work_hours) || 0)}</p>
            </div>
            <div className="bg-black-800 rounded-xl p-4 text-center">
              <p className="text-sm text-gray-400">Penalty</p>
              <p className="text-xl font-bold text-red-400">-{formatHours(Number(todayAttendance?.penalty_hours) || 0)}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            {status === 'not_clocked' && (
              <button
                onClick={() => { setCameraAction('in'); setShowCamera(true); }}
                disabled={actionLoading}
                className="flex-1 py-3 bg-gold-500 text-black rounded-xl font-semibold hover:bg-gold-400 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading ? '...' : '🟢 Clock In'}
              </button>
            )}
            
            {status === 'working' && (
              <>
                <button
                  onClick={handleBreakStart}
                  disabled={actionLoading}
                  className="flex-1 py-3 bg-amber-500 text-black rounded-xl font-semibold hover:bg-amber-400 disabled:opacity-50"
                >
                  {actionLoading ? '...' : '☕ Start Break'}
                </button>
                <button
                  onClick={() => { setCameraAction('out'); setShowCamera(true); }}
                  disabled={actionLoading}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 disabled:opacity-50"
                >
                  {actionLoading ? '...' : '🔴 Clock Out'}
                </button>
              </>
            )}

            {status === 'on_break' && (
              <button
                onClick={handleBreakEnd}
                disabled={actionLoading}
                className="flex-1 py-3 bg-gold-500 text-black rounded-xl font-semibold hover:bg-gold-400 disabled:opacity-50"
              >
                {actionLoading ? '...' : '▶️ End Break'}
              </button>
            )}

            {status === 'complete' && (
              <div className="flex-1 py-3 bg-black-800 text-gray-400 rounded-xl text-center font-semibold">
                ✅ Shift Complete - See you tomorrow!
              </div>
            )}
          </div>
        </div>

        {/* Weekly Timesheet Table */}
        <div className="bg-black-900 border border-gold-500/20 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-gold-500/20">
            <h2 className="text-lg font-bold text-white">Weekly Timesheet</h2>
            <p className="text-sm text-gray-400">
              {weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Date</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase">Clock In</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase">Clock Out</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase">Gross Hours</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase">Late</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase">Penalty</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase">Net Hours</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase">Overtime</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase">Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold-500/10">
                {weekDates.map((date) => {
                  const dateStr = getLocalDateString(date);
                  const record = weekRecords.find(r => r.date === dateStr);
                  const isToday = dateStr === getLocalDateString();
                  const isPast = date < new Date() && !isToday;
                  const workHours = Number(record?.work_hours) || 0;
                  const penalty = Number(record?.penalty_hours) || 0;
                  const overtime = Number(record?.overtime_hours) || 0;
                  const netHrs = workHours - penalty + overtime;

                  return (
                    <tr key={dateStr} className={isToday ? 'bg-gold-500/10' : ''}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-white">
                          {date.toLocaleDateString('en-US', { weekday: 'short' })}
                        </div>
                        <div className="text-sm text-gray-500">
                          {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {record?.time_in ? (
                          <span className={record.late_minutes > 0 ? 'text-red-400' : 'text-white'}>
                            {formatTime(record.time_in)}
                          </span>
                        ) : (
                          <span className="text-gray-500">{isPast ? 'Absent' : '--:--'}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-white">
                        {formatTime(record?.time_out || null)}
                      </td>
                      <td className="px-4 py-3 text-center text-white">
                        {formatHours(workHours)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {record?.late_minutes && record.late_minutes > 0 ? (
                          <span className="text-red-400">{record.late_minutes} min</span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {penalty > 0 ? (
                          <span className="text-red-400 font-medium">-{formatHours(penalty)}</span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-medium text-white">{formatHours(netHrs)}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {overtime > 0 ? (
                          <span className="text-gold-400 font-medium">+{formatHours(overtime)}</span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {record && (record.latitude_in || record.latitude_out || record.photo_in || record.photo_out) ? (
                          <button
                            onClick={() => {
                              setSelectedLocationData({
                                date: record.date,
                                time_in: record.time_in || undefined,
                                time_out: record.time_out || undefined,
                                latitude_in: record.latitude_in,
                                longitude_in: record.longitude_in,
                                location_in: record.location_in,
                                latitude_out: record.latitude_out,
                                longitude_out: record.longitude_out,
                                location_out: record.location_out,
                                photo_in: record.photo_in || undefined,
                                photo_out: record.photo_out || undefined
                              });
                              setShowLocationMap(true);
                            }}
                            className="p-1.5 text-gold-400 hover:bg-gold-500/20 rounded-lg transition-colors"
                            title="View location & selfie"
                          >
                            <MapPin size={16} />
                          </button>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-black-800 font-semibold">
                <tr>
                  <td className="px-4 py-3 text-white">Week Total</td>
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3 text-center text-white">{formatHours(weekTotals.workHours)}</td>
                  <td className="px-4 py-3 text-center text-red-400">{weekTotals.late} min</td>
                  <td className="px-4 py-3 text-center text-red-400">-{formatHours(weekTotals.penalty)}</td>
                  <td className="px-4 py-3 text-center text-white">{formatHours(netHours)}</td>
                  <td className="px-4 py-3 text-center text-gold-400">+{formatHours(weekTotals.overtime)}</td>
                  <td className="px-4 py-3"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Late Policy Notice */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <h3 className="font-semibold text-amber-400 mb-2">⚠️ Late Policy</h3>
          <ul className="text-sm text-amber-300/80 space-y-1">
            <li>• Work starts at <strong>8:00 AM</strong></li>
            <li>• 1 minute to 1 hour 59 minutes late = <strong>30 minutes deduction</strong></li>
            <li>• 2+ hours late = <strong>4 hours deduction</strong></li>
            <li>• Overtime can only be approved by your supervisor</li>
          </ul>
        </div>
      </div>

      {/* Camera Modal */}
      <CameraModal
        isOpen={showCamera}
        onCapture={cameraAction === 'in' ? handleClockIn : handleClockOut}
        onClose={() => setShowCamera(false)}
        title={cameraAction === 'in' ? '📸 Clock In Photo' : '📸 Clock Out Photo'}
      />

      {/* Location Map Modal */}
      <AttendanceLocationMap
        isOpen={showLocationMap}
        onClose={() => setShowLocationMap(false)}
        data={selectedLocationData}
      />
    </OJTLayout>
  );
}



