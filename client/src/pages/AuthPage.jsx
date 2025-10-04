import React, { useMemo, useState } from 'react';
import { SignedIn, SignedOut, SignIn, SignUp } from '@clerk/clerk-react';
import { Navigate, useSearchParams } from 'react-router-dom';

const AuthPage = () => {
  const [searchParams] = useSearchParams();
  const initialMode = useMemo(() => {
    const mode = (searchParams.get('mode') || '').toLowerCase();
    return mode === 'sign-in' ? 'sign-in' : 'sign-up';
  }, [searchParams]);
  const [mode, setMode] = useState(initialMode);

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SignedIn>
          <Navigate to="/dashboard" replace />
        </SignedIn>

        <SignedOut>
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-secondary-900 dark:text-secondary-100 mb-2">
                {mode === 'sign-in' ? 'Welcome back' : 'Create your account'}
              </h1>
              <p className="text-secondary-600 dark:text-secondary-400">
                {mode === 'sign-in' ? 'Sign in to continue to Fixify.' : 'Join Fixify to find and offer local services.'}
              </p>
            </div>

            <div className="flex justify-center mb-6">
              <div className="inline-flex rounded-md shadow-sm" role="group">
                <button
                  type="button"
                  onClick={() => setMode('sign-in')}
                  className={`px-4 py-2 text-sm font-medium border border-secondary-300 dark:border-secondary-700 ${
                    mode === 'sign-in'
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-secondary-700 hover:bg-secondary-50 dark:bg-secondary-800 dark:text-secondary-200'
                  } rounded-l-md`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setMode('sign-up')}
                  className={`px-4 py-2 text-sm font-medium border-t border-b border-r border-secondary-300 dark:border-secondary-700 ${
                    mode === 'sign-up'
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-secondary-700 hover:bg-secondary-50 dark:bg-secondary-800 dark:text-secondary-200'
                  } rounded-r-md`}
                >
                  Sign Up
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-lg p-6 shadow-soft">
              {mode === 'sign-in' ? (
                <SignIn
                  routing="hash"
                  signUpUrl="/auth?mode=sign-up"
                  afterSignInUrl="/dashboard"
                  appearance={{ elements: { formButtonPrimary: 'bg-primary-600 hover:bg-primary-700' } }}
                />
              ) : (
                <SignUp
                  routing="hash"
                  signInUrl="/auth?mode=sign-in"
                  afterSignUpUrl="/dashboard"
                  appearance={{ elements: { formButtonPrimary: 'bg-primary-600 hover:bg-primary-700' } }}
                />
              )}
            </div>
          </div>
        </SignedOut>
      </div>
    </div>
  );
};

export default AuthPage;