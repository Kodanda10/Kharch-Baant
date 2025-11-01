import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export const RealtimeStatus: React.FC = () => {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [lastEvent, setLastEvent] = useState<string>('');

  useEffect(() => {
    // Monitor connection status
    const channel = supabase.channel('heartbeat')
      .subscribe((status) => {
        console.log('Realtime connection status:', status);
        if (status === 'SUBSCRIBED') {
          setStatus('connected');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          setStatus('disconnected');
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, []);

  if (status === 'connected') {
    return (
      <div className="fixed bottom-4 right-4 bg-green-500 text-white px-3 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm z-50">
        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
        Live
        {lastEvent && <span className="text-xs opacity-75">• {lastEvent}</span>}
      </div>
    );
  }

  if (status === 'disconnected') {
    return (
      <div className="fixed bottom-4 right-4 bg-red-500 text-white px-3 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm z-50">
        <div className="w-2 h-2 bg-white rounded-full"></div>
        Disconnected
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-yellow-500 text-white px-3 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm z-50">
      <div className="w-2 h-2 bg-white rounded-full animate-spin"></div>
      Connecting...
    </div>
  );
};
