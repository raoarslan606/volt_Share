import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { toast } from 'sonner';
import { MapPin, Zap, Phone, MessageSquare, Calendar, Filter, Navigation, X, CheckCircle2 } from 'lucide-react';
import { api } from '../lib/api';
import { Station } from '../types';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';

// Custom Leaflet Green Pin Icon
const createCustomIcon = (type: 'HOUSEHOLD' | 'PUBLIC') => {
  const color = type === 'PUBLIC' ? '#3B82F6' : '#10B981';
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="
        background: ${color};
        width: 36px;
        height: 36px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 14px rgba(0,0,0,0.5);
        border: 2px solid #ffffff;
      ">
        <div style="transform: rotate(45deg); color: #090d16; font-weight: bold; font-size: 14px;">⚡</div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });
};

// Map Recenter Helper Component
const MapRecenter: React.FC<{ lat: number; lng: number }> = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 13, { duration: 1.5 });
  }, [lat, lng, map]);
  return null;
};

export const MapPage: React.FC = () => {
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number }>({
    lat: 31.5497, // Default Lahore center
    lng: 74.3436,
  });
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [connectorFilter, setConnectorFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingTimeSlot, setBookingTimeSlot] = useState('10:00-11:00');
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [bookingLoading, setBookingLoading] = useState(false);

  const { user } = useAuthStore();
  const navigate = useNavigate();

  // Detect user geolocation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          toast.success('Location updated');
        },
        () => {
          toast.info('Using default map location (Lahore)');
        },
      );
    }
  }, []);

  // Fetch nearby stations
  const { data: stations = [], isLoading } = useQuery<Station[]>({
    queryKey: ['stations-nearby', userCoords.lat, userCoords.lng],
    queryFn: async () => {
      const res = await api.get('/stations/nearby', {
        params: { lat: userCoords.lat, lng: userCoords.lng, radiusMeters: 15000 },
      });
      return res.data;
    },
  });

  // Filter stations
  const filteredStations = stations.filter((s) => {
    if (connectorFilter !== 'ALL' && s.connectorType !== connectorFilter) return false;
    if (typeFilter !== 'ALL' && s.stationType !== typeFilter) return false;
    return true;
  });

  // Handle Booking Submit
  const handleBooking = async () => {
    if (!user) {
      toast.error('Please log in to book a charger');
      navigate('/login');
      return;
    }
    if (!selectedStation) return;

    setBookingLoading(true);
    try {
      await api.post('/bookings', {
        stationId: selectedStation.id,
        date: new Date(bookingDate).toISOString(),
        timeSlot: bookingTimeSlot,
      });
      toast.success('Booking request sent to host!');
      setShowBookingModal(false);
      navigate('/bookings');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Booking failed');
    } finally {
      setBookingLoading(false);
    }
  };

  const startChat = (station: Station) => {
    if (!user) {
      navigate('/login');
      return;
    }
    const conversationId = [...[user.id, station.hostId].sort(), station.id].join(':');
    navigate(`/chat/${conversationId}`);
  };

  return (
    <div className="relative h-[calc(100vh-64px)] bg-navy-950 flex flex-col md:flex-row overflow-hidden">
      {/* Floating Top Filter Bar */}
      <div className="absolute top-4 left-4 right-4 md:right-auto z-[400] glass-card p-3 rounded-2xl border border-slate-800 flex flex-wrap items-center gap-3 shadow-2xl max-w-2xl">
        <div className="flex items-center space-x-2 text-xs text-brand-400 font-bold px-2">
          <Filter className="w-4 h-4" />
          <span>Filters:</span>
        </div>

        {/* Connector Filter */}
        <select
          value={connectorFilter}
          onChange={(e) => setConnectorFilter(e.target.value)}
          className="bg-slate-900 border border-slate-700 text-xs text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-brand-500"
        >
          <option value="ALL">All Connectors</option>
          <option value="Type2">Type 2 (IEC)</option>
          <option value="CCS2">CCS 2 (Fast DC)</option>
          <option value="GB-T">GB/T Standard</option>
          <option value="CHAdeMO">CHAdeMO</option>
        </select>

        {/* Station Type Filter */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-slate-900 border border-slate-700 text-xs text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-brand-500"
        >
          <option value="ALL">All Station Types</option>
          <option value="HOUSEHOLD">Home Chargers</option>
          <option value="PUBLIC">Public Fast Stations</option>
        </select>

        <div className="text-xs text-slate-400 font-medium ml-auto px-2">
          {filteredStations.length} station(s) found
        </div>
      </div>

      {/* Interactive Map */}
      <div className="w-full h-full relative z-0">
        <MapContainer
          center={[userCoords.lat, userCoords.lng]}
          zoom={12}
          scrollWheelZoom={true}
          style={{ width: '100%', height: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          <MapRecenter lat={userCoords.lat} lng={userCoords.lng} />

          {/* Render Station Markers */}
          {filteredStations.map((station) => (
            <Marker
              key={station.id}
              position={[station.latitude, station.longitude]}
              icon={createCustomIcon(station.stationType)}
              eventHandlers={{
                click: () => setSelectedStation(station),
              }}
            >
              <Popup>
                <div className="p-1 space-y-1">
                  <div className="font-bold text-sm text-slate-900">{station.stationName}</div>
                  <div className="text-xs text-slate-600">{station.connectorType} • {station.capacity}</div>
                  <div className="text-xs font-bold text-emerald-600">PKR {station.pricePerKwh}/kWh</div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Station Details Side Panel / Bottom Sheet */}
      {selectedStation && (
        <div className="absolute bottom-0 left-0 right-0 md:relative md:w-96 glass-card border-t md:border-t-0 md:border-l border-slate-800 p-6 z-[500] flex flex-col justify-between max-h-[80vh] md:max-h-full overflow-y-auto shadow-2xl">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border ${
                selectedStation.stationType === 'PUBLIC'
                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              }`}>
                {selectedStation.stationType} CHARGER
              </span>
              <button
                onClick={() => setSelectedStation(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Photo Thumbnail */}
            {selectedStation.photos && selectedStation.photos.length > 0 ? (
              <img
                src={selectedStation.photos[0]}
                alt={selectedStation.stationName}
                className="w-full h-40 object-cover rounded-xl border border-slate-800"
              />
            ) : (
              <div className="w-full h-36 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-center text-slate-500 text-xs">
                No photos available
              </div>
            )}

            <div>
              <h3 className="text-xl font-bold text-white font-display">{selectedStation.stationName}</h3>
              <p className="text-xs text-slate-400 flex items-center mt-1">
                <MapPin className="w-3.5 h-3.5 text-brand-400 mr-1 shrink-0" />
                {selectedStation.address}
              </p>
            </div>

            {/* Spec Cards */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                <div className="text-slate-500">Connector</div>
                <div className="font-bold text-white mt-0.5">{selectedStation.connectorType}</div>
              </div>
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                <div className="text-slate-500">Capacity</div>
                <div className="font-bold text-white mt-0.5">{selectedStation.capacity}</div>
              </div>
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                <div className="text-slate-500">Price Rate</div>
                <div className="font-bold text-brand-400 mt-0.5">PKR {selectedStation.pricePerKwh} / kWh</div>
              </div>
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                <div className="text-slate-500">Host</div>
                <div className="font-bold text-white mt-0.5 truncate">{selectedStation.hostName || 'Verified Host'}</div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2">
              <button
                onClick={() => setShowBookingModal(true)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-slate-950 font-bold text-sm shadow-lg shadow-brand-500/20 flex items-center justify-center space-x-2"
              >
                <Calendar className="w-4 h-4" />
                <span>Book Time Slot</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => startChat(selectedStation)}
                  className="py-2.5 rounded-xl glass-card hover:bg-slate-800 text-slate-200 font-semibold text-xs flex items-center justify-center space-x-1.5 border border-slate-700"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-brand-400" />
                  <span>Chat with Host</span>
                </button>
                {selectedStation.hostPhone ? (
                  <a
                    href={`tel:${selectedStation.hostPhone}`}
                    className="py-2.5 rounded-xl glass-card hover:bg-slate-800 text-slate-200 font-semibold text-xs flex items-center justify-center space-x-1.5 border border-slate-700"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Call Host</span>
                  </a>
                ) : (
                  <button disabled className="py-2.5 rounded-xl glass-card text-slate-600 text-xs opacity-50 cursor-not-allowed">
                    No Phone
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && selectedStation && (
        <div className="fixed inset-0 z-[1000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold font-display text-white text-lg">Reserve Charging Slot</h3>
              <button onClick={() => setShowBookingModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Charging Date</label>
                <input
                  type="date"
                  value={bookingDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Time Slot</label>
                <select
                  value={bookingTimeSlot}
                  onChange={(e) => setBookingTimeSlot(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="08:00-09:00">08:00 AM - 09:00 AM</option>
                  <option value="09:00-10:00">09:00 AM - 10:00 AM</option>
                  <option value="10:00-11:00">10:00 AM - 11:00 AM</option>
                  <option value="11:00-12:00">11:00 AM - 12:00 PM</option>
                  <option value="14:00-15:00">02:00 PM - 03:00 PM</option>
                  <option value="16:00-17:00">04:00 PM - 05:00 PM</option>
                  <option value="18:00-19:00">06:00 PM - 07:00 PM</option>
                  <option value="20:00-21:00">08:00 PM - 09:00 PM</option>
                </select>
              </div>

              <div className="bg-slate-900 p-3 rounded-xl text-xs space-y-1 text-slate-300">
                <div className="flex justify-between">
                  <span>Rate:</span>
                  <span className="font-bold text-white">PKR {selectedStation.pricePerKwh} / kWh</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Total (7kWh):</span>
                  <span className="font-bold text-brand-400">PKR {selectedStation.pricePerKwh * 7}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleBooking}
              disabled={bookingLoading}
              className="w-full py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold text-sm shadow-lg shadow-brand-500/20 flex items-center justify-center space-x-2"
            >
              {bookingLoading ? 'Processing...' : 'Confirm Booking Request'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
