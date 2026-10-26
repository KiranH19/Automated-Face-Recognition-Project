import React, { useState, useRef, useEffect } from 'react';
import { ViewType, Student } from '../types';
import { extractFaceFeatures, trainStudentProfile } from '../services/faceRecognition';
import { playSuccessChime } from '../services/sound';
import {
  Camera,
  UserPlus,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ScanFace,
  Info,
} from 'lucide-react';

interface AddStudentViewProps {
  onNavigate: (view: ViewType) => void;
  onSaveStudent: (
    student: Omit<Student, 'id' | 'created_at'>
  ) => { success: boolean; error?: string };
}

export const AddStudentView: React.FC<AddStudentViewProps> = ({
  onNavigate,
  onSaveStudent,
}) => {
  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [semester, setSemester] = useState('6th Semester');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedSamples, setCapturedSamples] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
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
        // 2. Fallback to any connected camera without constraints
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      } catch (err: unknown) {
        const error = err as { name?: string; message?: string };
        console.warn('Camera request failed:', error);

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

  const captureSamples = async () => {
    if (!cameraActive || !videoRef.current || !canvasRef.current) {
      alert('Please start the camera first.');
      return;
    }

    const targetSamples = 30;
    setIsCapturing(true);
    const newSamples: string[] = [];

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    for (let i = 0; i < targetSamples; i++) {
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        newSamples.push(dataUrl);
        setCapturedSamples([...newSamples]);
      }
      await new Promise((r) => setTimeout(r, 90));
    }

    playSuccessChime();
    setIsCapturing(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !rollNumber.trim() || !department.trim() || !semester.trim()) {
      alert('All required fields must be completed.');
      return;
    }

    if (capturedSamples.length < 30) {
      alert('Please start the webcam and capture 30 real face samples before saving.');
      return;
    }

    setIsSubmitting(true);

    // Extract real biometric feature vectors from the captured samples
    const sampleVectors: number[][] = [];
    for (const sample of capturedSamples) {
      const vec = await extractFaceFeatures(sample);
      if (vec) {
        sampleVectors.push(vec);
      }
    }

    if (sampleVectors.length < 5) {
      setIsSubmitting(false);
      alert('Could not detect clear facial features in the captured frames. Please ensure your face is well-lit and centered in the camera, then recapture.');
      return;
    }

    const featureProfile = trainStudentProfile(sampleVectors);

    const result = onSaveStudent({
      name: name.trim(),
      roll_number: rollNumber.trim().toUpperCase(),
      department: department.trim(),
      semester: semester.trim(),
      email: email.trim() || `${rollNumber.toLowerCase()}@college.edu`,
      phone: phone.trim() || '',
      sampleCount: capturedSamples.length,
      faceSamples: capturedSamples.slice(0, 5),
      featureProfile,
    });

    setIsSubmitting(false);

    if (result.success) {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      onNavigate('students');
    } else if (result.error) {
      alert(result.error);
    }
  };

  return (
    <div className="container narrow">
      <section className="page-head">
        <div>
          <p className="eyebrow">Real Biometric Enrollment</p>
          <h1>Add New Student</h1>
        </div>
        <button
          type="button"
          className="secondary-btn"
          onClick={() => onNavigate('students')}
        >
          <ArrowLeft size={16} /> Back to Directory
        </button>
      </section>

      <form className="panel form-grid" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name">Full Name *</label>
          <input
            type="text"
            id="name"
            placeholder="e.g. Kiran Handi"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="roll_number">USN / Roll Number *</label>
          <input
            type="text"
            id="roll_number"
            placeholder="e.g. 1RV21CS042"
            value={rollNumber}
            onChange={(e) => setRollNumber(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="department">Department *</label>
          <select
            id="department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            required
          >
            <option value="Computer Science & Engineering">Computer Science & Engineering</option>
            <option value="Information Science & Engineering">Information Science & Engineering</option>
            <option value="Electronics & Communication">Electronics & Communication</option>
            <option value="Mechanical Engineering">Mechanical Engineering</option>
            <option value="Artificial Intelligence & Data Science">Artificial Intelligence & Data Science</option>
          </select>
        </div>

        <div>
          <label htmlFor="semester">Semester *</label>
          <select
            id="semester"
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            required
          >
            <option value="1st Semester">1st Semester</option>
            <option value="2nd Semester">2nd Semester</option>
            <option value="3rd Semester">3rd Semester</option>
            <option value="4th Semester">4th Semester</option>
            <option value="5th Semester">5th Semester</option>
            <option value="6th Semester">6th Semester</option>
            <option value="7th Semester">7th Semester</option>
            <option value="8th Semester">8th Semester</option>
          </select>
        </div>

        <div>
          <label htmlFor="email">Email Address</label>
          <input
            type="email"
            id="email"
            placeholder="e.g. student@college.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="phone">Phone Number</label>
          <input
            type="tel"
            id="phone"
            placeholder="e.g. +91 98450 12345"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        {/* Real Live Camera Section */}
        <div className="camera-section full-row">
          <div className="camera-head">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ScanFace size={18} color="var(--primary)" />
                <strong style={{ fontSize: '1rem' }}>Webcam Face Capture Sensor</strong>
              </div>
              <p className="hint" style={{ margin: '4px 0 0' }}>
                Start your camera and face the lens. 30 real frame snapshots will be captured to build your biometric profile.
              </p>
            </div>
            <span
              className={`scanner-badge ${
                capturedSamples.length >= 30 ? 'active' : 'idle'
              }`}
            >
              {capturedSamples.length >= 30 ? <CheckCircle2 size={14} /> : null}
              {capturedSamples.length} / 30 Real Samples
            </span>
          </div>

          {cameraError && (
            <div className="flash error" style={{ margin: '6px 0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{cameraError}</span>
              </div>
              <div style={{ fontSize: '0.82rem', opacity: 0.9, paddingLeft: '26px' }}>
                Tip: If running in an embedded preview, open the app in a new browser tab or run locally via VS Code on <code>http://localhost:3000</code>.
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
                  <Camera size={44} style={{ margin: '0 auto 10px', opacity: 0.6 }} />
                  <p style={{ margin: '0 0 6px', fontSize: '1.05rem', color: '#ffffff', fontWeight: 700 }}>
                    Webcam Currently Inactive
                  </p>
                  <p className="muted" style={{ margin: '0 0 16px', fontSize: '0.85rem' }}>
                    Click "Start Webcam" to begin student face registration.
                  </p>
                  <button type="button" className="primary-btn" onClick={startCamera}>
                    <Camera size={16} /> Start Webcam
                  </button>
                </div>
              </div>
            )}

            {(cameraActive || isCapturing) && (
              <div className="camera-overlay">
                <div
                  className={`face-reticle ${
                    isCapturing ? 'capturing' : cameraActive ? 'active' : ''
                  }`}
                />
              </div>
            )}
          </div>

          <div className="form-actions" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              {!cameraActive ? (
                <button type="button" className="primary-btn" onClick={startCamera}>
                  <Camera size={16} /> Start Webcam
                </button>
              ) : (
                <button
                  type="button"
                  className="primary-btn"
                  onClick={captureSamples}
                  disabled={isCapturing}
                >
                  <ScanFace size={16} />
                  {isCapturing
                    ? `Capturing Real Frames (${capturedSamples.length}/30)...`
                    : capturedSamples.length >= 30
                    ? 'Re-Capture 30 Samples'
                    : 'Capture 30 Face Samples'}
                </button>
              )}
            </div>

            {capturedSamples.length >= 30 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--success)', fontWeight: 700, fontSize: '0.88rem' }}>
                <CheckCircle2 size={16} /> 30 Real Samples Ready
              </div>
            )}
          </div>

          {capturedSamples.length > 0 && (
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '6px' }}>
                Captured Webcam Snapshot Previews:
              </div>
              <div className="thumbnails-strip">
                {capturedSamples.slice(0, 10).map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt={`Real Sample ${i + 1}`}
                    className="thumb-preview"
                  />
                ))}
                {capturedSamples.length > 10 && (
                  <div
                    style={{
                      display: 'grid',
                      placeItems: 'center',
                      padding: '0 12px',
                      fontSize: '0.82rem',
                      color: 'var(--muted)',
                      fontWeight: 700,
                    }}
                  >
                    +{capturedSamples.length - 10} more
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="secondary-btn"
            onClick={() => onNavigate('students')}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="primary-btn"
            disabled={isSubmitting || capturedSamples.length < 30}
          >
            <UserPlus size={16} />
            {isSubmitting ? 'Registering...' : 'Save & Register Student'}
          </button>
        </div>

        <p className="hint full-row">
          After enrolling, navigate to the <strong>Dashboard</strong> and click <strong>"Train Model"</strong> to compile the biometric recognition data.
        </p>
      </form>
    </div>
  );
};
