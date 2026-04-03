import { useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { uploadMaterial, deleteMaterial } from '../../api/organizer.js';
import { getEvent } from '../../api/events.js';
import Navbar from '../../components/layout/Navbar.jsx';

const FILE_ICONS = {
  pdf: '📄',
  image: '🖼️',
  presentation: '📊',
  other: '📎',
};

export default function MaterialsPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const fileRef = useRef();

  const { data: event, isLoading } = useQuery({
    queryKey: ['event-organizer', id],
    queryFn: () => getEvent(id).then(r => r.data),
  });

  const uploadMutation = useMutation({
    mutationFn: (file) => uploadMaterial(id, file),
    onSuccess: () => { toast.success('Uploaded!'); queryClient.invalidateQueries(['event-organizer', id]); },
    onError: (err) => toast.error(err.response?.data?.detail || 'Upload failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (matId) => deleteMaterial(id, matId),
    onSuccess: () => { toast.success('Deleted'); queryClient.invalidateQueries(['event-organizer', id]); },
    onError: (err) => toast.error(err.response?.data?.detail || 'Failed'),
  });

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) uploadMutation.mutate(file);
    e.target.value = '';
  };

  const materials = event?.materials || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Event Materials</h1>

        {/* Upload */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Upload File</h2>
          <p className="text-xs text-gray-500 mb-4">Accepted: PDF, images, presentations. Max 20MB.</p>
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png,.gif,.ppt,.pptx"
            onChange={handleFileChange}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploadMutation.isPending}
            className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {uploadMutation.isPending ? 'Uploading…' : 'Choose File'}
          </button>
        </div>

        {/* List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center py-12"><div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : materials.length === 0 ? (
            <p className="text-center text-gray-500 py-12 text-sm">No materials uploaded yet.</p>
          ) : (
            <ul className="divide-y divide-gray-50">
              {materials.map((m) => (
                <li key={m.id} className="flex items-center gap-3 px-5 py-4">
                  <span className="text-2xl">{FILE_ICONS[m.file_type] || FILE_ICONS.other}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{m.original_filename}</p>
                    <p className="text-xs text-gray-500">
                      {m.file_size_bytes ? `${(m.file_size_bytes / 1024 / 1024).toFixed(2)} MB · ` : ''}
                      {m.uploaded_at ? format(new Date(m.uploaded_at), 'MMM d, yyyy') : ''}
                    </p>
                  </div>
                  <a
                    href={`/uploads/${m.file_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline mr-3"
                  >
                    Download
                  </a>
                  <button
                    onClick={() => { if (confirm('Delete this file?')) deleteMutation.mutate(m.id); }}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
