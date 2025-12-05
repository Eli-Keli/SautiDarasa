import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import TeacherView from './pages/TeacherView';
import StudentView from './pages/StudentView';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/teacher" replace />} />
        <Route path="/teacher" element={<TeacherView />} />
        <Route path="/student" element={<StudentView />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
