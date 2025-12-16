import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Signup from './pages/Signup';
import Home from './pages/Home';
import Conversation from './pages/Conversation';
import Feedback from './pages/Feedback';
import { UserProfile, AppRoute } from './types';

const App: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  return (
    <HashRouter>
      <Routes>
        <Route 
          path={AppRoute.SIGNUP} 
          element={<Signup setProfile={setProfile} />} 
        />
        <Route 
          path={AppRoute.HOME} 
          element={<Home profile={profile} />} 
        />
        <Route 
          path={AppRoute.CONVERSATION} 
          element={<Conversation profile={profile} />} 
        />
        <Route 
          path={AppRoute.FEEDBACK} 
          element={<Feedback profile={profile} />} 
        />
        <Route path="*" element={<Navigate to={AppRoute.SIGNUP} replace />} />
      </Routes>
    </HashRouter>
  );
};

export default App;