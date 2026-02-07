import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { NurseQueue } from './pages/NurseQueue';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/followups" element={<NurseQueue />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
