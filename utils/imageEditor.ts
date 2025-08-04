/**
 * ImageEditor class for handling canvas-based image editing operations
 */
export interface EditOperation {
  type: 'crop' | 'rotate' | 'brightness' | 'contrast';
  params: any;
}

// 性能监控辅助函数
async function recordPerformanceMetric(name: string, value: number, context?: any) {
  try {
    await fetch('/api/performance/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        value,
        unit: 'ms',
        context
      })
    });
  } catch (error) {
    // 静默处理指标记录失败
  }
}

export interface CropParams {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RotateParams {
  angle: number; // in degrees
}

export interface BrightnessParams {
  value: number; // -100 to 100
}

export interface ContrastParams {
  value: number; // -100 to 100
}

export class ImageEditor {
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private originalImage: HTMLImageElement | null = null;
  private currentImage: HTMLImageElement | null = null;
  private history: EditOperation[] = [];
  private historyIndex: number = -1;
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }
    this.context = ctx;
  }

  /**
   * Load an image from URL into the canvas
   */
  async loadImage(url: string): Promise<void> {
    const startTime = performance.now();
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous'; // Enable CORS for the image
      
      img.onload = () => {
        const loadTime = performance.now() - startTime;
        
        // Resize canvas to match image dimensions
        this.canvas.width = img.width;
        this.canvas.height = img.height;
        
        // Draw image on canvas
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.context.drawImage(img, 0, 0);
        
        // Store the original and current image
        this.originalImage = img;
        this.currentImage = img;
        
        // Reset history
        this.history = [];
        this.historyIndex = -1;
        
        // 记录图像加载性能
        recordPerformanceMetric('image.editor_load_time', loadTime, {
          imageWidth: img.width,
          imageHeight: img.height,
          imageSize: img.width * img.height
        });
        
        resolve();
      };
      
      img.onerror = () => {
        const loadTime = performance.now() - startTime;
        recordPerformanceMetric('image.editor_load_error', loadTime, {
          url,
          error: 'Failed to load image'
        });
        reject(new Error('Failed to load image'));
      };
      
      img.src = url;
    });
  }

  /**
   * Apply a crop operation to the canvas
   */
  crop(params: CropParams): void {
    if (!this.currentImage) return;
    
    const startTime = performance.now();
    const { x, y, width, height } = params;
    
    // Create a temporary canvas to hold the cropped image
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    
    if (!tempCtx) return;
    
    // Draw the cropped portion
    tempCtx.drawImage(
      this.canvas,
      x, y, width, height,
      0, 0, width, height
    );
    
    // Update the main canvas
    this.canvas.width = width;
    this.canvas.height = height;
    this.context.clearRect(0, 0, width, height);
    this.context.drawImage(tempCanvas, 0, 0);
    
    // Add to history
    this.addToHistory({
      type: 'crop',
      params
    });
    
    // 记录裁剪操作性能
    const cropTime = performance.now() - startTime;
    recordPerformanceMetric('image.crop_operation', cropTime, {
      originalSize: (this.originalImage?.width || 0) * (this.originalImage?.height || 0),
      croppedSize: width * height,
      cropRatio: (width * height) / ((this.originalImage?.width || 1) * (this.originalImage?.height || 1))
    });
  }

  /**
   * Apply a rotation operation to the canvas
   */
  rotate(params: RotateParams): void {
    if (!this.currentImage) return;
    
    const { angle } = params;
    const radians = (angle * Math.PI) / 180;
    
    // Create a temporary canvas for the rotation
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    
    if (!tempCtx) return;
    
    // Calculate new dimensions to fit the rotated image
    const currentWidth = this.canvas.width;
    const currentHeight = this.canvas.height;
    
    // Calculate the bounding box of the rotated image
    const cos = Math.abs(Math.cos(radians));
    const sin = Math.abs(Math.sin(radians));
    const newWidth = Math.floor(currentWidth * cos + currentHeight * sin);
    const newHeight = Math.floor(currentWidth * sin + currentHeight * cos);
    
    // Set dimensions for the temporary canvas
    tempCanvas.width = newWidth;
    tempCanvas.height = newHeight;
    
    // Move to center of temporary canvas and rotate
    tempCtx.translate(newWidth / 2, newHeight / 2);
    tempCtx.rotate(radians);
    tempCtx.drawImage(
      this.canvas,
      -currentWidth / 2,
      -currentHeight / 2
    );
    
    // Update the main canvas
    this.canvas.width = newWidth;
    this.canvas.height = newHeight;
    this.context.clearRect(0, 0, newWidth, newHeight);
    this.context.drawImage(tempCanvas, 0, 0);
    
    // Add to history
    this.addToHistory({
      type: 'rotate',
      params
    });
  }

  /**
   * Apply brightness adjustment to the canvas
   */
  adjustBrightness(params: BrightnessParams): void {
    if (!this.currentImage) return;
    
    const startTime = performance.now();
    const { value } = params;
    
    // Get image data
    const imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;
    
    // Adjust brightness
    const factor = 1 + value / 100;
    
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, Math.max(0, data[i] * factor));         // Red
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] * factor)); // Green
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] * factor)); // Blue
    }
    
    // Put the modified image data back
    this.context.putImageData(imageData, 0, 0);
    
    // Add to history
    this.addToHistory({
      type: 'brightness',
      params
    });
    
    // 记录亮度调整性能
    const adjustTime = performance.now() - startTime;
    recordPerformanceMetric('image.brightness_adjustment', adjustTime, {
      imageSize: this.canvas.width * this.canvas.height,
      brightnessValue: value,
      pixelCount: data.length / 4
    });
  }

  /**
   * Apply contrast adjustment to the canvas
   */
  adjustContrast(params: ContrastParams): void {
    if (!this.currentImage) return;
    
    const { value } = params;
    
    // Get image data
    const imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;
    
    // Adjust contrast
    const factor = (259 * (value + 255)) / (255 * (259 - value));
    
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128));         // Red
      data[i + 1] = Math.min(255, Math.max(0, factor * (data[i + 1] - 128) + 128)); // Green
      data[i + 2] = Math.min(255, Math.max(0, factor * (data[i + 2] - 128) + 128)); // Blue
    }
    
    // Put the modified image data back
    this.context.putImageData(imageData, 0, 0);
    
    // Add to history
    this.addToHistory({
      type: 'contrast',
      params
    });
  }

  /**
   * Apply an edit operation to the canvas
   */
  applyOperation(operation: EditOperation): void {
    switch (operation.type) {
      case 'crop':
        this.crop(operation.params as CropParams);
        break;
      case 'rotate':
        this.rotate(operation.params as RotateParams);
        break;
      case 'brightness':
        this.adjustBrightness(operation.params as BrightnessParams);
        break;
      case 'contrast':
        this.adjustContrast(operation.params as ContrastParams);
        break;
      default:
        console.warn(`Unknown operation type: ${operation.type}`);
    }
  }

  /**
   * Add an operation to the history stack
   */
  private addToHistory(operation: EditOperation): void {
    // If we're not at the end of the history, remove everything after current index
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }
    
    // Add the new operation
    this.history.push(operation);
    this.historyIndex = this.history.length - 1;
  }

  /**
   * Undo the last operation
   */
  undo(): boolean {
    if (this.historyIndex < 0 || !this.originalImage) return false;
    
    // Decrement the history index
    this.historyIndex--;
    
    // Reload the original image
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.canvas.width = this.originalImage.width;
    this.canvas.height = this.originalImage.height;
    this.context.drawImage(this.originalImage, 0, 0);
    
    // Reapply all operations up to the current history index
    for (let i = 0; i <= this.historyIndex; i++) {
      this.applyOperation(this.history[i]);
    }
    
    return true;
  }

  /**
   * Redo the next operation
   */
  redo(): boolean {
    if (this.historyIndex >= this.history.length - 1) return false;
    
    // Increment the history index
    this.historyIndex++;
    
    // Apply the operation at the current history index
    this.applyOperation(this.history[this.historyIndex]);
    
    return true;
  }

  /**
   * Reset to the original image
   */
  reset(): void {
    if (!this.originalImage) return;
    
    // Reset canvas and redraw original image
    this.canvas.width = this.originalImage.width;
    this.canvas.height = this.originalImage.height;
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.context.drawImage(this.originalImage, 0, 0);
    
    // Reset history
    this.history = [];
    this.historyIndex = -1;
  }

  /**
   * Export the current canvas state as a blob
   */
  export(format: 'png' | 'jpg' = 'png', quality: number = 0.9): Promise<Blob> {
    const startTime = performance.now();
    
    return new Promise((resolve, reject) => {
      try {
        this.canvas.toBlob(
          (blob) => {
            const exportTime = performance.now() - startTime;
            
            if (blob) {
              // 记录导出性能
              recordPerformanceMetric('image.export_operation', exportTime, {
                format,
                quality,
                imageSize: this.canvas.width * this.canvas.height,
                blobSize: blob.size,
                compressionRatio: blob.size / (this.canvas.width * this.canvas.height * 4)
              });
              
              resolve(blob);
            } else {
              recordPerformanceMetric('image.export_error', exportTime, {
                format,
                quality,
                error: 'Failed to create blob'
              });
              reject(new Error('Failed to create blob from canvas'));
            }
          },
          `image/${format}`,
          quality
        );
      } catch (error) {
        const exportTime = performance.now() - startTime;
        recordPerformanceMetric('image.export_error', exportTime, {
          format,
          quality,
          error: error instanceof Error ? error.message : 'unknown_error'
        });
        reject(error);
      }
    });
  }

  /**
   * Get the current canvas as a data URL
   */
  getDataURL(format: 'png' | 'jpg' = 'png', quality: number = 0.9): string {
    return this.canvas.toDataURL(`image/${format}`, quality);
  }
}