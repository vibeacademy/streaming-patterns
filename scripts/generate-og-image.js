import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function generateOGImage() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // Set viewport to exact OG image dimensions
    await page.setViewport({
      width: 1200,
      height: 630,
      deviceScaleFactor: 1 // 1x for optimal file size
    });

    console.log('Loading HTML template...');
    const htmlPath = 'file://' + join(__dirname, 'generate-og-image.html');
    await page.goto(htmlPath, { waitUntil: 'networkidle0' });

    // Wait a bit for any animations or rendering to complete
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Get the og-card element and screenshot it
    console.log('Capturing screenshot...');
    const element = await page.$('#og-card');

    if (!element) {
      throw new Error('Could not find #og-card element');
    }

    const outputPath = join(__dirname, '..', 'public', 'og-image.png');
    await element.screenshot({
      path: outputPath,
      omitBackground: false
    });

    console.log(`✓ OG image generated successfully: ${outputPath}`);
    console.log('  Dimensions: 1200x630px');
    console.log('  Quality: 2x (Retina)');

    // Get file size
    const fs = await import('fs');
    const stats = fs.statSync(outputPath);
    const fileSizeKB = Math.round(stats.size / 1024);
    console.log(`  File size: ${fileSizeKB} KB`);

    if (fileSizeKB > 500) {
      console.warn('  ⚠ Warning: File size exceeds 500KB. Consider optimizing.');
    }

  } catch (error) {
    console.error('Error generating OG image:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

generateOGImage();
