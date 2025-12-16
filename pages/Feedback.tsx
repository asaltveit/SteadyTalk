import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { UserProfile, AppRoute, ChatMessage } from '../types';
import Button from '../components/Button';
import { CheckCircle, AlertCircle, Lightbulb, Mail } from 'lucide-react';
import { GoogleGenAI, Type } from '@google/genai';

// N8N Webhook URL
const N8N_WEBHOOK_URL = "https://asalt.app.n8n.cloud/webhook/caef0b1b-734e-4359-8e53-c35f579da79a"; 

interface FeedbackProps {
  profile: UserProfile | null;
}

interface Tip {
  title: string;
  description: string;
  category: 'Communication' | 'Tone' | 'Clarity';
}

const Feedback: React.FC<FeedbackProps> = ({ profile }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<Tip[]>([]);
  const [emailSent, setEmailSent] = useState(false);

  const transcript: ChatMessage[] = location.state?.transcript || [];

  useEffect(() => {
    if (!profile || transcript.length === 0) {
      // If no data, allow one retry or showing empty state, but practically we should probably redirect if accessed directly
      // For now, let's just show mock data if empty for testing
      if (transcript.length === 0) {
          console.warn("No transcript found. Ensure you speak during the simulation.");
      }
    }

    const generateFeedback = async () => {
      try {
        if (!process.env.API_KEY) throw new Error("API Key missing");
        
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        // Prepare transcript text
        const conversationText = transcript.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n');
        
        // 1. Generate Feedback using Gemini Flash
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Analyze the following transcript of a roleplay between an employee and a difficult boss (Mr. Sterling). 
          Transcript:
          ${conversationText}
          
          Provide 3 specific, actionable tips for the employee to improve their communication, tone, and clarity.
          Return a JSON array of objects with keys: title, description, and category (one of 'Communication', 'Tone', 'Clarity').`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  category: { type: Type.STRING, enum: ['Communication', 'Tone', 'Clarity'] },
                }
              }
            }
          }
        });

        const tips: Tip[] = JSON.parse(response.text || '[]');
        setFeedback(tips);
        
        // 2. Trigger N8N Workflow (Simulated)
        if (N8N_WEBHOOK_URL) {
            await fetch(N8N_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: profile?.email,
                    name: profile?.name,
                    transcript: conversationText,
                    feedback: tips
                })
            });
            setEmailSent(true);
        } else {
            console.log("N8N Webhook URL not configured. Simulating email send payload:", {
                email: profile?.email,
                transcript: conversationText,
                feedback: tips
            });
            // Simulate network delay for effect
            setTimeout(() => setEmailSent(true), 1500);
        }

      } catch (err) {
        console.error("Error generating feedback:", err);
      } finally {
        setLoading(false);
      }
    };

    generateFeedback();
  }, [profile, transcript]);

  const getIcon = (category: string) => {
    switch (category) {
      case 'Tone': return <AlertCircle className="h-6 w-6 text-orange-400" />;
      case 'Clarity': return <CheckCircle className="h-6 w-6 text-green-400" />;
      default: return <Lightbulb className="h-6 w-6 text-yellow-400" />;
    }
  };

  if (!profile) return null;

  return (
    <div className="min-h-screen p-6 flex flex-col items-center justify-center">
      <div className="max-w-3xl w-full">
        <h1 className="text-3xl font-bold text-white mb-2 text-center">Session Analysis</h1>
        <p className="text-slate-400 text-center mb-8">
            Here is how you performed in your meeting with Mr. Sterling.
        </p>

        {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                <p className="text-slate-300">Analyzing conversation patterns...</p>
            </div>
        ) : (
            <div className="space-y-6">
                {/* Email Notification Status */}
                <div className={`p-4 rounded-lg border flex items-center gap-3 ${emailSent ? 'bg-green-900/20 border-green-800 text-green-200' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                    <Mail className="h-5 w-5" />
                    {emailSent ? (
                        <span>A detailed report has been sent to <strong>{profile.email}</strong> via our feedback workflow.</span>
                    ) : (
                        <span>Sending report to {profile.email}...</span>
                    )}
                </div>

                {/* Feedback Cards */}
                <div className="grid gap-4">
                    {feedback.map((tip, idx) => (
                        <div key={idx} className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 backdrop-blur-sm hover:border-indigo-500/50 transition-colors">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-slate-900 rounded-lg">
                                    {getIcon(tip.category)}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">{tip.category}</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">{tip.title}</h3>
                                    <p className="text-slate-300 leading-relaxed">{tip.description}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Actions */}
                <div className="flex justify-center pt-8">
                    <Button onClick={() => navigate(AppRoute.HOME)}>
                        Practice Again
                    </Button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default Feedback;