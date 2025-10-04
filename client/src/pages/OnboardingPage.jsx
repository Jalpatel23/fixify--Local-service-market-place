import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth as useAppAuth } from '../hooks/useAuth';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import { jobCategories } from '../utils/config';
import { useLocation as useGeoLocation } from '../hooks/useLocation';
import LocationPicker from '../components/Map/LocationPicker';
import { reverseGeocode } from '../utils/mapUtils';

const OnboardingPage = () => {
  const navigate = useNavigate();
  const { profile, updateProfileAsync, updateProfileLoading } = useAppAuth();
  const geo = useGeoLocation();
  const [step, setStep] = React.useState(1);
  const [location, setLocation] = React.useState(profile?.location || null);
  const [skills, setSkills] = React.useState(profile?.skills || []);
  const [accountType, setAccountType] = React.useState(profile?.accountType || 'client');
  const [preferences, setPreferences] = React.useState(profile?.preferences || { maxDistance: 40 });

  const toggleSkill = (category) => {
    const exists = skills.some(s => s.category === category);
    const updated = exists
      ? skills.filter(s => s.category !== category)
      : [...skills, { category, name: category, experience: 'intermediate' }];
    setSkills(updated);
  };

  const handleSkip = () => {
    navigate('/browse');
  };

  // Convert km -> miles (integer) for backend validation (expects 1..100 miles)
  const kmToMiles = (km) => Math.round(Number(km || 0) * 0.621371);

  const handleUseMyLocation = async () => {
    try {
      const loc = await geo.getLocation();
      // Reverse geocode to friendly address
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
        address: address ? { street: '', city: '', state: '', zipCode: '', country: '', formatted: address } : undefined,
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
      address: address ? { street: '', city: '', state: '', zipCode: '', country: '', formatted: address } : undefined,
    });
  };

  const handleFinish = async () => {
    await updateProfileAsync({
      location: location || undefined,
      skills,
      accountType,
      preferences: {
        ...preferences,
        // store in miles on backend, keep UI as km
        maxDistance: kmToMiles(preferences?.maxDistance),
      },
    });
    navigate('/browse');
  };

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-900">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-secondary-900 dark:text-secondary-100 mb-2">Welcome! Let's personalize Fixify</h1>
        <p className="text-secondary-600 dark:text-secondary-400 mb-6">These details are optional. You can skip and fill them later.</p>

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Location</h2>
            <p className="text-secondary-600 dark:text-secondary-400 text-sm">Use your GPS or pick on the map. You can refine it later in profile.</p>
            <div className="flex items-center gap-2">
              <Button onClick={handleUseMyLocation} loading={geo.isLoading}>Use my current location</Button>
              {geo.error && <span className="text-sm text-error-600">{geo.error}</span>}
            </div>
            <LocationPicker
              value={location && location.coordinates ? { lat: location.coordinates[1], lng: location.coordinates[0], address: location.address?.formatted } : null}
              onChange={handlePickerChange}
              className="mt-2"
            />
            <div className="flex justify-between">
              <Button variant="ghost" onClick={handleSkip}>Skip</Button>
              <Button onClick={() => setStep(2)}>Next</Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">What kind of jobs can you do?</h2>
            <div className="flex flex-wrap gap-2">
              {jobCategories.map(c => (
                <button
                  type="button"
                  key={c.value}
                  onClick={() => toggleSkill(c.value)}
                  className={`px-3 py-1 rounded-full border ${skills.some(s => s.category === c.value) ? 'bg-primary-600 text-white border-primary-700' : 'bg-white dark:bg-secondary-800 text-secondary-800 dark:text-secondary-100 border-secondary-300'}`}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Account type</label>
              <select
                className="w-full h-10 rounded-md border border-secondary-300 bg-white dark:bg-secondary-800 px-3"
                value={accountType}
                onChange={(e) => setAccountType(e.target.value)}
              >
                <option value="client">Client</option>
                <option value="helper">Helper</option>
                <option value="both">Both</option>
              </select>
            </div>
            <div className="flex justify-between">
              <Button variant="ghost" onClick={handleSkip}>Skip</Button>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setStep(1)}>Back</Button>
                <Button onClick={() => setStep(3)}>Next</Button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Preferences</h2>
            <div>
              <label className="block text-sm font-medium mb-1">Max distance (kilometers)</label>
              <Input type="number" min={1} max={160} value={preferences?.maxDistance || 40} onChange={(e) => setPreferences({ ...preferences, maxDistance: Number(e.target.value) })} />
            </div>
            <div className="flex justify-between">
              <Button variant="ghost" onClick={handleSkip}>Skip</Button>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setStep(2)}>Back</Button>
                <Button onClick={handleFinish} loading={updateProfileLoading}>Finish</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingPage;


