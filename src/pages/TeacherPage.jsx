import { useState, useEffect } from 'react'
import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'firebase/auth'
import {
    collection, onSnapshot, orderBy, query, doc, updateDoc
} from 'firebase/firestore'
import { auth, db, TEACHER_EMAILS } from '../firebase'

const TEACHER_KEYS = ['docente1', 'docente2', 'docente3']
const TEACHER_LABELS = ['Ricardo Aldo', 'Luis Chaustre', 'Henry Leon']

export default function TeacherPage() {
    const [user, setUser] = useState(null)
    const [authLoading, setAuthLoading] = useState(true)

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            setUser(u)
            setAuthLoading(false)
        })
        return () => unsub()
    }, [])

    if (authLoading) return (
        <div className="page-wrapper"><div className="loading-center"><div className="spinner" /></div></div>
    )

    const isAuthorized = user && TEACHER_EMAILS.includes(user.email)

    if (!user || !isAuthorized) {
        return <LoginForm notAuthorized={user && !isAuthorized} />
    }

    const teacherIndex = TEACHER_EMAILS.indexOf(user.email)
    const teacherKey = TEACHER_KEYS[teacherIndex]
    const teacherName = TEACHER_LABELS[teacherIndex]

    return <GradingPanel user={user} teacherKey={teacherKey} teacherName={teacherName} />
}

/* ─── LOGIN ─── */
function LoginForm({ notAuthorized }) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleLogin = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            await signInWithEmailAndPassword(auth, email, password)
        } catch {
            setError('Correo o contraseña incorrectos.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="login-wrapper">
            <div className="login-card">
                <div className="icon-wrap">👩‍🏫</div>
                <h2 style={{ textAlign: 'center', marginBottom: '0.4rem', fontWeight: 700 }}>
                    Panel Docente
                </h2>
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.8rem' }}>
                    Acceso exclusivo para los 3 docentes del curso
                </p>

                {notAuthorized && (
                    <div className="alert alert-error">
                        🚫 Tu correo no está autorizado como docente.
                    </div>
                )}
                {error && <div className="alert alert-error">❌ {error}</div>}

                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <label>Correo Electrónico</label>
                        <input
                            id="teacher-email"
                            className="form-control"
                            type="email"
                            placeholder="correo@universidad.edu"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Contraseña</label>
                        <input
                            id="teacher-password"
                            className="form-control"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button
                        id="login-btn"
                        className="btn btn-primary"
                        type="submit"
                        disabled={loading}
                        style={{ width: '100%' }}
                    >
                        {loading ? '⏳ Ingresando...' : '🔐 Iniciar Sesión'}
                    </button>
                </form>
            </div>
        </div>
    )
}

