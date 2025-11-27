import React, { useState, useEffect, useRef } from 'react';
import { Cake, Sparkles, PartyPopper, Star, Flame, Zap } from 'lucide-react';

export default function BirthdayCakeEvolution() {
  const [age, setAge] = useState(0);
  const [candles, setCandles] = useState([]);
  const [isBlowing, setIsBlowing] = useState(false);
  const [blowIntensity, setBlowIntensity] = useState(0);
  const [confetti, setConfetti] = useState([]);
  const [message, setMessage] = useState('');
  const [shake, setShake] = useState(false);
  const [micDenied, setMicDenied] = useState(false);
  
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const micStreamRef = useRef(null);
  const messageTimeoutRef = useRef(null);
  const candlesRef = useRef([]);

  // Keep candlesRef in sync with candles state
  useEffect(() => {
    candlesRef.current = candles;
  }, [candles]);

  const getTheme = () => {
    if (age <= 12) return { 
      bg: 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)', 
      cake: 'linear-gradient(180deg, #ec4899 0%, #db2777 100%)',
      cakeStyle: { borderRadius: '20px' },
      name: '🌈 Childhood Magic',
      description: 'Rainbow dreams and sprinkles!'
    };
    if (age <= 17) return { 
      bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
      cake: 'linear-gradient(180deg, #6366f1 0%, #8b5cf6 100%)',
      cakeStyle: { borderRadius: '15px', boxShadow: '0 0 40px rgba(139, 92, 246, 0.5)' },
      name: '⚡ Teen Spirit',
      description: 'Bold, electric energy!'
    };
    if (age <= 29) return { 
      bg: 'linear-gradient(135deg, #a8edea 0%, #667eea 100%)', 
      cake: 'linear-gradient(180deg, #06b6d4 0%, #3b82f6 100%)',
      cakeStyle: { borderRadius: '25px', transform: 'perspective(500px) rotateY(2deg)' },
      name: '💎 Young & Free',
      description: 'Sleek, modern sophistication!'
    };
    return { 
      bg: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', 
      cake: 'linear-gradient(180deg, #d97706 0%, #ea580c 100%)',
      cakeStyle: { 
        borderRadius: '20px',
        background: 'linear-gradient(180deg, #d97706 0%, #ea580c 50%, #d97706 100%)',
        position: 'relative'
      },
      name: '✨ Golden Years',
      description: 'Elegant and timeless!'
    };
  };

  const theme = getTheme();

  const getMilestoneMessage = (num) => {
    const messages = {
      1: '🎉 First birthday! The adventure begins!',
      10: '🎊 Double digits! You\'re growing up!',
      13: '🌟 Officially a teenager!',
      18: '🎓 Welcome to adulthood!',
      21: '🥂 Cheers to 21!',
      25: '✨ Quarter century milestone!',
      30: '🎯 The fabulous 30s begin!',
      40: '💎 Life begins at 40!',
      50: '👑 Half a century of awesomeness!',
      60: '🌅 The golden 60s!',
      70: '🎪 70 years young!',
      80: '🏆 80 years of wisdom!',
      90: '🌟 90 years of amazing!',
      100: '🎆 CENTURY CLUB! Legendary!',
      120: '🔮 Maximum age reached! You\'re immortal!'
    };
    return messages[num] || '';
  };

  const addCandle = () => {
    if (age >= 120 || isBlowing) return; // Cap at 120 and disable during blowing
    
    const newAge = age + 1;
    setAge(newAge);
    
    const isMilestone = [1, 10, 13, 18, 21, 25, 30, 40, 50, 60, 70, 80, 90, 100, 120].includes(newAge);
    
    setCandles(prev => [...prev, {
      id: Date.now(),
      lit: true,
      milestone: isMilestone,
      x: Math.random() * 80 + 10
    }]);

    if (isMilestone) {
      setShake(true);
      
      // Clear previous timeout and set new message
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }
      
      setMessage(getMilestoneMessage(newAge));
      setTimeout(() => setShake(false), 500);
      
      messageTimeoutRef.current = setTimeout(() => {
        setMessage('');
      }, 5000);
    }
  };

  const startBlowing = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      setMicDenied(false);
      
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const microphone = audioContextRef.current.createMediaStreamSource(stream);
      microphone.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;
      
      setIsBlowing(true);
      checkBlowing();
    } catch (err) {
      setMicDenied(true);
      setTimeout(() => setMicDenied(false), 5000);
    }
  };

  const checkBlowing = () => {
    if (!analyserRef.current) return;
    
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const check = () => {
      if (!analyserRef.current) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / bufferLength;
      
      // Update intensity display
      setBlowIntensity(Math.min(Math.floor(average / 5), 20));
      
      // Intensity-based blowing with pitch check
      if (average > 25) {
        let numToBlowOut;
        if (average < 40) {
          numToBlowOut = 1; // Gentle blow - 1 candle
        } else if (average < 60) {
          numToBlowOut = 2; // Light blow - 2 candles
        } else if (average < 80) {
          numToBlowOut = 3; // Medium blow - 3 candles
        } else if (average < 100) {
          numToBlowOut = 5; // Strong blow - 5 candles
        } else {
          numToBlowOut = 8; // Maximum blow - 8 candles
        }
        
        blowOutCandles(numToBlowOut, average);
      }
      
      // Auto-stop if all candles are out
      const litCandles = candlesRef.current.filter(c => c.lit);
      if (litCandles.length === 0) {
        stopBlowing();
        return;
      }
      
      if (analyserRef.current) {
        requestAnimationFrame(check);
      }
    };
    check();
  };

  const blowOutCandles = (numToBlowOut, intensity) => {
    setCandles(prev => {
      const litCandles = prev.filter(c => c.lit);
      if (litCandles.length === 0) return prev;
      
      const actualBlowOut = Math.min(numToBlowOut, litCandles.length);
      const newCandles = [...prev];
      let blown = 0;
      
      for (let i = newCandles.length - 1; i >= 0 && blown < actualBlowOut; i--) {
        if (newCandles[i].lit) {
          newCandles[i].lit = false;
          blown++;
        }
      }
      return newCandles;
    });

    // More confetti for stronger blows
    const confettiCount = Math.floor(intensity / 10) * 8;
    const newConfetti = Array.from({ length: confettiCount }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 100,
      y: -10,
      rotation: Math.random() * 360,
      scale: Math.random() * 0.5 + 0.5,
      color: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f7b731', '#5f27cd', '#ff6348', '#feca57'][Math.floor(Math.random() * 7)]
    }));
    setConfetti(prev => [...prev, ...newConfetti]);

    setTimeout(() => {
      setConfetti(prev => prev.filter(c => !newConfetti.find(nc => nc.id === c.id)));
    }, 2000);
  };

  const stopBlowing = () => {
    setIsBlowing(false);
    setBlowIntensity(0);
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    audioContextRef.current = null;
    analyserRef.current = null;
  };

  const reset = () => {
    stopBlowing();
    setAge(0);
    setCandles([]);
    setConfetti([]);
    setMessage('');
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
    }
  };

  useEffect(() => {
    return () => {
      stopBlowing();
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }
    };
  }, []);

  const containerStyle = {
    minHeight: '100vh',
    background: theme.bg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '15px',
    transition: 'background 1s ease',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    overflow: 'hidden'
  };

  const headerStyle = {
    textAlign: 'center',
    marginBottom: '15px'
  };

  const titleStyle = {
    fontSize: '36px',
    fontWeight: 'bold',
    color: 'white',
    marginBottom: '5px',
    textShadow: '2px 2px 4px rgba(0,0,0,0.2)'
  };

  const themeNameStyle = {
    color: 'white',
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '0px'
  };

  const themeDescStyle = {
    color: 'white',
    fontSize: '14px',
    opacity: 0.8
  };

  const messageBoxStyle = {
    textAlign: 'center',
    marginBottom: '10px',
    animation: 'bounce 1s infinite',
    position: 'absolute',
    top: '10px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 10
  };

  const messageStyle = {
    background: 'rgba(255,255,255,0.95)',
    backdropFilter: 'blur(10px)',
    borderRadius: '50px',
    padding: '12px 24px',
    display: 'inline-block',
    boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#9333ea'
  };

  const micDeniedStyle = {
    textAlign: 'center',
    marginBottom: '10px',
    position: 'absolute',
    top: '10px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 10
  };

  const micDeniedBoxStyle = {
    background: 'rgba(239, 68, 68, 0.9)',
    backdropFilter: 'blur(10px)',
    borderRadius: '15px',
    padding: '12px 20px',
    display: 'inline-block',
    boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
    color: 'white',
    fontSize: '14px',
    fontWeight: '600'
  };

  const cakeContainerStyle = {
    position: 'relative',
    background: 'rgba(255,255,255,0.2)',
    backdropFilter: 'blur(10px)',
    borderRadius: '25px',
    padding: '25px',
    boxShadow: '0 25px 50px rgba(0,0,0,0.2)',
    maxWidth: '600px',
    width: '100%'
  };

  const ageDisplayStyle = {
    textAlign: 'center',
    marginBottom: '15px'
  };

  const ageBoxStyle = {
    display: 'inline-block',
    background: 'white',
    borderRadius: '50px',
    padding: '15px 30px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
    transform: shake ? 'scale(1.1)' : 'scale(1)',
    transition: 'transform 0.3s'
  };

  const ageNumberStyle = {
    fontSize: '56px',
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, #9333ea 0%, #ec4899 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    margin: 0
  };

  const intensityBarContainerStyle = {
    marginBottom: '15px',
    textAlign: 'center'
  };

  const intensityLabelStyle = {
    color: 'white',
    fontSize: '12px',
    fontWeight: '600',
    marginBottom: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px'
  };

  const intensityBarStyle = {
    height: '10px',
    background: 'rgba(255,255,255,0.3)',
    borderRadius: '10px',
    overflow: 'hidden',
    position: 'relative'
  };

  const intensityFillStyle = {
    height: '100%',
    background: 'linear-gradient(90deg, #3b82f6, #06b6d4, #10b981)',
    borderRadius: '10px',
    width: `${(blowIntensity / 20) * 100}%`,
    transition: 'width 0.1s ease'
  };

  const candlesContainerStyle = {
    position: 'relative',
    height: '110px',
    marginBottom: '15px'
  };

  const cakeStyle = {
    ...theme.cakeStyle,
    background: theme.cake,
    height: age >= 30 ? '180px' : '150px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
    transform: shake ? 'scale(1.05)' : 'scale(1)',
    transition: 'all 0.5s',
    overflow: 'hidden'
  };

  const controlsStyle = {
    marginTop: '20px',
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    flexWrap: 'wrap'
  };

  const buttonBaseStyle = {
    padding: '14px 28px',
    borderRadius: '50px',
    fontWeight: 'bold',
    fontSize: '16px',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
    transition: 'transform 0.2s, opacity 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: 'white'
  };

  const addButtonStyle = {
    ...buttonBaseStyle,
    background: age >= 120 || isBlowing ? 'rgba(168, 85, 247, 0.5)' : 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
    cursor: age >= 120 || isBlowing ? 'not-allowed' : 'pointer',
    opacity: age >= 120 || isBlowing ? 0.6 : 1
  };

  const blowButtonStyle = {
    ...buttonBaseStyle,
    background: isBlowing ? '#ef4444' : 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)'
  };

  const resetButtonStyle = {
    ...buttonBaseStyle,
    background: 'rgba(255,255,255,0.3)',
    backdropFilter: 'blur(10px)'
  };

  const instructionsStyle = {
    marginTop: '15px',
    textAlign: 'center',
    color: 'white',
    fontSize: '12px',
    opacity: 0.85,
    lineHeight: '1.4'
  };

  const candleStyle = (candle) => ({
    position: 'absolute',
    bottom: 0,
    left: `${candle.x}%`,
    width: '7px',
    height: '55px',
    background: candle.milestone 
      ? 'linear-gradient(180deg, #fbbf24 0%, #f97316 100%)'
      : 'linear-gradient(180deg, #93c5fd 0%, #3b82f6 100%)',
    borderRadius: '4px 4px 0 0',
    transition: 'all 0.3s'
  });

  const flameStyle = {
    position: 'relative',
    top: '-20px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '12px',
    height: '24px',
    background: 'linear-gradient(180deg, #fbbf24 0%, #f97316 50%, #ef4444 100%)',
    borderRadius: '50%',
    filter: 'blur(2px)',
    animation: 'flicker 0.5s infinite alternate'
  };

  const confettiStyle = (c) => ({
    position: 'absolute',
    left: `${c.x}%`,
    top: `${c.y}%`,
    width: `${12 * c.scale}px`,
    height: `${12 * c.scale}px`,
    borderRadius: '3px',
    backgroundColor: c.color,
    pointerEvents: 'none',
    animation: 'fall 2s ease-in forwards',
    transform: `rotate(${c.rotation}deg)`
  });

  // Render golden tier layers for 30+
  const renderCakeLayers = () => {
    if (age < 30) {
      return <Cake style={{ width: '80px', height: '80px', color: 'rgba(255,255,255,0.5)' }} />;
    }
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
        <div style={{
          width: '60px',
          height: '24px',
          background: 'rgba(255,255,255,0.2)',
          borderRadius: '8px',
          border: '2px solid rgba(255,255,255,0.3)'
        }} />
        <div style={{
          width: '90px',
          height: '28px',
          background: 'rgba(255,255,255,0.25)',
          borderRadius: '10px',
          border: '2px solid rgba(255,255,255,0.3)'
        }} />
        <div style={{
          width: '120px',
          height: '32px',
          background: 'rgba(255,255,255,0.3)',
          borderRadius: '12px',
          border: '2px solid rgba(255,255,255,0.3)'
        }} />
        <Star style={{ 
          position: 'absolute', 
          width: '28px', 
          height: '28px', 
          color: '#fbbf24',
          filter: 'drop-shadow(0 0 10px #fbbf24)',
          animation: 'spin 3s linear infinite'
        }} />
      </div>
    );
  };

  return (
    <div style={containerStyle}>
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes flicker {
          0% { opacity: 1; transform: translateX(-50%) scale(1); }
          100% { opacity: 0.8; transform: translateX(-50%) scale(1.05); }
        }
        @keyframes fall {
          to {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        button:hover:not([disabled]) {
          transform: scale(1.05);
        }
        button:active:not([disabled]) {
          transform: scale(0.95);
        }
      `}</style>

      <div style={{ maxWidth: '800px', width: '100%' }}>
        <div style={headerStyle}>
          <h1 style={titleStyle}>🎂 Cake Evolution Party</h1>
          <p style={themeNameStyle}>{theme.name}</p>
          <p style={themeDescStyle}>{theme.description}</p>
        </div>

        {message && (
          <div style={messageBoxStyle}>
            <div style={messageStyle}>
              <p style={{ margin: 0 }}>{message}</p>
            </div>
          </div>
        )}

        {micDenied && (
          <div style={micDeniedStyle}>
            <div style={micDeniedBoxStyle}>
              🎤 Microphone access denied. Please enable it in your browser settings!
            </div>
          </div>
        )}

        <div style={cakeContainerStyle}>
          {confetti.map(c => (
            <div key={c.id} style={confettiStyle(c)} />
          ))}

          <div style={ageDisplayStyle}>
            <div style={ageBoxStyle}>
              <p style={ageNumberStyle}>{age}</p>
            </div>
          </div>

          {isBlowing && (
            <div style={intensityBarContainerStyle}>
              <div style={intensityLabelStyle}>
                <Flame style={{ width: '18px', height: '18px' }} />
                Blow Intensity
              </div>
              <div style={intensityBarStyle}>
                <div style={intensityFillStyle} />
              </div>
            </div>
          )}

          <div style={candlesContainerStyle}>
            {candles.map(candle => (
              <div key={candle.id} style={candleStyle(candle)}>
                {candle.lit && (
                  <div>
                    <div style={flameStyle} />
                    {candle.milestone && (
                      <div style={{
                        position: 'absolute',
                        top: '-38px',
                        left: '50%',
                        transform: 'translateX(-50%)'
                      }}>
                        <Zap style={{ 
                          width: '16px', 
                          height: '16px', 
                          color: '#fbbf24',
                          filter: 'drop-shadow(0 0 5px #fbbf24)',
                          animation: 'spin 2s linear infinite'
                        }} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={cakeStyle}>
            {renderCakeLayers()}
          </div>

          <div style={controlsStyle}>
            <button 
              onClick={addCandle} 
              style={addButtonStyle}
              disabled={age >= 120 || isBlowing}
            >
              <Sparkles style={{ width: '20px', height: '20px' }} />
              Add Year {age >= 120 && '(Max!)'}
            </button>
            
            {candles.some(c => c.lit) && (
              <button onClick={isBlowing ? stopBlowing : startBlowing} style={blowButtonStyle}>
                <PartyPopper style={{ width: '20px', height: '20px' }} />
                {isBlowing ? 'Stop Blowing' : 'Blow Candles'}
              </button>
            )}
            
            <button onClick={reset} style={resetButtonStyle}>
              Reset
            </button>
          </div>

          <div style={instructionsStyle}>
            <p style={{ margin: '0' }}>💨 Blow gently or hard for different effects!</p>
          </div>
        </div>
      </div>
    </div>
  );
}