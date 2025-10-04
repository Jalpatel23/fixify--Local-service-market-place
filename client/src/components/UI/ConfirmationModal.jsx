import React from 'react';
import { X, AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning', // 'warning', 'success', 'danger', 'info'
  isLoading = false
}) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          icon: CheckCircle,
          iconColor: 'text-success-600',
          iconBg: 'bg-success-100',
          confirmBtn: 'bg-success-600 hover:bg-success-700 focus:ring-success-500'
        };
      case 'danger':
        return {
          icon: XCircle,
          iconColor: 'text-error-600',
          iconBg: 'bg-error-100',
          confirmBtn: 'bg-error-600 hover:bg-error-700 focus:ring-error-500'
        };
      case 'info':
        return {
          icon: Info,
          iconColor: 'text-primary-600',
          iconBg: 'bg-primary-100',
          confirmBtn: 'bg-primary-600 hover:bg-primary-700 focus:ring-primary-500'
        };
      default: // warning
        return {
          icon: AlertTriangle,
          iconColor: 'text-warning-600',
          iconBg: 'bg-warning-100',
          confirmBtn: 'bg-warning-600 hover:bg-warning-700 focus:ring-warning-500'
        };
    }
  };

  const typeStyles = getTypeStyles();
  const Icon = typeStyles.icon;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-secondary-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal positioning */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>

        {/* Modal content */}
        <div className="inline-block align-bottom bg-white dark:bg-secondary-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="sm:flex sm:items-start">
            {/* Icon */}
            <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${typeStyles.iconBg} sm:mx-0 sm:h-10 sm:w-10`}>
              <Icon className={`h-6 w-6 ${typeStyles.iconColor}`} />
            </div>

            {/* Content */}
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
              <h3 className="text-lg leading-6 font-medium text-secondary-900 dark:text-secondary-100">
                {title}
              </h3>
              <div className="mt-2">
                <p className="text-sm text-secondary-500 dark:text-secondary-400">
                  {message}
                </p>
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Action buttons */}
          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed ${typeStyles.confirmBtn}`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                confirmText
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-secondary-300 dark:border-secondary-600 shadow-sm px-4 py-2 bg-white dark:bg-secondary-700 text-base font-medium text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
