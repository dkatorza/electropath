import React from 'react';
import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';

const Home = () => <h2>Home Page</h2>;
const SampleRoute = () => <h2>Sample Route Page</h2>;

function App() {
  return (
    <Router>
      <div>
        <nav>
          <ul>
            <li>
              <Link to='/'>Home</Link>
            </li>
            <li>
              <Link to='/dashboard'>Sample Route</Link>
            </li>
          </ul>
        </nav>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/notifications' element={<SampleRoute />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
