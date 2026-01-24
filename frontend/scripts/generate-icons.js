const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  sourceIcon: path.join(__dirname, '../../assets/main/icon.png'),
  sourceLogo: path.join(__dirname, '../../assets/main/logo.png'),
  outputDir: path.join(__dirname, '../assets/generated'),
  appDir: path.join(__dirname, '../mobile/assets'),
};

// Required sizes for different platforms
const SIZES = {
  // iOS App Icons
  ios: {
    'Icon-60@2x.png': 120,
    'Icon-60@3x.png': 180,
    'Icon-72@2x.png': 144,
    'Icon-72@3x.png': 216,
    'Icon-76@2x.png': 152,
    'Icon-76@3x.png': 228,
    'Icon-83.5@2x.png': 167,
    'Icon-small@2x.png': 58,
    'Icon-small@3x.png': 87,
    'Icon-40@2x.png': 80,
    'Icon-40@3x.png': 120,
    'Icon-20@2x.png': 40,
    'Icon-20@3x.png': 60,
    'Icon.png': 57,
    'Icon@2x.png': 114,
    'Icon-72.png': 72,
    'Icon-72@2x.png': 144,
    'Icon-76.png': 76,
    'Icon-76@2x.png': 152,
    'Icon-small.png': 29,
    'Icon-small@2x.png': 58,
    'Icon-40.png': 40,
    'Icon-40@2x.png': 80,
    'Icon-20.png': 20,
    'Icon-20@2x.png': 40,
  },
  
  // Android App Icons
  android: {
    'mipmap-mdpi/ic_launcher.png': 48,
    'mipmap-hdpi/ic_launcher.png': 72,
    'mipmap-xhdpi/ic_launcher.png': 96,
    'mipmap-xxhdpi/ic_launcher.png': 144,
    'mipmap-xxxhdpi/ic_launcher.png': 192,
    'mipmap-mdpi/ic_launcher_round.png': 48,
    'mipmap-hdpi/ic_launcher_round.png': 72,
    'mipmap-xhdpi/ic_launcher_round.png': 96,
    'mipmap-xxhdpi/ic_launcher_round.png': 144,
    'mipmap-xxxhdpi/ic_launcher_round.png': 192,
  },
  
  // Web Icons
  web: {
    'favicon.ico': [16, 32, 48],
    'favicon-16x16.png': 16,
    'favicon-32x32.png': 32,
    'apple-touch-icon.png': 180,
    'android-chrome-192x192.png': 192,
    'android-chrome-512x512.png': 512,
    'icon-192x192.png': 192,
    'icon-512x512.png': 512,
  },
  
  // App Store & Play Store
  stores: {
    'icon-1024.png': 1024, // App Store
    'play-store-icon.png': 512, // Play Store
  },
  
  // Splash Screens (optional)
  splash: {
    'splash-1242x2436.png': { width: 1242, height: 2436 }, // iPhone X
    'splash-1125x2436.png': { width: 1125, height: 2436 }, // iPhone XR
    'splash-1080x1920.png': { width: 1080, height: 1920 }, // Most Android
    'splash-2048x2732.png': { width: 2048, height: 2732 }, // iPad Pro
  }
};

// Check if source files exist
function checkSourceFiles() {
  const iconExists = fs.existsSync(CONFIG.sourceIcon);
  const logoExists = fs.existsSync(CONFIG.sourceLogo);
  
  console.log('🔍 Checking source files...');
  console.log(`Icon file exists: ${iconExists ? '✅' : '❌'} (${CONFIG.sourceIcon})`);
  console.log(`Logo file exists: ${logoExists ? '✅' : '❌'} (${CONFIG.sourceLogo})`);
  
  if (!iconExists) {
    throw new Error(`❌ Source icon file not found: ${CONFIG.sourceIcon}`);
  }
  
  if (!logoExists) {
    console.log('⚠️  Logo file not found, skipping logo generation');
  }
  
  return { iconExists, logoExists };
}

// Create output directories
function createDirectories() {
  const dirs = [
    CONFIG.outputDir,
    path.join(CONFIG.outputDir, 'ios'),
    path.join(CONFIG.outputDir, 'android'),
    path.join(CONFIG.outputDir, 'web'),
    path.join(CONFIG.outputDir, 'stores'),
    path.join(CONFIG.outputDir, 'splash'),
    path.join(CONFIG.appDir, 'icon'),
    path.join(CONFIG.appDir, 'icon/ios'),
    path.join(CONFIG.appDir, 'icon/android'),
    path.join(CONFIG.appDir, 'splash'),
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    }
  });
}

// Clean previous generated files
function cleanPreviousFiles() {
  console.log('🧹 Cleaning previous generated files...');
  
  function cleanDir(dir) {
    if (fs.existsSync(dir)) {
      fs.readdirSync(dir).forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isFile()) {
          fs.unlinkSync(filePath);
          console.log(`🗑️  Deleted: ${filePath}`);
        }
      });
    }
  }
  
  // Clean all generated directories
  cleanDir(CONFIG.outputDir);
  cleanDir(path.join(CONFIG.appDir, 'icon'));
  cleanDir(path.join(CONFIG.appDir, 'splash'));
}

