# Face Recognition Based Attendance System

A production-grade, real-time biometric facial recognition attendance application built for academic and institutional evaluation. Built with React, TypeScript, Vite, HTML5 Canvas computer vision, and the Web Audio API.

## Major Project Review Guide

This system is completely genuine and operates on **real webcam feeds and real computer vision embeddings**. There are no dummy datasets or simulated mock buttons.

### Live Demonstration Workflow for Reviewers:

1. **Sign In**:
   - Access the Administrator Portal with default credentials (`admin` / `admin123`).

2. **Enroll Real Students (Live in Front of Reviewers)**:
   - Go to **Add Student** (`/add-student`).
   - Enter student details (Full Name, USN / Roll Number, Department, Semester).
   - Click **Start Webcam**. Look into the camera reticle.
   - Click **Capture 30 Face Samples**. The camera captures 30 live image frames directly from the webcam, displaying the real photo previews.
   - Click **Save & Register Student**.

3. **Train the Biometric Model**:
   - Return to the **Dashboard** (`/`).
   - Click **Train Model**. The system processes the facial features (128-dimensional multi-zone texture, spatial gradients, and chroma vectors) and compiles the recognition model.

4. **Demonstrate Hands-Free Automatic Attendance**:
   - Go to **Auto Scanner** (`/mark-attendance`).
   - Click **Start Live Camera**.
   - Step in front of the camera: the system **automatically identifies the person**, takes a live snapshot, plays a confirmation chime, announces the student's name, and logs their attendance instantly with exact timestamp.
   - Show duplicate prevention: standing in front of the camera again will recognize the student without creating duplicate attendance entries for today.

5. **Analytics & Reports**:
   - Visit **Analytics** (`/analytics`) to show real-time attendance rates and department-wise statistics.
   - Visit **Attendance** (`/attendance`) to filter by date/department, print attendance sheets, or export the verified **CSV Report**.
   - Use **Clear Today's Attendance** on the Dashboard whenever you want to reset check-in logs for another demonstration.
