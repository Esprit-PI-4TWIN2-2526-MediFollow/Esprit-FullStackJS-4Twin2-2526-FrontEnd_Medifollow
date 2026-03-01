import { Component, OnInit } from '@angular/core';
import { FaceRecognitionService } from '../../../../services/face-recognition.service';

@Component({
  selector: 'app-security-settings-card',
  templateUrl: './security-settings-card.component.html',
  styles: ``
})
export class SecuritySettingsCardComponent implements OnInit {
  currentUser: any = null;
  faceRegistered = false;
  isLoading = false;
  isRegistering = false;
  showCamera = false;
  videoStream: MediaStream | null = null;

  constructor(private faceRecognitionService: FaceRecognitionService) {}

  ngOnInit() {
    this.loadCurrentUser();
    if (this.currentUser) {
      this.checkFaceStatus();
    }
  }

  loadCurrentUser() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        this.currentUser = JSON.parse(userStr);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }

  checkFaceStatus() {
    const userId = this.currentUser?.id || this.currentUser?._id;
    if (!userId) return;

    this.isLoading = true;
    this.faceRecognitionService.getFaceStatus(userId).subscribe({
      next: (result) => {
        this.faceRegistered = result.registered;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error checking face status:', err);
        this.isLoading = false;
      }
    });
  }

  async enableFaceId() {
    const userId = this.currentUser?.id || this.currentUser?._id;
    if (!userId) {
      alert('User not found. Please sign in again.');
      return;
    }

    this.isRegistering = true;
    this.showCamera = true;

    try {
      // Request camera access and show preview
      this.videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = document.getElementById('cameraPreview') as HTMLVideoElement;
      if (video) {
        video.srcObject = this.videoStream;
        video.play();
      }
    } catch (error) {
      alert('Could not access camera. Please allow camera permissions.');
      this.isRegistering = false;
      this.showCamera = false;
    }
  }

  async captureFace() {
    const video = document.getElementById('cameraPreview') as HTMLVideoElement;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      
      try {
        // Wait a moment for video to stabilize
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Detect face and get descriptor
        const descriptor = await this.faceRecognitionService.detectFace(video);
        
        if (!descriptor) {
          alert('No face detected. Please:\n- Make sure your face is clearly visible\n- Ensure good lighting\n- Position your face in the center\n- Wait a moment and try again');
          return;
        }

        const imageBase64 = canvas.toDataURL('image/jpeg');
        const userId = this.currentUser?.id || this.currentUser?._id;
        
        // Stop camera
        this.stopCamera();
        
        this.faceRecognitionService.registerFace(userId, imageBase64, Array.from(descriptor)).subscribe({
          next: () => {
            alert('Face ID registered successfully!');
            this.faceRegistered = true;
            this.isRegistering = false;
            this.showCamera = false;
          },
          error: (err) => {
            alert(err.error?.message || 'Failed to register face. Please try again.');
            this.isRegistering = false;
            this.showCamera = false;
          }
        });
      } catch (error: any) {
        console.error('Face detection error:', error);
        alert('Error detecting face: ' + (error.message || 'Unknown error'));
      }
    }
  }

  cancelCapture() {
    this.stopCamera();
    this.isRegistering = false;
    this.showCamera = false;
  }

  stopCamera() {
    if (this.videoStream) {
      this.videoStream.getTracks().forEach(track => track.stop());
      this.videoStream = null;
    }
  }

  deleteFaceData() {
    if (!confirm('Are you sure you want to remove Face ID?')) {
      return;
    }

    const userId = this.currentUser?.id || this.currentUser?._id;
    if (!userId) {
      alert('User not found');
      return;
    }

    this.faceRecognitionService.deleteFaceData(userId).subscribe({
      next: () => {
        alert('Face ID removed successfully');
        this.faceRegistered = false;
      },
      error: (err) => {
        alert('Failed to remove Face ID');
        console.error(err);
      }
    });
  }

  ngOnDestroy() {
    this.stopCamera();
  }
}
