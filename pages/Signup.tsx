import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserProfile, AppRoute } from '../types';
import Button from '../components/Button';
import Input from '../components/Input';
import { UserCircle, Briefcase } from 'lucide-react';

interface SignupProps {
  setProfile: (profile: UserProfile) => void;
}

// Email validation function that requires valid domain/TLD structure
const validateEmail = (email: string): boolean => {
  if (!email) return false;
  
  // Basic email format: local@domain
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return false;
  
  // Split email into local and domain parts
  const parts = email.split('@');
  if (parts.length !== 2) return false;
  
  const domain = parts[1];
  
  // Domain must contain at least one dot (for TLD)
  if (!domain.includes('.')) return false;
  
  // Split domain into parts
  const domainParts = domain.split('.');
  
  // Must have at least domain name and TLD
  if (domainParts.length < 2) return false;
  
  // TLD must be at least 2 characters
  const tld = domainParts[domainParts.length - 1];
  if (tld.length < 2) return false;
  
  // Domain name (before TLD) must not be empty
  if (domainParts[domainParts.length - 2].length === 0) return false;
  
  // TLD should only contain letters (no numbers)
  if (!/^[a-zA-Z]+$/.test(tld)) return false;
  
  return true;
};

const Signup: React.FC<SignupProps> = ({ setProfile }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<UserProfile>({
    name: '',
    role: '',
    topic: 'Salary Negotiation',
    email: '',
  });
  const [emailError, setEmailError] = useState<string>('');

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    setFormData({...formData, email});
    
    // Clear error when user starts typing
    if (emailError) {
      setEmailError('');
    }
  };

  const handleEmailBlur = () => {
    if (formData.email && !validateEmail(formData.email)) {
      setEmailError('Please enter a valid email address with a proper domain (e.g., user@example.com)');
    } else {
      setEmailError('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email before submission
    if (!validateEmail(formData.email)) {
      setEmailError('Please enter a valid email address with a proper domain (e.g., user@example.com)');
      return;
    }
    
    if (formData.name && formData.role && formData.email) {
      setProfile(formData);
      navigate(AppRoute.HOME);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-indigo-900/50 rounded-full flex items-center justify-center mb-4 border border-indigo-500/30">
            <UserCircle className="h-8 w-8 text-indigo-400" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Create your Profile</h2>
          <p className="mt-2 text-slate-400">
            Before we begin, tell us who you are and what you want to discuss with your boss.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6 bg-slate-800/50 p-8 rounded-2xl border border-slate-700 shadow-xl backdrop-blur-sm">
          <div className="space-y-4">
            <Input 
              label="Full Name"
              placeholder="e.g. Alex Johnson"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
            <div className="flex flex-col gap-2">
              <Input 
                label="Email Address"
                type="email"
                placeholder="e.g. alex@example.com"
                value={formData.email}
                onChange={handleEmailChange}
                onBlur={handleEmailBlur}
                required
                className={emailError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
              />
              {emailError && (
                <p className="text-sm text-red-400 ml-1">{emailError}</p>
              )}
            </div>
            <Input 
              label="Your Job Title"
              placeholder="e.g. Senior Product Designer"
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
              required
            />
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-300 ml-1">
                Conversation Topic
              </label>
              <div className="relative">
                <select 
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 appearance-none"
                  value={formData.topic}
                  onChange={(e) => setFormData({...formData, topic: e.target.value})}
                >
                  <option>Salary Negotiation</option>
                  <option>Performance Review</option>
                  <option>Resignation</option>
                  <option>Project Conflict</option>
                  <option>Promotion Request</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                  <Briefcase className="h-4 w-4" />
                </div>
              </div>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={!formData.name || !formData.role || !formData.email || !validateEmail(formData.email)}
          >
            Continue to Briefing
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Signup;