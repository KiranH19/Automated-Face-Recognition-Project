import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ViewType, Student, TrainedModelInfo, AttendanceRecord } from '../types';
import { extractFaceFeatures, matchFace } from '../services/faceRecognition';
import { playSuccessChime, playNoticeBeep, speakStudentName } from '../services/sound';
import {
  Camera,
  ScanFace,
  Volume2,
  VolumeX,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  UserPlus,
  BrainCircuit,
} from 'lucide-react';

interface MarkAttendanceViewProps {
  students: Student[];
  model: TrainedModelInfo;
  onNavigate: (view: ViewType) => void;
  onMarkAttendance: (
    studentId: number,
    photoUrl?: string
  ) => { success: boolean; message: string; studentName?: string; record?: AttendanceRecord; student?: Student };
  onAddFlash: (type: 'success' | 'error' | 'info', text: string) => void;
}

export const MarkAttendanceView: React.FC<MarkAttendanceViewProps> = ({
  students,
  model,
  onNavigate,
  onMarkAttendance,
  onAddFlash,
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [autoScanEnabled, setAutoScanEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Scanning feedback state
  const [isScanning, setIsScanning] = useState(false);
  const [faceDetectedInFrame, setFaceDetectedInFrame] = useState(false);
  const [lastDetectedStudent, setLastDetectedStudent] = useState<{
    name: string;
    roll: string;
    time: string;
    status: string;
    photoUrl?: string;
    isNew: boolean;
    confidence: number;
  } | null>(null);
  const [recentLiveFeed, setRecentLiveFeed] = useState<AttendanceRecord[]>([]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scanIntervalRef = useRef<number | null>(null);
  const recentDetectionsCooldownRef = useRef<Record<number, number>>({});

  // Stop camera stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (scanIntervalRef.current) {
        window.clearInterval(scanIntervalRef.current);
      }
    };
  }, [stream]);

  const startCamera = async () => {
    setCameraError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(
        'Camera API is not supported in this browser or is blocked because the connection is not secure (requires HTTPS or http://localhost).'
      );
      return;
    }

    let mediaStream: MediaStream | null = null;

    try {
      // 1. Try standard user-facing webcam
      mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });
    } catch {
      try {
        // 2. Fallback to basic webcam constraint without facingMode or size constraints
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      } catch (err: unknown) {
        const error = err as { name?: string; message?: string };
        console.warn('Camera access unavailable:', error);

        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          setCameraError(
            'Camera permission was blocked. Click the lock/tune icon on the left side of your browser address bar, set Camera to "Allow", and reload this page.'
          );
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          setCameraError('No webcam hardware found. Please plug in or connect a camera.');
        } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
          setCameraError(
            'Camera is in use by another program (e.g. Zoom, Google Meet, or another browser window). Please close it and retry.'
          );
        } else {
          setCameraError(
            `Unable to access camera: ${error.message || 'Permission denied or device unavailable'}. Run locally via VS Code on http://localhost:3000 to enable instant camera popups.`
          );
        }
        return;
      }
    }

    if (mediaStream) {
      setStream(mediaStream);
      setCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setStream(null);
    setCameraActive(false);
    setFaceDetectedInFrame(false);
    if (scanIntervalRef.current) {
      window.clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
  };

  // Real Automated Face Recognition Processing
  const processFrame = useCallback(async () => {
    if (!videoRef.current || !cameraActive || !model.isTrained) return;
    if (videoRef.current.readyState < 2) return;

    setIsScanning(true);
    try {
      const vec = await extractFaceFeatures(videoRef.current);
      if (!vec) {
        setFaceDetectedInFrame(false);
        return;
      }

      setFaceDetectedInFrame(true);

      const match = matchFace(vec, model.studentSignatures);
      if (match && match.confidence >= 60) {
        const studentId = match.studentId;
        const now = Date.now();
        const lastSeen = recentDetectionsCooldownRef.current[studentId] || 0;

        // 5-second cooldown per student so standing in front doesn't create duplicate spam
        if (now - lastSeen < 5000) {
          return;
        }

        recentDetectionsCooldownRef.current[studentId] = now;

        // Take an actual live photographic snapshot from the webcam at this exact moment
        let snapshotUrl: string | undefined = undefined;
        if (canvasRef.current && videoRef.current) {
          const cvs = canvasRef.current;
          cvs.width = 160;
          cvs.height = 120;
          const ctx = cvs.getContext('2d');
          if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0, 160, 120);
            snapshotUrl = cvs.toDataURL('image/jpeg', 0.85);
          }
        }

        const res = onMarkAttendance(studentId, snapshotUrl);
        const student = students.find((s) => s.id === studentId);

        if (res.success && student) {
          if (soundEnabled) {
            playSuccessChime();
            speakStudentName(student.name);
          }
          setLastDetectedStudent({
            name: student.name,
            roll: student.roll_number,
            time: new Date().toLocaleTimeString(),
            status: res.record?.status || 'Present',
            photoUrl: snapshotUrl || student.faceSamples?.[0],
            isNew: true,
            confidence: match.confidence,
          });
          if (res.record) {
            setRecentLiveFeed((prev) => [res.record!, ...prev.slice(0, 7)]);
          }
        } else if (res.message === 'Already marked today' && student) {
          if (soundEnabled) {
            playNoticeBeep();
          }
          setLastDetectedStudent({
            name: student.name,
            roll: student.roll_number,
            time: 'Already Recorded Today',
            status: 'Present',
            photoUrl: snapshotUrl || student.faceSamples?.[0],
            isNew: false,
            confidence: match.confidence,
          });
        }
      }
    } catch (e) {
      console.error('Face processor error:', e);
    } finally {
      setIsScanning(false);
    }
  }, [cameraActive, model, onMarkAttendance, students, soundEnabled]);

  // Continuous loop for Hands-Free Auto Attendance
  useEffect(() => {
    if (cameraActive && autoScanEnabled && model.isTrained) {
      scanIntervalRef.current = window.setInterval(processFrame, 500);
    } else if (scanIntervalRef.current) {
      window.clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    return () => {
      if (scanIntervalRef.current) {
        window.clearInterval(scanIntervalRef.current);
      }
    };
  }, [cameraActive, autoScanEnabled, model.isTrained, processFrame]);

  // If no model is trained yet
  if (!model.isTrained || Object.keys(model.studentSignatures || {}).length === 0) {
    return (
      <div>
        <section className="page-head">
          <div>
            <p className="eyebrow">Biometric System</p>
            <h1>Attendance Scanner</h1>
          </div>
        </section>

        <div className="panel" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <BrainCircuit size={52} color="var(--primary)" style={{ margin: '0 auto 16px', opacity: 0.8 }} />
          <h2 style={{ margin: '0 0 10px', fontSize: '1.4rem' }}>Facial Biometric Model Not Trained</h2>
          <p className="muted" style={{ maxWidth: '540px', margin: '0 auto 24px', lineHeight: 1.6 }}>
            {students.length === 0
              ? 'No students are registered in the system yet. Please enroll students with real camera face captures first, then train the model to enable automatic attendance recognition.'
              : `You have ${students.length} student(s) enrolled, but the recognition model has not been trained yet. Please click "Train Model" to compile their facial signatures.`}
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            {students.length === 0 ? (
              <button
                type="button"
                className="primary-btn"
                onClick={() => onNavigate('add-student')}
              >
                <UserPlus size={16} /> Enroll New Student
              </button>
            ) : (
              <button
                type="button"
                className="primary-btn"
                onClick={() => onNavigate('dashboard')}
              >
                <BrainCircuit size={16} /> Go to Dashboard & Train Model
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <section className="page-head">
        <div>
          <p className="eyebrow">Smart Biometric Terminal</p>
          <h1>Hands-Free Attendance Scanner</h1>
        </div>
        <div className="actions">
          <button
            type="button"
            className="secondary-btn"
            onClick={() => onNavigate('attendance')}
          >
            View Attendance Records <ArrowRight size={16} />
          </button>
        </div>
      </section>

      <div className="kiosk-grid">
        {/* Left: Camera & Real-Time Face Detection Viewport */}
        <section className="panel" style={{ padding: '20px' }}>
          <div className="camera-head" style={{ marginBottom: '14px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <ScanFace size={20} color="var(--primary)" />
                <strong style={{ fontSize: '1.05rem' }}>Live Webcam Sensor</strong>
              </div>
              <p className="hint" style={{ margin: 0 }}>
                Point camera towards the subject. Anyone showing up in front of the lens will be verified automatically.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                className="secondary-btn"
                style={{ minHeight: '34px', padding: '0 10px', fontSize: '0.85rem' }}
                onClick={() => setSoundEnabled(!soundEnabled)}
                title={soundEnabled ? 'Mute Voice / Chime' : 'Enable Voice / Chime'}
              >
                {soundEnabled ? <Volume2 size={16} color="var(--primary)" /> : <VolumeX size={16} color="var(--muted)" />}
                {soundEnabled ? 'Sound On' : 'Muted'}
              </button>

              <span className={`scanner-badge ${cameraActive ? 'active' : 'idle'}`}>
                <span className="pulse-dot" />
                {cameraActive ? (autoScanEnabled ? 'Auto-Scan Active' : 'Camera On') : 'Camera Standby'}
              </span>
            </div>
          </div>

          {cameraError && (
            <div className="flash error" style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={18} />
                <span>{cameraError}</span>
              </div>
            </div>
          )}

          <div className="camera-box">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ display: cameraActive ? 'block' : 'none' }}
            />
            <canvas ref={canvasRef} hidden />

            {!cameraActive && (
              <div className="camera-placeholder">
                <div>
                  <Camera size={48} style={{ margin: '0 auto 12px', opacity: 0.6 }} />
                  <p style={{ margin: '0 0 6px', fontSize: '1.15rem', color: '#ffffff', fontWeight: 700 }}>
                    Live Webcam Sensor Ready
                  </p>
                  <p className="muted" style={{ margin: '0 0 18px', fontSize: '0.88rem' }}>
                    Click "Start Live Camera" to activate automatic face detection.
                  </p>
                  <button
                    type="button"
                    className="primary-btn"
                    onClick={startCamera}
                    style={{ margin: '0 auto' }}
                  >
                    <Camera size={16} /> Start Live Camera
                  </button>
                </div>
              </div>
            )}

            {cameraActive && (
              <div className="camera-overlay">
                <div className="hud-top-status">
                  <div className="hud-mode-pill">
                    <span
                      className="pulse-dot"
                      style={{ background: faceDetectedInFrame ? '#22c55e' : '#38bdf8' }}
                    />
                    <span>
                      {faceDetectedInFrame ? 'FACE DETECTED' : 'SCANNING FOR SUBJECT'}
                    </span>
                  </div>
                  <div className="hud-mode-pill">
                    <Clock size={13} />
                    <span>{new Date().toLocaleTimeString()}</span>
                  </div>
                </div>

                {autoScanEnabled && <div className="scan-laser" />}

                <div
                  className={`face-reticle ${
                    faceDetectedInFrame
                      ? 'detected'
                      : isScanning
                      ? 'active'
                      : ''
                  }`}
                />

                {lastDetectedStudent && (
                  <div className="auto-success-toast">
                    {lastDetectedStudent.photoUrl ? (
                      <img
                        src={lastDetectedStudent.photoUrl}
                        alt={lastDetectedStudent.name}
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '2px solid #10b981',
                        }}
                      />
                    ) : (
                      <CheckCircle2 size={24} color="#10b981" />
                    )}
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>
                        {lastDetectedStudent.isNew ? 'Attendance Automatically Marked!' : 'Already Logged Today'}
                      </div>
                      <div style={{ fontSize: '0.82rem', opacity: 0.9 }}>
                        {lastDetectedStudent.name} ({lastDetectedStudent.roll}) · {lastDetectedStudent.confidence}% Match
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="form-actions" style={{ marginTop: '16px', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              {!cameraActive ? (
                <button type="button" className="primary-btn" onClick={startCamera}>
                  <Camera size={16} /> Start Live Camera
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => setAutoScanEnabled(!autoScanEnabled)}
                  >
                    {autoScanEnabled ? 'Pause Continuous Scanning' : 'Resume Continuous Scanning'}
                  </button>
                  <button type="button" className="danger-btn" onClick={stopCamera}>
                    Stop Camera
                  </button>
                </>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.86rem', color: 'var(--muted)' }}>
              <ShieldCheck size={16} color="var(--success)" />
              <span>Real-Time Biometric Verification</span>
            </div>
          </div>
        </section>

        {/* Right: Live Session Stream */}
        <section className="panel" style={{ padding: '20px' }}>
          <div className="section-title">
            <h2>Today's Live Session Stream</h2>
            <span style={{ fontSize: '0.82rem', color: 'var(--muted)', fontWeight: 600 }}>
              Real-time Logs
            </span>
          </div>

          <div className="live-feed-card">
            {recentLiveFeed.length > 0 ? (
              recentLiveFeed.map((rec) => (
                <div key={rec.id + '-' + rec.attendance_time} className="live-feed-item">
                  <div className="student-cell">
                    {rec.photoUrl ? (
                      <img src={rec.photoUrl} alt={rec.name} className="student-avatar" />
                    ) : (
                      <div className="student-avatar">{rec.name[0]}</div>
                    )}
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{rec.name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                        {rec.roll_number} · {rec.department}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="status-badge present">
                      <CheckCircle2 size={12} /> {rec.status}
                    </span>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '4px' }}>
                      {rec.attendance_time}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div
                style={{
                  padding: '42px 16px',
                  textAlign: 'center',
                  color: 'var(--muted)',
                  border: '1px dashed var(--line)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <ScanFace size={40} style={{ margin: '0 auto 10px', opacity: 0.35 }} />
                <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--ink)' }}>
                  Awaiting Facial Presence
                </div>
                <div style={{ fontSize: '0.82rem', marginTop: '6px', lineHeight: 1.5 }}>
                  When an enrolled student stands in front of the camera, their check-in will instantly appear here.
                </div>
              </div>
            )}
          </div>

          <div
            style={{
              marginTop: '20px',
              padding: '16px',
              borderRadius: 'var(--radius-sm)',
              background: '#f8fafc',
              border: '1px solid var(--line)',
              fontSize: '0.85rem',
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: '6px', color: 'var(--ink)' }}>
              Project Review Verification Steps:
            </div>
            <ol style={{ margin: 0, paddingLeft: '18px', color: 'var(--muted)', lineHeight: '1.6' }}>
              <li>Enroll real student(s) in <strong>Add Student</strong> by taking 30 real webcam snapshots.</li>
              <li>Click <strong>Train Model</strong> on Dashboard to process their biometric features.</li>
              <li>Activate this scanner. Stand in front of the webcam.</li>
              <li>The system recognizes you automatically and logs your attendance.</li>
            </ol>
          </div>
        </section>
      </div>
    </div>
  );
};
