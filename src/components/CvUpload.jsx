import React, { useState, useRef } from 'react';

export default function CvUpload({ onUploadSuccess, onSkip, canSkip = false }) {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [successData, setSuccessData] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const validateAndSetFile = (selectedFile) => {
    setError(null);
    setSuccessData(null);
    
    if (!selectedFile) return;
    
    const validExtensions = ['.pdf', '.docx'];
    const hasValidExt = validExtensions.some(ext => selectedFile.name.toLowerCase().endsWith(ext));
    if (!hasValidExt) {
      setError('Please upload a PDF or DOCX file.');
      return;
    }
    
    if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
      setError('File is too large. Maximum size is 5MB.');
      return;
    }

    setFile(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(10);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch('/api/interview/upload-cv', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to upload CV.');
      }

      const data = await response.json();
      setUploadProgress(100);
      
      setTimeout(() => {
        setIsUploading(false);
        setSuccessData(data);
        if (onUploadSuccess) {
          setTimeout(() => onUploadSuccess(data.cv_text), 1000);
        }
      }, 500);

    } catch (err) {
      setIsUploading(false);
      setUploadProgress(0);
      setError(err.message || 'Failed to upload CV. Please try again.');
    }
  };

  const resetUpload = () => {
    setFile(null);
    setError(null);
    setSuccessData(null);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="w-full flex flex-col gap-4 text-on-surface">
      <div className="text-center space-y-1">
        <h3 className="text-lg font-bold">Upload Your CV</h3>
        <p className="text-sm text-on-surface-variant">
          We'll analyze your resume to ask personalized questions during the interview.
        </p>
      </div>

      {!successData ? (
        <div>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-300 ${
              isDragging ? 'border-primary bg-primary/5 shadow-[0_0_15px_rgba(79,219,200,0.1)]' : 'border-white/10 bg-white/5 hover:bg-white/10'
            } ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.docx"
              className="hidden"
              disabled={isUploading}
            />

            {!file ? (
              <>
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-primary border border-white/10">
                  <span className="material-symbols-outlined text-[28px]">upload</span>
                </div>
                <div className="text-center">
                  <p className="font-bold text-sm">Click or drag file to this area to upload</p>
                  <p className="text-xs text-on-surface-variant mt-1">Supports PDF or DOCX (Max 5MB)</p>
                </div>
              </>
            ) : (
              <div className="w-full flex flex-col gap-3">
                <div className="flex items-center justify-between bg-[#131b2e]/60 border border-white/5 p-3 rounded-xl">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <span className="material-symbols-outlined text-primary text-[28px]">description</span>
                    <div className="flex flex-col overflow-hidden text-left">
                      <span className="text-sm font-bold truncate pr-4">
                        {file.name}
                      </span>
                      <span className="text-xs text-on-surface-variant">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                  </div>
                  {!isUploading && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); resetUpload(); }}
                      className="p-1 text-on-surface-variant hover:text-error transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  )}
                </div>

                {isUploading && (
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="height-full bg-primary transition-all duration-200" 
                      style={{ width: `${uploadProgress}%`, height: '100%' }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 p-3.5 bg-error-container/20 border border-error/30 text-error rounded-xl text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">error</span>
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-4 mt-6">
            {canSkip && (
              <button 
                onClick={onSkip}
                className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-on-surface font-bold py-3 rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-50"
                disabled={isUploading}
              >
                Skip CV
              </button>
            )}
            <button 
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="flex-[2] bg-gradient-to-r from-primary to-primary-container text-on-primary-fixed font-bold py-3 rounded-xl shadow-[0_4px_12px_rgba(20,184,166,0.15)] hover:shadow-[0_6px_20px_rgba(20,184,166,0.3)] transition-all duration-200 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isUploading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-on-primary-fixed" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Parsing Resume...</span>
                </>
              ) : (
                <>
                  <span>Upload & Proceed</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="p-6 bg-primary/5 border border-primary/20 rounded-xl flex flex-col items-center gap-3 text-center animate-pulse">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[28px]">check_circle</span>
          </div>
          <div>
            <h4 className="font-bold text-[#10b981]">Resume Processed</h4>
            <p className="text-xs text-on-surface-variant mt-1">
              Customized context loaded. Initializing assessment...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
