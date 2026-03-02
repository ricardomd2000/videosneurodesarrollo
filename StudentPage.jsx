import { useState } from 'react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

function getEmbedUrl(url) {
    if (!url) return null
    // YouTube
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/)
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`
    // Google Drive
    const driveMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/)
    if (driveMatch) return `https://drive.google.com/file/d/${driveMatch[1]}/preview`
    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`
    return null
}

export default function StudentPage() {
    const [form, setForm] = useState({ nombre: '', carnet: '', url: '' })
    const [preview, setPreview] = useState(null)
    const [status, setStatus] = useState(null) // 'success' | 'error' | 'loading'
    const [error, setError] = useState('')

    const handleChange = (e) => {
        const { name, value } = e.target
        setForm(prev => ({ ...prev, [name]: value }))
        if (name === 'url') {
            setPreview(getEmbedUrl(value))
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!form.nombre.trim() || !form.carnet.trim() || !form.url.trim()) {
            setError('Por favor completa todos los campos.')
            return
        }
        if (!getEmbedUrl(form.url)) {
            setError('El enlace no parece ser de YouTube, Google Drive o Vimeo.')
            return
        }
        setError('')
        setStatus('loading')
        try {
            await addDoc(collection(db, 'videos'), {
                nombre: form.nombre.trim(),
                carnet: form.carnet.trim(),
                url: form.url.trim(),
                embedUrl: getEmbedUrl(form.url),
                notas: {},
                createdAt: serverTimestamp(),
            })
            setStatus('success')
            setForm({ nombre: '', carnet: '', url: '' })
            setPreview(null)
        } catch (err) {
            console.error(err)
            setStatus('error')
        }
    }

    return (
        <div className="page-wrapper">
            <div className="page-header">
                <h1>📤 Enviar mi Video</h1>
                <p>Pega el enlace de tu video de la actividad Neurodesarrollo</p>
            </div>

            <div className="submit-card">
                <div className="card">
                    {status === 'success' && (
                        <div className="alert alert-success">
                            ✅ ¡Video enviado con éxito! Ya puedes verlo en la galería.
                        </div>
                    )}
                    {status === 'error' && (
                        <div className="alert alert-error">
                            ❌ Ocurrió un error. Verifica tu conexión e intenta de nuevo.
                        </div>
                    )}
                    {error && <div className="alert alert-error">⚠️ {error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Nombre Completo</label>
                            <input
                                id="nombre"
                                className="form-control"
                                name="nombre"
                                placeholder="Ej. María González López"
                                value={form.nombre}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Indique el número de su grupo</label>
                            <input
                                id="carnet"
                                className="form-control"
                                name="carnet"
                                placeholder="Ej. Grupo 1"
                                value={form.carnet}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Enlace del Video</label>
                            <input
                                id="url"
                                className="form-control"
                                name="url"
                                placeholder="YouTube, Google Drive o Vimeo"
                                value={form.url}
                                onChange={handleChange}
                                required
                            />
                            <div style={{ marginTop: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                Formatos aceptados: YouTube, Google Drive, Vimeo
                            </div>
                        </div>

                        {preview && (
                            <div className="form-group">
                                <label>Vista Previa</label>
                                <div className="video-preview">
                                    <iframe
                                        src={preview}
                                        title="Vista previa"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                </div>
                            </div>
                        )}

                        <button
                            id="submit-video-btn"
                            className="btn btn-primary"
                            type="submit"
                            disabled={status === 'loading'}
                            style={{ width: '100%', marginTop: '0.5rem' }}
                        >
                            {status === 'loading' ? '⏳ Enviando...' : '🚀 Enviar Video'}
                        </button>
                    </form>
                </div>

                <div className="alert alert-info" style={{ marginTop: '1rem' }}>
                    💡 Asegúrate de que tu video sea <strong>público o accesible con el enlace</strong> para que los docentes y compañeros puedan verlo.
                </div>
            </div>
        </div>
    )
}
