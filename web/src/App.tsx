import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import ThinkersPage from './pages/ThinkersPage'
import ThinkerDetailPage from './pages/ThinkerDetailPage'
import CoursesPage from './pages/CoursesPage'
import LecturePage from './pages/LecturePage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/thinkers" element={<ThinkersPage />} />
        <Route path="/thinkers/:id" element={<ThinkerDetailPage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/lectures/:id" element={<LecturePage />} />
      </Route>
    </Routes>
  )
}
