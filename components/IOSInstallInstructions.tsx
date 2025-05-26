'use client';

import { useState, useEffect } from 'react';

export default function IOSInstallInstructions() {
  const [isIOS, setIsIOS] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isInStandaloneMode = ('standalone' in window.navigator) && (window.navigator as any).standalone;
    
    setIsIOS(iOS && !isInStandaloneMode);
  }, []);

  if (!isIOS) return null;

  return (
    <>
      {!showInstructions && (
        <div className="fixed bottom-4 left-4 right-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg shadow-lg p-4 z-50 max-w-sm mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <img 
                  src="/icons/manifest-icon-192.maskable.png" 
                  alt="Jenny's Pudding" 
                  className="w-10 h-10 rounded-lg"
                />
              </div>
              <div>
                <h3 className="text-sm font-medium">Install Jenny's Pudding</h3>
                <p className="text-xs opacity-90">Add to your home screen for quick access</p>
              </div>
            </div>
            <button
              onClick={() => setShowInstructions(true)}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-2 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {showInstructions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-sm w-full p-6">
            <div className="text-center mb-4">
              <img 
                src="/icons/manifest-icon-192.maskable.png" 
                alt="Jenny's Pudding" 
                className="w-16 h-16 rounded-lg mx-auto mb-3"
              />
              <h2 className="text-lg font-semibold text-gray-900">Install Jenny's Pudding</h2>
              <p className="text-sm text-gray-600">Add to your home screen for the best experience</p>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-blue-600">1</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-700">
                    Tap the <strong>Share</strong> button 
                    <svg className="inline w-4 h-4 mx-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                    </svg>
                    at the bottom of Safari
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-blue-600">2</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-700">
                    Select <strong>"Add to Home Screen"</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-blue-600">3</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-700">
                    Tap <strong>"Add"</strong> to install the app
                  </p>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowInstructions(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Maybe Later
              </button>
              <button
                onClick={() => setShowInstructions(false)}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700"
              >
                Got It!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 