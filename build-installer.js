const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('====================================================');
console.log('      BẮT ĐẦU QUÁ TRÌNH BUILD SETUP & INSTALLER     ');
console.log('====================================================');

try {
  // 1. Build ứng dụng chính thành ZIP
  console.log('\n[Bước 1/4] Đang đóng gói ứng dụng chính thành file ZIP...');
  execSync('npm run build', { stdio: 'inherit', cwd: __dirname });

  // 2. Tìm file ZIP trong thư mục dist/
  const distDir = path.join(__dirname, 'dist');
  if (!fs.existsSync(distDir)) {
    throw new Error('Thư mục dist/ không tồn tại sau khi build ứng dụng chính.');
  }

  const files = fs.readdirSync(distDir);
  const zipFile = files.find(f => f.endsWith('.zip') && f.includes('win'));

  if (!zipFile) {
    throw new Error('Không tìm thấy file ZIP (.zip) phù hợp của ứng dụng chính trong thư mục dist/.');
  }

  const zipSrcPath = path.join(distDir, zipFile);
  const zipDestPath = path.join(__dirname, 'installer', 'app.zip');

  console.log(`\n[Bước 2/4] Tìm thấy file zip nguồn: ${zipFile}`);
  console.log(`-> Đang sao chép file ZIP đến: ${zipDestPath}`);
  fs.copyFileSync(zipSrcPath, zipDestPath);

  // Sao chép icon vào installer để đóng gói
  const iconSrcDir = path.join(__dirname, 'icon');
  const iconDestDir = path.join(__dirname, 'installer', 'icon');
  if (fs.existsSync(iconSrcDir)) {
    if (!fs.existsSync(iconDestDir)) {
      fs.mkdirSync(iconDestDir, { recursive: true });
    }
    fs.copyFileSync(path.join(iconSrcDir, 'icon.png'), path.join(iconDestDir, 'icon.png'));
    console.log('-> Đã sao chép icon.png sang thư mục installer.');
  }

  // 3. Build installer
  console.log('\n[Bước 3/4] Đang build bộ cài đặt (Installer)...');
  execSync('npx electron-builder --project installer', { stdio: 'inherit', cwd: __dirname });

  // 4. Dọn dẹp file zip trung gian trong installer
  console.log('\n[Bước 4/4] Đang dọn dẹp các tệp tin tạm thời...');
  try {
    fs.unlinkSync(zipDestPath);
    console.log('-> Đã xóa tệp tin app.zip tạm trong installer.');
  } catch (e) {
    console.warn('-> Không thể xóa tệp tin app.zip tạm:', e.message);
  }

  try {
    if (fs.existsSync(path.join(iconDestDir, 'icon.png'))) {
      fs.unlinkSync(path.join(iconDestDir, 'icon.png'));
      fs.rmdirSync(iconDestDir);
      console.log('-> Đã dọn dẹp thư mục icon tạm trong installer.');
    }
  } catch (e) {
    console.warn('-> Không thể dọn dẹp thư mục icon tạm:', e.message);
  }

  console.log('\n====================================================');
  console.log('      HOÀN TẤT BUILD! SẢN PHẨM BỘ CÀI ĐẶT NẰM Ở:   ');
  console.log('      dist-installer/                               ');
  console.log('====================================================\n');

} catch (err) {
  console.error('\nLỗi trong quá trình build:', err.message);
  process.exit(1);
}
