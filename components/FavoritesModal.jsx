'use client';

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '../context/NavigationContext';
import { 
  Star, 
  Home, 
  Briefcase, 
  Zap, 
  MapPin, 
  Trash2, 
  Plus, 
  X, 
  User, 
  LogIn, 
  LogOut,
  Check
} from 'lucide-react';

export default function FavoritesModal({ isOpen, onClose }) {
  const { user, savedPlaces, addSavedPlace, deleteSavedPlace, signIn, signUp, signOut } = useAuth();
  const { setDestination } = useNavigation();

  const [activeTab, setActiveTab] = useState('places'); // 'places' or 'auth'
  const [showAddForm, setShowAddForm] = useState(false);

  // New place form
  const [name, setName] = useState('');
  const [category, setCategory] = useState('favorite');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState('41.7151');
  const [lng, setLng] = useState('44.8271');

  // Auth form
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  if (!isOpen) return null;

  const handleSavePlace = async (e) => {
    e.preventDefault();
    if (!name || !lat || !lng) return;

    await addSavedPlace({
      name,
      category,
      address: address || name,
      lat: parseFloat(lat),
      lng: parseFloat(lng),
    });

    setName('');
    setAddress('');
    setShowAddForm(false);
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    setAuthLoading(true);

    try {
      if (isRegister) {
        await signUp(email, password);
        setAuthSuccess('რეგისტრაცია წარმატებით დასრულდა! შეამოწმეთ ელფოსტა.');
      } else {
        await signIn(email, password);
        setAuthSuccess('ავტორიზაცია წარმატებით გაიარეთ!');
        setTimeout(() => onClose(), 1000);
      }
    } catch (err) {
      setAuthError(err.message || 'ავტორიზაციის შეცდომა');
    } finally {
      setAuthLoading(false);
    }
  };

  const selectPlaceAndClose = (place) => {
    setDestination({
      name: place.name,
      address: place.address,
      lat: place.lat,
      lng: place.lng,
      place_id: place.place_id,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 select-none">
      <div className="w-full max-w-lg bg-[#16181f] border border-tesla-border rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header Tabs */}
        <div className="flex items-center justify-between border-b border-tesla-border px-6 py-4 bg-black/20">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('places')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'places'
                  ? 'bg-tesla-accent text-white'
                  : 'text-tesla-muted hover:text-white hover:bg-white/5'
              }`}
            >
              ჩემი მისამართები
            </button>
            <button
              onClick={() => setActiveTab('auth')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                activeTab === 'auth'
                  ? 'bg-tesla-accent text-white'
                  : 'text-tesla-muted hover:text-white hover:bg-white/5'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>{user ? user.email.split('@')[0] : 'ანგარიში'}</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-tesla-muted hover:text-white rounded-xl hover:bg-white/5 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {activeTab === 'places' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">შენახული ლოკაციები</h3>
                <button
                  onClick={() => setShowAddForm((prev) => !prev)}
                  className="px-3 py-1.5 bg-tesla-accent/20 hover:bg-tesla-accent/30 text-tesla-accent rounded-xl text-xs font-bold flex items-center gap-1 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>დამატება</span>
                </button>
              </div>

              {/* Add New Place Form */}
              {showAddForm && (
                <form onSubmit={handleSavePlace} className="bg-black/40 border border-tesla-border p-4 rounded-2xl space-y-3">
                  <div>
                    <label className="text-[11px] font-semibold text-tesla-muted block mb-1">სახელი</label>
                    <input
                      type="text"
                      required
                      placeholder="მაგ. სპორტდარბაზი ან აგარაკი"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-[#0a0b0e] border border-tesla-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-tesla-accent"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-tesla-muted block mb-1">კატეგორია</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full bg-[#0a0b0e] border border-tesla-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      >
                        <option value="favorite">რჩეული (Favorite)</option>
                        <option value="home">სახლი (Home)</option>
                        <option value="work">სამსახური (Work)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-tesla-muted block mb-1">მისამართი</label>
                      <input
                        type="text"
                        placeholder="მაგ. ჭავჭავაძის 32"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full bg-[#0a0b0e] border border-tesla-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-tesla-muted block mb-1">გრძედი (Lat)</label>
                      <input
                        type="number"
                        step="any"
                        required
                        value={lat}
                        onChange={(e) => setLat(e.target.value)}
                        className="w-full bg-[#0a0b0e] border border-tesla-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-tesla-muted block mb-1">განედი (Lng)</label>
                      <input
                        type="number"
                        step="any"
                        required
                        value={lng}
                        onChange={(e) => setLng(e.target.value)}
                        className="w-full bg-[#0a0b0e] border border-tesla-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-tesla-accent hover:bg-blue-600 text-white font-bold text-xs rounded-xl transition"
                  >
                    შენახვა
                  </button>
                </form>
              )}

              {/* List of Places */}
              <div className="space-y-2">
                {savedPlaces.map((place) => {
                  const IconComp = place.category === 'home' ? Home : place.category === 'work' ? Briefcase : Zap;
                  return (
                    <div
                      key={place.id}
                      className="flex items-center justify-between p-3.5 bg-black/40 hover:bg-white/5 border border-tesla-border/80 rounded-2xl transition group"
                    >
                      <button
                        onClick={() => selectPlaceAndClose(place)}
                        className="flex items-center gap-3 text-left overflow-hidden flex-1"
                      >
                        <div className="w-10 h-10 rounded-xl bg-tesla-accent/20 flex items-center justify-center text-tesla-accent flex-shrink-0">
                          <IconComp className="w-5 h-5" />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-sm font-bold text-white truncate">{place.name}</p>
                          <p className="text-xs text-tesla-muted truncate">{place.address}</p>
                        </div>
                      </button>

                      <button
                        onClick={() => deleteSavedPlace(place.id)}
                        className="p-2 text-tesla-muted hover:text-red-400 opacity-60 group-hover:opacity-100 transition"
                        title="წაშლა"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'auth' && (
            <div className="space-y-4">
              {user ? (
                <div className="text-center py-6 space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                    <User className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{user.email}</h3>
                    <p className="text-xs text-tesla-muted">სინქრონიზებულია Supabase მონაცემთა ბაზასთან</p>
                  </div>
                  <button
                    onClick={signOut}
                    className="py-2.5 px-6 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-xl text-xs font-bold inline-flex items-center gap-2 transition"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>გასვლა</span>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleAuthSubmit} className="space-y-3">
                  <div className="text-center mb-4">
                    <h3 className="text-base font-bold text-white">
                      {isRegister ? 'რეგისტრაცია (Supabase)' : 'ავტორიზაცია (Supabase)'}
                    </h3>
                    <p className="text-xs text-tesla-muted">
                      შეინახეთ თქვენი მისამართები ღრუბელში, რომ ნებისმიერ დროს ჰქონდეთ წვდომა
                    </p>
                  </div>

                  {authError && (
                    <div className="p-3 bg-red-500/20 border border-red-500/40 rounded-xl text-xs text-red-300">
                      {authError}
                    </div>
                  )}

                  {authSuccess && (
                    <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-xs text-emerald-300">
                      {authSuccess}
                    </div>
                  )}

                  <div>
                    <label className="text-[11px] font-semibold text-tesla-muted block mb-1">ელფოსტა (Email)</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="driver@tesla.com"
                      className="w-full bg-[#0a0b0e] border border-tesla-border rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-tesla-accent"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-tesla-muted block mb-1">პაროლი</label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#0a0b0e] border border-tesla-border rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-tesla-accent"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-3 bg-tesla-accent hover:bg-blue-600 active:scale-95 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 mt-4"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>{authLoading ? 'მუშავდება...' : isRegister ? 'რეგისტრაცია' : 'შესვლა'}</span>
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsRegister((prev) => !prev);
                        setAuthError('');
                      }}
                      className="text-xs text-tesla-muted hover:text-white underline transition"
                    >
                      {isRegister ? 'უკვე გაქვთ ანგარიში? შესვლა' : 'არ გაქვთ ანგარიში? რეგისტრაცია'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
