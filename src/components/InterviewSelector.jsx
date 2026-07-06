import React, { useState, useEffect } from 'react';
import CvUpload from './CvUpload';
import { useBilling } from '../context/BillingContext';
import UpgradeModal from './UpgradeModal';
import Loader from './Loader';

export default function InterviewSelector({ onSelect }) {
  const [categories, setCategories] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Flow State: 'category' | 'template' | 'cv'
  const [step, setStep] = useState('category');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { credits } = useBilling();

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
    if (credits <= 0) {
      setShowUpgradeModal(true);
      return;
    }

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
    if (!catName) return 'ph-book';
    const name = catName.toLowerCase();
    if (name.includes('computer') || name.includes('cse')) return 'ph-code';
    if (name.includes('civil')) return 'ph-hard-hat';
    if (name.includes('mba') || name.includes('pgdm')) return 'ph-trend-up';
    if (name.includes('gov') || name.includes('public')) return 'ph-bank';
    if (name.includes('art')) return 'ph-palette';
    return 'ph-book';
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
    return <Loader text="Loading templates..." fullScreen={false} />;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 relative">
      <UpgradeModal 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)} 
      />
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm flex items-center gap-2">
          <i className="ph ph-warning-circle text-xl"></i>
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: SELECT CATEGORY */}
      {step === 'category' && (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              Choose Interview Domain
            </h2>
            <p className="text-gray-500 max-w-md mx-auto text-sm">
              Select your career domain to view tailored adaptive assessments templates.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat.category_name)}
                className="bg-white p-6 rounded-2xl border border-gray-100 hover:border-teal-200 flex items-start gap-4 shadow-sm hover:shadow-md transition-all duration-300 text-left cursor-pointer group"
              >
                <div className="p-3.5 bg-teal-50 rounded-xl text-teal-600 group-hover:bg-teal-100 transition-all">
                  <i className={`ph ${getCategoryIcon(cat.category_name)} text-[28px]`}></i>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900 group-hover:text-teal-600 transition-colors">
                    {cat.category_name}
                  </h3>
                  <p className="text-xs text-gray-500 font-medium leading-relaxed mt-1">
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
              className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-teal-600 transition-colors cursor-pointer"
            >
              <i className="ph ph-arrow-left text-[18px]"></i>
              Back to Domains
            </button>
            <span className="text-xs font-bold bg-gray-50 border border-gray-200 px-3 py-1 rounded-full text-gray-600">
              Domain: {selectedCategory}
            </span>
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              Select Target Role
            </h2>
            <p className="text-gray-500 max-w-md mx-auto text-sm">
              Each template contains specific guidelines and focuses on key skills.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 mt-8">
            {filteredTemplates.length === 0 ? (
              <div className="text-center p-12 bg-white rounded-2xl border border-gray-100 text-gray-400">
                <i className="ph ph-file-search text-[48px] text-gray-300 mb-2"></i>
                <p className="font-medium">No active interview templates found in this category.</p>
              </div>
            ) : (
              filteredTemplates.map((temp) => (
                <div
                  key={temp.id}
                  className="bg-white p-6 rounded-2xl border border-gray-100 hover:border-teal-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <div className="space-y-2 max-w-xl text-left">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-lg text-gray-900">{temp.name}</h3>
                      {temp.company_name && (
                        <span className="text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded">
                          {temp.company_name}
                        </span>
                      )}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border capitalize ${
                        temp.difficulty_level === 'hard' 
                          ? 'bg-red-50 text-red-600 border-red-200' 
                          : temp.difficulty_level === 'medium'
                          ? 'bg-orange-50 text-orange-600 border-orange-200'
                          : 'bg-green-50 text-green-600 border-green-200'
                      }`}>
                        {temp.difficulty_level}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-gray-500 leading-relaxed">
                      {temp.description || 'Practice adaptively with interactive AI assessors.'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleTemplateSelect(temp)}
                    className="bg-[#0E3386] text-white font-bold text-sm py-3 px-5 rounded-xl transition-all duration-300 hover:-translate-y-0.5 shadow-[0_0_15px_rgba(14,51,134,0.2)] hover:shadow-[0_0_25px_rgba(14,51,134,0.4)] flex items-center justify-center gap-2 shrink-0"
                  >
                    <span>{temp.requires_cv ? 'Upload CV & Start' : 'Start Session'}</span>
                    <i className="ph ph-play-circle text-[18px]"></i>
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
              className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-teal-600 transition-colors cursor-pointer"
            >
              <i className="ph ph-arrow-left text-[18px]"></i>
              Back to Roles
            </button>
            <span className="text-xs font-bold bg-primary/10 border border-primary/20 px-3 py-1 rounded-full text-primary">
              Role: {selectedTemplate?.name}
            </span>
          </div>

          <div className="w-full max-w-md mx-auto bg-white border border-gray-100 p-8 rounded-3xl shadow-lg relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-primary via-primary-container to-primary"></div>
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
