import { Injectable } from '@angular/core';
import * as blazeface from '@tensorflow-models/blazeface';
import * as tf from '@tensorflow/tfjs';

@Injectable({
  providedIn: 'root'
})
export class WebcamService {
  private videoElement: HTMLVideoElement | null = null;
  private faceNetModel: tf.GraphModel | null = null;
  private ageGenderModel: tf.LayersModel | null = null;
  private genderLabels: string[] = ['Male', 'Female'];

  constructor() { }

  public async initVideoStream(): Promise<MediaStream | null> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      this.videoElement = document.createElement('video');
      this.videoElement.srcObject = stream;
      this.videoElement.autoplay = true;
      this.videoElement.playsInline = true; // For iOS Safari
      return stream;
    } catch (error) {
      console.error('Error accessing webcam: ', error);
      return null;
    }
  }

  public stopVideoStream(): void {
    if (this.videoElement && this.videoElement.srcObject) {
      const stream = this.videoElement.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      this.videoElement.srcObject = null;
    }
  }

  public async loadModels(): Promise<void> {
    // Load FaceNet model
    this.faceNetModel = await tf.loadGraphModel('https://tfhub.dev/google/tfjs-model/facenet/1/default/1');
    console.log('FaceNet model loaded');

    // Load Age and Gender classifier
    this.ageGenderModel = await tf.loadLayersModel('/assets/models/age-gender-model/model.json');
    console.log('Age and Gender classifier loaded');
  }

  public async detectFaces(): Promise<blazeface.NormalizedFace[]> {
    const model = await blazeface.load();
    if (model && this.videoElement) {
      const predictions = await model.estimateFaces(this.videoElement, false);
      return predictions;
    }
    return [];
  }

  public async extractEmbedding(faceImage: tf.Tensor): Promise<tf.Tensor> {
    if (this.faceNetModel) {
      // Add a batch dimension (1, 160, 160, 3)
      const batchedImage = faceImage.expandDims(0);
      
      // Perform prediction
      const embedding = this.faceNetModel.predict(batchedImage) as tf.Tensor;
      return embedding;
    }
    throw new Error('FaceNet model not loaded');
  }
  
  

  public async predictAgeGender(embedding: tf.Tensor): Promise<{ age: number; gender: string }> {
    if (this.ageGenderModel) {
      // Ensure tensor is properly formatted
      const batchedEmbedding = embedding.expandDims(0);
  
      // Perform prediction
      const predictions = this.ageGenderModel.predict(batchedEmbedding) as tf.Tensor;
  
      // Convert predictions to an array
      const predictionsArray = await predictions.array() as number[];
  
      // Handle the output assuming it contains age and gender information
      const age = predictionsArray[0]; // Age is likely a number
      const genderIndex = Math.round(predictionsArray[1]); // Gender index as a number
  
      // Map numeric index to gender string
      const gender = this.genderLabels[genderIndex] || 'unknown';
  
      return { age, gender };
    }
    throw new Error('Age/Gender model not loaded');
  }
  
  public extractFaceImage(face: blazeface.NormalizedFace): tf.Tensor3D | null {
    if (!this.videoElement) return null;

    const video = this.videoElement;
    const [startX, startY] = face.topLeft as [number, number];
    const [endX, endY] = face.bottomRight as [number, number];

    const width = endX - startX;
    const height = endY - startY;

    // Create a canvas to extract the image data from the video element
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) return null;

    canvas.width = width;
    canvas.height = height;

    // Draw the face region onto the canvas
    context.drawImage(video, startX, startY, width, height, 0, 0, width, height);

    // Get image data from the canvas
    const imageData = context.getImageData(0, 0, width, height);

    // Convert image data to a Tensor
    const faceTensor = tf.browser.fromPixels(imageData);

    return faceTensor;
  }
}

