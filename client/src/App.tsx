import { Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import CreateDisputePage from './pages/CreateDispute';
import DisputeDetailPage from './pages/DisputeDetail';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/disputes/new" element={<CreateDisputePage />} />
      <Route path="/disputes/:id" element={<DisputeDetailPage />} />
    </Routes>
  );
}

export default App;
