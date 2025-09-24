import React from 'react';
import { useAuth as useAppAuth } from '../hooks/useAuth';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Card from '../components/UI/Card';
import { jobCategories } from '../utils/config';
import { useLocation as useGeoLocation } from '../hooks/useLocation';
import LocationPicker from '../components/Map/LocationPicker';
import { reverseGeocode } from '../utils/mapUtils';

const ProfilePage = () => {
  const { profile, updateProfile, updateProfileLoading } = useAppAuth();
  const geo = useGeoLocation();
  const milesToKm = (m) => Math.round(Number(m || 0) * 1.60934);
  const kmToMiles = (km) => Math.round(Number(km || 0) * 0.621371);
  const [form, setForm] = React.useState({
    accountType: profile?.accountType || 'client',
    preferences: { ...(profile?.preferences || {}), maxDistance: milesToKm(profile?.preferences?.maxDistance || 25) },
    skills: profile?.skills || [],
  });
  // Keep a string version for stable typing/backspace handling
  const [maxDistanceKmInput, setMaxDistanceKmInput] = React.useState(String(milesToKm(profile?.preferences?.maxDistance || 25)));
  const [location, setLocation] = React.useState(profile?.location || null);

  React.useEffect(() => {
    setForm({
      accountType: profile?.accountType || 'client',
      preferences: { ...(profile?.preferences || {}), maxDistance: milesToKm(profile?.preferences?.maxDistance || 25) },
      skills: profile?.skills || [],
    });
    setMaxDistanceKmInput(String(milesToKm(profile?.preferences?.maxDistance || 25)));
    setLocation(profile?.location || null);
  }, [profile]);

  const toggleSkill = (category) => {
    const exists = form.skills.some(s => s.category === category);
    const updated = exists
      ? form.skills.filter(s => s.category !== category)
      : [...form.skills, { category, name: category, experience: 'intermediate' }];
    setForm(prev => ({ ...prev, skills: updated }));
  };

  const handleUseMyLocation = async () => {
    try {
      const loc = await geo.getLocation();
      let address;
      try {
        const res = await reverseGeocode(loc.lat, loc.lng);
        address = res.formatted_address;
      } catch (_) {
        address = undefined;
      }
      setLocation({
        type: 'Point',
        coordinates: [loc.lng, loc.lat],
        address: address ? { formatted: address } : undefined,
      });
    } catch (_) {}
  };

  const handlePickerChange = async (coords) => {
    if (!coords) {
      setLocation(null);
      return;
    }
    let address;
    try {
      const res = await reverseGeocode(coords.lat, coords.lng);
      address = res.formatted_address;
    } catch (_) {
      address = undefined;
    }
    setLocation({
      type: 'Point',
      coordinates: [coords.lng, coords.lat],
      address: address ? { formatted: address } : undefined,
    });
  };

  const handleSave = (e) => {
    e.preventDefault();
    // Sanitize and clamp distance (km) before converting to miles
    const parsedKm = Math.max(1, Math.min(160, Number(maxDistanceKmInput || 0)));
    updateProfile({
      accountType: form.accountType,
      location: location || undefined,
      preferences: { ...form.preferences, maxDistance: kmToMiles(parsedKm) },
      skills: form.skills,
    });
  };

  // Memoize LocationPicker to avoid heavy rerenders while typing
  const locationPicker = React.useMemo(() => (
    <LocationPicker
      value={location && location.coordinates ? { lat: location.coordinates[1], lng: location.coordinates[0], address: location.address?.formatted } : null}
      onChange={handlePickerChange}
    />
  ), [location]);

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-secondary-100 mb-1">Profile</h1>
          <p className="text-secondary-600 dark:text-secondary-400">Update your profile, skills, and preferences.</p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Location */}
          <div>
            <h2 className="text-xl font-semibold mb-2">Location</h2>
            <div className="flex items-center gap-2 mb-3">
              <Button onClick={handleUseMyLocation} loading={geo.isLoading}>Use my current location</Button>
              {geo.error && <span className="text-sm text-error-600">{geo.error}</span>}
            </div>
            <LocationPicker
              value={location && location.coordinates ? { lat: location.coordinates[1], lng: location.coordinates[0], address: location.address?.formatted } : null}
              onChange={handlePickerChange}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Account type</label>
              <select
                className="w-full h-10 rounded-md border border-secondary-300 bg-white dark:bg-secondary-800 px-3"
                value={form.accountType}
                onChange={(e) => setForm(v => ({ ...v, accountType: e.target.value }))}
              >
                <option value="client">Client</option>
                <option value="helper">Helper</option>
                <option value="both">Both</option>
              </select>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">Skills / Job types</h2>
            <div className="flex flex-wrap gap-2">
              {jobCategories.map(c => (
                <button
                  type="button"
                  key={c.value}
                  onClick={() => toggleSkill(c.value)}
                  className={`px-3 py-1 rounded-full border ${form.skills.some(s => s.category === c.value) ? 'bg-primary-600 text-white border-primary-700' : 'bg-white dark:bg-secondary-800 text-secondary-800 dark:text-secondary-100 border-secondary-300'}`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">Preferences</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
              <label className="block text-sm font-medium mb-1">Max distance (kilometers)</label>
              <Input
                type="number"
                min={1}
                max={160}
                value={maxDistanceKmInput}
                onChange={(e) => {
                  const next = e.target.value;
                  // Allow empty string while typing
                  if (next === '') {
                    setMaxDistanceKmInput('');
                    return;
                  }
                  // Only update if numeric
                  if (/^\d+$/.test(next)) {
                    setMaxDistanceKmInput(next);
                  }
                }}
                onBlur={() => {
                  // Normalize to bounds on blur
                  const num = Math.max(1, Math.min(160, Number(maxDistanceKmInput || 0)));
                  setMaxDistanceKmInput(String(num));
                }}
              />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" loading={updateProfileLoading}>Save changes</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;