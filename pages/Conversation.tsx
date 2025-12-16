import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserProfile, AppRoute, ChatMessage } from '../types';
import Button from '../components/Button';
import { getJordanLeeSystemPrompt } from '../utils/persona';
import { createPersona, createConversation } from '../utils/tavus';
import { X } from 'lucide-react';

// N8N Webhook URL - can be overridden by VITE_N8N_WEBHOOK_URL environment variable
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const N8N_WEBHOOK_URL = (import.meta as any).env?.VITE_N8N_WEBHOOK_URL || "https://asalt.app.n8n.cloud/webhook/caef0b1b-734e-4359-8e53-c35f579da79a";

interface ConversationProps {
  profile: UserProfile | null;
}

const Conversation: React.FC<ConversationProps> = ({ profile }) => {
  const navigate = useNavigate();
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationUrl, setConversationUrl] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Refs for iframe
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Transcription State
  const transcriptRef = useRef<ChatMessage[]>([]);

  // Check profile
  useEffect(() => {
    if (!profile) {
      navigate(AppRoute.SIGNUP);
    }
  }, [profile, navigate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const disconnect = () => {
    setIsConnected(false);
    setConversationUrl(null);
  };

  const leaveCall = async () => {
    try {
      // Call webhook when leaving the call
      if (N8N_WEBHOOK_URL && conversationId) {
        await fetch(N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source: 'tavus',
            event_type: 'call.ended',
            conversation_id: conversationId,
            timestamp: new Date().toISOString(),
            user: {
              name: profile?.name,
              email: profile?.email,
              role: profile?.role,
            },
          }),
        });
        console.log('Webhook called successfully on leave call');
      } else if (conversationId) {
        console.log('N8N Webhook URL not configured. Call ended payload:', {
          conversation_id: conversationId,
          user: {
            name: profile?.name,
            email: profile?.email,
            role: profile?.role,
          },
        });
      }
    } catch (err) {
      console.error('Error calling webhook on leave call:', err);
    } finally {
      disconnect();
      // Navigate to feedback page or home
      navigate(AppRoute.FEEDBACK, { 
        state: { transcript: transcriptRef.current } 
      });
    }
  };

  const startSession = async () => {
    setError(null);
    setIsLoading(true);
    transcriptRef.current = []; // Reset transcript
    
    try {
      // 1. Get Jordan Lee persona system prompt
      const systemPrompt = getJordanLeeSystemPrompt({
        name: profile?.name,
        role: profile?.role,
        topic: profile?.topic,
      });

      // 2. Create Tavus persona
      console.log('Creating Tavus persona...');
      let persona;
      try {
        persona = await createPersona(systemPrompt);
      } catch (tavusError: any) {
        console.error('Tavus persona creation error:', tavusError);
        if (tavusError.message?.includes('TAVUS_API_KEY')) {
          throw new Error('Tavus API key is missing or invalid. Please check your TAVUS_API_KEY in .env.local');
        }
        throw new Error(`Failed to create persona: ${tavusError.message || 'Unknown error'}`);
      }
      
      const personaId = persona.persona_id;
      console.log('Persona created:', personaId);

      // 3. Create Tavus conversation
      console.log('Creating Tavus conversation...');
      let conversation;
      try {
        conversation = await createConversation(personaId);
      } catch (tavusError: any) {
        console.error('Tavus conversation creation error:', tavusError);
        throw new Error(`Failed to create conversation: ${tavusError.message || 'Unknown error'}`);
      }
      
      const url = conversation.conversation_url;
      const id = conversation.conversation_id || conversation.id || null;
      console.log('Conversation URL:', url);
      console.log('Conversation ID:', id);

      setConversationUrl(url);
      setConversationId(id);
      setIsConnected(true);
      setIsLoading(false);

    } catch (e: any) {
      console.error('Start session error:', e);
      setError(e.message || "Failed to initialize Tavus connection. Please check your TAVUS_API_KEY.");
      setIsLoading(false);
    }
  };


  return (
    <div className="h-screen bg-black flex flex-col relative overflow-hidden">
      
      {/* Leave Call Button - Only show when connected */}
      {isConnected && conversationUrl && (
        <div className="absolute top-4 right-4 z-30">
          <Button
            onClick={leaveCall}
            variant="danger"
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Leave Call
          </Button>
        </div>
      )}

      {/* Tavus iframe - Full Screen */}
      <div className="flex-1 relative w-full h-full">
        {conversationUrl ? (
          <iframe
            ref={iframeRef}
            src={conversationUrl}
            className="w-full h-full border-0"
            allow="camera; microphone; autoplay; fullscreen; display-capture; geolocation"
            allowFullScreen
            title="Jordan Lee Conversation"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {/* Visualizer / Avatar placeholder */}
            <div className="relative w-48 h-48 rounded-full flex items-center justify-center">
              <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-pulse"></div>
              <img 
                src="https://picsum.photos/400/400?grayscale" 
                alt="Jordan Lee" 
                className="w-40 h-40 rounded-full object-cover border-4 border-indigo-500 z-10"
              />
            </div>
          </div>
        )}

        {!isConnected && !error && !isLoading && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-20">
            <div className="text-center p-6">
              <h3 className="text-xl text-white font-bold mb-4">Ready to begin?</h3>
              <Button onClick={startSession} className="mx-auto" disabled={isLoading}>
                Connect Call
              </Button>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-20">
            <div className="text-center p-6">
              <div className="text-white mb-4">Connecting to Jordan Lee...</div>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
            </div>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-20">
            <div className="text-center p-6 max-w-md">
              <div className="text-red-500 mb-2 font-bold">Connection Error</div>
              <p className="text-slate-300 mb-4">{error}</p>
              <Button onClick={startSession} variant="secondary" disabled={isLoading}>
                Retry
              </Button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default Conversation;