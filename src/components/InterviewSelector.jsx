import React, { useState, useEffect } from 'react';
import CvUpload from './CvUpload';

export default function InterviewSelector({ onSelect }) {
  const [categories, setCategories] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Flow State: 'category' | 'template' | 'cv'
  const [step, setStep] = useState('category');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Fetch categories and templates
  useEffect(() => {
    const fetchData = async () => {
      try {
        const catRes = await fetch('/api/interview/categories');
        const tempRes = await fetch('/api/interview/templates');

        if (!catRes.ok || !tempRes.ok) {
          throw new Error('Failed to load interview metadata from server.');
        }

        const catData = await catRes.json();
        const tempData = await tempRes.json();

        setCategories(catData.categories || []);
        setTemplates(tempData.templates || []);
      } catch (err) {
        console.error('Fetcher error:', err);
        setError(err.message || 'Unable to connect to backend service.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setStep('template');
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    if (template.requires_cv) {
      setStep('cv');
    } else {
      handleStartInterview(template, null);
    }
  };

  const handleStartInterview = async (template, cvText = null) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/interview/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template_id: template.id }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to start interview session.');
      }

      const data = await response.json();
      onSelect(template, data.session, cvText);
    } catch (err) {
      console.error('Session starter error:', err);
      setError(err.message || 'Server error initiating the interview.');
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter(t => t.category === selectedCategory);

  const getCategoryIcon = (catName) => {
    if (!catName) return 'menu_book';
    const name = catName.toLowerCase();
    if (name.includes('computer') || name.includes('cse')) return 'code';
    if (name.includes('civil')) return 'engineering';
    if (name.includes('mba') || name.includes('pgdm')) return 'trending_up';
    if (name.includes('gov') || name.includes('public')) return 'account_balance';
    if (name.includes('art')) return 'palette';
    return 'menu_book';
  };

  const getCategoryDesc = (catName) => {
    if (!catName) return 'General specialized assessments';
    const name = catName.toLowerCase();
    if (name.includes('computer') || name.includes('cse')) return 'Software, DevOps, System Design, Frontend/Backend';
    if (name.includes('civil')) return 'Structural Design, Engineering, Project Planning';
    if (name.includes('mba') || name.includes('pgdm')) return 'Product Management, Business Analysts, Case Rounds';
    if (name.includes('gov') || name.includes('public')) return 'Public Service, Administrative, General Aptitude';
    if (name.includes('art')) return 'Design, Communication, Media Strategy, Content';
    return 'General specialized assessments';
  };

  if (loading && step === 'category') {
    return (
      <div className="w-full flex items-center justify-center p-20 text-primary">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-10 w-10 text-primary" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm font-semibold tracking-wider">Loading templates...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {error && (
        <div className="mb-6 p-4 bg-error-container/20 border border-error/30 text-error rounded-xl text-sm flex items-center gap-2">
          <span className="material-symbols-outlined">error</span>
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: SELECT CATEGORY */}
      {step === 'category' && (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-glow text-primary">
              Choose Interview Domain
            </h2>
            <p className="text-on-surface-variant max-w-md mx-auto text-sm">
              Select your career domain to view tailored adaptive assessments templates.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat.category_name)}
                className="glass-card p-6 rounded-2xl border border-white/5 hover:border-primary/20 flex items-start gap-4 hover:shadow-[0_10px_30px_rgba(79,219,200,0.1)] hover:-translate-y-1 transition-all duration-300 text-left cursor-pointer group"
              >
                <div className="p-3.5 bg-primary/10 rounded-xl text-primary group-hover:bg-primary/20 transition-all">
                  <span className="material-symbols-outlined text-[28px]">{getCategoryIcon(cat.category_name)}</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-on-surface group-hover:text-primary transition-colors">
                    {cat.category_name}
                  </h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed mt-1">
                    {getCategoryDesc(cat.category_name)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 2: SELECT TEMPLATE */}
      {step === 'template' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setStep('category')}
              className="flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Back to Domains
            </button>
            <span className="text-xs font-bold bg-white/5 border border-white/10 px-3 py-1 rounded-full text-on-surface-variant">
              Domain: {selectedCategory}
            </span>
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-glow text-primary">
              Select Target Role
            </h2>
            <p className="text-on-surface-variant max-w-md mx-auto text-sm">
              Each template contains specific guidelines and focuses on key skills.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 mt-8">
            {filteredTemplates.length === 0 ? (
              <div className="text-center p-12 glass-card rounded-2xl border border-white/5 text-on-surface-variant">
                <span className="material-symbols-outlined text-[48px] text-white/20 mb-2">find_in_page</span>
                <p>No active interview templates found in this category.</p>
              </div>
            ) : (
              filteredTemplates.map((temp) => (
                <div
                  key={temp.id}
                  className="glass-card p-6 rounded-2xl border border-white/5 hover:border-primary/20 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-[0_8px_25px_rgba(79,219,200,0.08)] transition-all duration-300"
                >
                  <div className="space-y-2 max-w-xl text-left">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-lg text-on-surface">{temp.name}</h3>
                      {temp.company_name && (
                        <span className="text-[10px] font-bold bg-[#14b8a6]/20 text-primary border border-primary/20 px-2 py-0.5 rounded">
                          {temp.company_name}
                        </span>
                      )}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border capitalize ${
                        temp.difficulty_level === 'hard' 
                          ? 'bg-error-container/20 text-error border-error/20' 
                          : temp.difficulty_level === 'medium'
                          ? 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/20'
                          : 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/20'
                      }`}>
                        {temp.difficulty_level}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      {temp.description || 'Practice adaptively with interactive AI assessors.'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleTemplateSelect(temp)}
                    className="bg-primary hover:bg-primary-container text-on-primary-fixed font-bold text-xs py-3 px-5 rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <span>{temp.requires_cv ? 'Upload CV & Start' : 'Start Session'}</span>
                    <span className="material-symbols-outlined text-[16px]">play_circle</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* STEP 3: UPLOAD CV */}
      {step === 'cv' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setStep('template')}
              className="flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Back to Roles
            </button>
            <span className="text-xs font-bold bg-white/5 border border-white/10 px-3 py-1 rounded-full text-on-surface-variant">
              Role: {selectedTemplate?.name}
            </span>
          </div>

          <div className="w-full max-w-md mx-auto bg-[#131b2e]/60 border border-white/10 p-8 rounded-3xl shadow-xl">
            <CvUpload
              onUploadSuccess={(cvText) => handleStartInterview(selectedTemplate, cvText)}
              onSkip={() => handleStartInterview(selectedTemplate, null)}
              canSkip={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}
