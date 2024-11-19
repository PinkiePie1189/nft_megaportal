import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import NftTrader from './NftTrader';
import NftTable from './NftTable';
import NftHistory from './NftHistory';
import './App.css';

const App = () => {
  const [currentComponent, setCurrentComponent] = useState('NftTrader');

  useEffect(() => {
    console.log(`${currentComponent} component reloaded`);
  }, [currentComponent]);

  const renderComponent = () => {
    switch (currentComponent) {
      case 'NftTrader':
        return <NftTrader />;
      case 'NftTable':
        return <NftTable />;
      case 'NftHistory':
        return <NftHistory />;
      default:
        return <NftTrader />;
    }
  };

  return (
    <div className="App">
      <Navbar onNavigate={setCurrentComponent} />
      <div className="content">{renderComponent()}</div>
    </div>
  );
};

export default App;
