import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import * as faceapi from 'face-api.js';

@Injectable({
  providedIn: 'root'
})
export class FaceRecognitionService {
  private apiUrl = 'http://localhost:3000/api/face-recognition';
  private modelsLoaded = false;

  constructor(private http: HttpClient) {
    this.loadModels();
  }

  private async loadModels() {
    if (this.modelsLoaded) return;
    
    try {
      const MODEL_URL = '/assets/models';
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
      this.modelsLoaded = true;
      console.log('Face recognition models loaded');
    } catch (error) {
      console.error('Error loading face models:', error);
    }
  }

  async detectFace(imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement): Promise<Float32Array | null> {
    try {
      await this.loadModels();
      
      console.log('Detecting face...');
      const detection = await faceapi
        .detectSingleFace(imageElement, new faceapi.TinyFaceDetectorOptions({
          inputSize: 416,
          scoreThreshold: 0.5
        }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        console.log('No face detected');
        return null;
      }

      console.log('Face detected successfully!');
      return detection.descriptor;
    } catch (error) {
      console.error('Error in detectFace:', error);
      throw error;
    }
  }

  registerFace(userId: string, imageBase64: string, descriptor: number[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, { userId, image: imageBase64, descriptor });
  }

  authenticateWithFace(email: string, descriptor: number[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/authenticate`, { email, descriptor });
  }

  getFaceStatus(userId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/status/${userId}`);
  }

  deleteFaceData(userId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${userId}`);
  }
}
