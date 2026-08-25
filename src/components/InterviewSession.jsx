import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import WebcamFeed from './WebcamFeed';
import ProctorGuard from './ProctorGuard';
import { useRive, useStateMachineInput } from '@rive-app/react-canvas';
import { useNotification } from '../context/NotificationContext';

const InterviewMonster = ({ isSpeaking, isListening, reportData, failTrigger }) => {
  const { rive, RiveComponent } = useRive({
    src: '/riv%20files/5628-11215-wave-hear-and-talk.riv',
    stateMachines: 'State Machine 1',
    autoplay: true,
  });

  const talkInput = useStateMachineInput(rive, 'State Machine 1', 'Talk');
  const hearInput = useStateMachineInput(rive, 'State Machine 1', 'Hear');
  const successInput = useStateMachineInput(rive, 'State Machine 1', 'success');
  const failInput = useStateMachineInput(rive, 'State Machine 1', 'fail');

  useEffect(() => {
    if (talkInput) talkInput.value = isSpeaking;
  }, [isSpeaking, talkInput]);

  useEffect(() => {
    if (hearInput) hearInput.value = isListening;
  }, [isListening, hearInput]);

  useEffect(() => {
    if (reportData) {
      if (reportData.scores?.overall >= 50 && successInput) {
        successInput.fire();
      } else if (failInput) {
        failInput.fire();
      }
    }
  }, [reportData, successInput, failInput]);

  useEffect(() => {
    if (failTrigger > 0 && failInput) {
      failInput.fire();
    }
  }, [failTrigger, failInput]);

  return (
    <div className="absolute w-[130%] h-[130%] flex items-center justify-center" style={{ mixBlendMode: 'multiply' }}>
      <RiveComponent className="w-full h-full object-contain" />
    </div>
  );
};

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
  const [failTrigger, setFailTrigger] = useState(0);
  
  const [metrics, setMetrics] = useState({
    tab_switch_count: 0,
    fullscreen_exit_count: 0,
    face_missing_count: 0
  });

  const lastAIMessage = [...messages].reverse().find(m => m.role === 'ai');
  
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
      setTimeout(() => {
        if (transcriptRef.current.trim()) {
          handleSendAnswer();
        }
      }, 200);
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
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-4 md:gap-6 relative px-2 md:px-4">
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
        <div className="fixed inset-0 z-[60] bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-2 md:p-4 overflow-y-auto">
          <div className="bg-white border border-gray-100 rounded-2xl md:rounded-3xl max-w-2xl w-full max-h-[90vh] md:max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-[scaleUp_0.3s_ease-out]">
            {/* Report Header */}
            <div className="p-4 md:p-6 bg-gray-50 border-b border-gray-100 flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#0E3386]/10 flex items-center justify-center text-[#0E3386]">
                <span className="material-symbols-outlined text-[22px] md:text-[28px]">emoji_events</span>
              </div>
              <div className="text-left">
                <h3 className="text-lg md:text-xl font-bold text-gray-900">Interview Completed!</h3>
                <p className="text-xs text-gray-500 mt-0.5">Here is your tailored evaluation report.</p>
              </div>
            </div>

            {/* Report Data Body */}
            <div className="p-4 md:p-6 overflow-y-auto space-y-4 md:space-y-6">
              {/* Score breakdown metrics */}
              {reportData.scores && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 border-b border-gray-100 pb-4 md:pb-6">
                  <div className="bg-gray-50 p-3 md:p-4 rounded-xl text-center border border-gray-100 shadow-sm">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Overall Score</span>
                    <span className="text-2xl font-bold text-[#0E3386] block mt-1">{reportData.scores.overall || 0}/100</span>
                  </div>
                  <div className="bg-gray-50 p-3 md:p-4 rounded-xl text-center border border-gray-100 shadow-sm">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Technical</span>
                    <span className="text-2xl font-bold text-[#0E3386] block mt-1">{reportData.scores.technical || 0}/100</span>
                  </div>
                  <div className="bg-gray-50 p-3 md:p-4 rounded-xl text-center border border-gray-100 shadow-sm">
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
            <div className="p-3 md:p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button 
                onClick={handleEndInterviewClick}
                className="w-full sm:w-auto bg-[#0E3386] hover:bg-[#0E3386]/90 text-white font-bold text-sm py-2.5 md:py-3 px-6 md:px-8 rounded-xl transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(14,51,134,0.2)]"
              >
                <span>Return to Dashboard</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Arena Box */}
      <div className="w-full flex flex-col h-[calc(100vh-6rem)] md:h-[75vh] bg-gradient-to-br from-[#f8ebfb] via-[#e8f1ff] to-[#f4ebf8] border border-white/60 rounded-[20px] md:rounded-[32px] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.08)] relative">
        {/* Decorative background glows */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-[#fce0ff] mix-blend-multiply filter blur-[80px] opacity-60"></div>
          <div className="absolute top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-[#d0e1ff] mix-blend-multiply filter blur-[80px] opacity-60"></div>
        </div>

        {/* Arena Header */}
        <div className="px-3 md:px-6 py-3 md:py-4 flex justify-between items-center z-10 border-b border-white/30 bg-white/30 backdrop-blur-md">
          <div className="flex items-center gap-2 md:gap-3">
            <span className="w-2 h-2 md:w-2.5 md:h-2.5 bg-[#8b5cf6] rounded-full animate-ping" />
            <h2 className="font-bold text-sm md:text-base text-gray-800 tracking-wide truncate max-w-[150px] md:max-w-none">{interview.name}</h2>
          </div>
          <button 
            onClick={handleEndInterviewClick}
            className="flex items-center gap-1 md:gap-1.5 px-3 md:px-4 py-1.5 md:py-2 bg-white/60 hover:bg-white text-gray-700 rounded-full font-bold text-[10px] md:text-xs transition-all cursor-pointer shadow-sm border border-white/50 hover:shadow-md"
          >
            <span className="material-symbols-outlined text-[16px] text-red-500">cancel</span>
            <span>Abort Session</span>
          </button>
        </div>

        {/* Minimalist Talking Tom Layout Container */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 z-10 relative overflow-hidden gap-4">
          
          {/* Monster Character (Center, Large) */}
          <div className={`transition-all duration-500 ${isSpeaking ? 'drop-shadow-[0_0_60px_rgba(139,92,246,0.6)]' : 'drop-shadow-2xl'} z-20 flex-shrink-0 flex flex-col items-center justify-center flex-1`}>
            <div className={`w-[260px] h-[260px] sm:w-[320px] sm:h-[320px] md:w-[460px] md:h-[460px] overflow-hidden rounded-full flex items-center justify-center relative ${!isSpeaking ? "opacity-95" : "opacity-100"}`}>
              <InterviewMonster 
                isSpeaking={isSpeaking} 
                isListening={isListening} 
                reportData={reportData} 
                failTrigger={failTrigger} 
              />
            </div>
          </div>

          {/* Minimalist Subtitles */}
          <div className="z-30 w-full max-w-3xl min-h-[80px] flex items-center justify-center text-center px-4 mb-2">
            {isProcessing && messages.length === 0 ? (
               <div className="flex flex-col items-center gap-2">
                 <h3 className="text-xl md:text-2xl font-bold text-gray-800 drop-shadow-sm">Hello there! 👋</h3>
                 <span className="text-sm text-gray-500 font-medium">Getting everything ready...</span>
               </div>
            ) : isProcessing ? (
               <div className="flex items-center gap-2 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full">
                 <span className="text-sm text-gray-600 font-medium">Listening to you...</span>
                 <div className="flex gap-1">
                   <span className="w-1.5 h-1.5 bg-[#8b5cf6] rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                   <span className="w-1.5 h-1.5 bg-[#8b5cf6] rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                   <span className="w-1.5 h-1.5 bg-[#8b5cf6] rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                 </div>
               </div>
            ) : lastAIMessage ? (
               <p className="text-gray-800 text-lg md:text-2xl font-bold leading-tight drop-shadow-md bg-white/40 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/50">
                 {lastAIMessage.text}
               </p>
            ) : null}
          </div>
        </div>

        {/* Minimalist Voice Control Button */}
        <div className="pb-8 md:pb-12 pt-4 z-20 w-full flex flex-col items-center justify-center bg-gradient-to-t from-white/80 via-white/40 to-transparent">
          {transcript && (
            <div className="mb-4 px-6 py-2 bg-gray-900/80 backdrop-blur-md text-white text-sm rounded-full max-w-md truncate shadow-lg border border-gray-700">
              "{transcript}"
            </div>
          )}
          
          <button 
            onClick={toggleListen}
            disabled={isProcessing}
            className={`relative group w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center transition-all duration-500 flex-shrink-0 cursor-pointer outline-none ${
              isListening 
                ? 'bg-gradient-to-tr from-red-500 to-pink-500 shadow-[0_0_40px_rgba(239,68,68,0.6)] scale-110 text-white' 
                : 'bg-gradient-to-tr from-[#8b5cf6] to-[#6366f1] hover:scale-105 shadow-[0_10px_30px_rgba(139,92,246,0.4)] text-white hover:shadow-[0_15px_40px_rgba(139,92,246,0.6)]'
            }`}
          >
            {/* Animated rings when listening */}
            {isListening && (
              <>
                <span className="absolute inset-0 rounded-full border-2 border-red-400 animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite] opacity-75"></span>
                <span className="absolute inset-[-10px] rounded-full border-2 border-pink-400 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite] opacity-50"></span>
              </>
            )}
            
            <span className="material-symbols-outlined text-[36px] md:text-[42px] relative z-10 drop-shadow-md transition-transform duration-300 group-hover:scale-110">
              {isListening ? 'mic' : 'mic'}
            </span>
          </button>
          <p className="mt-4 text-xs font-bold text-gray-500 uppercase tracking-widest opacity-80">
            {isListening ? 'Listening... Tap to stop' : 'Tap to speak'}
          </p>
        </div>
      </div>
    </div>
  );
}
