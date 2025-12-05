import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import TeacherView from './pages/TeacherView';
import StudentView from './pages/StudentView';

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/teacher" replace />} />
          <Route path="/teacher" element={<TeacherView />} />
          <Route path="/student" element={<StudentView />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