// Generate single icon
async function generateIcon(sourcePath, outputPath, size, isSplash = false) {
  try {
    let sharpInstance = sharp(sourcePath);
    
    if (isSplash && typeof size === 'object') {
      // For splash screens with specific dimensions
      sharpInstance = sharpInstance
        .resize(size.width, size.height, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        });
    } else {
      // For square icons
      sharpInstance = sharpInstance
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        });
    }
    
    await sharpInstance.png({ quality: 90 }).toFile(outputPath);
    console.log(`✅ Generated: ${outputPath} (${size}px)`);
  } catch (error) {
    console.error(`❌ Error generating ${outputPath}:`, error.message);
  }
}

// Generate ICO file with multiple sizes
async function generateIco(sourcePath, outputPath, sizes) {
  try {
    const buffers = [];
    
    for (const size of sizes) {
      const buffer = await sharp(sourcePath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toBuffer();
      
      buffers.push(buffer);
    }
    
    // Combine into ICO file
    const icoBuffer = await sharp(buffers[0]) // Use largest as base
      .toFile(outputPath);
    
    console.log(`✅ Generated: ${outputPath} (ICO with sizes: ${sizes.join(', ')}px)`);
  } catch (error) {
    console.error(`❌ Error generating ${outputPath}:`, error.message);
  }
}

// Generate all icons
async function generateAllIcons() {
  console.log('🎨 Starting icon generation...');
  
  const { iconExists, logoExists } = checkSourceFiles();
  
  if (!iconExists) {
    console.log('❌ Cannot proceed without source icon file');
    return;
  }
  
  createDirectories();
  cleanPreviousFiles();
  
  // Generate iOS icons
  console.log('\n📱 Generating iOS icons...');
  for (const [filename, size] of Object.entries(SIZES.ios)) {
    const outputPath = path.join(CONFIG.outputDir, 'ios', filename);
    const appPath = path.join(CONFIG.appDir, 'icon/ios', filename);
    
    await generateIcon(CONFIG.sourceIcon, outputPath, size);
    await generateIcon(CONFIG.sourceIcon, appPath, size);
  }
  
  // Generate Android icons
  console.log('\n🤖 Generating Android icons...');
  for (const [filename, size] of Object.entries(SIZES.android)) {
    const outputPath = path.join(CONFIG.outputDir, 'android', filename);
    const appPath = path.join(CONFIG.appDir, 'icon/android', filename);
    
    await generateIcon(CONFIG.sourceIcon, outputPath, size);
    await generateIcon(CONFIG.sourceIcon, appPath, size);
  }
  
  // Generate Web icons
  console.log('\n🌐 Generating Web icons...');
  for (const [filename, size] of Object.entries(SIZES.web)) {
    const outputPath = path.join(CONFIG.outputDir, 'web', filename);
    
    if (filename === 'favicon.ico') {
      await generateIco(CONFIG.sourceIcon, outputPath, size);
    } else {
      await generateIcon(CONFIG.sourceIcon, outputPath, size);
    }
  }
  
  // Generate Store icons
  console.log('\🏪 Generating Store icons...');
  for (const [filename, size] of Object.entries(SIZES.stores)) {
    const outputPath = path.join(CONFIG.outputDir, 'stores', filename);
    await generateIcon(CONFIG.sourceIcon, outputPath, size);
  }
  
  // Generate Splash screens (optional)
  console.log('\n💦 Generating Splash screens...');
  for (const [filename, dimensions] of Object.entries(SIZES.splash)) {
    const outputPath = path.join(CONFIG.outputDir, 'splash', filename);
    const appPath = path.join(CONFIG.appDir, 'splash', filename);
    
    await generateIcon(CONFIG.sourceIcon, outputPath, dimensions, true);
    await generateIcon(CONFIG.sourceIcon, appPath, dimensions, true);
  }
  
  console.log('\n🎉 Icon generation completed!');
  console.log(`📂 Generated files location: ${CONFIG.outputDir}`);
  console.log(`📱 App files location: ${CONFIG.appDir}`);
}

// Update app.json with icon paths
function updateAppJson() {
  const appJsonPath = path.join(__dirname, '../mobile/app.json');
  
  if (!fs.existsSync(appJsonPath)) {
    console.log('⚠️  app.json not found, skipping update');
    return;
  }
  
  try {
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    
    // Update icon paths
    appJson.icon = './assets/icon/icon.png';
    appJson.splash = {
      image: './assets/splash/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff'
    };
    
    // Update iOS icons
    if (!appJson.ios) appJson.ios = {};
    appJson.ios.icon = './assets/icon/ios/Icon.png';
    
    // Update Android icons
    if (!appJson.android) appJson.android = {};
    appJson.android.icon = './assets/icon/android/ic_launcher.png';
    appJson.android.adaptiveIcon = {
      foregroundImage: './assets/icon/android/ic_launcher_foreground.png',
      backgroundColor: '#FFFFFF'
    };
    
    fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));
    console.log('✅ Updated app.json with new icon paths');
  } catch (error) {
    console.error('❌ Error updating app.json:', error.message);
  }
}

// Main execution
async function main() {
  try {
    console.log('🚀 Starting Dwellix icon generation...\n');
    
    await generateAllIcons();
    updateAppJson();
    
    console.log('\n✨ All done! Your Dwellix app icons are ready to use.');
    console.log('\n📋 Next steps:');
    console.log('1. Check the generated icons in assets/generated/');
    console.log('2. Update your app.json if needed');
    console.log('3. Run your Expo app to test the icons');
    console.log('4. Commit the generated files to your repository');
    
  } catch (error) {
    console.error('\n❌ Icon generation failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { generateAllIcons, updateAppJson };
