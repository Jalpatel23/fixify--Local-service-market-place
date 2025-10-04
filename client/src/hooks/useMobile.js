import { useState, useEffect } from 'react';

export const useMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      const isTabletDevice = /ipad|android(?=.*\b(?!.*mobile))/i.test(userAgent);
      
      setIsMobile(isMobileDevice);
      setIsTablet(isTabletDevice);
    };

    const checkStandalone = () => {
      setIsStandalone(window.matchMedia('(display-mode: standalone)').matches);
    };

    const handleOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    // Initial checks
    checkDevice();
    checkStandalone();

    // Event listeners
    window.addEventListener('resize', checkDevice);
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);

    // Media query for standalone mode
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', checkStandalone);

    return () => {
      window.removeEventListener('resize', checkDevice);
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
      mediaQuery.removeEventListener('change', checkStandalone);
    };
  }, []);

  const installPWA = async () => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        
        // Check if app is already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
          return { success: false, message: 'App is already installed' };
        }

        // Show install prompt
        const promptEvent = await new Promise((resolve) => {
          window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            resolve(e);
          });
        });

        if (promptEvent) {
          promptEvent.prompt();
          const choiceResult = await promptEvent.userChoice;
          return { 
            success: choiceResult.outcome === 'accepted',
            message: choiceResult.outcome === 'accepted' ? 'App installed successfully' : 'Installation cancelled'
          };
        }

        return { success: false, message: 'Install prompt not available' };
      } catch (error) {
        console.error('PWA installation error:', error);
        return { success: false, message: 'Installation failed' };
      }
    }
    
    return { success: false, message: 'PWA not supported' };
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  };

  const shareContent = async (data) => {
    if (navigator.share) {
      try {
        await navigator.share(data);
        return { success: true };
      } catch (error) {
        console.error('Share failed:', error);
        return { success: false, error: error.message };
      }
    }
    return { success: false, error: 'Web Share API not supported' };
  };

  const vibrate = (pattern = 100) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  };

  const getBatteryInfo = async () => {
    if ('getBattery' in navigator) {
      try {
        const battery = await navigator.getBattery();
        return {
          level: battery.level,
          charging: battery.charging,
          chargingTime: battery.chargingTime,
          dischargingTime: battery.dischargingTime
        };
      } catch (error) {
        console.error('Battery API error:', error);
        return null;
      }
    }
    return null;
  };

  const getDeviceInfo = () => {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemory: navigator.deviceMemory,
      maxTouchPoints: navigator.maxTouchPoints
    };
  };

  const addToHomeScreen = () => {
    if (isMobile && !isStandalone) {
      // Show custom install prompt
      const prompt = document.createElement('div');
      prompt.className = 'fixed bottom-4 left-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50';
      prompt.innerHTML = `
        <div class="flex items-center justify-between">
          <div>
            <h3 class="font-semibold">Install Fixify</h3>
            <p class="text-sm opacity-90">Add to home screen for quick access</p>
          </div>
          <button onclick="this.parentElement.parentElement.remove()" class="text-white opacity-70 hover:opacity-100">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      `;
      document.body.appendChild(prompt);
      
      // Auto-remove after 10 seconds
      setTimeout(() => {
        if (prompt.parentNode) {
          prompt.remove();
        }
      }, 10000);
    }
  };

  return {
    isMobile,
    isTablet,
    isOnline,
    isStandalone,
    installPWA,
    requestNotificationPermission,
    shareContent,
    vibrate,
    getBatteryInfo,
    getDeviceInfo,
    addToHomeScreen
  };
}; 