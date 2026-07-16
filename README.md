# YT-DLP Premium Downloader

<p align="center">
  <img src="https://encrypted-tbn1.gstatic.com/images?q=tbn:ANd9GcQwMrImVZAT8f6yUE50e9_QfyWOL2pa6HOLLhwYsl-0nhzd6gUs" alt="YT-DLP Premium Downloader Banner" width="600"/>
</p>

> 💬 "I made this myself because I got so tired of y2mate constantly crashing and not working reliably." 😒


A modern, high-performance, and beautiful desktop application for downloading media from YouTube and other platforms. Built with **Electron** and powered by **yt-dlp**.

Một ứng dụng máy tính hiện đại, hiệu năng cao và giao diện đẹp mắt để tải xuống video/âm thanh từ YouTube và nhiều nền tảng khác. Xây dựng trên nền tảng **Electron** và bộ công cụ mạnh mẽ **yt-dlp**.

---

## 🌐 Language Selector / Chọn ngôn ngữ

* [🇬🇧 English Version](#english-documentation)
* [🇻🇳 Phiên bản Tiếng Việt](#tài-liệu-tiếng-việt)

---

# English Documentation

YT-DLP Downloader is a premium cross-platform desktop wrapper for `yt-dlp`, providing a rich and interactive interface with glassmorphism styling, smooth animations, and robust download control.

## ✨ Features

- **Modern & Premium UI**: Built with a sleek dark mode theme, Outfit typography, custom title bar, glassmorphism cards, and interactive hover effects.
- **Dynamic Link Analysis**: Fetches rich metadata (thumbnail, title, duration, uploader, and all available stream formats) using `yt-dlp --dump-json` before downloading.
- **Automated Dependency Setup & Updater**: On first startup, the app automatically checks, downloads, and configures local `yt-dlp`, `ffmpeg`, and `ffprobe` binaries. An in-app "Update" button allows upgrading `yt-dlp` to its latest release with a single click.
- **Full Playlist Support**: Supports downloading entire playlists/sets (especially optimized for SoundCloud playlists using direct API v2 resolution with high-speed chunked fetching). Users can preview playlist items and selectively check/uncheck tracks to download.
- **Flexible Formats & Quality Presets**:
  - **Video (MP4)**: Support for `Best Quality`, `1080p`, `720p`, and `480p`.
  - **Audio (Music Extraction)**: Convert to high-quality `MP3 (320kbps)`, `MP3 (192kbps)`, lossless `WAV`, or native `M4A`.
- **Metadata & Thumbnail Embedding**: Option to embed full media metadata (title, artist, album, etc.) and cover artwork (automatically converted to JPG) directly into download files.
- **Real-Time Progress Tracking**: Displays active progress percentage, current download speed, estimated total file size, and Estimated Time of Arrival (ETA).
- **Live Logs Console**: Keep track of the actual command-line output from the running `yt-dlp` child process.
- **Rich Download History & File Operations**: Keep track of downloaded videos and audios. Open files directly or copy their absolute paths to the clipboard with platform-optimized formats.
- **Drag and Drop Files**: Drag downloaded items directly from the History list into other applications (e.g., file explorer, video editor, chat window) for instant use.
- **Robust Path Resolution**: Auto-detects final target file paths from logs, with a smart fallback directory scan for recently modified files (last 15 seconds) if log format changes.
- **Local Application Cache**: Sandboxed `userData` directory configured inside the application folder (`electron_user_data`), preventing folder write permission issues and keeping the application fully portable.
- **Interactive Download Management**:
  - Choose custom saving directory through native system dialogs.
  - Abort/Cancel active downloads cleanly at any time (sends `SIGTERM` to the process).
  - Open target download directory directly from the app interface after completion.
- **Optimized for VMs/Sandboxes**: Hardware acceleration and GPU sandbox disabled by default to ensure flawless running on remote desktop connections, virtual environments, and sandbox tools.

## 📋 Prerequisites

The application features an **automated setup wizard** that downloads and configures its own local copies of `yt-dlp`, `ffmpeg`, and `ffprobe` on first launch. 

Therefore, **manual installation is optional**. If you prefer to use system-wide installations, ensure:
1. **Node.js** (v16.x or newer recommended) and **npm** are installed.
2. `yt-dlp`, `ffmpeg`, and `ffprobe` are available in your system's `PATH` (optional fallback).

## 🚀 Getting Started

Follow these steps to run the application locally:

### 1. Clone or Extract the Project
Open your terminal in the project directory:
```bash
cd yt-downloader-electron
```

### 2. Install Dependencies
```bash
npm install
```

*Note: If Electron download fails due to network/cache restrictions in your environment, you can run the manual extraction script provided:*
```bash
node install_electron.js
```

### 3. Start the Application
```bash
npm start
```

### 4. Package/Build for Production (Optional)
To package the application into a zip distribution:
```bash
npm run build
```
To package the application and build the **custom setup installer** (`YT-DLP Downloader Setup 1.0.1.exe`) with auto-downloads of dependencies:
```bash
npm run build:installer
```
To run and test the installer in development mode:
```bash
npm run start:installer
```
The packaged outputs will be saved in `dist/` and `dist-installer/` respectively.

---

## 📂 Project Structure

```
yt-downloader-electron/
├── index.html            # Main UI Layout (HTML5)
├── styles.css            # Custom Styling (Dark Mode, Glassmorphism, Animations)
├── main.js               # Electron Main Process (IPC Handlers, Process Spawning)
├── preload.js            # Electron Preload Script (Secure IPC Bridge)
├── renderer.js           # Frontend Logic & UI Event Handlers
├── build-installer.js    # Integrated installer build pipeline script
├── installer/            # Custom Electron-based installer sub-project
└── package.json          # Node.js Project Configuration & Dependencies
```

---

## 🛠️ Usage Guide

1. **Enter URL**: Paste a valid video/playlist link from YouTube or other supported platforms in the input bar.
2. **Analyze**: Click the **Analyze (Phân tích)** button. The app will fetch details and display the video thumbnail, title, and length.
3. **Configure Options**:
   - Choose whether you want **Video (MP4)** or **Audio**.
   - Select the desired quality option from the dropdown menu.
   - Click the folder icon next to **Save Location** to choose where the downloaded file should be saved.
4. **Download**: Click the **Download** button. Monitor progress, speed, and logs in the download queue.
5. **Manage**: Use the **Cancel (Hủy)** button to abort if needed. Once finished, click **Open Folder (Mở thư mục)** to view your file!

---

# Tài liệu Tiếng Việt

YT-DLP Downloader là ứng dụng máy tính đa nền tảng, đóng gói bộ công cụ `yt-dlp` dưới một giao diện đồ họa hiện đại, trực quan, hỗ trợ hiệu ứng kính mờ (glassmorphism), hoạt ảnh mượt mà cùng khả năng kiểm soát tải xuống mạnh mẽ.

## ✨ Tính năng nổi bật

- **Giao diện Cao cấp & Hiện đại**: Sử dụng tông màu tối (dark mode) chủ đạo, font chữ Outfit thời thượng, thanh tiêu đề tùy biến, các thẻ hiệu ứng kính mờ và tương tác di chuột tinh tế.
- **Phân tích Liên kết Động**: Tự động trích xuất siêu dữ liệu phong phú (ảnh thu nhỏ, tiêu đề, thời lượng, người đăng và danh sách tất cả định dạng luồng có sẵn) thông qua lệnh `yt-dlp --dump-json` trước khi tải.
- **Tự động cấu hình & Cập nhật phụ thuộc**: Trong lần chạy đầu tiên, ứng dụng tự động kiểm tra, tải xuống và cấu hình các thư viện chạy độc lập gồm `yt-dlp`, `ffmpeg`, và `ffprobe`. Nút "Cập nhật" tích hợp giúp nâng cấp `yt-dlp` lên phiên bản mới nhất chỉ với 1 click.
- **Hỗ trợ Playlist với bộ chọn bài**: Hỗ trợ tải toàn bộ danh sách phát (tối ưu hóa đặc biệt cho SoundCloud playlist/set thông qua API v2 tìm nạp phân đoạn tốc độ cao). Người dùng có thể xem trước danh sách phát và chọn/bỏ chọn từng bài hát trước khi tải.
- **Tùy chọn Định dạng & Chất lượng đa dạng**:
  - **Video (MP4)**: Hỗ trợ các độ phân giải `Chất lượng tốt nhất`, `1080p`, `720p`, và `480p`.
  - **Audio (Tách nhạc)**: Chuyển đổi sang `MP3 (320kbps)`, `MP3 (192kbps)`, định dạng không nén `WAV`, hoặc định dạng gốc `M4A`.
- **Nhúng siêu dữ liệu & ảnh bìa**: Tùy chọn nhúng trực tiếp toàn bộ dữ liệu thẻ mô tả (tiêu đề, tác giả, album...) và ảnh thu nhỏ (tự động chuyển đổi sang JPG) vào tệp tin tải về.
- **Theo dõi Tiến trình Thời gian thực**: Hiển thị phần trăm tải xuống, tốc độ tải hiện tại, dung lượng tệp dự kiến và thời gian hoàn thành ước tính (ETA).
- **Hộp thoại Logs trực tiếp**: Hiển thị trực quan đầu ra dòng lệnh (stdout) trực tiếp từ tiến trình con `yt-dlp` đang chạy.
- **Lịch sử tải xuống & Thao tác tệp nhanh**: Lưu trữ lịch sử tải xuống trực quan. Hỗ trợ mở trực tiếp tệp tin hoặc sao chép nhanh đường dẫn tuyệt đối của tệp vào clipboard theo định dạng tối ưu cho từng hệ điều hành.
- **Kéo thả tệp tin (Drag and Drop)**: Người dùng có thể nhấn giữ và kéo thả trực tiếp các mục trong phần Lịch sử tải xuống ra ngoài (ví dụ vào thư mục, phần mềm dựng phim, hoặc ứng dụng chat như Zalo/Messenger).
- **Trích xuất đường dẫn thông minh**: Phân tích logs tiến trình tải để xác định chính xác đường dẫn tệp tin đầu ra, đi kèm cơ chế dự phòng tự động quét các tệp thay đổi gần nhất trong 15 giây nếu định dạng log của yt-dlp thay đổi.
- **Không gian lưu trữ di động (Portable)**: Thư mục dữ liệu ứng dụng (`userData`) được cấu hình nằm ngay bên trong thư mục gốc của dự án (`electron_user_data`), tránh các lỗi phân quyền ghi ổ đĩa hệ thống và giúp ứng dụng dễ dàng di chuyển.
- **Quản lý Tải xuống Trực quan**:
  - Chọn thư mục lưu trữ tùy ý thông qua hộp thoại hệ thống gốc.
  - Hủy/Dừng tiến trình tải xuống đang chạy an toàn bất cứ lúc nào (gửi tín hiệu `SIGTERM` tới tiến trình).
  - Mở nhanh thư mục lưu tệp tải xuống ngay trên giao diện ứng dụng sau khi hoàn tất.
- **Tối ưu hóa cho máy ảo (VM) / Sandbox**: Vô hiệu hóa tăng tốc phần cứng (hardware acceleration) và GPU sandbox theo mặc định để đảm bảo ứng dụng hoạt động ổn định trên các kết nối Remote Desktop, môi trường ảo hóa và sandbox.

## 📋 Yêu cầu Hệ thống

Ứng dụng tích hợp **trình thiết lập tự động** sẽ tự tải và cấu hình các công cụ `yt-dlp`, `ffmpeg` và `ffprobe` trong lần đầu khởi chạy.

Vì vậy, **việc cài đặt thủ công là không bắt buộc**. Nếu bạn muốn cấu hình thủ công cho toàn hệ thống, hãy đảm bảo:
1. Máy tính đã cài đặt **Node.js** (Khuyến nghị v16.x trở lên) và **npm**.
2. Đã thêm `yt-dlp`, `ffmpeg` và `ffprobe` vào biến môi trường `PATH` của hệ thống (tùy chọn dự phòng).

## 🚀 Hướng dẫn Cài đặt & Khởi chạy

Làm theo các bước sau để chạy ứng dụng trên máy của bạn:

### 1. Di chuyển vào thư mục dự án
Mở terminal tại thư mục chứa mã nguồn dự án:
```bash
cd yt-downloader-electron
```

### 2. Cài đặt các gói phụ thuộc (Dependencies)
```bash
npm install
```

*Lưu ý: Nếu quá trình tải Electron bị lỗi do giới hạn mạng hoặc cache trong môi trường của bạn, bạn có thể chạy tập lệnh cài đặt thủ công sau:*
```bash
node install_electron.js
```

### 3. Khởi chạy ứng dụng
```bash
npm start
```

### 4. Đóng gói ứng dụng (Tùy chọn)
Để đóng gói ứng dụng thành tệp zip phân phối:
```bash
npm run build
```
Để đóng gói ứng dụng và tạo **bộ cài đặt setup thông minh** (`YT-DLP Downloader Setup 1.0.1.exe`) tự động tải phụ thuộc (`bin` dependencies):
```bash
npm run build:installer
```
Để chạy thử trình cài đặt trong môi trường phát triển (development):
```bash
npm run start:installer
```
Sản phẩm đóng gói sẽ nằm lần lượt trong thư mục `dist/` và `dist-installer/`.

---

## 📂 Cấu trúc thư mục

```
yt-downloader-electron/
├── index.html            # Giao diện người dùng chính (HTML5)
├── styles.css            # CSS cấu hình giao diện (Dark Mode, Glassmorphism, Animations)
├── main.js               # Tiến trình Electron Main (Xử lý IPC, spawn tiến trình yt-dlp)
├── preload.js            # Cầu nối bảo mật Electron Preload (Secure IPC Bridge)
├── renderer.js           # Logic xử lý tại Frontend & bắt sự kiện giao diện
├── build-installer.js    # Script tự động đóng gói tích hợp bộ cài đặt
├── installer/            # Thư mục mã nguồn của ứng dụng cài đặt (installer)
└── package.json          # Cấu hình dự án Node.js và các thư viện dependencies
```

---

## 🛠️ Hướng dẫn sử dụng

1. **Nhập URL**: Dán đường dẫn video hoặc danh sách phát từ YouTube hoặc các trang web được hỗ trợ vào ô nhập liệu.
2. **Phân tích**: Nhấp nút **Phân tích**. Ứng dụng sẽ tìm nạp thông tin và hiển thị ảnh thu nhỏ (thumbnail), tiêu đề, thời lượng video.
3. **Cấu hình tải**:
   - Chọn định dạng tải xuống là **Video (MP4)** hoặc **Audio (Tách nhạc)**.
   - Chọn chất lượng tải mong muốn từ trình thả xuống.
   - Nhấp vào biểu tượng thư mục bên cạnh **Nơi lưu tệp** để chọn nơi lưu trữ video/âm thanh sau khi tải.
4. **Tải xuống**: Nhấp nút **Tải xuống**. Xem phần trăm, tốc độ tải và các dòng log chi tiết trong hàng đợi tải xuống.
5. **Quản lý**: Bạn có thể bấm nút **Hủy** để dừng tiến trình tải bất cứ lúc nào. Khi tải xong, bấm **Mở thư mục** để xem tệp tin đã tải!

---

## 📄 License / Giấy phép

Distributed under the ISC License. Xem `package.json` để biết thêm chi tiết.

Phát triển bởi **Antigravity**.
