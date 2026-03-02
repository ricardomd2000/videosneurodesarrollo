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

const RUBRIC_CRITERIA = [
    { id: 'hitos', label: '1. Identificación de hitos', weight: 0.15, desc: 'Reconocimiento de hitos motores, cognitivos, lenguaje y socioemocionales.' },
    { id: 'puestaEscena', label: '2. Puesta en escena (Role Play)', weight: 0.20, desc: 'Calidad de la representación dramática y fidelidad al mes.' },
    { id: 'estructuras', label: '3. Explicación de estructuras', weight: 0.20, desc: 'Relación con estructuras neurológicas y áreas cerebrales.' },
    { id: 'creatividad', label: '4. Creatividad y originalidad', weight: 0.10, desc: 'Uso de recursos, vestuario, narrativa e innovación.' },
    { id: 'trabajoEquipo', label: '5. Trabajo en equipo', weight: 0.15, desc: 'Participación equitativa y coordinación de integrantes.' },
    { id: 'calidadVideo', label: '6. Calidad del video', weight: 0.10, desc: 'Audio, iluminación, edición y aspectos técnicos.' },
    { id: 'entrega', label: '7. Entrega y publicación', weight: 0.10, desc: 'Link funcional de YouTube, descripción y puntualidad.' }
]

function RubricModal({ video, currentRubric, onSave, onClose }) {
    const [scores, setScores] = useState(RUBRIC_CRITERIA.reduce((acc, c) => ({
        ...acc,
        [c.id]: currentRubric?.[c.id] ?? 0
    }), {}))

    const total = RUBRIC_CRITERIA.reduce((acc, c) => acc + (Number(scores[c.id]) * c.weight), 0).toFixed(2)

    return (
        <div className="modal-overlay">
            <div className="modal-card rubric-modal">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: 0 }}>📊 Rúbrica: {video.nombre}</h3>
                    <button className="btn-close" onClick={onClose}>&times;</button>
                </div>

                <div className="rubric-grid">
                    {RUBRIC_CRITERIA.map(c => (
                        <div key={c.id} className="rubric-item">
                            <div className="rubric-info">
                                <strong>{c.label}</strong>
                                <p>{c.desc}</p>
                            </div>
                            <div className="rubric-score">
                                <input
                                    type="number"
                                    min="0"
                                    max="5"
                                    step="0.1"
                                    value={scores[c.id]}
                                    onChange={e => setScores(s => ({ ...s, [c.id]: e.target.value }))}
                                    className="grade-input"
                                />
                                <span className="weight-label">({(c.weight * 100)}%)</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="rubric-footer">
                    <div className="total-box">
                        Nota Final: <span>{total}</span> / 5.0
                    </div>
                    <div style={{ display: 'flex', gap: '0.8rem' }}>
                        <button className="btn btn-outline" onClick={onClose}>Cancelar</button>
                        <button className="btn btn-primary" onClick={() => onSave(scores, total)}>
                            💾 Guardar Rúbrica
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

/* ─── GRADING PANEL ─── */
function GradingPanel({ user, teacherKey, teacherName }) {
    const [videos, setVideos] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeRubric, setActiveRubric] = useState(null) // ID of video being rubric-graded
    const [grades, setGrades] = useState({})   // { videoId: { nota: '', comentario: '', rubrica: {} } }
    const [saving, setSaving] = useState({})

    useEffect(() => {
        const q = query(collection(db, 'videos'), orderBy('createdAt', 'desc'))
        const unsub = onSnapshot(q, (snap) => {
            const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
            setVideos(docs)
            const initial = {}
            docs.forEach(v => {
                const myGrade = v.notas?.[teacherKey]
                initial[v.id] = {
                    nota: myGrade ? String(myGrade.nota ?? '') : '',
                    comentario: myGrade ? (myGrade.comentario ?? '') : '',
                    rubrica: myGrade?.rubrica ?? null
                }
            })
            setGrades(initial)
            setLoading(false)
        })
        return () => unsub()
    }, [teacherKey])

    const handleSaveRubric = async (scores, total) => {
        const videoId = activeRubric
        setSaving(prev => ({ ...prev, [videoId]: true }))
        try {
            const currentComment = grades[videoId]?.comentario || ''
            await updateDoc(doc(db, 'videos', videoId), {
                [`notas.${teacherKey}`]: {
                    nota: Number(total),
                    comentario: currentComment,
                    rubrica: scores
                }
            })
            setActiveRubric(null)
        } catch (err) {
            console.error(err)
            alert('Error al guardar rúbrica.')
        } finally {
            setSaving(prev => ({ ...prev, [videoId]: false }))
        }
    }

    const handleCommentChange = (videoId, val) => {
        setGrades(prev => ({
            ...prev,
            [videoId]: { ...prev[videoId], comentario: val }
        }))
    }

    const saveCommentOnly = async (videoId) => {
        setSaving(prev => ({ ...prev, [videoId]: true }))
        try {
            const current = grades[videoId]
            await updateDoc(doc(db, 'videos', videoId), {
                [`notas.${teacherKey}.comentario`]: current.comentario
            })
        } catch (err) {
            console.error(err)
            alert('Error al guardar comentario.')
        } finally {
            setSaving(prev => ({ ...prev, [videoId]: false }))
        }
    }

    const pending = videos.filter(v => !v.notas?.[teacherKey])

    return (
        <div className="page-wrapper">
            {activeRubric && (
                <RubricModal
                    video={videos.find(v => v.id === activeRubric)}
                    currentRubric={grades[activeRubric]?.rubrica}
                    onSave={handleSaveRubric}
                    onClose={() => setActiveRubric(null)}
                />
            )}

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
                                    <th style={{ width: '250px' }}>Calificación (Rúbrica)</th>
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
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Grupo: {video.carnet}</div>
                                            </td>
                                            <td>
                                                <a
                                                    href={video.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="btn-link"
                                                >
                                                    🔗 Ver video
                                                </a>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                        <button
                                                            className={`btn ${already ? 'btn-outline' : 'btn-primary'} btn-sm`}
                                                            onClick={() => setActiveRubric(video.id)}
                                                            disabled={saving[video.id]}
                                                        >
                                                            {already ? '📝 Editar Rúbrica' : '📋 Calificar con Rúbrica'}
                                                        </button>
                                                        {already && (
                                                            <div className="final-grade-badge">
                                                                Nota: <strong>{Number(already.nota).toFixed(1)}</strong>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                                                        <input
                                                            className="form-control"
                                                            style={{ fontSize: '0.8rem', padding: '0.35rem 0.6rem' }}
                                                            placeholder="Comentario (opcional)"
                                                            value={g.comentario}
                                                            onChange={e => handleCommentChange(video.id, e.target.value)}
                                                        />
                                                        <button
                                                            className="btn btn-success btn-sm"
                                                            onClick={() => saveCommentOnly(video.id)}
                                                            title="Guardar comentario"
                                                            disabled={saving[video.id]}
                                                        >
                                                            {saving[video.id] ? '...' : '💾'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                {already ? (
                                                    <span className="badge badge-graded">✅ OK</span>
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
