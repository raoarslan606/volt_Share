import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Zap, MapPin, DollarSign, Camera, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { api } from '../lib/api';

const markerIcon = L.divIcon({
  className: 'custom-leaflet-marker',
  html: `<div style="background:#10B981;width:30px;height:30px;border-radius:50%;border:2px solid #fff;display:flex;align-items:center;justify-content:center;color:#000;font-weight:bold;">⚡</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

// Interactive Pin Picker Component
const LocationPicker: React.FC<{ coords: { lat: number; lng: number }; setCoords: (c: { lat: number; lng: number }) => void }> = ({
  coords,
  setCoords,
}) => {
  useMapEvents({
    click(e) {
      setCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return <Marker position={[coords.lat, coords.lng]} icon={markerIcon} />;
};

export const NewStationPage: React.FC = () => {
  const [step, setStep] = useState(1);
  const [coords, setCoords] = useState({ lat: 31.5497, lng: 74.3436 });
  const [photos, setPhotos] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      stationName: '',
      stationType: 'HOUSEHOLD',
      address: '',
      capacity: '7kW',
      connectorType: 'Type2',
      pricePerKwh: 30,
    },
  });

  const pricePerKwh = watch('pricePerKwh');

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      // 1. Create Station
      const res = await api.post('/stations', {
        ...data,
        pricePerKwh: parseFloat(data.pricePerKwh),
        latitude: coords.lat,
        longitude: coords.lng,
      });

      const stationId = res.data.id;

      // 2. Upload photos if selected
      if (photos.length > 0) {
        const formData = new FormData();
        photos.forEach((p) => formData.append('photos', p));
        await api.post(`/stations/${stationId}/photos`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      toast.success('Station registered! Awaiting admin verification.');
      navigate('/host/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-900 text-slate-100 p-4 sm:p-6 lg:p-8 flex items-center justify-center">
      <div className="max-w-2xl w-full glass-card p-6 sm:p-10 rounded-3xl border border-slate-800 space-y-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-2xl font-bold font-display text-white">Register EV Station</h2>
            <p className="text-xs text-slate-400">Step {step} of 4</p>
          </div>
          <div className="flex items-center space-x-1">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`w-8 h-2 rounded-full transition-all ${
                  s <= step ? 'bg-brand-500' : 'bg-slate-800'
                }`}
              />
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* STEP 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Station Title</label>
                <input
                  {...register('stationName', { required: 'Station name is required' })}
                  placeholder="e.g. Model Town Phase 2 Fast Charger"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Type</label>
                  <select
                    {...register('stationType')}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 px-3 text-sm text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="HOUSEHOLD">Household Wallbox</option>
                    <option value="PUBLIC">Public Commercial Station</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Capacity</label>
                  <select
                    {...register('capacity')}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 px-3 text-sm text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="7kW">7 kW (AC Slow)</option>
                    <option value="11kW">11 kW (AC Fast)</option>
                    <option value="22kW">22 kW (AC Superfast)</option>
                    <option value="DC Fast">DC Fast Charger</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Connector Standard</label>
                <select
                  {...register('connectorType')}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 px-3 text-sm text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="Type2">Type 2 (IEC 62196)</option>
                  <option value="CCS2">CCS 2 (Combined Charging System)</option>
                  <option value="GB-T">GB/T Standard</option>
                  <option value="CHAdeMO">CHAdeMO</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full py-3.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold text-sm flex items-center justify-center space-x-2"
              >
                <span>Continue to Pricing</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 2: Pricing & Address */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Street Address</label>
                <input
                  {...register('address', { required: 'Address is required' })}
                  placeholder="House #123, Street 4, Sector Y, DHA Lahore"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Price Rate (PKR / kWh)</label>
                <input
                  type="number"
                  step="0.5"
                  {...register('pricePerKwh', { required: true, min: 1 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              {/* Earnings Calculator */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs space-y-1">
                <div className="text-slate-400">Estimated Monthly Earning (10 charges/month @ 30kWh):</div>
                <div className="text-xl font-bold font-display text-emerald-400">
                  PKR {((pricePerKwh || 0) * 30 * 10).toLocaleString()}
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/2 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="w-1/2 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold text-sm flex items-center justify-center space-x-2"
                >
                  <span>Select Map Pin</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Map Location Picker */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-xs text-slate-300">Click anywhere on the map to set exact GPS pin coordinates:</p>
              <div className="h-64 rounded-2xl overflow-hidden border border-slate-800">
                <MapContainer center={[coords.lat, coords.lng]} zoom={13} style={{ width: '100%', height: '100%' }}>
                  <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                  <LocationPicker coords={coords} setCoords={setCoords} />
                </MapContainer>
              </div>

              <div className="text-xs text-slate-400 font-mono">
                Latitude: {coords.lat.toFixed(5)} • Longitude: {coords.lng.toFixed(5)}
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-1/2 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="w-1/2 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold text-sm flex items-center justify-center space-x-2"
                >
                  <span>Upload Photos</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Photos & Submit */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Station Photos (Max 5)</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => setPhotos(Array.from(e.target.files || []))}
                  className="w-full text-xs text-slate-400 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-500/10 file:text-brand-400 hover:file:bg-brand-500/20"
                />
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs space-y-2">
                <div className="font-bold text-white">Review Summary:</div>
                <div className="text-slate-400">Title: <span className="text-white">{watch('stationName')}</span></div>
                <div className="text-slate-400">Address: <span className="text-white">{watch('address')}</span></div>
                <div className="text-slate-400">Price: <span className="text-brand-400 font-bold">PKR {pricePerKwh}/kWh</span></div>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="w-1/2 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-1/2 py-3.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold text-sm shadow-lg shadow-brand-500/20 flex items-center justify-center space-x-2"
                >
                  {loading ? 'Submitting...' : 'Register Station'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
