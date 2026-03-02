import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../../services/auth/auth.service';
import { FaceRecognitionService } from '../../../../services/face-recognition.service';
import { FirstLoginRequiredResponse, SignInResponse } from '../../../../models/auth';

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
  errorMessage = '';
  infoMessage = '';

  loginForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private faceRecognitionService: FaceRecognitionService,
    private router: Router,
    private route: ActivatedRoute
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
    this.route.queryParamMap.subscribe((params) => {
      this.infoMessage = params.get('message') || '';
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onSignIn() {
    this.errorMessage = '';

    if (this.loginForm.invalid || this.isLoading) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    const { email, password } = this.loginForm.value;

    this.authService.signIn({ email, password }).subscribe({
      next: (res: SignInResponse) => {
        if (this.isFirstLoginResponse(res)) {
          this.authService.setOnboardingToken(res.onboardingToken);
          this.router.navigate(['/first-login/change-password'], {
            queryParams: {
              message:
                res.message ||
                'Première connexion détectée. Veuillez définir un nouveau mot de passe.',
            },
          });
          return;
        }

        if (res.accessToken && res.user) {
          this.authService.persistAuthSession(res.accessToken, res.user);
          this.router.navigate([this.authService.getPostLoginRoute(res.user)]);
          return;
        }

        this.errorMessage = 'Réponse de connexion invalide.';
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Erreur lors de la connexion.';
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  private isFirstLoginResponse(res: SignInResponse): res is FirstLoginRequiredResponse {
    return (
      (res as FirstLoginRequiredResponse).requiresPasswordChange === true &&
      !!(res as FirstLoginRequiredResponse).onboardingToken
    );
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
          if (res.accessToken && res.user) {
            this.authService.persistAuthSession(res.accessToken, res.user);
            this.router.navigate([this.authService.getPostLoginRoute(res.user)]);
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
