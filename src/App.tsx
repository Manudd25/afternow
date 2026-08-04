import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { HomePage } from './pages/HomePage';
import { ExplorePage } from './pages/ExplorePage';
import { ComparePage } from './pages/ComparePage';
import { ClimateScenarioProvider } from './context/ClimateScenarioContext';

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <ClimateScenarioProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/explore"
            element={
              <AppLayout>
                <ExplorePage />
              </AppLayout>
            }
          />
          <Route
            path="/compare"
            element={
              <AppLayout>
                <ComparePage />
              </AppLayout>
            }
          />
        </Routes>
      </BrowserRouter>
    </ClimateScenarioProvider>
  );
}
