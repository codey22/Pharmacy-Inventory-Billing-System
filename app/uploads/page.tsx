'use client';

import { useState } from 'react';
import styles from './uploads.module.css';

export default function UploadsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setUploadedUrl(null);
    setError(null);
    if (f && f.type !== 'application/pdf') {
      setError('Please select a PDF file.');
      setFile(null);
      return;
    }
    setFile(f || null);
  };

  const onUpload = async () => {
    if (!file) {
      setError('Select a PDF to upload.');
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/uploads', {
        method: 'POST',
        body: form,
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'Upload failed');
      }
      const data: { url: string } = await res.json();
      setUploadedUrl(data.url);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className="card">
        <h2>Upload PDF</h2>
        <p className="muted-text">Upload and store PDF documents.</p>

        <div className={styles.fieldRow}>
          <input
            type="file"
            accept="application/pdf"
            onChange={onFileChange}
          />
          <button
            className="btn btn-primary"
            onClick={onUpload}
            disabled={uploading}
            title="Upload PDF"
          >
            {uploading ? 'Uploading…' : 'Upload'}
          </button>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        {uploadedUrl && (
          <div className={styles.result}>
            <span>Uploaded:</span>
            <a href={uploadedUrl} target="_blank" rel="noreferrer">
              {uploadedUrl}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

