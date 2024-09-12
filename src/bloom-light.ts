import { getRGBString, RGBColor } from './color';

export interface Point {
  x: number;
  y: number;
  angle: number;
}

export interface DrawLightOptions {
  /**
   * 고유 아이디
   */
  id: string;

  /**
   * 중심 좌표 x
   */
  x: number;

  /**
   * 중심 좌표 y
   */
  y: number;

  /**
   * 최소 반지름
   */
  minRadius: number;

  /**
   * 최대 반지름
   */
  maxRadius: number;

  /**
   * 점 개수
   */
  pointCount?: number;

  /**
   * 빛 색상
   */
  lightColor: RGBColor;

  /**
   * 배경 색상
   */
  backgroundColor: string;
}

export class BloomLight {
  private pointsMap: Map<string, Point[]> = new Map();

  private scale = 1;

  private scaleDirection = 1;

  private ctx: CanvasRenderingContext2D;

  private canvas: HTMLCanvasElement;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
    this.canvas = ctx.canvas;
  }

  clearRect() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawLight({
    id,
    x,
    y,
    minRadius,
    maxRadius,
    pointCount = 15,
    backgroundColor,
    lightColor,
  }: DrawLightOptions) {
    const points = this.pointsMap.get(id);

    if (!this.pointsMap.has(id) || this.pointsMap.get(id)?.length === 0) {
      let prevAngle = 0;
      const angleIncrements = (Math.PI * 2) / pointCount;
      const newPoints = Array.from({ length: pointCount }, () => {
        // 0 ~ 360 순서대로 돌면서 랜덤한 좌표를 생성
        prevAngle += angleIncrements + (Math.random() * 0.2 - 0.1);
        const radius = minRadius + (maxRadius - minRadius) * Math.random();
        const pointX = x + Math.cos(prevAngle) * radius;
        const pointY = y + Math.sin(prevAngle) * radius;

        return {
          x: pointX,
          y: pointY,
          angle: prevAngle,
        };
      });

      this.pointsMap.set(id, newPoints);
    }

    if (!points) {
      return;
    }

    this.scale += 0.0001 * this.scaleDirection;

    // 커지거나 작아지는 방향 변환
    if (this.scale > 1.005 || this.scale < 0.995) {
      this.scaleDirection *= -1;
    }

    // // 점들 그리기 (테스트용)
    // for (let i = 0; i < points.length; i++) {
    //   this.ctx.beginPath();
    //   this.ctx.arc(points[i].x, points[i].y, 3, 0, Math.PI * 2); // 작은 원으로 각 점 표시
    //   this.ctx.fillStyle = 'red'; // 점 색상을 빨간색으로 설정
    //   this.ctx.fill();
    //   this.ctx.closePath();
    // }

    // // center point (test)
    // this.ctx.beginPath();
    // this.ctx.arc(x, y, 10, 0, Math.PI * 2);
    // this.ctx.fillStyle = 'green'; // 점 색상을 빨간색으로 설정
    // this.ctx.fill();
    // this.ctx.closePath();

    this.ctx.beginPath();
    this.ctx.moveTo((points[0].x - x) * this.scale + x, (points[0].y - y) * this.scale + y);

    for (let i = 1; i < points.length; i++) {
      const nextPoint = points[i];
      const controlPoint = {
        x: ((points[i - 1].x + nextPoint.x) / 2 - x) * this.scale + x, // 중심을 기준으로 스케일 적용
        y: ((points[i - 1].y + nextPoint.y) / 2 - y) * this.scale + y,
      };

      // 점과 점을 이어주는 곡선을 그림 (휨 강도는 controlPoint에 따라 변동)
      this.ctx.quadraticCurveTo(
        controlPoint.x,
        controlPoint.y,
        (nextPoint.x - x) * this.scale + x, // 중심을 기준으로 크기 변동 적용
        (nextPoint.y - y) * this.scale + y,
      );
    }
    this.ctx.closePath();

    // 점 사이의 그라디언트 효과 (빛의 자연스러운 확산)
    const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, maxRadius);
    gradient.addColorStop(0, getRGBString(lightColor, 0.6));
    gradient.addColorStop(0.5, getRGBString(lightColor, 0.4));
    gradient.addColorStop(1, backgroundColor);

    this.ctx.filter = 'blur(15px)';
    this.ctx.fillStyle = gradient;
    this.ctx.fill();
  }
}
