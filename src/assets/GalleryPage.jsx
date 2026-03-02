import { useState, useEffect } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase'

const TEACHER_NAMES = ['Ricardo Aldo', 'Luis Chaustre', 'Henry Leon']
const TEACHER_KEYS = ['docente1', 'docente2', 'docente3']

export default function GalleryPage() {
    const [videos, setVideos] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [filter, setFilter] = useState('all') // 'all' | 'graded' | 'pending'

    useEffect(() => {
        const q = query(collection(db, 'videos'), orderBy('createdAt', 'desc'))
        const unsub = onSnapshot(q, (snap) => {
            setVideos(snap.docs.map(d => ({ id: d.id, ...d.data() })))
            setLoading(false)
        })
        return () => unsub()
    }, [])

    const filtered = videos.filter(v => {
        const matchSearch = v.nombre?.toLowerCase().includes(search.toLowerCase()) ||
            v.carnet?.toLowerCase().includes(search.toLowerCase())
        const allGraded = TEACHER_KEYS.every(k => v.notas?.[k] !== undefined)
        const anyGraded = TEACHER_KEYS.some(k => v.notas?.[k] !== undefined)
        if (filter === 'graded') return matchSearch && allGraded
        if (filter === 'pending') return matchSearch && !anyGraded
        return matchSearch
    })

    const totalGraded = videos.filter(v => TEACHER_KEYS.every(k => v.notas?.[k] !== undefined)).length

    return (
        <div className="page-wrapper">
            <div className="page-header">
                <h1>🎬 Galería de Videos</h1>
                <p>Revisa los trabajos de tus compañeros y las notas de los docentes</p>
            </div>

            {!loading && (
                <div className="stats-bar">
                    <div className="stat-pill">Total: <strong>{videos.length}</strong></div>
                    <div className="stat-pill">Calificados: <strong>{totalGraded}</strong></div>
                    <div className="stat-pill">Pendientes: <strong>{videos.length - totalGraded}</strong></div>
                </div>
            )}

            <div className="filter-bar">
                <input
                    id="search-gallery"
                    className="form-control"
                    placeholder="🔍 Buscar por nombre o grupo..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                <button
                    className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setFilter('all')}
                >Todos</button>
                <button
                    className={`btn btn-sm ${filter === 'graded' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setFilter('graded')}
                >Calificados</button>
                <button
                    className={`btn btn-sm ${filter === 'pending' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setFilter('pending')}
                >Pendientes</button>
            </div>

            {loading ? (
                <div className="loading-center"><div className="spinner" /></div>
            ) : filtered.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">📭</div>
                    <p>No hay videos que coincidan con tu búsqueda.</p>
                </div>
            ) : (
                <div className="gallery-grid">
                    {filtered.map(video => (
                        <VideoCard key={video.id} video={video} />
                    ))}
                </div>
            )}
        </div>
    )
}

function VideoCard({ video }) {
    const allGraded = TEACHER_KEYS.every(k => video.notas?.[k] !== undefined)

    return (
        <div className="video-card">
            <div className="video-thumb">
                <iframe
                    src={video.embedUrl}
                    title={video.nombre}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                />
            </div>
            <div className="video-card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div>
                        <div className="student-name">{video.nombre}</div>
                        <div className="student-id">Grupo: {video.carnet}</div>
                    </div>
                    <span className={`badge ${allGraded ? 'badge-graded' : 'badge-pending'}`}>
                        {allGraded ? '✅ Calificado' : '⏳ Pendiente'}
                    </span>
                </div>

                <div className="grades-row">
                    {TEACHER_KEYS.map((key, i) => {
                        const nota = video.notas?.[key]
                        return (
                            <div className="grade-item" key={key}>
                                <span className="grade-teacher">{TEACHER_NAMES[i]}</span>
                                {nota !== undefined ? (
                                    <div style={{ textAlign: 'right' }}>
                                        <span className="grade-value">{nota.nota}/100</span>
                                        {nota.comentario && (
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '150px' }}>
                                                {nota.comentario}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <span className="grade-pending">Pendiente</span>
                                )}
                            </div>
                        )
                    })}
                </div>

                {TEACHER_KEYS.some(k => video.notas?.[k]?.nota !== undefined) && (
                    <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', background: 'var(--bg-secondary)', borderRadius: '8px', textAlign: 'center' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Promedio: </span>
                        <strong style={{ color: 'var(--success)' }}>
                            {(
                                TEACHER_KEYS
                                    .filter(k => video.notas?.[k]?.nota !== undefined)
                                    .reduce((acc, k) => acc + Number(video.notas[k].nota), 0) /
                                TEACHER_KEYS.filter(k => video.notas?.[k]?.nota !== undefined).length
                            ).toFixed(1)}
                        </strong>
                    </div>
                )}
            </div>
        </div>
    )
}
