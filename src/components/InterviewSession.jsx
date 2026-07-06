import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import WebcamFeed from './WebcamFeed';
import ProctorGuard from './ProctorGuard';

import { useNotification } from '../context/NotificationContext';

export default function InterviewSession({ interview, session, cvText, onEnd }) {
  const { addNotification } = useNotification();
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]); // { role: 'ai' | 'user', text: string, type: 'question' | 'report' | 'answer' }
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(true);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [reportData, setReportData] = useState(null);
  
  const [metrics, setMetrics] = useState({
    tab_switch_count: 0,
    fullscreen_exit_count: 0,
    face_missing_count: 0
  });
  
  const recognitionRef = useRef(null);
  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);
  const baseTranscriptRef = useRef('');
  const transcriptRef = useRef('');
  const audioContextRef = useRef(null);
  const sourceNodeRef = useRef(null);

  // Keep ref synced
  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  // Request fullscreen and hide sidebar on mount
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('toggle-sidebar', { detail: false }));
    
    const el = document.documentElement;
    if (el.requestFullscreen) {
      el.requestFullscreen().catch(err => {
        console.warn("Browser blocked auto-fullscreen:", err.message);
      });
    }
    
    return () => {
      window.dispatchEvent(new CustomEvent('toggle-sidebar', { detail: true }));
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(err => console.warn(err));
      }
    };
  }, []);

  // Auto-scroll chat window
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize message input area
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '50px';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = Math.max(50, Math.min(scrollHeight, 200)) + 'px';
    }
  }, [transcript]);

  // Initialize browser speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      let lastProcessedIndex = -1;

      recognition.onresult = (event) => {
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            if (i > lastProcessedIndex) {
              const base = baseTranscriptRef.current.trim();
              const piece = event.results[i][0].transcript.trim();
              baseTranscriptRef.current = base + (base && piece ? ' ' : '') + piece;
              lastProcessedIndex = i;
            }
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        const base = baseTranscriptRef.current.trim();
        const interim = interimTranscript.trim();
        const separator = base && interim ? ' ' : '';
        
        setTranscript(base + separator + interim);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        baseTranscriptRef.current = transcriptRef.current;
        lastProcessedIndex = -1;
      };

      recognitionRef.current = recognition;
    } else {
      console.warn("Speech Recognition API is not supported in this browser.");
    }
  }, []);

  // Text-To-Speech (TTS) playback via backend api
  const speakAudio = async (text) => {
    try {
      if (sourceNodeRef.current) {
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
      }

      setIsSpeaking(true);

      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: text,
          voice_gender: interview.voice_gender || 'neutral'
        })
      });

      if (!response.ok) {
        console.error("Backend TTS failed, falling back to browser synthesis");
        fallbackBrowserSpeak(text);
        return;
      }

      const arrayBuffer = await response.arrayBuffer();
      
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }

      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      sourceNodeRef.current = source;

      source.onended = () => {
        setIsSpeaking(false);
      };

      source.start(0);
    } catch (err) {
      console.error("ElevenLabs TTS error:", err);
      fallbackBrowserSpeak(text);
    }
  };

  const fallbackBrowserSpeak = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const engVoice = voices.find(v => v.lang.includes('en-US') || v.lang.includes('en-GB'));
    if (engVoice) {
      utterance.voice = engVoice;
    }
    
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    window.speechSynthesis.resume();
    window.speechSynthesis.speak(utterance);
  };

  // Socket Connection and Events Handling
  useEffect(() => {
    // Determine backend URL - empty string uses current domain (and vite proxy locally)
    const backendUrl = import.meta.env.DEV ? '' : 'https://vivasaarthi-backend.onrender.com';
    
    // Connect directly to backend server
    const newSocket = io(backendUrl, {
      transports: ['websocket'], // MANDATORY FOR RENDER (skips long-polling)
      upgrade: false
    });

    newSocket.on('connect', () => {
      console.log('Connected to interview socket');
      // Begin session
      newSocket.emit('start_interview', { 
        session_id: session.id,
        cv_text: cvText 
      });
    });

    newSocket.on('question', (data) => {
      console.log('Received question data:', data);
      setIsProcessing(false);
      setMessages(prev => [...prev, { role: 'ai', text: data.clean_text, type: 'question' }]);
      speakAudio(data.clean_text);
    });

    newSocket.on('report', (data) => {
      console.log('Received report data:', data);
      setIsProcessing(false);
      setReportData(data);
      speakAudio(data.spoken_remarks || "The interview has concluded. Here is your summary.");
    });

    newSocket.on('error', (err) => {
      console.error('Socket error event:', err);
      setIsProcessing(false);
      alert('Error: ' + err.message);
    });

    setSocket(newSocket);

    return () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      if (sourceNodeRef.current) sourceNodeRef.current.stop();
      if (recognitionRef.current) recognitionRef.current.stop();
      newSocket.disconnect();
    };
  }, [session.id, cvText]);

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      baseTranscriptRef.current = transcriptRef.current;
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleEndInterviewClick = async () => {
    try {
      setIsProcessing(true);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/interview/end', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          session_id: session.id,
          tab_switch_count: metrics.tab_switch_count,
          fullscreen_exit_count: metrics.fullscreen_exit_count,
          face_missing_count: metrics.face_missing_count
        })
      });
      if (res.ok) {
        addNotification('Credits updated after session', 'success');
      }
    } catch (err) {
      console.error('Failed to end interview:', err);
    } finally {
      setIsProcessing(false);
      onEnd();
    }
  };

  const handleSendAnswer = () => {
    if (!transcript.trim()) return;
    
    const answer = transcript.trim();
    setMessages(prev => [...prev, { role: 'user', text: answer, type: 'answer' }]);
    
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }
    
    setTranscript('');
    baseTranscriptRef.current = '';
    transcriptRef.current = '';
    setIsProcessing(true);
    socket.emit('answer', { answer });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendAnswer();
    }
  };

  // Basic regex markdown to HTML helper
  const renderReportMarkdown = (md) => {
    if (!md) return null;
    let html = md
      .replace(/^## (.*$)/gim, '<h3 class="text-lg font-bold text-[#0E3386] mt-6 mb-2 pb-1 border-b border-gray-200">$1</h3>')
      .replace(/^# (.*$)/gim, '<h2 class="text-xl font-bold text-[#0E3386] mt-8 mb-3">$1</h2>')
      .replace(/^\* (.*$)/gim, '<li class="ml-4 list-disc text-sm text-gray-700 my-1">$1</li>')
      .replace(/^- (.*$)/gim, '<li class="ml-4 list-disc text-sm text-gray-700 my-1">$1</li>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-gray-900 font-bold">$1</strong>')
      .replace(/\n/g, '<br />');

    return (
      <div 
        dangerouslySetInnerHTML={{ __html: html }} 
        className="leading-relaxed text-left text-sm text-gray-700 space-y-1.5"
      />
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 relative px-4">
      {/* Active Proctoring Guard */}
      <ProctorGuard 
        isActive={!reportData} 
        onViolation={(type) => {
          if (type === 'tab_switch' || type === 'window_blur') {
            setMetrics(prev => ({ ...prev, tab_switch_count: prev.tab_switch_count + 1 }));
          } else if (type === 'fullscreen_exit') {
            setMetrics(prev => ({ ...prev, fullscreen_exit_count: prev.fullscreen_exit_count + 1 }));
          }
        }}
        onAutoTerminate={(reason) => {
          alert(reason);
          handleEndInterviewClick();
        }} 
      />
      
      {/* Floating Webcam window */}
      <WebcamFeed 
        isActive={!reportData} 
        onCameraReady={(ready) => setIsCameraReady(ready)}
        onFrameCapture={(frameData) => {
          if (socket && !isProcessing && !reportData) {
            socket.emit('receive_frame', { frame_data: frameData });
          }
        }} 
      />



      {/* Final Summary Report Overlay */}
      {reportData && (
        <div className="fixed inset-0 z-[60] bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-gray-100 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-[scaleUp_0.3s_ease-out]">
            {/* Report Header */}
            <div className="p-6 bg-gray-50 border-b border-gray-100 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#0E3386]/10 flex items-center justify-center text-[#0E3386]">
                <span className="material-symbols-outlined text-[28px]">emoji_events</span>
              </div>
              <div className="text-left">
                <h3 className="text-xl font-bold text-gray-900">Interview Completed!</h3>
                <p className="text-xs text-gray-500 mt-0.5">Here is your tailored evaluation report.</p>
              </div>
            </div>

            {/* Report Data Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Score breakdown metrics */}
              {reportData.scores && (
                <div className="grid grid-cols-3 gap-4 border-b border-gray-100 pb-6">
                  <div className="bg-gray-50 p-4 rounded-xl text-center border border-gray-100 shadow-sm">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Overall Score</span>
                    <span className="text-2xl font-bold text-[#0E3386] block mt-1">{reportData.scores.overall || 0}/100</span>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl text-center border border-gray-100 shadow-sm">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Technical</span>
                    <span className="text-2xl font-bold text-[#0E3386] block mt-1">{reportData.scores.technical || 0}/100</span>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl text-center border border-gray-100 shadow-sm">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Communication</span>
                    <span className="text-2xl font-bold text-[#0E3386] block mt-1">{reportData.scores.communication || 0}/100</span>
                  </div>
                </div>
              )}

              {/* Text feedback */}
              <div className="space-y-4">
                {renderReportMarkdown(reportData.text)}
              </div>
            </div>

            {/* Close action */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button 
                onClick={handleEndInterviewClick}
                className="bg-[#0E3386] hover:bg-[#0E3386]/90 text-white font-bold text-sm py-3 px-8 rounded-xl transition-all duration-300 cursor-pointer flex items-center gap-2 shadow-[0_4px_12px_rgba(14,51,134,0.2)]"
              >
                <span>Return to Dashboard</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Arena Box */}
      <div className="w-full flex flex-col h-[75vh] bg-gradient-to-br from-[#f8ebfb] via-[#e8f1ff] to-[#f4ebf8] border border-white/60 rounded-[32px] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.08)] relative">
        {/* Decorative background glows */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-[#fce0ff] mix-blend-multiply filter blur-[80px] opacity-60"></div>
          <div className="absolute top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-[#d0e1ff] mix-blend-multiply filter blur-[80px] opacity-60"></div>
        </div>

        {/* Arena Header */}
        <div className="px-6 py-4 flex justify-between items-center z-10 border-b border-white/30 bg-white/30 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 bg-[#8b5cf6] rounded-full animate-ping" />
            <h2 className="font-bold text-base text-gray-800 tracking-wide">{interview.name}</h2>
          </div>
          <button 
            onClick={handleEndInterviewClick}
            className="flex items-center gap-1.5 px-4 py-2 bg-white/60 hover:bg-white text-gray-700 rounded-full font-bold text-xs transition-all cursor-pointer shadow-sm border border-white/50 hover:shadow-md"
          >
            <span className="material-symbols-outlined text-[16px] text-red-500">cancel</span>
            <span>Abort Session</span>
          </button>
        </div>

        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col z-10 relative scrollbar-hide">
          {/* Empty State / Welcome Screen */}
          {messages.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center animate-[fadeIn_0.8s_ease-out] z-0">
              <div className="text-center mb-6">
                <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">
                  Meet your AI Coach <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8b5cf6] to-[#6366f1]">VivaSaarthi</span>
                </h2>
              </div>
              
              <div className="relative group">
                {/* Thought bubble */}
                <div className="absolute -top-12 -right-8 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-2xl rounded-bl-none shadow-xl border border-white/50 text-sm font-bold text-gray-700 animate-bounce z-10">
                  Need Any Help?
                  <div className="absolute -bottom-2 left-2 w-3 h-3 bg-white/90 transform rotate-45 border-b border-r border-transparent"></div>
                </div>
                
                {/* Robot Image */}
                <img 
                  src="/robot.png" 
                  alt="AI Robot" 
                  className="w-56 h-56 object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.15)] transition-transform duration-500 group-hover:scale-105 relative z-0"
                />
              </div>
            </div>
          )}

          {messages.map((msg, index) => (
            <div 
              key={index}
              className={`max-w-[75%] p-4 rounded-3xl leading-relaxed text-left text-sm shadow-md border ${
                msg.role === 'user' 
                  ? 'self-end bg-gradient-to-r from-[#8b5cf6] to-[#6366f1] border-transparent text-white rounded-br-sm' 
                  : 'self-start bg-white/80 backdrop-blur-md border-white/50 text-gray-800 rounded-bl-sm'
              }`}
            >
              {msg.text}
            </div>
          ))}

          {isProcessing && (
            <div className="self-start flex items-center gap-3 bg-white/80 backdrop-blur-md border border-white/50 p-4 rounded-3xl rounded-bl-sm shadow-md">
              <span className="text-xs text-gray-500 font-medium">VivaSaarthi is typing...</span>
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-[#8b5cf6] rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                <span className="w-1.5 h-1.5 bg-[#8b5cf6] rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                <span className="w-1.5 h-1.5 bg-[#8b5cf6] rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
              </div>
            </div>
          )}
          <div ref={chatEndRef} className="h-4" />
        </div>

        {/* Dynamic AI pulse ring (visual avatar in corner when chatting) */}
        {(messages.length > 0 || isSpeaking) && (
          <div className={`absolute right-6 top-24 w-16 h-16 rounded-full bg-white/40 backdrop-blur-xl border border-white/60 flex items-center justify-center z-20 shadow-xl transition-all duration-500 ${isSpeaking ? 'animate-pulse ring-4 ring-[#8b5cf6]/40' : ''}`}>
             <img src="/robot.png" alt="AI Avatar" className="w-12 h-12 object-contain" />
          </div>
        )}

        {/* Input Control Console */}
        <div className="p-6 z-20 w-full flex justify-center bg-gradient-to-t from-white/40 to-transparent">
          <div className="w-full max-w-3xl flex items-end gap-3 bg-white/70 backdrop-blur-2xl border border-white/60 p-2 rounded-[32px] shadow-[0_8px_32px_rgba(0,0,0,0.06)] transition-all hover:bg-white/80">
            <button 
              onClick={toggleListen}
              disabled={isProcessing}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 flex-shrink-0 cursor-pointer ${
                isListening 
                  ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)] text-white scale-105' 
                  : 'bg-white hover:bg-gray-50 text-gray-400 hover:text-[#8b5cf6] shadow-sm'
              }`}
              title={isListening ? "Mute Microphone" : "Unmute Microphone"}
            >
              <span className="material-symbols-outlined text-[24px]">
                {isListening ? 'mic_off' : 'mic'}
              </span>
            </button>

            <textarea
              ref={textareaRef}
              value={transcript}
              onChange={(e) => {
                setTranscript(e.target.value);
                baseTranscriptRef.current = e.target.value;
              }}
              onKeyDown={handleKeyDown}
              placeholder={isListening ? "Listening..." : "Type your answer..."}
              disabled={isProcessing}
              className="flex-1 bg-transparent py-3 px-4 text-sm text-gray-800 placeholder:text-gray-500 focus:outline-none resize-none h-[48px] overflow-y-auto font-medium"
            />

            <button 
              onClick={handleSendAnswer}
              disabled={!transcript.trim() || isProcessing}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 flex-shrink-0 ${
                (!transcript.trim() || isProcessing) 
                  ? 'bg-gray-100 text-gray-300 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-[#8b5cf6] to-[#6366f1] text-white hover:scale-105 shadow-[0_4px_15px_rgba(139,92,246,0.3)] cursor-pointer'
              }`}
            >
              <span className="material-symbols-outlined text-[20px] font-bold transform -rotate-45 ml-1">send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
