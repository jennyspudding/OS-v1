"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function TestMarketsPage() {
  const [marketsData, setMarketsData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMarkets = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/test-lalamove-markets');
      const data = await response.json();
      
      console.log('Markets API response:', data);
      setMarketsData(data);
      
      if (!data.success) {
        setError(data.error || 'Failed to fetch markets');
      }
    } catch (err) {
      console.error('Error fetching markets:', err);
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarkets();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-center">Lalamove Markets Test</h1>
        
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">API Test Results</h2>
            <Button 
              onClick={fetchMarkets}
              disabled={loading}
              className="bg-[#d63384] hover:bg-[#b02a5b] text-white"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#d63384]"></div>
              <span className="ml-3 text-gray-600">Fetching markets data...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-red-700 font-medium">Error: {error}</span>
              </div>
            </div>
          )}

          {marketsData && (
            <div className="space-y-6">
              {/* Success Status */}
              <div className={`p-4 rounded-lg ${marketsData.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center">
                  <svg className={`w-5 h-5 mr-2 ${marketsData.success ? 'text-green-500' : 'text-red-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={marketsData.success ? "M5 13l4 4L19 7" : "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"} />
                  </svg>
                  <span className={`font-medium ${marketsData.success ? 'text-green-700' : 'text-red-700'}`}>
                    {marketsData.success ? 'API Call Successful' : 'API Call Failed'}
                  </span>
                </div>
                {marketsData.message && (
                  <p className={`mt-2 text-sm ${marketsData.success ? 'text-green-600' : 'text-red-600'}`}>
                    {marketsData.message}
                  </p>
                )}
              </div>

              {/* Indonesia Markets */}
              {marketsData.success && marketsData.data && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-[#d63384]">
                    Indonesia Markets ({marketsData.data.indonesiaMarketsCount})
                  </h3>
                  
                  {marketsData.data.indonesiaMarkets.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      {marketsData.data.indonesiaMarkets.map((market: any, index: number) => (
                        <div key={index} className="bg-[#f8d7da] border border-[#f5c2c7] rounded-lg p-4">
                          <div className="font-medium text-[#d63384] mb-2">
                            {market.name || 'Unknown City'}
                          </div>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div><strong>Locode:</strong> {market.locode || 'N/A'}</div>
                            <div><strong>Country:</strong> {market.country || 'N/A'}</div>
                            <div><strong>Timezone:</strong> {market.timezone || 'N/A'}</div>
                            {market.currency && <div><strong>Currency:</strong> {market.currency}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500 text-center py-4">
                      No Indonesia markets found
                    </div>
                  )}
                </div>
              )}

              {/* Sample of All Cities */}
              {marketsData.success && marketsData.data && marketsData.data.allCities && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">
                    Sample Cities (First 10 of {marketsData.data.totalCities})
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
                    <pre className="text-xs text-gray-700">
                      {JSON.stringify(marketsData.data.allCities, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Error Details */}
              {!marketsData.success && marketsData.details && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-red-600">Error Details</h3>
                  <div className="bg-red-50 rounded-lg p-4">
                    <pre className="text-xs text-red-700 whitespace-pre-wrap">
                      {JSON.stringify(marketsData.details, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Raw Response */}
              <details className="border border-gray-200 rounded-lg">
                <summary className="p-4 cursor-pointer font-medium text-gray-700 hover:bg-gray-50">
                  View Raw API Response
                </summary>
                <div className="p-4 border-t border-gray-200 bg-gray-50">
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap overflow-x-auto">
                    {JSON.stringify(marketsData, null, 2)}
                  </pre>
                </div>
              </details>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-3">Instructions</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>1. This page tests the Lalamove Cities API to find exact market locodes</p>
            <p>2. Make sure you have LALAMOVE_API_KEY and LALAMOVE_API_SECRET in your .env.local file</p>
            <p>3. The API will return all available cities/markets from Lalamove</p>
            <p>4. Look for Indonesia markets with locodes starting with "ID"</p>
            <p>5. Use the exact locode in your quotation requests</p>
          </div>
        </div>
      </div>
    </div>
  );
} 