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
    // Connect directly to Flask backend server
    const newSocket = io('http://127.0.0.1:5000', {
      transports: ['websocket', 'polling']
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
        body: JSON.stringify({ session_id: session.id })
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
      .replace(/^## (.*$)/gim, '<h3 class="text-lg font-bold text-primary mt-6 mb-2 pb-1 border-b border-white/5">$1</h3>')
      .replace(/^# (.*$)/gim, '<h2 class="text-xl font-bold text-primary mt-8 mb-3">$1</h2>')
      .replace(/^\* (.*$)/gim, '<li class="ml-4 list-disc text-sm text-on-surface-variant my-1">$1</li>')
      .replace(/^- (.*$)/gim, '<li class="ml-4 list-disc text-sm text-on-surface-variant my-1">$1</li>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>')
      .replace(/\n/g, '<br />');

    return (
      <div 
        dangerouslySetInnerHTML={{ __html: html }} 
        className="leading-relaxed text-left text-sm text-on-surface-variant space-y-1.5"
      />
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 relative px-4">
      {/* Active Proctoring Guard */}
      <ProctorGuard 
        isActive={!reportData} 
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
        <div className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#171f33] border border-primary/30 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-[scaleUp_0.3s_ease-out]">
            {/* Report Header */}
            <div className="p-6 bg-primary/10 border-b border-white/5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[28px]">emoji_events</span>
              </div>
              <div className="text-left">
                <h3 className="text-xl font-bold">Interview Completed!</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">Here is your tailored evaluation report.</p>
              </div>
            </div>

            {/* Report Data Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Score breakdown metrics */}
              {reportData.scores && (
                <div className="grid grid-cols-3 gap-4 border-b border-white/5 pb-6">
                  <div className="bg-white/5 p-4 rounded-xl text-center border border-white/5">
                    <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider block">Overall Score</span>
                    <span className="text-2xl font-bold text-primary block mt-1">{reportData.scores.overall || 0}/100</span>
                  </div>
                  <div className="bg-white/5 p-4 rounded-xl text-center border border-white/5">
                    <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider block">Technical</span>
                    <span className="text-2xl font-bold text-secondary block mt-1">{reportData.scores.technical || 0}/100</span>
                  </div>
                  <div className="bg-white/5 p-4 rounded-xl text-center border border-white/5">
                    <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider block">Communication</span>
                    <span className="text-2xl font-bold text-tertiary block mt-1">{reportData.scores.communication || 0}/100</span>
                  </div>
                </div>
              )}

              {/* Text feedback */}
              <div className="space-y-4">
                {renderReportMarkdown(reportData.text)}
              </div>
            </div>

            {/* Close action */}
            <div className="p-4 bg-black/20 border-t border-white/5 flex justify-end">
              <button 
                onClick={handleEndInterviewClick}
                className="bg-primary hover:bg-primary-container text-on-primary-fixed font-bold text-sm py-3 px-8 rounded-xl transition-all duration-300 cursor-pointer flex items-center gap-2 shadow-[0_4px_12px_rgba(20,184,166,0.2)]"
              >
                <span>Return to Dashboard</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Arena Box */}
      <div className="w-full flex flex-col h-[75vh] glass-card border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative">
        {/* Arena Header */}
        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#171f33]/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 bg-primary rounded-full animate-ping" />
            <h2 className="font-bold text-base">{interview.name}</h2>
          </div>
          <button 
            onClick={handleEndInterviewClick}
            className="flex items-center gap-1.5 px-4 py-2 bg-error/15 border border-error/20 hover:border-error/50 text-error rounded-xl font-bold text-xs transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">cancel</span>
            <span>Abort Session</span>
          </button>
        </div>

        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col">
          {messages.map((msg, index) => (
            <div 
              key={index}
              className={`max-w-[75%] p-4 rounded-2xl leading-relaxed text-left text-sm ${
                msg.role === 'user' 
                  ? 'self-end bg-primary/10 border border-primary/20 text-on-surface' 
                  : 'self-start bg-white/5 border border-white/5 text-on-surface'
              }`}
            >
              {msg.text}
            </div>
          ))}

          {isProcessing && (
            <div className="self-start flex items-center gap-3 bg-white/5 border border-white/5 p-4 rounded-2xl">
              <span className="text-xs text-on-surface-variant animate-pulse">Assistant is formulating response...</span>
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Dynamic AI pulse ring (visual avatar) */}
        {isSpeaking && (
          <div className="absolute right-4 top-16 w-12 h-12 rounded-full border border-primary/30 bg-primary/5 flex items-center justify-center animate-pulse z-10 shadow-[0_0_20px_rgba(79,219,200,0.15)]">
            <span className="material-symbols-outlined text-primary text-[20px]">smart_toy</span>
          </div>
        )}

        {/* Input Control Console */}
        <div className="p-4 border-t border-white/5 bg-[#171f33]/80 backdrop-blur-md flex flex-col gap-3">
          <div className="flex gap-4 items-end">
            <button 
              onClick={toggleListen}
              disabled={isProcessing}
              className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all duration-300 flex-shrink-0 cursor-pointer ${
                isListening 
                  ? 'bg-error border-error shadow-[0_0_15px_rgba(239,68,68,0.5)] text-white' 
                  : 'bg-white/5 border-white/10 hover:border-primary/45 text-on-surface-variant hover:text-primary'
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
              placeholder={isListening ? "Transcribing voice... speak clearly." : "Type your answer here or click mic to dictate..."}
              disabled={isProcessing}
              className="flex-1 bg-black/30 border border-white/10 hover:border-white/20 focus:border-primary/50 rounded-xl py-3 px-4 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none transition-colors duration-200 resize-none h-[50px] overflow-y-auto leading-relaxed"
            />

            <button 
              onClick={handleSendAnswer}
              disabled={!transcript.trim() || isProcessing}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 flex-shrink-0 cursor-pointer ${
                (!transcript.trim() || isProcessing) 
                  ? 'bg-white/5 border border-white/5 text-on-surface-variant/30 cursor-not-allowed' 
                  : 'bg-primary border border-primary text-on-primary-fixed hover:scale-105 shadow-[0_4px_12px_rgba(20,184,166,0.15)]'
              }`}
            >
              <span className="material-symbols-outlined text-[20px] font-bold">send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