/* ─── GRADING PANEL ─── */
function GradingPanel({ user, teacherKey, teacherName }) {
    const [videos, setVideos] = useState([])
    const [loading, setLoading] = useState(true)
    const [grades, setGrades] = useState({})   // { videoId: { nota: '', comentario: '' } }
    const [saved, setSaved] = useState({})    // { videoId: true }
    const [saving, setSaving] = useState({})   // { videoId: true }

    useEffect(() => {
        const q = query(collection(db, 'videos'), orderBy('createdAt', 'desc'))
        const unsub = onSnapshot(q, (snap) => {
            const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
            setVideos(docs)
            // Pre-fill with existing grades for this teacher
            const initial = {}
            docs.forEach(v => {
                if (v.notas?.[teacherKey]) {
                    initial[v.id] = {
                        nota: String(v.notas[teacherKey].nota ?? ''),
                        comentario: v.notas[teacherKey].comentario ?? ''
                    }
                } else {
                    initial[v.id] = { nota: '', comentario: '' }
                }
            })
            setGrades(initial)
            setLoading(false)
        })
        return () => unsub()
    }, [teacherKey])

    const handleChange = (videoId, field, value) => {
        setGrades(prev => ({
            ...prev,
            [videoId]: { ...prev[videoId], [field]: value }
        }))
        setSaved(prev => ({ ...prev, [videoId]: false }))
    }

    const handleSave = async (videoId) => {
        const g = grades[videoId]
        const nota = Number(g.nota)
        if (isNaN(nota) || nota < 0 || nota > 100) {
            alert('La nota debe ser un número entre 0 y 100.')
            return
        }
        setSaving(prev => ({ ...prev, [videoId]: true }))
        try {
            await updateDoc(doc(db, 'videos', videoId), {
                [`notas.${teacherKey}`]: { nota, comentario: g.comentario || '' }
            })
            setSaved(prev => ({ ...prev, [videoId]: true }))
        } catch (err) {
            console.error(err)
            alert('Error al guardar. Intenta de nuevo.')
        } finally {
            setSaving(prev => ({ ...prev, [videoId]: false }))
        }
    }

    const pending = videos.filter(v => !v.notas?.[teacherKey])

    return (
        <div className="page-wrapper">
            <div className="page-header">
                <h1>👩‍🏫 Panel de Calificación</h1>
                <p>Bienvenida/o, <strong>{teacherName}</strong> · {user.email}</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div className="stats-bar" style={{ marginBottom: 0 }}>
                    <div className="stat-pill">Total: <strong>{videos.length}</strong></div>
                    <div className="stat-pill">Por calificar: <strong>{pending.length}</strong></div>
                    <div className="stat-pill">Calificados: <strong>{videos.length - pending.length}</strong></div>
                </div>
                <button
                    id="logout-btn"
                    className="btn btn-outline btn-sm"
                    onClick={() => signOut(auth)}
                >
                    🚪 Cerrar Sesión
                </button>
            </div>

            {loading ? (
                <div className="loading-center"><div className="spinner" /></div>
            ) : videos.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">📭</div>
                    <p>Aún no hay videos enviados por los estudiantes.</p>
                </div>
            ) : (
                <div className="card" style={{ padding: 0 }}>
                    <div className="teacher-table-wrap">
                        <table className="teacher-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '200px' }}>Estudiante</th>
                                    <th>Video</th>
                                    <th style={{ width: '220px' }}>Tu Nota (0–100)</th>
                                    <th style={{ width: '100px' }}>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {videos.map(video => {
                                    const already = video.notas?.[teacherKey]
                                    const g = grades[video.id] || { nota: '', comentario: '' }
                                    return (
                                        <tr key={video.id}>
                                            <td>
                                                <div style={{ fontWeight: 600 }}>{video.nombre}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{video.carnet}</div>
                                            </td>
                                            <td>
                                                <a
                                                    href={video.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    style={{ color: 'var(--accent-secondary)', textDecoration: 'none', fontSize: '0.85rem' }}
                                                >
                                                    🔗 Ver video
                                                </a>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                                    <div className="grade-input-row">
                                                        <input
                                                            id={`grade-${video.id}`}
                                                            className="grade-input"
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            placeholder="—"
                                                            value={g.nota}
                                                            onChange={e => handleChange(video.id, 'nota', e.target.value)}
                                                        />
                                                        <button
                                                            id={`save-${video.id}`}
                                                            className="btn btn-success btn-sm"
                                                            onClick={() => handleSave(video.id)}
                                                            disabled={saving[video.id] || !g.nota}
                                                        >
                                                            {saving[video.id] ? '...' : saved[video.id] ? '✅' : '💾'}
                                                        </button>
                                                    </div>
                                                    <input
                                                        id={`comment-${video.id}`}
                                                        className="form-control"
                                                        style={{ fontSize: '0.8rem', padding: '0.35rem 0.6rem' }}
                                                        placeholder="Comentario (opcional)"
                                                        value={g.comentario}
                                                        onChange={e => handleChange(video.id, 'comentario', e.target.value)}
                                                    />
                                                </div>
                                            </td>
                                            <td>
                                                {already ? (
                                                    <span className="badge badge-graded">✅ {already.nota}</span>
                                                ) : (
                                                    <span className="badge badge-pending">⏳ Pendiente</span>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}
