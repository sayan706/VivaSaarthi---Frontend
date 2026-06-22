import React, { useEffect, useRef, useState } from 'react';

export default function WebcamFeed({ onFrameCapture, isActive, onCameraReady }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  // Dragging state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const handlePointerDown = (e) => {
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    
    setPosition({ 
      x: e.clientX - dragStartRef.current.x, 
      y: e.clientY - dragStartRef.current.y 
    });
  };

  const handlePointerUp = (e) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  // Start webcam
  useEffect(() => {
    if (!isActive) return;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: 'user' },
          audio: false
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraReady(true);
        if (onCameraReady) onCameraReady(true);
        setCameraError(null);
      } catch (err) {
        console.error('Camera access denied:', err);
        setCameraError('Camera access denied. Please allow camera to proceed.');
        setCameraReady(false);
        if (onCameraReady) onCameraReady(false);
      }
    };

    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive]);

  // Capture frames every 30 seconds for AI Vision analysis
  useEffect(() => {
    if (!cameraReady || !onFrameCapture) return;

    const captureFrame = () => {
      if (!videoRef.current || !canvasRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      canvas.width = 320;
      canvas.height = 240;
      ctx.drawImage(videoRef.current, 0, 0, 320, 240);
      const frameData = canvas.toDataURL('image/jpeg', 0.6);
      onFrameCapture(frameData);
    };

    // Capture first frame after 5 seconds
    const initialTimeout = setTimeout(captureFrame, 5000);
    // Then every 30 seconds
    intervalRef.current = setInterval(captureFrame, 30000);

    return () => {
      clearTimeout(initialTimeout);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [cameraReady, onFrameCapture]);

  // Detect camera disconnection
  useEffect(() => {
    if (!streamRef.current) return;

    const videoTrack = streamRef.current.getVideoTracks()[0];
    if (!videoTrack) return;

    const handleTrackEnded = () => {
      setCameraReady(false);
      if (onCameraReady) onCameraReady(false);
      setCameraError('Camera was disconnected. Please reconnect.');
    };

    videoTrack.addEventListener('ended', handleTrackEnded);
    return () => videoTrack.removeEventListener('ended', handleTrackEnded);
  }, [cameraReady]);

  if (!isActive) return null;

  return (
    <>
      <canvas ref={canvasRef} className="hidden" />
      <div 
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`fixed bottom-6 right-6 z-50 rounded-2xl overflow-hidden bg-black w-[200px] height-[150px] select-none border-2 ${
          isDragging 
            ? 'shadow-[0_16px_40px_rgba(0,0,0,0.6)] border-primary' 
            : 'shadow-[0_8px_32px_rgba(0,0,0,0.5)] border-white/10'
        } transition-shadow duration-300`}
        style={{
          width: '200px',
          height: '150px',
          transform: `translate(${position.x}px, ${position.y}px)`,
          cursor: isDragging ? 'grabbing' : 'grab',
          touchAction: 'none',
        }}
      >
        {/* Live indicator */}
        <div className="absolute top-2 left-2 flex items-center gap-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full z-10 text-[10px] font-bold tracking-widest">
          <div className={`w-1.5 h-1.5 rounded-full ${cameraReady ? 'bg-error animate-pulse' : 'bg-white/30'}`} />
          <span className={cameraReady ? 'text-white' : 'text-on-surface-variant'}>
            {cameraReady ? 'LIVE' : 'OFF'}
          </span>
        </div>

        {/* Camera content */}
        {cameraError ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-4 text-center">
            <span className="material-symbols-outlined text-error text-[28px]">videocam_off</span>
            <span className="text-[10px] text-error font-semibold leading-tight">
              {cameraError}
            </span>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover scale-x-[-1]"
          />
        )}
      </div>
    </>
  );
}
