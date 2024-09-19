import { createNoise2D } from 'simplex-noise';
import { getAverageColor, RGBColor } from './color';
import { BloomLight } from './bloom-light';

export interface CornerColors {
  topLeft: RGBColor;
  topRight: RGBColor;
  bottomLeft: RGBColor;
  bottomRight: RGBColor;
}

export class AmbientLight {
  private video: HTMLVideoElement;

  /**
   * 비디오의 화면을 그려서 앰비언트 라이트에 사용할 색상을 뽑기 위한 캔버스
   */
  private virtualCanvas: HTMLCanvasElement;

  private virtualCanvasContext: CanvasRenderingContext2D | null;

  private ambientLightCanvas: HTMLCanvasElement | null = null;

  private ambientLightCanvasContext: CanvasRenderingContext2D | null = null;

  private cornerColors: CornerColors | null = null;

  noise = createNoise2D();

  private bloomLight: BloomLight | null = null;

  private animationFrameId: number | null = null;

  constructor(video: HTMLVideoElement) {
    console.log('AmbientLight created');

    this.video = video;
    this.virtualCanvas = document.createElement('canvas');
    this.virtualCanvas.width = 10;
    this.virtualCanvas.height = 6;
    this.virtualCanvasContext = this.virtualCanvas.getContext('2d', { willReadFrequently: true });

    // this.video.parentElement?.appendChild(this.virtualCanvas);
    // this.video.parentElement?.appendChild(this.ambientLightCanvas);

    this.initAmbientLightDOM();
  }

  initAmbientLightDOM() {
    this.ambientLightCanvas = document.createElement('canvas');
    this.ambientLightCanvas.id = 'ambientLightCanvas+uuid';
    this.ambientLightCanvas.style.position = 'absolute';
    this.ambientLightCanvas.style.top = '0';
    this.ambientLightCanvas.style.left = '0';
    this.ambientLightCanvas.style.width = '100%';
    this.ambientLightCanvas.style.transform = 'scale(1.4)';
    this.ambientLightCanvas.style.zIndex = '-1';
    this.ambientLightCanvas.width = this.video.videoWidth;
    this.ambientLightCanvas.height = this.video.videoHeight;

    this.ambientLightCanvasContext = this.ambientLightCanvas.getContext('2d', {
      willReadFrequently: true,
    });

    const videoParent = this.video.parentElement;
    const fragment = document.createDocumentFragment();
    const ambientLightWrapper = document.createElement('div');
    ambientLightWrapper.id = 'ambientLightWrapper+uuid';
    ambientLightWrapper.style.position = 'relative';

    fragment.appendChild(ambientLightWrapper);
    ambientLightWrapper.appendChild(this.ambientLightCanvas);
    ambientLightWrapper.appendChild(this.video);

    videoParent?.appendChild(fragment);
  }

  drawVideoFrameInVirtualCanvas() {
    if (!this.virtualCanvasContext) {
      return;
    }

    // 100분의 1 크기로 그림 픽셀을 뭉개서 가장자리 색상을 뽑기 위함
    this.virtualCanvasContext.drawImage(
      this.video,
      0,
      0,
      this.video.videoWidth,
      this.video.videoHeight,
      0,
      0,
      this.virtualCanvas.width,
      this.virtualCanvas.height,
    );

    this.virtualCanvasContext.imageSmoothingEnabled = false;
    this.virtualCanvasContext.filter = 'blur(1px)';
  }

  getCornerAverageColors() {
    if (!this.virtualCanvasContext) {
      return null;
    }

    const { width, height } = this.virtualCanvas;
    const imageData = this.virtualCanvasContext.getImageData(
      0,
      0,
      this.virtualCanvas.width,
      this.virtualCanvas.height,
    );

    // 각 꼭짓점에서 regionSize * regionSize 영역
    const regionSize = 2;

    return {
      topLeft: getAverageColor({
        imageData,
        startX: 0,
        startY: 0,
        endX: regionSize,
        endY: regionSize,
      }),
      topRight: getAverageColor({
        imageData,
        startX: width - regionSize,
        startY: 0,
        endX: width - 1,
        endY: regionSize,
      }),
      bottomLeft: getAverageColor({
        imageData,
        startX: 0,
        startY: height - regionSize,
        endX: regionSize,
        endY: height - 1,
      }),
      bottomRight: getAverageColor({
        imageData,
        startX: width - regionSize,
        startY: height - regionSize,
        endX: width - 1,
        endY: height - 1,
      }),
    };
  }

