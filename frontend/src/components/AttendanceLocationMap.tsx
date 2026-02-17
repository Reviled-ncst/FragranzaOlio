import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, X, Clock, LogIn, LogOut, Navigation, Camera, CheckCircle, User, ZoomIn } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getImageUrl } from '../services/api';

// Fix for default marker icon in Leaflet with Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

L.Marker.prototype.options.icon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Clock-in marker (green)
const ClockInIcon = L.divIcon({
  className: 'clock-in-marker',
  html: `<div style="
    background: linear-gradient(135deg, #22c55e, #16a34a);
    width: 32px;
    height: 32px;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    border: 3px solid white;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
  "><div style="
    transform: rotate(45deg);
    font-size: 14px;
  ">→</div></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

// Clock-out marker (red)
const ClockOutIcon = L.divIcon({
  className: 'clock-out-marker',
  html: `<div style="
    background: linear-gradient(135deg, #ef4444, #dc2626);
    width: 32px;
    height: 32px;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    border: 3px solid white;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
  "><div style="
    transform: rotate(45deg);
    font-size: 14px;
  ">←</div></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

export interface AttendanceLocationData {
  date: string;
  time_in?: string;
  time_out?: string;
  latitude_in?: number;
  longitude_in?: number;
  location_in?: string;
  latitude_out?: number;
  longitude_out?: number;
  location_out?: string;
  photo_in?: string;
  photo_out?: string;
  face_verified?: boolean;
  trainee_name?: string;
}

interface AttendanceLocationMapProps {
  isOpen: boolean;
  onClose: () => void;
  data: AttendanceLocationData | null;
}

export default function AttendanceLocationMap({ isOpen, onClose, data }: AttendanceLocationMapProps) {
  const [mapType, setMapType] = useState<'standard' | 'satellite'>('standard');
  const [fullscreenPhoto, setFullscreenPhoto] = useState<string | null>(null);

  if (!isOpen || !data) return null;

  const hasClockIn = data.latitude_in && data.longitude_in;
  const hasClockOut = data.latitude_out && data.longitude_out;
  const hasAnyLocation = hasClockIn || hasClockOut;
  const hasPhotoIn = !!data.photo_in;
  const hasPhotoOut = !!data.photo_out;

  // Calculate center and bounds
  let center: [number, number] = [14.5995, 120.9842]; // Default to Manila
  let zoom = 15;

  if (hasClockIn && hasClockOut) {
    // Center between both points
    center = [
      (data.latitude_in! + data.latitude_out!) / 2,
      (data.longitude_in! + data.longitude_out!) / 2
    ];
  } else if (hasClockIn) {
    center = [data.latitude_in!, data.longitude_in!];
  } else if (hasClockOut) {
    center = [data.latitude_out!, data.longitude_out!];
  }

  const formatTime = (time?: string) => {
    if (!time) return '--:--';
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const openInGoogleMaps = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-black-900 border border-gold-500/30 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-gold-500/20">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <MapPin className="text-gold-400" size={20} />
                Attendance Location
              </h2>
              <p className="text-sm text-gray-400 mt-0.5">
                {data.trainee_name && `${data.trainee_name} • `}{formatDate(data.date)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-black-800 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Map */}
          <div className="relative h-[400px]">
            {hasAnyLocation ? (
              <>
                <MapContainer
                  center={center}
                  zoom={zoom}
                  className="h-full w-full"
                  scrollWheelZoom={true}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url={mapType === 'satellite' 
                      ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
                      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
                    }
                  />
                  
                  {/* Clock-in marker */}
                  {hasClockIn && (
                    <Marker 
                      position={[data.latitude_in!, data.longitude_in!]} 
                      icon={ClockInIcon}
                    >
                      <Popup>
                        <div className="text-center">
                          <div className="font-semibold text-green-600 flex items-center gap-1 justify-center">
                            <LogIn size={14} /> Clock In
                          </div>
                          <div className="text-sm font-medium">{formatTime(data.time_in)}</div>
                          {data.location_in && (
                            <div className="text-xs text-gray-600 mt-1">{data.location_in}</div>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  )}

                  {/* Clock-out marker */}
                  {hasClockOut && (
                    <Marker 
                      position={[data.latitude_out!, data.longitude_out!]} 
                      icon={ClockOutIcon}
                    >
                      <Popup>
                        <div className="text-center">
                          <div className="font-semibold text-red-600 flex items-center gap-1 justify-center">
                            <LogOut size={14} /> Clock Out
                          </div>
                          <div className="text-sm font-medium">{formatTime(data.time_out)}</div>
                          {data.location_out && (
                            <div className="text-xs text-gray-600 mt-1">{data.location_out}</div>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  )}
                </MapContainer>

                {/* Map controls */}
                <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-2">
                  <button
                    onClick={() => setMapType(mapType === 'standard' ? 'satellite' : 'standard')}
                    className="p-2 bg-black-900/90 border border-gold-500/30 rounded-lg text-white hover:bg-black-800 transition-colors text-xs"
                  >
                    {mapType === 'standard' ? '🛰️ Satellite' : '🗺️ Standard'}
                  </button>
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center bg-black-800">
                <div className="text-center">
                  <MapPin className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-400">No Location Data</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Location was not captured for this attendance record
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Location Details */}
          <div className="p-5 border-t border-gold-500/20">
            {/* Face Verification Badge */}
            {data.face_verified && (
              <div className="mb-4 flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                <CheckCircle className="text-emerald-400" size={16} />
                <span className="text-sm text-emerald-400 font-medium">Face Verified</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Clock In */}
              <div className={`p-4 rounded-xl border ${hasClockIn || hasPhotoIn ? 'bg-green-500/10 border-green-500/30' : 'bg-black-800 border-gold-500/10'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                      <LogIn className="text-green-400" size={16} />
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Clock In</div>
                      <div className="text-white font-semibold">{formatTime(data.time_in)}</div>
                    </div>
                  </div>
                </div>

                {/* Selfie Photo */}
                {hasPhotoIn && (
                  <div className="mb-3">
                    <div className="relative group cursor-pointer" onClick={() => setFullscreenPhoto(getImageUrl(data.photo_in))}>
                      <img 
                        src={getImageUrl(data.photo_in)} 
                        alt="Clock-in selfie"
                        className="w-full h-32 object-cover rounded-lg border border-green-500/30"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                        <ZoomIn className="text-white" size={24} />
                      </div>
                      <div className="absolute top-2 left-2 px-2 py-1 bg-green-500/80 text-xs text-white rounded flex items-center gap-1">
                        <Camera size={10} /> Selfie
                      </div>
                    </div>
                  </div>
                )}
                
                {!hasPhotoIn && (
                  <div className="mb-3 h-32 bg-black-800 rounded-lg border border-gold-500/10 flex items-center justify-center">
                    <div className="text-center">
                      <User className="w-8 h-8 text-gray-600 mx-auto mb-1" />
                      <p className="text-xs text-gray-500">No selfie captured</p>
                    </div>
                  </div>
                )}

                {hasClockIn ? (
                  <>
                    {data.location_in && (
                      <p className="text-sm text-gray-400 mb-2">{data.location_in}</p>
                    )}
                    <p className="text-xs text-gray-500 mb-2">
                      {Number(data.latitude_in)?.toFixed(6)}, {Number(data.longitude_in)?.toFixed(6)}
                    </p>
                    <button
                      onClick={() => openInGoogleMaps(data.latitude_in!, data.longitude_in!)}
                      className="text-xs text-gold-400 hover:text-gold-300 flex items-center gap-1"
                    >
                      <Navigation size={12} /> Open in Google Maps
                    </button>
                  </>
                ) : (
                  <p className="text-sm text-gray-500">No location data</p>
                )}
              </div>

              {/* Clock Out */}
              <div className={`p-4 rounded-xl border ${hasClockOut || hasPhotoOut ? 'bg-red-500/10 border-red-500/30' : 'bg-black-800 border-gold-500/10'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                      <LogOut className="text-red-400" size={16} />
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Clock Out</div>
                      <div className="text-white font-semibold">{formatTime(data.time_out)}</div>
                    </div>
                  </div>
                </div>

                {/* Selfie Photo */}
                {hasPhotoOut && (
                  <div className="mb-3">
                    <div className="relative group cursor-pointer" onClick={() => setFullscreenPhoto(getImageUrl(data.photo_out))}>
                      <img 
                        src={getImageUrl(data.photo_out)} 
                        alt="Clock-out selfie"
                        className="w-full h-32 object-cover rounded-lg border border-red-500/30"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                        <ZoomIn className="text-white" size={24} />
                      </div>
                      <div className="absolute top-2 left-2 px-2 py-1 bg-red-500/80 text-xs text-white rounded flex items-center gap-1">
                        <Camera size={10} /> Selfie
                      </div>
                    </div>
                  </div>
                )}
                
                {!hasPhotoOut && data.time_out && (
                  <div className="mb-3 h-32 bg-black-800 rounded-lg border border-gold-500/10 flex items-center justify-center">
                    <div className="text-center">
                      <User className="w-8 h-8 text-gray-600 mx-auto mb-1" />
                      <p className="text-xs text-gray-500">No selfie captured</p>
                    </div>
                  </div>
                )}

                {!data.time_out && (
                  <div className="mb-3 h-32 bg-black-800 rounded-lg border border-gold-500/10 flex items-center justify-center">
                    <div className="text-center">
                      <Clock className="w-8 h-8 text-gray-600 mx-auto mb-1" />
                      <p className="text-xs text-gray-500">Not clocked out yet</p>
                    </div>
                  </div>
                )}

                {hasClockOut ? (
                  <>
                    {data.location_out && (
                      <p className="text-sm text-gray-400 mb-2">{data.location_out}</p>
                    )}
                    <p className="text-xs text-gray-500 mb-2">
                      {Number(data.latitude_out)?.toFixed(6)}, {Number(data.longitude_out)?.toFixed(6)}
                    </p>
                    <button
                      onClick={() => openInGoogleMaps(data.latitude_out!, data.longitude_out!)}
                      className="text-xs text-gold-400 hover:text-gold-300 flex items-center gap-1"
                    >
                      <Navigation size={12} /> Open in Google Maps
                    </button>
                  </>
                ) : (
                  <p className="text-sm text-gray-500">{data.time_out ? 'No location data' : ''}</p>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Fullscreen Photo Viewer */}
        <AnimatePresence>
          {fullscreenPhoto && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/95 flex items-center justify-center z-[60]"
              onClick={() => setFullscreenPhoto(null)}
            >
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.8 }}
                className="relative max-w-3xl max-h-[90vh] p-4"
              >
                <button
                  onClick={() => setFullscreenPhoto(null)}
                  className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white hover:bg-black/80 transition-colors z-10"
                >
                  <X size={24} />
                </button>
                <img
                  src={fullscreenPhoto}
                  alt="Attendance selfie"
                  className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}

// Button component for triggering the map
interface LocationButtonProps {
  hasLocation: boolean;
  onClick: () => void;
  size?: 'sm' | 'md';
}

export function LocationButton({ hasLocation, onClick, size = 'sm' }: LocationButtonProps) {
  const sizeClasses = size === 'sm' 
    ? 'p-1.5 text-xs' 
    : 'p-2 text-sm';
  
  return (
    <button
      onClick={onClick}
      className={`${sizeClasses} rounded-lg transition-colors flex items-center gap-1 ${
        hasLocation 
          ? 'text-gold-400 hover:bg-gold-500/20 hover:text-gold-300' 
          : 'text-gray-500 cursor-not-allowed'
      }`}
      title={hasLocation ? 'View location' : 'No location data'}
      disabled={!hasLocation}
    >
      <MapPin size={size === 'sm' ? 14 : 16} />
    </button>
  );
}
