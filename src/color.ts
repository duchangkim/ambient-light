export interface GetAverageColorParams {
  imageData: ImageData;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

/**
 * 영역의 평균 색상을 구하는 함수
 */
export const getAverageColor = ({
  imageData,
  startX,
  startY,
  endX,
  endY,
}: GetAverageColorParams): RGBColor => {
  let rTotal = 0;
  let gTotal = 0;
  let bTotal = 0;
  let pixelCount = 0;

  for (let y = startY; y <= endY; y++) {
    for (let x = startX; x <= endX; x++) {
      // RGBA로 순서대로 구성되어있기 때문에 4를 곱하는것임
      // 그래서 image.data[index] -> 0, 1, 2가 순서대로 rgb가 되는것임
      const index = (y * imageData.width + x) * 4;

      rTotal += imageData.data[index]; // R
      gTotal += imageData.data[index + 1]; // G
      bTotal += imageData.data[index + 2]; // B
      pixelCount++;
    }
  }

  return {
    r: rTotal / pixelCount,
    g: gTotal / pixelCount,
    b: bTotal / pixelCount,
  };
};

export const getRGBString = (rgbColor: RGBColor, alpha?: number): string => {
  if (alpha) {
    return `rgba(${rgbColor.r},${rgbColor.g},${rgbColor.b},${alpha})`;
  }

  return `rgb(${rgbColor.r},${rgbColor.g},${rgbColor.b})`;
};
