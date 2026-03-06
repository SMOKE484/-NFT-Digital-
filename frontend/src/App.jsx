import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Scan from './pages/Scan';
import Card from './pages/Card';
import NewCard from './pages/NewCard';
import PrintCard from './pages/PrintCard';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/scan" element={<Scan />} />
        <Route path="/card/:cardId" element={<Card />} />
        <Route path="/new" element={<NewCard />} />
        <Route path="/print/:cardId" element={<PrintCard />} />
      </Routes>
    </BrowserRouter>
  );
}
