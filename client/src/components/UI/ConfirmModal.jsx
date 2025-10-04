import React from 'react';

const ConfirmModal = ({
  open,
  title = 'Are you sure?',
  description = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  tone = 'danger', // 'danger' | 'primary'
  loading = false,
  onConfirm,
  onCancel
}) => {
  if (!open) return null;

  const toneStyles = tone === 'danger'
    ? {
        btn: 'bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600',
        iconBg: 'bg-red-100 dark:bg-red-900/40',
        iconText: 'text-red-600 dark:text-red-300',
      }
    : {
        btn: 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600',
        iconBg: 'bg-blue-100 dark:bg-blue-900/40',
        iconText: 'text-blue-600 dark:text-blue-300',
      };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl ${toneStyles.iconBg} flex items-center justify-center`}>
              <svg className={`w-6 h-6 ${toneStyles.iconText}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v3m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{description}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 rounded-lg text-sm font-medium text-white ${toneStyles.btn} transition-colors disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            {loading ? 'Please wait...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;


