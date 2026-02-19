import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import API from '../api/axios';

const CourseContent = () => {
    const { id } = useParams();
    const { user } = useContext(AuthContext);

    const [materials, setMaterials] = useState([]);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [file, setFile] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        const fetchMaterials = async () => {
            const res = await API.get(`/Courses/${id}/materials`);
            setMaterials(res.data);
        };
        fetchMaterials();
    }, [id]);

    const handleUpload = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        if (file) formData.append('file', file);

        try {
            await API.post(`/Courses/${id}/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            alert('Posted successfully!');
            setTitle('');
            setDescription('');
            setFile(null);

            const res = await API.get(`/Courses/${id}/materials`);
            setMaterials(res.data);
        } catch {
            alert('Upload failed');
        }
    };

    const renderPreview = (material) => {
        if (!material.fileUrl) return null;
        const url = `https://localhost:7096${material.fileUrl}`;
        const extension = material.fileName.split('.').pop().toLowerCase();

        if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) {
            return (
                <div className="file-preview file-preview-image">
                    <img src={url} alt="preview" />
                </div>
            );
        }

        if (extension === 'pdf') {
            return (
                <div className="file-preview file-preview-pdf">
                    <iframe src={url} title="pdf-preview" />
                    <p className="file-preview-note">
                        <a href={url} target="_blank" rel="noreferrer">
                            Open PDF in full screen ↗
                        </a>
                    </p>
                </div>
            );
        }

        return (
            <div className="file-preview file-preview-other">
                📎 <a href={url} target="_blank" rel="noreferrer" download>
                    Download: {material.fileName}
                </a>
                <p className="file-preview-note">(Office files must be downloaded to view)</p>
            </div>
        );
    };

    if (!user) return <div className="dashboard-container">Loading...</div>;

    return (
        <div className="dashboard-container">
            <div className="header-strip course-content-header">
                <button onClick={() => navigate('/dashboard')} className="btn-action">
                    ← Back
                </button>
                <h2>Course Stream</h2>
            </div>

            {user.role === 'Teacher' && (
                <form onSubmit={handleUpload} className="user-info-card course-content-form">
                    <h3>Post Announcement or Material</h3>

                    <input
                        className="form-input"
                        placeholder="Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />

                    <textarea
                        className="form-input"
                        placeholder="Announcement Details"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />

                    <input
                        type="file"
                        onChange={(e) => setFile(e.target.files[0])}
                        className="file-input"
                    />

                    <button type="submit" className="btn-approve">
                        Post to Stream
                    </button>
                </form>
            )}

            <div className="admin-section">
                <h3>Class Feed</h3>

                {materials.length === 0 ? (
                    <p>Nothing posted yet.</p>
                ) : (
                    materials.map((m) => (
                        <div key={m.id} className="user-info-card course-material-card">
                            <div className="course-material-header">
                                <h4>{m.title}</h4>
                                <small>{new Date(m.createdAt).toLocaleDateString()}</small>
                            </div>

                            <p>{m.description}</p>

                            {renderPreview(m)}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default CourseContent;
