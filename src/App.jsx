import { useState } from 'react';
import SalesPage from './components/SalesPage';
import Workspace from './components/Workspace';

function App() {
  const [currentView, setCurrentView] = useState('landing'); // 'landing' | 'workspace'

  const handleNavigate = (view) => {
    setCurrentView(view);
  };

  return (
    <>
      {currentView === 'landing' ? (
        <SalesPage onNavigate={handleNavigate} />
      ) : (
        <Workspace onNavigate={handleNavigate} />
      )}
    </>
  );
}

export default App;
