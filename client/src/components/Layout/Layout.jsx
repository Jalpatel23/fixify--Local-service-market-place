import React, { useMemo, useState, useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';
import { useAuth as useAppAuth } from '../../hooks/useAuth';
import { storageService } from '../../utils/config';
import toast from 'react-hot-toast';

const WEEKLY_REMINDER_KEY = 'fixify-weekly-profile-reminder-at';
const WEEKLY_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 1 week

const Layout = ({ children }) => {
  const { isAuthReady, isSignedIn, hasCompletedProfile } = useAppAuth();
  const profileComplete = hasCompletedProfile();

  useEffect(() => {
    if (!isAuthReady || !isSignedIn) return;
    const lastShown = storageService.get(WEEKLY_REMINDER_KEY);
    const shouldShow = !lastShown || (Date.now() - Number(lastShown)) > WEEKLY_DURATION_MS;
    if (shouldShow) {
      toast((t) => (
        <div className="flex items-start gap-3">
          <div className="text-sm">Tip: Review and update your profile details regularly for the best matches.</div>
          <a
            href="/profile"
            className="text-primary-600 hover:text-primary-700 font-medium text-sm"
            onClick={() => toast.dismiss(t.id)}
          >
            Open Profile
          </a>
        </div>
      ));
      storageService.set(WEEKLY_REMINDER_KEY, Date.now());
    }
  }, [isAuthReady, isSignedIn]);

  return (
    <div className="min-h-screen flex flex-col bg-secondary-50 dark:bg-secondary-900">
      <Header />

      <main className="flex-1">
        {children}
      </main>

      <Footer />
    </div>
  );
};

export default Layout;