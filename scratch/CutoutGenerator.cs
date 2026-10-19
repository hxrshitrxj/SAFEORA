using System;
using System.Drawing;
using System.Drawing.Imaging;

namespace CharacterExtraction
{
    public class Processor
    {
        // Exact left contour points of the guard character (y -> x)
        private static readonly double[][] LeftPoints = new double[][]
        {
            new double[] { 85, 490 },
            new double[] { 95, 465 },
            new double[] { 110, 445 },
            new double[] { 125, 430 },
            new double[] { 140, 419 },
            new double[] { 155, 421 },
            new double[] { 170, 425 },
            new double[] { 185, 429 },
            new double[] { 200, 434 },
            new double[] { 215, 443 },
            new double[] { 230, 453 },
            new double[] { 245, 462 },
            new double[] { 260, 471 },
            new double[] { 275, 479 },
            new double[] { 290, 485 },
            new double[] { 305, 485 },
            new double[] { 320, 484 },
            new double[] { 335, 480 },
            new double[] { 350, 476 },
            new double[] { 370, 469 },
            new double[] { 390, 463 },
            new double[] { 410, 458 },
            new double[] { 430, 454 },
            new double[] { 450, 450 },
            new double[] { 470, 444 },
            new double[] { 490, 436 },
            new double[] { 510, 429 },
            new double[] { 530, 423 },
            new double[] { 550, 423 },
            new double[] { 570, 431 },
            new double[] { 590, 441 },
            new double[] { 610, 445 },
            new double[] { 636, 454 }
        };

        // Exact right contour points of the guard character (y -> x)
        private static readonly double[][] RightPoints = new double[][]
        {
            new double[] { 85, 535 },
            new double[] { 100, 570 },
            new double[] { 120, 592 },
            new double[] { 140, 600 },
            new double[] { 160, 598 },
            new double[] { 180, 591 },
            new double[] { 200, 585 },
            new double[] { 220, 592 },
            new double[] { 240, 596 },
            new double[] { 260, 610 },
            new double[] { 280, 624 },
            new double[] { 300, 639 },
            new double[] { 320, 651 },
            new double[] { 340, 657 },
            new double[] { 360, 657 },
            new double[] { 380, 656 },
            new double[] { 400, 653 },
            new double[] { 420, 653 },
            new double[] { 440, 654 },
            new double[] { 460, 657 },
            new double[] { 480, 661 },
            new double[] { 500, 664 },
            new double[] { 520, 666 },
            new double[] { 540, 663 },
            new double[] { 560, 657 },
            new double[] { 580, 637 },
            new double[] { 600, 622 },
            new double[] { 620, 637 },
            new double[] { 636, 645 }
        };

        private static double Interpolate(double[][] table, double y)
        {
            if (y <= table[0][0]) return table[0][1];
            if (y >= table[table.Length - 1][0]) return table[table.Length - 1][1];

            for (int i = 0; i < table.Length - 1; i++)
            {
                if (y >= table[i][0] && y <= table[i + 1][0])
                {
                    double t = (y - table[i][0]) / (table[i + 1][0] - table[i][0]);
                    return table[i][1] + t * (table[i + 1][1] - table[i][1]);
                }
            }
            return table[table.Length - 1][1];
        }

        public static void GenerateCleanCharacter(string inputPath, string outputPath)
        {
            using (Bitmap src = new Bitmap(inputPath))
            {
                int w = src.Width;
                int h = src.Height;

                BitmapData srcData = src.LockBits(
                    new Rectangle(0, 0, w, h),
                    ImageLockMode.ReadOnly,
                    PixelFormat.Format32bppArgb
                );

                byte[] pixels = new byte[srcData.Stride * h];
                System.Runtime.InteropServices.Marshal.Copy(srcData.Scan0, pixels, 0, pixels.Length);
                src.UnlockBits(srcData);

                // Find bounding box
                int minY = 85;
                int maxY = h - 1;
                int minX = 418;
                int maxX = 667;

                int cropW = maxX - minX + 1; // 250px
                int cropH = maxY - minY + 1; // 551px

                Console.WriteLine("Cropping character to: " + cropW + "x" + cropH);

                using (Bitmap outBmp = new Bitmap(cropW, cropH, PixelFormat.Format32bppArgb))
                {
                    BitmapData outData = outBmp.LockBits(
                        new Rectangle(0, 0, cropW, cropH),
                        ImageLockMode.WriteOnly,
                        PixelFormat.Format32bppArgb
                    );

                    byte[] outPixels = new byte[outData.Stride * cropH];

                    for (int cy = 0; cy < cropH; cy++)
                    {
                        int gy = minY + cy;
                        double leftEdge = Interpolate(LeftPoints, gy);
                        double rightEdge = Interpolate(RightPoints, gy);

                        for (int cx = 0; cx < cropW; cx++)
                        {
                            int gx = minX + cx;
                            int inIdx = gy * srcData.Stride + gx * 4;
                            int outIdx = cy * outData.Stride + cx * 4;

                            // Calculate distance to boundary for smooth 1.5px anti-aliased edge
                            double distLeft = gx - leftEdge;
                            double distRight = rightEdge - gx;
                            double dist = Math.Min(distLeft, distRight);

                            float alpha = 0f;
                            if (gy < 87)
                            {
                                // top rim smooth fade
                                double topDist = gy - 85;
                                alpha = (float)Math.Max(0.0, Math.Min(1.0, topDist / 2.0));
                            }
                            else if (dist > 1.2)
                            {
                                alpha = 1.0f;
                            }
                            else if (dist > -1.2)
                            {
                                double t = (dist + 1.2) / 2.4;
                                alpha = (float)(t * t * (3.0 - 2.0 * t));
                            }

                            if (alpha > 0f)
                            {
                                outPixels[outIdx] = pixels[inIdx];         // B
                                outPixels[outIdx + 1] = pixels[inIdx + 1]; // G
                                outPixels[outIdx + 2] = pixels[inIdx + 2]; // R
                                outPixels[outIdx + 3] = (byte)(alpha * 255f); // A
                            }
                            else
                            {
                                outPixels[outIdx] = 0;
                                outPixels[outIdx + 1] = 0;
                                outPixels[outIdx + 2] = 0;
                                outPixels[outIdx + 3] = 0;
                            }
                        }
                    }

                    System.Runtime.InteropServices.Marshal.Copy(outPixels, 0, outData.Scan0, outPixels.Length);
                    outBmp.UnlockBits(outData);

                    outBmp.Save(outputPath, ImageFormat.Png);
                    Console.WriteLine("Saved pixel-perfect character to: " + outputPath);
                }
            }
        }
    }
}
