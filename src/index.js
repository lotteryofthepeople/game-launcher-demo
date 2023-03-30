import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import {GameLauncher} from './GameLauncher';

function App() {
    return (
        <div>
            Embedded Game UI:
            <GameLauncher gameId={1}/>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