  draw() {
    const maxRadius = 200;
    const minRadius = 180;

    this.drawVideoFrameInVirtualCanvas();
    this.cornerColors = this.getCornerAverageColors();
    // this.displayColors();

    this.bloomLight?.clearRect();
    this.bloomLight?.drawLight({
      x: maxRadius,
      y: maxRadius,
      maxRadius,
      minRadius,
      pointCount: 15,
      lightColor: this.cornerColors!.topLeft,
      backgroundColor: 'rgba(24,24,27,0.1)',
      id: 'topLeft',
    });

    this.bloomLight?.drawLight({
      x: this.ambientLightCanvas!.width - maxRadius,
      y: maxRadius,
      maxRadius,
      minRadius,
      lightColor: this.cornerColors!.topRight,
      backgroundColor: 'rgba(24,24,27,0.1)',
      id: 'topRight',
    });

    this.bloomLight?.drawLight({
      x: this.ambientLightCanvas!.width / 2.5,
      y: maxRadius,
      maxRadius,
      minRadius,
      lightColor: this.cornerColors!.topLeft,
      backgroundColor: 'rgba(24,24,27,0.1)',
      id: 'topCenterLeft',
    });

    this.bloomLight?.drawLight({
      x: this.ambientLightCanvas!.width - this.ambientLightCanvas!.width / 2.5,
      y: maxRadius,
      maxRadius,
      minRadius,
      lightColor: this.cornerColors!.topRight,
      backgroundColor: 'rgba(24,24,27,0.1)',
      id: 'topCenterRight',
    });

    this.bloomLight?.drawLight({
      x: maxRadius,
      y: this.ambientLightCanvas!.height - maxRadius,
      maxRadius,
      minRadius,
      lightColor: this.cornerColors!.bottomLeft,
      backgroundColor: 'rgba(24,24,27,0.1)',
      id: 'bottomLeft',
    });

    this.bloomLight?.drawLight({
      x: this.ambientLightCanvas!.width - maxRadius,
      y: this.ambientLightCanvas!.height - maxRadius,
      maxRadius,
      minRadius,
      lightColor: this.cornerColors!.bottomRight,
      backgroundColor: 'rgba(24,24,27,0.1)',
      id: 'bottomRight',
    });

    this.bloomLight?.drawLight({
      x: this.ambientLightCanvas!.width / 2.5,
      y: this.ambientLightCanvas!.height - maxRadius,
      maxRadius,
      minRadius,
      lightColor: this.cornerColors!.bottomLeft,
      backgroundColor: 'rgba(24,24,27,0.1)',
      id: 'bottomCenterLeft',
    });

    this.bloomLight?.drawLight({
      x: this.ambientLightCanvas!.width - this.ambientLightCanvas!.width / 2.5,
      y: this.ambientLightCanvas!.height - maxRadius,
      maxRadius,
      minRadius,
      lightColor: this.cornerColors!.bottomRight,
      backgroundColor: 'rgba(24,24,27,0.1)',
      id: 'bottomCenterRight',
    });

    this.animationFrameId = requestAnimationFrame(this.draw.bind(this));
  }

  public on() {
    this.video.addEventListener('play', () => {
      this.drawVideoFrameInVirtualCanvas();
      this.cornerColors = this.getCornerAverageColors();
      this.bloomLight = new BloomLight(this.ambientLightCanvasContext!);

      this.draw.bind(this)();
    });

    this.video.addEventListener('pause', () => {
      if (!this.animationFrameId) {
        return;
      }

      cancelAnimationFrame(this.animationFrameId);
    });
  }
}
