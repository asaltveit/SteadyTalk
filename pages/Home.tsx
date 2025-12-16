import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserProfile, AppRoute } from '../types';
import Button from '../components/Button';
import { Video, ShieldAlert, Mic } from 'lucide-react';

interface HomeProps {
  profile: UserProfile | null;
}

const Home: React.FC<HomeProps> = ({ profile }) => {
  const navigate = useNavigate();

  if (!profile) {
    navigate(AppRoute.SIGNUP);
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-900/20 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/20 rounded-full blur-[100px]"></div>
      </div>

      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <div className="mb-6 flex justify-center">
            <img 
              src="/fake_boss.webp" 
              alt="Mr. Sterling" 
              className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-indigo-500/50 shadow-xl shadow-indigo-500/20"
            />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready, {profile.name}?
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            You are about to enter a video call with <span className="text-indigo-400 font-semibold">Mr. Sterling</span>. 
            He is a difficult, results-oriented manager. You need to discuss <span className="text-white font-medium">"{profile.topic}"</span>.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 backdrop-blur-sm">
            <div className="h-12 w-12 bg-blue-900/30 rounded-lg flex items-center justify-center mb-4 text-blue-400">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Be Prepared</h3>
            <p className="text-slate-400 text-sm">Mr. Sterling appreciates data and directness. Don't beat around the bush.</p>
          </div>
          <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 backdrop-blur-sm">
            <div className="h-12 w-12 bg-indigo-900/30 rounded-lg flex items-center justify-center mb-4 text-indigo-400">
              <Mic className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Speak Clearly</h3>
            <p className="text-slate-400 text-sm">This is a live voice interaction powered by Gemini. Speak naturally.</p>
          </div>
          <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 backdrop-blur-sm">
            <div className="h-12 w-12 bg-purple-900/30 rounded-lg flex items-center justify-center mb-4 text-purple-400">
              <Video className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Face to Face</h3>
            <p className="text-slate-400 text-sm">Keep your composure. The simulation reacts to your tone and arguments.</p>
          </div>
        </div>

        <div className="flex justify-center">
          <Button 
            onClick={() => navigate(AppRoute.CONVERSATION)}
            className="text-lg px-8 py-4 shadow-xl shadow-indigo-500/20"
          >
            Start Simulation
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Home;