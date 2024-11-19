import React from 'react';
import './Navbar.css';

const Navbar = ({ onNavigate }) => {
  return (
    <nav className="navbar">
      <div className="logo">NFT Megaportal</div>
      <ul className="nav-links">
        <li onClick={() => onNavigate('NftTrader')}>NFT Trader</li>
        <li onClick={() => onNavigate('NftTable')}>Available NFT</li>
        <li onClick={() => onNavigate('NftHistory')}>Transaction History</li>
      </ul>
    </nav>
  );
};

export default Navbar;
