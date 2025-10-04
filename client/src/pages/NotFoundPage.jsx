import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Search, ArrowLeft, AlertTriangle, MapPin, Briefcase } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 to-primary-50 dark:from-secondary-900 dark:to-primary-900 flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* 404 Number */}
        <div className="mb-8">
          <h1 className="text-9xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
            404
          </h1>
        </div>
        
        {/* Main Content */}
        <div className="mb-12">
          <div className="w-24 h-24 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-12 h-12 text-primary-600 dark:text-primary-400" />
          </div>
          
          <h2 className="text-3xl font-bold text-secondary-900 dark:text-secondary-100 mb-4">
            Page Not Found
          </h2>
          
          <p className="text-lg text-secondary-600 dark:text-secondary-400 mb-8 max-w-md mx-auto">
            The page you're looking for doesn't exist or has been moved. 
            Let's get you back on track to finding great opportunities.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <Link
            to="/"
            className="group p-6 bg-white dark:bg-secondary-800 rounded-xl shadow-sm border border-secondary-200 dark:border-secondary-700 hover:shadow-md transition-all duration-200 hover:scale-105"
          >
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-primary-200 dark:group-hover:bg-primary-800 transition-colors">
              <Home className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <h3 className="font-semibold text-secondary-900 dark:text-secondary-100 mb-2">
              Go Home
            </h3>
            <p className="text-sm text-secondary-600 dark:text-secondary-400">
              Return to the homepage
            </p>
          </Link>

          <Link
            to="/browse"
            className="group p-6 bg-white dark:bg-secondary-800 rounded-xl shadow-sm border border-secondary-200 dark:border-secondary-700 hover:shadow-md transition-all duration-200 hover:scale-105"
          >
            <div className="w-12 h-12 bg-success-100 dark:bg-success-900 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-success-200 dark:group-hover:bg-success-800 transition-colors">
              <Search className="w-6 h-6 text-success-600 dark:text-success-400" />
            </div>
            <h3 className="font-semibold text-secondary-900 dark:text-secondary-100 mb-2">
              Browse Jobs
            </h3>
            <p className="text-sm text-secondary-600 dark:text-secondary-400">
              Find local opportunities
            </p>
          </Link>

          <Link
            to="/post-job"
            className="group p-6 bg-white dark:bg-secondary-800 rounded-xl shadow-sm border border-secondary-200 dark:border-secondary-700 hover:shadow-md transition-all duration-200 hover:scale-105"
          >
            <div className="w-12 h-12 bg-warning-100 dark:bg-warning-900 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-warning-200 dark:group-hover:bg-warning-800 transition-colors">
              <Briefcase className="w-6 h-6 text-warning-600 dark:text-warning-400" />
            </div>
            <h3 className="font-semibold text-secondary-900 dark:text-secondary-100 mb-2">
              Post a Job
            </h3>
            <p className="text-sm text-secondary-600 dark:text-secondary-400">
              Create new opportunities
            </p>
          </Link>
        </div>

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center px-6 py-3 border border-secondary-300 dark:border-secondary-600 text-secondary-700 dark:text-secondary-300 rounded-lg hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </button>
          
          <Link
            to="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            <Home className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>

        {/* Help Text */}
        <div className="mt-12 p-4 bg-secondary-100 dark:bg-secondary-800 rounded-lg">
          <p className="text-sm text-secondary-600 dark:text-secondary-400">
            Can't find what you're looking for?{' '}
            <Link 
              to="/contact" 
              className="text-primary-600 dark:text-primary-400 hover:underline font-medium"
            >
              Contact our support team
            </Link>
            {' '}for assistance.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage; 