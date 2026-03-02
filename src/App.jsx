import './index.css'
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import StudentPage from './pages/StudentPage'
import GalleryPage from './pages/GalleryPage'
import TeacherPage from './pages/TeacherPage'

function App() {
  return (
    <BrowserRouter>
      <nav className="navbar">
        <NavLink to="/" className="navbar-brand">
          <span className="logo-icon">🧠</span>
          <span>Neurodesarrollo Videos</span>
        </NavLink>
        <div className="navbar-links">
          <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            📤 Enviar Video
          </NavLink>
          <NavLink to="/galeria" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            🎬 Galería
          </NavLink>
          <NavLink to="/docentes" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            👩‍🏫 Docentes
          </NavLink>
        </div>
      </nav>
      <Routes>
        <Route path="/" element={<StudentPage />} />
        <Route path="/galeria" element={<GalleryPage />} />
        <Route path="/docentes" element={<TeacherPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
