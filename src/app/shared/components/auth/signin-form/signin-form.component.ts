import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../services/auth/auth.service';
import { FaceRecognitionService } from '../../../../services/face-recognition.service';

@Component({
  selector: 'app-signin-form',
  templateUrl: './signin-form.component.html'
})
export class SigninFormComponent implements OnInit {
  showPassword = false;
  isChecked = false;
  isLoading = false;
  isFaceIdLoading = false;
  showFaceIdButton = true;
  showCamera = false;
  videoStream: MediaStream | null = null;

  loginForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private faceRecognitionService: FaceRecognitionService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: [
        '',
        [
          Validators.required,
          Validators.email,
        ]
      ],
      password: [
        '',
        [
          Validators.required,
        ]
      ]
    });
  }

  ngOnInit() {
    // Face ID is always available
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onSignIn() {
    if (this.loginForm.invalid || this.isLoading) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    const { email, password } = this.loginForm.value;

    this.authService.signIn({ email, password }).subscribe({
      next: (res: any) => {
        if (res.accessToken) {
          localStorage.setItem('accessToken', res.accessToken);
        }
        if (res.user) {
          localStorage.setItem('user', JSON.stringify(res.user));
          const role = res.user.role;

          if (role === 'SUPERADMIN' || role === 'ADMIN') {
            this.router.navigate(['/dashboard']);
          } else {
            this.router.navigate(['/']);
          }
        }
      },
      error: (err) => {
        alert(err.error?.message || 'Erreur lors de la connexion');
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  async onFaceIdLogin() {
    const email = this.loginForm.get('email')?.value;
    
    if (!email) {
      alert('Please enter your email address first');
      return;
    }

    this.isFaceIdLoading = true;
    this.showCamera = true;

    try {
      // Request camera access
      this.videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = document.getElementById('loginCameraPreview') as HTMLVideoElement;
      if (video) {
        video.srcObject = this.videoStream;
        video.play();
      }
    } catch (error) {
      alert('Could not access camera. Please allow camera permissions.');
      this.isFaceIdLoading = false;
      this.showCamera = false;
    }
  }

  async captureFaceForLogin() {
    const email = this.loginForm.get('email')?.value;
    const video = document.getElementById('loginCameraPreview') as HTMLVideoElement;
    
    try {
      // Wait a moment for video to stabilize
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Detect face and get descriptor
      const descriptor = await this.faceRecognitionService.detectFace(video);
      
      if (!descriptor) {
        alert('No face detected. Please:\n- Make sure your face is clearly visible\n- Ensure good lighting\n- Wait a moment and try again');
        return;
      }

      // Stop camera
      this.stopCamera();

      this.faceRecognitionService.authenticateWithFace(email, Array.from(descriptor)).subscribe({
        next: (res: any) => {
          if (res.accessToken) {
            localStorage.setItem('accessToken', res.accessToken);
          }
          if (res.user) {
            localStorage.setItem('user', JSON.stringify(res.user));
            const role = res.user.role;

            if (role === 'SUPERADMIN' || role === 'ADMIN') {
              this.router.navigate(['/dashboard']);
            } else {
              this.router.navigate(['/']);
            }
          }
        },
        error: (err) => {
          alert(err.error?.message || 'Face authentication failed. Please try again.');
          this.isFaceIdLoading = false;
          this.showCamera = false;
        },
        complete: () => {
          this.isFaceIdLoading = false;
          this.showCamera = false;
        }
      });
    } catch (error: any) {
      console.error('Face detection error:', error);
      alert('Error detecting face: ' + (error.message || 'Unknown error'));
    }
  }

  cancelFaceLogin() {
    this.stopCamera();
    this.isFaceIdLoading = false;
    this.showCamera = false;
  }

  stopCamera() {
    if (this.videoStream) {
      this.videoStream.getTracks().forEach(track => track.stop());
      this.videoStream = null;
    }
  }

  ngOnDestroy() {
    this.stopCamera();
  }
}
