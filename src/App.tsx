import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Header } from './components/Layout/Header';
import { LoadingSpinner } from './components/UI/LoadingSpinner';

// Lazy load pages for code splitting
const Home = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));
const Movies = lazy(() => import('./pages/Movies').then(m => ({ default: m.Movies })));
const TVShows = lazy(() => import('./pages/TVShows').then(m => ({ default: m.TVShows })));
const MyList = lazy(() => import('./pages/MyList').then(m => ({ default: m.MyList })));
const Search = lazy(() => import('./pages/Search').then(m => ({ default: m.Search })));
const Detail = lazy(() => import('./pages/Detail').then(m => ({ default: m.Detail })));
const Player = lazy(() => import('./pages/Player').then(m => ({ default: m.Player })));
const ProfileSelect = lazy(() => import('./pages/ProfileSelect').then(m => ({ default: m.ProfileSelect })));

function App() {
  return (
    <AppProvider>
      <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
        <Header />
        <main style={{ paddingTop: '80px', width: '100%', height: 'calc(100% - 80px)', overflow: 'auto' }}>
          <Suspense fallback={<LoadingSpinner size="large" />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/movies" element={<Movies />} />
              <Route path="/tv-shows" element={<TVShows />} />
              <Route path="/my-list" element={<MyList />} />
              <Route path="/search" element={<Search />} />
              <Route path="/detail/:type/:id" element={<Detail />} />
              <Route path="/player/:type/:id" element={<Player />} />
              <Route path="/profiles" element={<ProfileSelect />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </AppProvider>
  );
}

export default App;