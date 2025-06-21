"use client";
import { useState } from 'react';
import { Button } from "@/components/ui/button";

export default function TestTelegramPage() {
  const [testResult, setTestResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testBasicConnection = async () => {
    setLoading(true);
    setTestResult('Testing basic connection...');
    
    try {
      const response = await fetch('/api/test-telegram');
      const data = await response.json();
      
      if (data.success) {
        setTestResult('✅ Basic test message sent successfully! Check your Telegram.');
      } else {
        setTestResult(`❌ Test failed: ${data.message}`);
      }
    } catch (error) {
      setTestResult(`❌ Error: ${error}`);
    }
    
    setLoading(false);
  };

  const testOrderNotification = async () => {
    setLoading(true);
    setTestResult('Testing order notification...');
    
    try {
      const response = await fetch('/api/test-telegram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      
      if (data.success) {
        setTestResult('✅ Sample order notification sent successfully! Check your Telegram.');
      } else {
        setTestResult(`❌ Test failed: ${data.message}`);
      }
    } catch (error) {
      setTestResult(`❌ Error: ${error}`);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            📱 Telegram Integration Test
          </h1>
          <p className="text-gray-600">
            Test your Telegram bot configuration and order notifications.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Run Tests</h2>
          <div className="space-y-4">
            <div>
              <Button 
                onClick={testBasicConnection}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? 'Testing...' : '🧪 Test Basic Connection'}
              </Button>
              <p className="text-sm text-gray-500 mt-1">
                Sends a simple test message to verify bot configuration
              </p>
            </div>
            
            <div>
              <Button 
                onClick={testOrderNotification}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                {loading ? 'Testing...' : '📦 Test Order Notification'}
              </Button>
              <p className="text-sm text-gray-500 mt-1">
                Sends a sample order notification with dummy data
              </p>
            </div>
          </div>
        </div>

        {testResult && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Test Results</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <pre className="text-sm whitespace-pre-wrap">{testResult}</pre>
            </div>
          </div>
        )}

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">
            ⚠️ Setup Required
          </h3>
          <p className="text-yellow-700 mb-4">
            If tests are failing, make sure you have completed the Telegram setup:
          </p>
          <ol className="list-decimal list-inside text-yellow-700 space-y-1 text-sm">
            <li>Create a Telegram bot via @BotFather</li>
            <li>Get your Chat ID via @userinfobot</li>
            <li>Add TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID to your .env.local file</li>
            <li>Set TELEGRAM_NOTIFICATIONS_ENABLED=true</li>
            <li>Restart your development server</li>
          </ol>
          <p className="text-yellow-700 mt-4 text-sm">
            📖 See TELEGRAM_SETUP.md for detailed instructions.
          </p>
        </div>
      </div>
    </div>
  );
} 