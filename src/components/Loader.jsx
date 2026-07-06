import React, { useState, useEffect } from 'react';
import { useLottie } from 'lottie-react';

export default function Loader({ text = "Loading...", fullScreen = true }) {
  const [lottieData, setLottieData] = useState(null);

  useEffect(() => {
    fetch('/Video call.json')
      .then(res => res.json())
      .then(data => setLottieData(data))
      .catch(err => console.error('Failed to load lottie:', err));
  }, []);

  const options = {
    animationData: lottieData,
    loop: true,
  };

  const { View } = useLottie(options, { width: 150, height: 150 });

  return (
    <div className={`w-full flex items-center justify-center p-20 text-primary bg-[#f5f6f8] ${fullScreen ? 'min-h-screen' : ''}`}>
      <div className="flex flex-col items-center gap-4">
        {lottieData ? (
          View
        ) : (
          <svg className="animate-spin h-10 w-10 text-primary" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        <span className="text-sm font-semibold tracking-wider text-[#1a1a1a]">{text}</span>
      </div>
    </div>
  );
}
