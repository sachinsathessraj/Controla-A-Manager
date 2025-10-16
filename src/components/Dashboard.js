// Dashboard.jsx
import React, { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import './Dashboard.css';

// --- URL resolver with validation (prevents "Invalid URL") ---
function resolveN8nUrl() {
  const candidates = [
    (process.env.REACT_APP_N8N_URL || '').trim(),   // CRA
    (import.meta?.env?.VITE_N8N_URL || '').trim(),  // Vite
    (process.env.NEXT_PUBLIC_N8N_URL || '').trim(), // Next.js
    'http://localhost:5678/webhook/image-compliance', // dev fallback
  ].filter(Boolean);

  const raw = candidates[0];
  let u;
  try {
    u = new URL(raw);
  } catch {
    throw new Error(
      `Invalid N8N URL "${raw}". Set REACT_APP_N8N_URL / VITE_N8N_URL / NEXT_PUBLIC_N8N_URL to your PRODUCTION webhook, e.g. https://<workspace>.n8n.cloud/webhook/image-compliance`
    );
  }
  if (!/^https?:$/.test(u.protocol)) {
    throw new Error('N8N URL must start with http:// or https://');
  }
  if (u.pathname.includes('/webhook-test/')) {
    throw new Error(
      'You are using an n8n TEST URL. Use the PRODUCTION webhook URL (Webhook node → Production URL).'
    );
  }
  return u.toString();
}

export default function Dashboard() {
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef();

  // Revoke any temp object URLs on unmount
  useEffect(() => {
    return () => {
      if (report?.previewUrl?.startsWith('blob:')) URL.revokeObjectURL(report.previewUrl);
    };
  }, [report]);

  // --- helpers ---
  function getImageDims(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const dims = { width: img.naturalWidth, height: img.naturalHeight };
        URL.revokeObjectURL(url);
        resolve(dims);
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  function postFormDataWithProgress(formData, onProgress) {
    return new Promise((resolve, reject) => {
      // Use environment variable or default to local development server
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5678/webhook/image-compliance';
      
      const xhr = new XMLHttpRequest();
      xhr.open('POST', apiUrl, true);
      xhr.setRequestHeader('Accept', 'application/json');

      xhr.upload.onprogress = (evt) => {
        if (evt.lengthComputable && typeof onProgress === 'function') {
          const pct = Math.round((evt.loaded / evt.total) * 100);
          onProgress(pct);
        }
      };

      xhr.onload = () => {
        try {
          const response = JSON.parse(xhr.responseText || '{}');
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(response);
          } else {
            reject(new Error(response.message || `Upload failed (${xhr.status})`));
          }
        } catch (e) {
          reject(new Error('Invalid server response'));
        }
      };

      xhr.onerror = () => {
        reject(new Error('Network error. Make sure the backend server is running.'));
      };

      xhr.ontimeout = () => {
        reject(new Error('Request timed out'));
      };

      xhr.send(formData);
    });
  }

  // --- main call to n8n ---
  const analyzeImage = async (file) => {
    // infer format
    const byExt = (file.name.split('.').pop() || '').toLowerCase();
    const mime = file.type || '';
    const format =
      byExt ||
      (mime.includes('jpeg') ? 'jpg'
        : mime.includes('png') ? 'png'
        : mime.includes('gif') ? 'gif'
        : mime.includes('tiff') ? 'tiff'
        : '');

    const { width, height } = await getImageDims(file);

    const formData = new FormData();
    formData.append('file', file);                 // MUST be "file" to match n8n Webhook Binary Property
    formData.append('filename', file.name);
    formData.append('format', format);
    formData.append('width', String(width));
    formData.append('height', String(height));
    formData.append('isMainImage', 'true');
    formData.append('title', '');                  // optional; wire to inputs if you add them
    formData.append('category', '');               // optional
    formData.append('timestamp', new Date().toISOString());

    const json = await postFormDataWithProgress(formData, setUploadProgress);
    // expected from n8n: { compliance, issues[], warnings[], metrics{}, meta{} }

    return {
      id: `report-${uuidv4()}`,
      status: 'completed',
      compliance: json.compliance || 'FAIL',
      issues: Array.isArray(json.issues) ? json.issues : [],
      warnings: Array.isArray(json.warnings) ? json.warnings : [],
      metrics: json.metrics || {},
      meta: json.meta || {},
      rawResponse: json,
    };
  };

  // --- UI handlers ---
  const processImage = async (file) => {
    setError(null);
    setReport(null);
    setUploadProgress(0);

    if (!file?.type?.match(/^image\/(jpeg|png|gif|tiff?)$/)) {
      setError('Please upload a valid image file (JPEG, PNG, GIF, TIFF)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB limit');
      return;
    }

    const previewUrl = URL.createObjectURL(file);

    try {
      setIsAnalyzing(true);
      const result = await analyzeImage(file);
      setReport({ ...result, previewUrl });
    } catch (err) {
      console.error(err);
      setReport({
        id: `report-${uuidv4()}`,
        status: 'error',
        compliance: 'FAIL',
        issues: [{ code: 'NETWORK', message: err.message || 'Failed to analyze image' }],
        warnings: [],
        metrics: {},
        meta: {},
        previewUrl,
      });
      setError(err.message || 'Failed to analyze image');
    } finally {
      setIsAnalyzing(false);
      setUploadProgress(0);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files?.length) await processImage(files[0]);
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (file) await processImage(file);
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Image Compliance Analyzer</h1>
        <p>Upload product images to check Amazon compliance requirements</p>
      </header>

      <div
        className={`upload-zone ${isDragging ? 'drag-active' : ''}`}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => !isAnalyzing && fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/jpeg,image/png,image/gif,image/tiff"
          style={{ display: 'none' }}
          disabled={isAnalyzing}
        />

        {isAnalyzing ? (
          <div className="upload-progress">
            <div className="progress-bar" style={{ width: `${uploadProgress}%` }} />
            <div className="progress-text">
              {uploadProgress < 100 ? `Uploading... ${uploadProgress}%` : 'Processing image...'}
            </div>
          </div>
        ) : (
          <div className="upload-prompt">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            <p>Drag & drop an image here, or click to select</p>
            <p className="file-types">Supports: JPG, PNG, GIF, TIFF (max 10MB)</p>
          </div>
        )}

        {error && (
          <div className="error-message">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            {error}
          </div>
        )}
      </div>

      {report && (
        <div className="analysis-results">
          <h2>Analysis Results</h2>
          <div className="report-summary">
            <div className="image-preview">
              <img src={report.previewUrl} alt="Uploaded preview" />
            </div>

            <div className="check-results">
              <div className={`badge ${(report.issues?.length > 0 || report.warnings?.length > 0) ? 'fail' : 'pass'}`}>
                {(report.issues?.length > 0 || report.warnings?.length > 0) ? 'FAIL' : 'PASS'}
              </div>

              <div className="results-container">
                {report.issues?.length > 0 && (
                  <div className="check-category issues">
                    <h3>
                      <span className="status-badge fail">Issues</span>
                      <span className="count-badge">{report.issues.length} found</span>
                    </h3>
                    <div className="check-list">
                      {report.issues.map((i, idx) => (
                        <div key={`issue-${i.code}-${idx}`} className="check-item fail">
                          <div className="check-header">
                            <span className="check-status">
                              <svg className="icon" viewBox="0 0 24 24" width="16" height="16">
                                <path fill="currentColor" d="M12,2C6.48,2 2,6.48 2,12s4.48,10 10,10 10-4.48 10-10S17.52,2 12,2zm1,15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                              </svg>
                              Issue
                            </span>
                            <span className="check-code">{i.code}</span>
                          </div>
                          <div className="check-message">{i.message}</div>
                          {i.details && (
                            <div className="check-details">
                              {typeof i.details === 'object' ? (
                                <pre>{JSON.stringify(i.details, null, 2)}</pre>
                              ) : (
                                i.details
                              )}
                            </div>
                          )}
                          {i.suggestion && (
                            <div className="check-suggestion">
                              <strong>Suggestion:</strong> {i.suggestion}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {report.warnings?.length > 0 && (
                  <div className="check-category warnings">
                    <h3>
                      <span className="status-badge fail">Warnings</span>
                      <span className="count-badge">{report.warnings.length} found</span>
                    </h3>
                    <div className="check-list">
                      {report.warnings.map((w, idx) => (
                        <div key={`warn-${w.code}-${idx}`} className="check-item fail">
                          <div className="check-header">
                            <span className="check-status">
                              <svg className="icon" viewBox="0 0 24 24" width="16" height="16">
                                <path fill="currentColor" d="M12,2C6.48,2 2,6.48 2,12s4.48,10 10,10 10-4.48 10-10S17.52,2 12,2zm1,15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                              </svg>
                              Issue
                            </span>
                            <span className="check-code">{w.code}</span>
                          </div>
                          <div className="check-message">{w.message}</div>
                          {w.details && (
                            <div className="check-details">
                              {typeof w.details === 'object' ? (
                                <pre>{JSON.stringify(w.details, null, 2)}</pre>
                              ) : (
                                w.details
                              )}
                            </div>
                          )}
                          {w.suggestion && (
                            <div className="check-suggestion">
                              <strong>Suggestion:</strong> {w.suggestion}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Optional: show metrics for debugging */}
              {report.metrics && Object.keys(report.metrics).length > 0 && (
                <div className="metrics">
                  <h4>Metrics</h4>
                  <pre>{JSON.stringify(report.metrics, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
