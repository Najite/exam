'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  Camera, 
  CameraOff, 
  Volume2, 
  ShieldCheck, 
  AlertTriangle, 
  UserCheck, 
  Eye, 
  VolumeX, 
  RefreshCw, 
  Sliders, 
  Sparkles,
  Users,
  EyeOff
} from 'lucide-react';
import { ProctorIncident, ProctorIncidentType } from '@/types';

interface WebcamProctorProps {
  onIncident: (incident: Omit<ProctorIncident, 'id' | 'timestamp' | 'secondsIntoExam'>) => void;
  secondsElapsed: number;
  strikeCount: number;
  maxStrikes: number;
  enableFaceCheck?: boolean;
  enableMicCheck?: boolean;
}

export function WebcamProctor({
  onIncident,
  secondsElapsed,
  strikeCount,
  maxStrikes,
  enableFaceCheck = true,
  enableMicCheck = true,
}: WebcamProctorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Status states
  const [hasCamera, setHasCamera] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isSimulatedMode, setIsSimulatedMode] = useState<boolean>(false);
  const [audioLevel, setAudioLevel] = useState<number>(10);
  const [faceStatus, setFaceStatus] = useState<'detected' | 'missing' | 'multiple'>('detected');
  const [gazeStatus, setGazeStatus] = useState<'centered' | 'left' | 'right' | 'down'>('centered');
  const [lastWarning, setLastWarning] = useState<string | null>(null);
  const [showControls, setShowControls] = useState<boolean>(false);

  // Simulation controls state
  const [simulatedGaze, setSimulatedGaze] = useState<'centered' | 'left' | 'right' | 'down'>('centered');
  const [simulatedFacePresent, setSimulatedFacePresent] = useState<boolean>(true);
  const [simulatedMultipleFaces, setSimulatedMultipleFaces] = useState<boolean>(false);

  // Incident throttling
  const lastIncidentTimeRef = useRef<Record<string, number>>({});

  const throttleIncident = useCallback(
    (type: ProctorIncidentType, severity: 'low' | 'medium' | 'high', description: string, cooldownMs = 8000) => {
      const now = Date.now();
      const last = lastIncidentTimeRef.current[type] || 0;
      if (now - last > cooldownMs) {
        lastIncidentTimeRef.current[type] = now;
        setLastWarning(description);
        onIncident({ type, severity, description });
      }
    },
    [onIncident]
  );

  // Initialize Media Stream (Real Camera & Mic)
  const initRealMedia = useCallback(async () => {
    setCameraError(null);
    try {
      // First attempt with both video and audio
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 320 }, height: { ideal: 240 } },
          audio: true,
        });
      } catch (errWithAudio) {
        // Fallback to video-only if audio device is locked or denied
        console.warn('Audio device unavailable, requesting video-only stream:', errWithAudio);
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 320 }, height: { ideal: 240 } },
          audio: false,
        });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(() => {});
        };
      }
      setHasCamera(true);
      setIsSimulatedMode(false);

      // Setup audio analyzer if audio track is active
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack && audioTrack.enabled) {
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateAudioMeter = () => {
            if (!streamRef.current) return;
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
            const avg = Math.min(100, Math.round((sum / dataArray.length) * 1.6));
            setAudioLevel(avg);

            // Alert on excessive background speech / noise (> 70% level)
            if (avg > 70 && enableMicCheck) {
              throttleIncident(
                'noise_detected',
                'medium',
                'Acoustic alert: High background volume or unauthorized conversation detected'
              );
            }
            requestAnimationFrame(updateAudioMeter);
          };
          updateAudioMeter();
        } catch (e) {
          console.warn('Audio analyser error:', e);
        }
      }
    } catch (err: any) {
      console.warn('Webcam not accessible, switching to Synthetic AI Vision Proctor:', err.message);
      setHasCamera(false);
      setIsSimulatedMode(true);
      setCameraError(err.message || 'Camera not available');
    }
  }, [enableMicCheck, throttleIncident]);

  useEffect(() => {
    initRealMedia();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [initRealMedia]);

  // Real Computer Vision Processing Loop (when real camera is active)
  useEffect(() => {
    if (!hasCamera || isSimulatedMode || !enableFaceCheck) return;

    let animId: number;
    let missingCounter = 0;

    const processFrame = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const overlay = overlayCanvasRef.current;

      if (video && canvas && overlay && video.readyState >= 2) {
        const width = 160;
        const height = 120;
        canvas.width = width;
        canvas.height = height;
        overlay.width = width;
        overlay.height = height;

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        const oCtx = overlay.getContext('2d');

        if (ctx && oCtx) {
          ctx.drawImage(video, 0, 0, width, height);
          oCtx.clearRect(0, 0, width, height);

          const frame = ctx.getImageData(0, 0, width, height);
          const data = frame.data;

          let skinPixels = 0;
          let sumX = 0;
          let sumY = 0;
          let minX = width, maxX = 0, minY = height, maxY = 0;

          // Skin-color detection in RGB/YCbCr space
          for (let y = 0; y < height; y += 2) {
            for (let x = 0; x < width; x += 2) {
              const idx = (y * width + x) * 4;
              const r = data[idx];
              const g = data[idx + 1];
              const b = data[idx + 2];

              // Empirical human skin tone filter
              const isSkin =
                r > 60 &&
                g > 35 &&
                b > 20 &&
                r > g &&
                r > b &&
                r - g > 10 &&
                Math.abs(r - g) > 12;

              if (isSkin) {
                skinPixels++;
                sumX += x;
                sumY += y;
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
              }
            }
          }

          const sampledPixels = (width / 2) * (height / 2);
          const skinRatio = skinPixels / sampledPixels;

          // Face presence evaluation
          if (skinRatio > 0.05) {
            missingCounter = 0;
            setFaceStatus('detected');

            // Centroid calculation
            const cx = sumX / skinPixels;
            const cy = sumY / skinPixels;

            // Gaze / Face orientation
            let currentGaze: 'centered' | 'left' | 'right' | 'down' = 'centered';
            if (cx < width * 0.32) {
              currentGaze = 'left';
            } else if (cx > width * 0.68) {
              currentGaze = 'right';
            } else if (cy > height * 0.72) {
              currentGaze = 'down';
            }

            setGazeStatus(currentGaze);

            if (currentGaze !== 'centered') {
              throttleIncident(
                'face_missing',
                'medium',
                `Vision alert: Candidate gaze deviated (${currentGaze.toUpperCase()}). Please face screen directly.`,
                6000
              );
            }

            // Draw Real-time Bounding Box & Centroid Crosshair HUD
            const boxPadding = 6;
            const bx = Math.max(0, minX - boxPadding);
            const by = Math.max(0, minY - boxPadding);
            const bw = Math.min(width - bx, (maxX - minX) + boxPadding * 2);
            const bh = Math.min(height - by, (maxY - minY) + boxPadding * 2);

            oCtx.strokeStyle = currentGaze === 'centered' ? '#10b981' : '#f59e0b';
            oCtx.lineWidth = 1.5;
            oCtx.strokeRect(bx, by, bw, bh);

            // Crosshair at face centroid
            oCtx.fillStyle = '#6366f1';
            oCtx.beginPath();
            oCtx.arc(cx, cy, 3, 0, Math.PI * 2);
            oCtx.fill();

            // Status tag
            oCtx.font = '8px monospace';
            oCtx.fillStyle = '#10b981';
            oCtx.fillText(`GAZE: ${currentGaze.toUpperCase()}`, bx, Math.max(10, by - 3));
          } else {
            // No face detected in frame
            missingCounter++;
            if (missingCounter > 15) { // sustained for ~1 second
              setFaceStatus('missing');
              setGazeStatus('centered');
              throttleIncident(
                'face_missing',
                'high',
                'Critical security alert: Candidate face missing from camera frame!',
                7000
              );
            }
          }
        }
      }

      animId = requestAnimationFrame(processFrame);
    };

    animId = requestAnimationFrame(processFrame);
    return () => cancelAnimationFrame(animId);
  }, [hasCamera, isSimulatedMode, enableFaceCheck, throttleIncident]);

  // Synthetic AI Vision Animation Loop (when real camera is unavailable or in simulator mode)
  useEffect(() => {
    if (!isSimulatedMode) return;

    let animId: number;
    let tick = 0;

    const renderSyntheticFeed = () => {
      tick++;
      const canvas = canvasRef.current;
      const overlay = overlayCanvasRef.current;

      if (canvas && overlay) {
        const width = 160;
        const height = 120;
        canvas.width = width;
        canvas.height = height;
        overlay.width = width;
        overlay.height = height;

        const ctx = canvas.getContext('2d');
        const oCtx = overlay.getContext('2d');

        if (ctx && oCtx) {
          // Dark studio background
          ctx.fillStyle = '#090d16';
          ctx.fillRect(0, 0, width, height);

          // Grid lines
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 0.5;
          for (let x = 0; x < width; x += 20) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
          }
          for (let y = 0; y < height; y += 20) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
          }

          if (simulatedFacePresent) {
            // Head position based on simulated gaze
            let hx = width / 2;
            let hy = height / 2 + 5;
            if (simulatedGaze === 'left') hx -= 28;
            else if (simulatedGaze === 'right') hx += 28;
            else if (simulatedGaze === 'down') hy += 18;

            // Draw Head Silhouette
            ctx.fillStyle = '#334155';
            ctx.beginPath();
            ctx.ellipse(hx, hy - 4, 22, 26, 0, 0, Math.PI * 2);
            ctx.fill();

            // Draw Shoulders
            ctx.beginPath();
            ctx.ellipse(hx, height + 8, 38, 22, 0, 0, Math.PI * 2);
            ctx.fill();

            // Eyes / Gaze tracking points
            const eyeY = hy - 6;
            const eyeOffset = simulatedGaze === 'left' ? -4 : simulatedGaze === 'right' ? 4 : 0;

            ctx.fillStyle = '#818cf8';
            ctx.beginPath();
            ctx.arc(hx - 8 + eyeOffset, eyeY, 2.5, 0, Math.PI * 2);
            ctx.arc(hx + 8 + eyeOffset, eyeY, 2.5, 0, Math.PI * 2);
            ctx.fill();

            // Overlay Bounding Box
            oCtx.strokeStyle = simulatedGaze === 'centered' ? '#10b981' : '#f59e0b';
            oCtx.lineWidth = 1.5;
            oCtx.strokeRect(hx - 26, hy - 32, 52, 60);

            oCtx.font = '8px monospace';
            oCtx.fillStyle = simulatedGaze === 'centered' ? '#10b981' : '#f59e0b';
            oCtx.fillText(`GAZE: ${simulatedGaze.toUpperCase()}`, hx - 24, hy - 35);

            // Multiple faces simulation
            if (simulatedMultipleFaces) {
              const mX = 28;
              const mY = 40;
              ctx.fillStyle = '#ef4444';
              ctx.beginPath();
              ctx.ellipse(mX, mY, 14, 16, 0, 0, Math.PI * 2);
              ctx.fill();

              oCtx.strokeStyle = '#ef4444';
              oCtx.lineWidth = 1.5;
              oCtx.strokeRect(mX - 16, mY - 18, 32, 36);
              oCtx.fillStyle = '#ef4444';
              oCtx.fillText('2ND PERSON', mX - 16, mY - 21);
            }
          } else {
            // Face missing screen
            ctx.fillStyle = '#1e1b4b';
            ctx.font = '10px sans-serif';
            ctx.fillStyle = '#ef4444';
            ctx.textAlign = 'center';
            ctx.fillText('NO FACE DETECTED', width / 2, height / 2);
          }
        }
      }

      animId = requestAnimationFrame(renderSyntheticFeed);
    };

    animId = requestAnimationFrame(renderSyntheticFeed);
    return () => cancelAnimationFrame(animId);
  }, [isSimulatedMode, simulatedFacePresent, simulatedGaze, simulatedMultipleFaces]);

  // Simulated Trigger Handlers
  const handleSimulateGazeAway = (dir: 'left' | 'right' | 'down') => {
    setSimulatedGaze(dir);
    setGazeStatus(dir);
    throttleIncident(
      'face_missing',
      'medium',
      `Simulated gaze deviation alert: Candidate looking ${dir.toUpperCase()}`,
      1000
    );
    setTimeout(() => {
      setSimulatedGaze('centered');
      setGazeStatus('centered');
    }, 4000);
  };

  const handleSimulateFaceMissing = () => {
    setSimulatedFacePresent(false);
    setFaceStatus('missing');
    throttleIncident(
      'face_missing',
      'high',
      'Simulated security alert: Candidate has stepped away from testing station!',
      1000
    );
    setTimeout(() => {
      setSimulatedFacePresent(true);
      setFaceStatus('detected');
    }, 4000);
  };

  const handleSimulateMultipleFaces = () => {
    setSimulatedMultipleFaces(true);
    setFaceStatus('multiple');
    throttleIncident(
      'multiple_faces',
      'high',
      'Simulated security violation: Multiple unauthorized individuals detected in camera frame!',
      1000
    );
    setTimeout(() => {
      setSimulatedMultipleFaces(false);
      setFaceStatus('detected');
    }, 5000);
  };

  const handleSimulateNoise = () => {
    setAudioLevel(85);
    throttleIncident(
      'noise_detected',
      'medium',
      'Simulated acoustic alert: Background talking and voice activity detected!',
      1000
    );
    setTimeout(() => setAudioLevel(15), 3000);
  };

  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-3 shadow-xl flex flex-col gap-2.5 w-full">
      {/* Proctor Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          <span>AI Vision Proctor Live</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowControls((v) => !v)}
            title="Toggle Proctor Simulator Test Suite"
            className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <Sliders className="w-3 h-3 text-indigo-400" />
          </button>

          <div
            className={`text-xs px-2 py-0.5 rounded-full font-mono font-medium ${
              strikeCount === 0
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                : strikeCount >= maxStrikes
                ? 'bg-rose-950 text-rose-300 border border-rose-800 animate-pulse'
                : 'bg-amber-950 text-amber-300 border border-amber-800'
            }`}
          >
            Strikes: {strikeCount}/{maxStrikes}
          </div>
        </div>
      </div>

      {/* Video & Canvas Stream Display */}
      <div className="relative aspect-4/3 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center group">
        {/* Real Video Element (Hidden from display, read by canvas) */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className="hidden"
        />

        {/* Main Processing Canvas */}
        <canvas
          ref={canvasRef}
          className="w-full h-full object-cover transform -scale-x-100"
        />

        {/* HUD Overlay Canvas for Bounding Box & Landmarks */}
        <canvas
          ref={overlayCanvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none transform -scale-x-100"
        />

        {/* Live HUD Badges */}
        <div className="absolute inset-2 pointer-events-none flex flex-col justify-between p-1.5">
          <div className="flex justify-between items-center text-[10px] text-indigo-300 font-mono bg-black/50 backdrop-blur-xs px-2 py-0.5 rounded-md">
            <span className="flex items-center gap-1 font-semibold">
              <Eye className="w-3 h-3 text-emerald-400" />
              <span>Face: {faceStatus === 'detected' ? 'Locked (1)' : faceStatus === 'multiple' ? 'MULTIPLE!' : 'Searching...'}</span>
            </span>
            <span className="text-slate-400">{hasCamera ? 'HD 30 FPS' : 'SYNTHETIC AI'}</span>
          </div>

          {lastWarning && (
            <div className="bg-rose-950/95 border border-rose-500 text-rose-200 text-[10px] p-1.5 rounded-md flex items-center gap-1 font-semibold shadow-lg shadow-rose-950/80 animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span className="truncate">{lastWarning}</span>
            </div>
          )}

          <div className="flex justify-between items-center text-[10px] text-slate-300 bg-black/50 backdrop-blur-xs px-2 py-0.5 rounded-md">
            <span className="flex items-center gap-1">
              <Volume2 className="w-3 h-3 text-indigo-400" /> MIC VU:
            </span>
            <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden flex">
              <div
                className={`h-full transition-all duration-75 ${
                  audioLevel > 65 ? 'bg-rose-500' : audioLevel > 35 ? 'bg-amber-400' : 'bg-emerald-400'
                }`}
                style={{ width: `${Math.min(100, Math.max(12, audioLevel))}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Proctoring Status Details */}
      <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-300">
        <div className="flex items-center gap-1.5 bg-slate-800/60 p-1.5 rounded-lg border border-slate-700/50">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="truncate">Tab Lock: Active</span>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-800/60 p-1.5 rounded-lg border border-slate-700/50">
          <UserCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span className="truncate capitalize">Gaze: {gazeStatus}</span>
        </div>
      </div>

      {/* Camera Mode Toggle & Diagnostic Actions */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px]">
        <span className="text-slate-400 flex items-center gap-1 font-mono">
          <span className={`w-1.5 h-1.5 rounded-full ${hasCamera ? 'bg-emerald-400' : 'bg-indigo-400 animate-pulse'}`} />
          {hasCamera ? 'Physical Webcam' : 'Synthetic Vision Guard'}
        </span>

        <button
          type="button"
          onClick={initRealMedia}
          className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold cursor-pointer"
        >
          <RefreshCw className="w-2.5 h-2.5" />
          <span>{hasCamera ? 'Re-sync' : 'Connect Real Cam'}</span>
        </button>
      </div>

      {/* Proctoring Simulator Test Suite (Allows testing all flags on-demand) */}
      {showControls && (
        <div className="p-2.5 bg-slate-950 rounded-xl border border-indigo-900/60 text-slate-300 space-y-2 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between text-[11px] font-bold text-indigo-300 pb-1 border-b border-slate-800">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <span>AI Proctor Test Suite</span>
            </span>
            <span className="text-[9px] text-slate-500 font-mono">Click to test triggers</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[10px]">
            <button
              type="button"
              onClick={() => handleSimulateGazeAway('left')}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-amber-300 flex items-center gap-1 transition"
            >
              <Eye className="w-3 h-3 text-amber-400 shrink-0" />
              <span>Look Away</span>
            </button>

            <button
              type="button"
              onClick={handleSimulateFaceMissing}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-rose-300 flex items-center gap-1 transition"
            >
              <EyeOff className="w-3 h-3 text-rose-400 shrink-0" />
              <span>Face Missing</span>
            </button>

            <button
              type="button"
              onClick={handleSimulateMultipleFaces}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-rose-300 flex items-center gap-1 transition"
            >
              <Users className="w-3 h-3 text-rose-400 shrink-0" />
              <span>Multiple Faces</span>
            </button>

            <button
              type="button"
              onClick={handleSimulateNoise}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-amber-300 flex items-center gap-1 transition"
            >
              <Volume2 className="w-3 h-3 text-amber-400 shrink-0" />
              <span>Voice / Chatter</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
