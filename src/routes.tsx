import React from 'react';
import { BrowserRouter, Route } from 'react-router-dom';
import CreatePoint from './pages/CreatePoint';
import Home from './pages/Home';

const Routes: React.FC = () => {
  return (
    <BrowserRouter>
      <Route path="/" exact component={Home} />
      <Route path="/create-point" component={CreatePoint} />
    </BrowserRouter>
  );
};

export default Routes;
