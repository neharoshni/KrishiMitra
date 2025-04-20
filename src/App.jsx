import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SurveyPage from './pages/SurveyPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/survey" element={<SurveyPage />} />
      </Routes>
    </Router>
  );
}

export default App;
