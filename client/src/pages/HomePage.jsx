import React from 'react';
import { Link } from 'react-router-dom';
import { SignedIn, SignedOut, SignUpButton } from '@clerk/clerk-react';
import { Search, Users, Clock, Shield, Star, MapPin } from 'lucide-react';

const HomePage = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Find Local Services
              <br />
              <span className="text-primary-200">Made Simple</span>
            </h1>
            <p className="text-xl md:text-2xl text-primary-100 mb-8 max-w-3xl mx-auto">
              Connect with skilled professionals in your area for all your home service needs. 
              From plumbing to painting, we've got you covered.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <SignedOut>
                <SignUpButton
                  mode="modal"
                  forceRedirectUrl="/dashboard"
                  signInForceRedirectUrl="/dashboard"
                >
                  <button className="btn btn-lg bg-white text-primary-600 hover:bg-primary-50">
                    Get Started
                  </button>
                </SignUpButton>
              </SignedOut>
              
              <SignedIn>
                <Link
                  to="/browse"
                  className="btn btn-lg bg-white text-primary-600 hover:bg-primary-50"
                >
                  Browse Jobs
                </Link>
                <Link
                  to="/post-job"
                  className="btn btn-lg btn-outline border-white text-white hover:bg-white hover:text-primary-600"
                >
                  Post a Job
                </Link>
              </SignedIn>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white dark:bg-secondary-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 dark:text-secondary-100 mb-4">
              Why Choose Fixify?
            </h2>
            <p className="text-lg text-secondary-600 dark:text-secondary-400 max-w-2xl mx-auto">
              We make it easy to find reliable, skilled professionals for all your home service needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100 mb-2">
                Easy to Find
              </h3>
              <p className="text-secondary-600 dark:text-secondary-400">
                Browse jobs by category, location, and budget. Find exactly what you need quickly.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-success-100 dark:bg-success-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-success-600 dark:text-success-400" />
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100 mb-2">
                Verified Professionals
              </h3>
              <p className="text-secondary-600 dark:text-secondary-400">
                All professionals are verified and rated by the community for your peace of mind.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-warning-100 dark:bg-warning-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-warning-600 dark:text-warning-400" />
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100 mb-2">
                Quick Response
              </h3>
              <p className="text-secondary-600 dark:text-secondary-400">
                Get responses within hours, not days. Fast and efficient service matching.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-error-100 dark:bg-error-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-error-600 dark:text-error-400" />
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100 mb-2">
                Secure & Safe
              </h3>
              <p className="text-secondary-600 dark:text-secondary-400">
                Secure payments and communication. Your safety and privacy are our priority.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100 mb-2">
                Quality Guaranteed
              </h3>
              <p className="text-secondary-600 dark:text-secondary-400">
                Rate and review professionals. Quality work is guaranteed and rewarded.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-success-100 dark:bg-success-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-success-600 dark:text-success-400" />
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100 mb-2">
                Local Focus
              </h3>
              <p className="text-secondary-600 dark:text-secondary-400">
                Connect with professionals in your neighborhood. Support local businesses.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-secondary-50 dark:bg-secondary-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 dark:text-secondary-100 mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-secondary-600 dark:text-secondary-400 mb-8 max-w-2xl mx-auto">
            Join thousands of users who are already finding and providing local services.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <SignedOut>
              <SignUpButton
                mode="modal"
                forceRedirectUrl="/dashboard"
                signInForceRedirectUrl="/dashboard"
              >
                <button className="btn btn-lg btn-primary">
                  Sign Up Now
                </button>
              </SignUpButton>
            </SignedOut>
            
            <SignedIn>
              <Link
                to="/browse"
                className="btn btn-lg btn-primary"
              >
                Browse Jobs
              </Link>
              <Link
                to="/post-job"
                className="btn btn-lg btn-outline"
              >
                Post a Job
              </Link>
            </SignedIn>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage; 