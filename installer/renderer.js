// Translations Dictionary (5 Languages)
const translations = {
  vi: {
    appName: "Nyanko's Media Downloader Setup",
    langTitle: "Chọn ngôn ngữ cài đặt",
    langSubtitle: "Vui lòng chọn ngôn ngữ hiển thị để tiếp tục",
    langNext: "Tiếp tục",
    
    welcomeTitle: "Chào mừng đến với Nyanko's Media Downloader",
    welcomeVersion: "Phiên bản 1.2.0 • Tabby Neko Edition",
    welcomeDescTitle: "Giới thiệu ứng dụng",
    welcomeDescBody: "Nyanko's Media Downloader là ứng dụng tải xuống video, nhạc chất lượng cao mượt mà từ YouTube, TikTok, Facebook, SoundCloud và hơn 1000+ trang web khác.",
    feat1: "Hỗ trợ Full HD / 4K / 60fps",
    feat2: "Tách nhạc MP3 / FLAC cực nhanh",
    feat3: "Bao gồm yt-dlp & ffmpeg mới nhất",
    feat4: "Tích hợp Chrome Extension tiện lợi",
    welcomeBack: "Quay lại",
    welcomeNext: "Bắt đầu thiết lập",

    optionsTitle: "Tùy chọn Cài đặt",
    optionsSubtitle: "Chọn chế độ cài đặt và đường dẫn lưu trữ ứng dụng",
    modeLocalTitle: "Cài đặt vào Máy (Local)",
    modeLocalDesc: "Khuyên dùng. Cài đặt vào hệ thống, tự động tạo shortcut ở Start Menu và Desktop.",
    modePortableTitle: "Bản Di động (Portable)",
    modePortableDesc: "Giải nén toàn bộ phần mềm & dependency vào 1 thư mục riêng (dễ dàng chép vào USB).",
    installPathLabel: "Đường dẫn thư mục cài đặt:",
    browseBtn: "Duyệt...",
    depSourceTitle: "Nguồn phân phối Dependency (yt-dlp & FFmpeg):",
    sourceBinTitle: "Tải trực tiếp vào bin/",
    sourceBinDesc: "Nhanh, độc lập, không cần Admin",
    sourceWingetTitle: "Cài qua Winget (System)",
    sourceWingetDesc: "Quản lý gói Windows Package Manager",
    optionsBack: "Quay lại",
    optionsInstall: "Bắt đầu Cài đặt",

    progressTitle: "Đang cài đặt phần mềm",
    progressSubtitle: "Vui lòng chờ trong khi hệ thống sao chép file và kiểm tra dependency...",
    statusExtract: "Giải nén tập tin ứng dụng chính...",
    statusYtdlp: "Kiểm tra dependency: yt-dlp.exe...",
    statusFfmpeg: "Kiểm tra dependency: ffmpeg.exe...",
    statusFfprobe: "Kiểm tra dependency: ffprobe.exe...",
    waiting: "Đang chờ...",
    ready: "Đã có sẵn",
    downloading: "Đang tải",
    installedSuccess: "Cài đặt thành công",
    preparing: "Đang chuẩn bị...",

    extTitle: "Cài đặt Extension cho Trình duyệt Chrome?",
    extSubtitle: "Giúp tự động phát hiện link tải video/nhạc trực tiếp từ Chrome",
    extOptionTitle: "Tích hợp Chrome Extension tiện lợi",
    extOptionDesc: "Tự động sao chép bộ Extension vào thư mục phần mềm để bạn dễ dàng load unpacked vào Google Chrome / Edge / Cốc Cốc.",
    extGuideTitle: "📌 Cách kích hoạt Extension sau khi cài đặt:",
    extGuideSteps: [
      "Mở trình duyệt Google Chrome và truy cập chrome://extensions",
      "Bật nút Developer mode (Chế độ dành cho nhà phát triển) ở góc trên bên phải",
      "Bấm Load unpacked (Tải tiện ích đã giải nén) và chọn thư mục chrome-extension"
    ],
    extSkip: "Bỏ qua",
    extNext: "Tiếp tục",

    finishTitle: "Hoàn tất Cài đặt thành công!",
    finishSubtitle: "Nyanko's Media Downloader đã sẵn sàng để sử dụng",
    finishOptionsTitle: "Tùy chọn tạo lối tắt:",
    finishDesktop: "Tạo lối tắt trên Màn hình chính (Desktop Shortcut)",
    finishStart: "Ghim ứng dụng vào Start Menu",
    finishTaskbar: "Ghim ứng dụng vào Thanh tác vụ (Taskbar)",
    finishLaunch: "Khởi chạy Nyanko's Media Downloader ngay bây giờ",
    finishBtn: "Hoàn tất & Đóng"
  },

  en: {
    appName: "Nyanko's Media Downloader Setup",
    langTitle: "Choose Installation Language",
    langSubtitle: "Select your preferred language to continue",
    langNext: "Next",

    welcomeTitle: "Welcome to Nyanko's Media Downloader",
    welcomeVersion: "Version 1.2.0 • Tabby Neko Edition",
    welcomeDescTitle: "Application Overview",
    welcomeDescBody: "Nyanko's Media Downloader is a high-speed media application for downloading videos and audio from YouTube, TikTok, Facebook, SoundCloud, and 1000+ sites.",
    feat1: "Supports Full HD / 4K / 60fps",
    feat2: "High quality MP3 / FLAC extraction",
    feat3: "Includes latest yt-dlp & ffmpeg engine",
    feat4: "Integrated Chrome Extension support",
    welcomeBack: "Back",
    welcomeNext: "Start Setup",

    optionsTitle: "Installation Options",
    optionsSubtitle: "Select your installation mode and destination directory",
    modeLocalTitle: "System Installation (Local)",
    modeLocalDesc: "Recommended. Installs into program directory with Start Menu & Desktop shortcuts.",
    modePortableTitle: "Portable Mode",
    modePortableDesc: "Extracts all binaries & dependencies into a self-contained folder (perfect for USB).",
    installPathLabel: "Destination Folder Path:",
    browseBtn: "Browse...",
    depSourceTitle: "Dependency Distribution Channel (yt-dlp & FFmpeg):",
    sourceBinTitle: "Direct Download to bin/",
    sourceBinDesc: "Fast, standalone, no admin required",
    sourceWingetTitle: "Install via Winget (System)",
    sourceWingetDesc: "Windows Package Manager CLI",
    optionsBack: "Back",
    optionsInstall: "Start Installation",

    progressTitle: "Installing Application",
    progressSubtitle: "Please wait while files are extracted and dependencies checked...",
    statusExtract: "Extracting main application package...",
    statusYtdlp: "Checking dependency: yt-dlp.exe...",
    statusFfmpeg: "Checking dependency: ffmpeg.exe...",
    statusFfprobe: "Checking dependency: ffprobe.exe...",
    waiting: "Waiting...",
    ready: "Ready (Skipped)",
    downloading: "Downloading",
    installedSuccess: "Installed successfully",
    preparing: "Preparing...",

    extTitle: "Install Chrome Browser Extension?",
    extSubtitle: "Automatically capture media links directly while browsing Chrome",
    extOptionTitle: "Include Chrome Extension package",
    extOptionDesc: "Copies extension folder into app directory so you can easily load unpacked in Chrome / Edge / Brave.",
    extGuideTitle: "📌 How to activate Extension after installation:",
    extGuideSteps: [
      "Open Google Chrome and navigate to chrome://extensions",
      "Enable 'Developer mode' toggle in the top-right corner",
      "Click 'Load unpacked' and select the chrome-extension directory"
    ],
    extSkip: "Skip",
    extNext: "Continue",

    finishTitle: "Installation Completed Successfully!",
    finishSubtitle: "Nyanko's Media Downloader is ready to use",
    finishOptionsTitle: "Shortcut & Launch options:",
    finishDesktop: "Create Desktop Shortcut",
    finishStart: "Pin application to Start Menu",
    finishTaskbar: "Pin application to Taskbar",
    finishLaunch: "Launch Nyanko's Media Downloader now",
    finishBtn: "Finish & Close"
  },

  zh: {
    appName: "Nyanko's Media Downloader 安装程序",
    langTitle: "选择安装语言",
    langSubtitle: "请选择您偏好的语言以继续",
    langNext: "下一步",

    welcomeTitle: "欢迎使用 Nyanko's Media Downloader",
    welcomeVersion: "版本 1.2.0 • Tabby Neko Edition",
    welcomeDescTitle: "软件简介",
    welcomeDescBody: "Nyanko's Media Downloader 是一款高清音视频下载工具，支持 YouTube、TikTok、Facebook、SoundCloud 等 1000+ 平台。",
    feat1: "支持 Full HD / 4K / 60fps",
    feat2: "极速 MP3 / FLAC 音频提取",
    feat3: "内置最新 yt-dlp 与 ffmpeg 引擎",
    feat4: "便捷集成 Chrome 浏览器扩展",
    welcomeBack: "返回",
    welcomeNext: "开始设置",

    optionsTitle: "安装选项",
    optionsSubtitle: "选择安装模式及目标保存路径",
    modeLocalTitle: "系统安装 (Local)",
    modeLocalDesc: "推荐。安装至系统目录，自动生成 Start Menu 与桌面快捷方式。",
    modePortableTitle: "便携版本 (Portable)",
    modePortableDesc: "解压所有主程序及依赖到独立文件夹（方便拷贝至 U盘）。",
    installPathLabel: "安装目标文件夹路径：",
    browseBtn: "浏览...",
    depSourceTitle: "依赖项分发渠道 (yt-dlp 与 FFmpeg)：",
    sourceBinTitle: "直接下载至 bin/",
    sourceBinDesc: "快速、独立、无需管理员权限",
    sourceWingetTitle: "通过 Winget 安装 (系统)",
    sourceWingetDesc: "使用 Windows 包管理器 CLI",
    optionsBack: "返回",
    optionsInstall: "开始安装",

    progressTitle: "正在安装软件",
    progressSubtitle: "请稍候，正在解压文件并检查依赖项...",
    statusExtract: "正在解压主程序文件...",
    statusYtdlp: "检查依赖项: yt-dlp.exe...",
    statusFfmpeg: "检查依赖项: ffmpeg.exe...",
    statusFfprobe: "检查依赖项: ffprobe.exe...",
    waiting: "等待中...",
    ready: "已就绪 (跳过下载)",
    downloading: "下载中",
    installedSuccess: "安装成功",
    preparing: "准备中...",

    extTitle: "是否安装 Chrome 浏览器扩展？",
    extSubtitle: "可在 Chrome 浏览器中一键抓取并发送下载链接",
    extOptionTitle: "附带 Chrome 扩展包",
    extOptionDesc: "自动将扩展复制到软件目录，方便您在 Chrome / Edge 中加载已解压的扩展。",
    extGuideTitle: "📌 安装完成后激活扩展的方法：",
    extGuideSteps: [
      "打开 Google Chrome 并访问 chrome://extensions",
      "开启右上角的“开发者模式 (Developer mode)”",
      "点击“加载已解压的扩展程序”并选择 chrome-extension 目录"
    ],
    extSkip: "跳过",
    extNext: "继续",

    finishTitle: "安装已成功完成！",
    finishSubtitle: "Nyanko's Media Downloader 已准备就绪",
    finishOptionsTitle: "快捷方式与启动选项：",
    finishDesktop: "创建桌面快捷方式",
    finishStart: "固定到开始菜单 (Start Menu)",
    finishTaskbar: "固定到任务栏 (Taskbar)",
    finishLaunch: "立即启动 Nyanko's Media Downloader",
    finishBtn: "完成并关闭"
  },

  "zh-TW": {
    appName: "Nyanko's Media Downloader 安裝程式",
    langTitle: "選擇安裝語言",
    langSubtitle: "請選擇您偏好的語言以繼續",
    langNext: "下一步",

    welcomeTitle: "歡迎使用 Nyanko's Media Downloader",
    welcomeVersion: "版本 1.2.0 • Tabby Neko Edition",
    welcomeDescTitle: "軟體簡介",
    welcomeDescBody: "Nyanko's Media Downloader 是一款高畫質影音下載工具，支援 YouTube、TikTok、Facebook、SoundCloud 等 1000+ 平台。",
    feat1: "支援 Full HD / 4K / 60fps",
    feat2: "極速 MP3 / FLAC 音訊擷取",
    feat3: "內建最新 yt-dlp 與 ffmpeg 引擎",
    feat4: "便捷整合 Chrome 瀏覽器擴充功能",
    welcomeBack: "返回",
    welcomeNext: "開始設定",

    optionsTitle: "安裝選項",
    optionsSubtitle: "選擇安裝模式及目標儲存路徑",
    modeLocalTitle: "系統安裝 (Local)",
    modeLocalDesc: "推薦。安裝至系統目錄，自動建立 Start Menu 與桌面捷徑。",
    modePortableTitle: "可攜版本 (Portable)",
    modePortableDesc: "解壓縮所有主程式及依賴到獨立資料夾（方便複製至隨身碟）。",
    installPathLabel: "安裝目標資料夾路徑：",
    browseBtn: "瀏覽...",
    depSourceTitle: "相依性分發管道 (yt-dlp 與 FFmpeg)：",
    sourceBinTitle: "直接下載至 bin/",
    sourceBinDesc: "快速、獨立、無需管理員權限",
    sourceWingetTitle: "透過 Winget 安裝 (系統)",
    sourceWingetDesc: "使用 Windows 套件管理器 CLI",
    optionsBack: "返回",
    optionsInstall: "開始安裝",

    progressTitle: "正在安裝軟體",
    progressSubtitle: "請稍候，正在解壓縮檔案並檢查依賴項...",
    statusExtract: "正在解壓縮主程式檔案...",
    statusYtdlp: "檢查依賴項: yt-dlp.exe...",
    statusFfmpeg: "檢查依賴項: ffmpeg.exe...",
    statusFfprobe: "檢查依賴項: ffprobe.exe...",
    waiting: "等待中...",
    ready: "已就緒 (跳過下載)",
    downloading: "下載中",
    installedSuccess: "安裝成功",
    preparing: "準備中...",

    extTitle: "是否安裝 Chrome 瀏覽器擴充功能？",
    extSubtitle: "可在 Chrome 瀏覽器中一鍵擷取並傳送下載連結",
    extOptionTitle: "附帶 Chrome 擴充功能包",
    extOptionDesc: "自動將擴充功能複製到軟體目錄，方便您在 Chrome / Edge 中載入未打包的擴充功能。",
    extGuideTitle: "📌 安裝完成後啟用擴充功能的方法：",
    extGuideSteps: [
      "開啟 Google Chrome 並前往 chrome://extensions",
      "開啟右上角的「開發人員模式 (Developer mode)」",
      "點擊「載入未打包項目」並選擇 chrome-extension 資料夾"
    ],
    extSkip: "跳過",
    extNext: "繼續",

    finishTitle: "安裝已成功完成！",
    finishSubtitle: "Nyanko's Media Downloader 已準備就緒",
    finishOptionsTitle: "捷徑與啟動選項：",
    finishDesktop: "建立桌面捷徑",
    finishStart: "釘選至開始功能表 (Start Menu)",
    finishTaskbar: "釘選至工作列 (Taskbar)",
    finishLaunch: "立即啟動 Nyanko's Media Downloader",
    finishBtn: "完成並關閉"
  },

  ja: {
    appName: "Nyanko's Media Downloader セットアップ",
    langTitle: "インストール言語の選択",
    langSubtitle: "表示言語を選択してください",
    langNext: "次へ",

    welcomeTitle: "Nyanko's Media Downloader へようこそ",
    welcomeVersion: "バージョン 1.2.0 • Tabby Neko Edition",
    welcomeDescTitle: "アプリの概要",
    welcomeDescBody: "Nyanko's Media Downloader は、YouTube、TikTok、Facebook、SoundCloud など 1000 以上のサイトから高品質な動画と音楽をダウンロードできるツールです。",
    feat1: "Full HD / 4K / 60fps 対応",
    feat2: "高速 MP3 / FLAC 音声抽出",
    feat3: "最新 yt-dlp & ffmpeg エンジン内蔵",
    feat4: "便利な Chrome 拡張機能に対応",
    welcomeBack: "戻る",
    welcomeNext: "セットアップ開始",

    optionsTitle: "インストールオプション",
    optionsSubtitle: "インストールモードと保存先フォルダを選択してください",
    modeLocalTitle: "標準インストール (Local)",
    modeLocalDesc: "推奨。システムフォルダにインストールし、スタートメニューとデスクトップにショートカットを作成します。",
    modePortableTitle: "ポータブル版 (Portable)",
    modePortableDesc: "すべての本体と依存ファイルを単一フォルダに展開します（USBへの持ち運びに最適）。",
    installPathLabel: "インストール先フォルダのパス:",
    browseBtn: "参照...",
    depSourceTitle: "依存関係の配信チャネル (yt-dlp & FFmpeg):",
    sourceBinTitle: "bin/ に直接ダウンロード",
    sourceBinDesc: "高速、独立、管理者権限不要",
    sourceWingetTitle: "Winget 経由でインストール (システム)",
    sourceWingetDesc: "Windows パッケージマネージャー CLI を使用",
    optionsBack: "戻る",
    optionsInstall: "インストール開始",

    progressTitle: "ソフトウェアをインストール中",
    progressSubtitle: "ファイルの展開と依存関係のチェックが完了するまでお待ちください...",
    statusExtract: "メインアプリケーションを展開中...",
    statusYtdlp: "依存関係の確認: yt-dlp.exe...",
    statusFfmpeg: "依存関係の確認: ffmpeg.exe...",
    statusFfprobe: "依存関係の確認: ffprobe.exe...",
    waiting: "待機中...",
    ready: "準備完了 (スキップ)",
    downloading: "ダウンロード中",
    installedSuccess: "インストール成功",
    preparing: "準備中...",

    extTitle: "Chrome 拡張機能をインストールしますか？",
    extSubtitle: "Chrome で再生中のメディアリンクを自動検出して送信できます",
    extOptionTitle: "Chrome 拡張機能パッケージを含める",
    extOptionDesc: "拡張機能フォルダをアプリディレクトリにコピーし、Chrome / Edge で「パッケージ化されていない拡張機能」として簡単に読み込めます。",
    extGuideTitle: "📌 インストール後の拡張機能の有効化手順:",
    extGuideSteps: [
      "Google Chrome を開き chrome://extensions にアクセス",
      "右上にある「デベロッパーモード」をオンにする",
      "「パッケージ化されていない拡張機能を読み込む」をクリックし chrome-extension フォルダを選択"
    ],
    extSkip: "スキップ",
    extNext: "次へ",

    finishTitle: "インストールが正常に完了しました！",
    finishSubtitle: "Nyanko's Media Downloader を使用する準備が整いました",
    finishOptionsTitle: "ショートカットと起動オプション:",
    finishDesktop: "デスクトップショートカットを作成",
    finishStart: "スタートメニューにピン留め",
    finishTaskbar: "タスクバーにピン留め",
    finishLaunch: "今すぐ Nyanko's Media Downloader を起動する",
    finishBtn: "完了して閉じる"
  }
};

// Global State
let currentLang = 'vi';
let selectedMode = 'local'; // 'local' or 'portable'
let defaultPaths = { localInstall: '', portableInstall: '' };
let currentTargetPath = '';

// DOM Selectors
const btnMinimize = document.getElementById('btn-minimize');
const btnClose = document.getElementById('btn-close');

// Screens
const stepLang = document.getElementById('step-lang');
const stepWelcome = document.getElementById('step-welcome');
const stepOptions = document.getElementById('step-options');
const stepProgress = document.getElementById('step-progress');
const stepChromeExt = document.getElementById('step-chrome-ext');
const stepFinish = document.getElementById('step-finish');

// Screen 0: Language Select
const langOptionBtns = document.querySelectorAll('.lang-option-btn');
const btnLangNext = document.getElementById('btn-lang-next');

// Screen 1: Welcome
const btnWelcomeBack = document.getElementById('btn-welcome-back');
const btnWelcomeNext = document.getElementById('btn-welcome-next');

// Screen 2: Options
const radioLocal = document.getElementById('mode-local');
const radioPortable = document.getElementById('mode-portable');
const modeCards = document.querySelectorAll('.mode-card');
const pathInput = document.getElementById('install-path-input');
const btnBrowsePath = document.getElementById('btn-browse-path');
const btnOptionsBack = document.getElementById('btn-options-back');
const btnOptionsInstall = document.getElementById('btn-options-install');

// Screen 3: Progress
const majorProgressFill = document.getElementById('major-progress-fill');
const majorProgressStatus = document.getElementById('major-progress-status');
const majorProgressPercent = document.getElementById('major-progress-percent');

// Screen 4: Chrome Ext
const chkInstallExtension = document.getElementById('chk-install-extension');
const btnExtSkip = document.getElementById('btn-ext-skip');
const btnExtNext = document.getElementById('btn-ext-next');

// Screen 5: Finish
const chkDesktopShortcut = document.getElementById('chk-desktop-shortcut');
const chkStartShortcut = document.getElementById('chk-start-shortcut');
const chkTaskbarPin = document.getElementById('chk-taskbar-pin');
const chkLaunchApp = document.getElementById('chk-launch-app');
const btnFinish = document.getElementById('btn-finish');

// Apply Translations to DOM
function applyTranslations(lang) {
  currentLang = lang;
  const t = translations[lang] || translations.vi;

  document.getElementById('titlebar-appName').textContent = t.appName;
  
  // Screen 0
  document.getElementById('txt-lang-title').textContent = t.langTitle;
  document.getElementById('txt-lang-subtitle').textContent = t.langSubtitle;
  document.getElementById('lbl-lang-next').textContent = t.langNext;

  // Screen 1
  document.getElementById('txt-welcome-title').textContent = t.welcomeTitle;
  document.getElementById('txt-welcome-version').textContent = t.welcomeVersion;
  document.getElementById('txt-welcome-desc-title').textContent = t.welcomeDescTitle;
  document.getElementById('txt-welcome-desc-body').textContent = t.welcomeDescBody;
  document.getElementById('feat-1').textContent = t.feat1;
  document.getElementById('feat-2').textContent = t.feat2;
  document.getElementById('feat-3').textContent = t.feat3;
  document.getElementById('feat-4').textContent = t.feat4;
  document.getElementById('lbl-welcome-back').textContent = t.welcomeBack;
  document.getElementById('lbl-welcome-next').textContent = t.welcomeNext;

  // Screen 2
  document.getElementById('txt-options-title').textContent = t.optionsTitle;
  document.getElementById('txt-options-subtitle').textContent = t.optionsSubtitle;
  document.getElementById('lbl-mode-local-title').textContent = t.modeLocalTitle;
  document.getElementById('lbl-mode-local-desc').textContent = t.modeLocalDesc;
  document.getElementById('lbl-mode-portable-title').textContent = t.modePortableTitle;
  document.getElementById('lbl-mode-portable-desc').textContent = t.modePortableDesc;
  document.getElementById('lbl-install-path').textContent = t.installPathLabel;
  document.getElementById('btn-browse-path').textContent = t.browseBtn;
  if (document.getElementById('lbl-dep-source-title')) {
    document.getElementById('lbl-dep-source-title').textContent = t.depSourceTitle || "Nguồn phân phối Dependency:";
    document.getElementById('lbl-source-bin-title').textContent = t.sourceBinTitle || "Tải trực tiếp vào bin/";
    document.getElementById('lbl-source-bin-desc').textContent = t.sourceBinDesc || "Nhanh, độc lập, không cần Admin";
    document.getElementById('lbl-source-winget-title').textContent = t.sourceWingetTitle || "Cài qua Winget (System)";
    document.getElementById('lbl-source-winget-desc').textContent = t.sourceWingetDesc || "Quản lý gói Windows Package Manager";
  }
  document.getElementById('lbl-options-back').textContent = t.optionsBack;
  document.getElementById('lbl-options-install').textContent = t.optionsInstall;

  // Screen 3
  document.getElementById('txt-progress-title').textContent = t.progressTitle;
  document.getElementById('txt-progress-subtitle').textContent = t.progressSubtitle;
  document.getElementById('status-extract-text').textContent = t.statusExtract;
  document.getElementById('status-ytdlp-text').textContent = t.statusYtdlp;
  document.getElementById('status-ffmpeg-text').textContent = t.statusFfmpeg;
  document.getElementById('status-ffprobe-text').textContent = t.statusFfprobe;
  document.getElementById('major-progress-status').textContent = t.preparing;

  // Screen 4
  document.getElementById('txt-ext-title').textContent = t.extTitle;
  document.getElementById('txt-ext-subtitle').textContent = t.extSubtitle;
  document.getElementById('lbl-ext-option-title').textContent = t.extOptionTitle;
  document.getElementById('lbl-ext-option-desc').textContent = t.extOptionDesc;
  document.getElementById('txt-ext-guide-title').textContent = t.extGuideTitle;
  const guideSteps = document.getElementById('txt-ext-guide-steps');
  guideSteps.children[0].innerHTML = t.extGuideSteps[0];
  guideSteps.children[1].innerHTML = t.extGuideSteps[1];
  guideSteps.children[2].innerHTML = t.extGuideSteps[2];
  document.getElementById('lbl-ext-skip').textContent = t.extSkip;
  document.getElementById('lbl-ext-next').textContent = t.extNext;

  // Screen 5
  document.getElementById('txt-finish-title').textContent = t.finishTitle;
  document.getElementById('txt-finish-subtitle').textContent = t.finishSubtitle;
  document.getElementById('txt-finish-options-title').textContent = t.finishOptionsTitle;
  document.getElementById('lbl-finish-desktop').textContent = t.finishDesktop;
  document.getElementById('lbl-finish-start').textContent = t.finishStart;
  document.getElementById('lbl-finish-taskbar').textContent = t.finishTaskbar;
  document.getElementById('lbl-finish-launch').textContent = t.finishLaunch;
  document.getElementById('lbl-finish-btn').textContent = t.finishBtn;
}

// Navigation Helper
function switchStep(fromStep, toStep) {
  fromStep.classList.remove('active');
  toStep.classList.add('active');
}

// Screen 0 Event Handlers
langOptionBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    langOptionBtns.forEach(b => b.classList.remove('border-pink-500', 'bg-slate-800'));
    btn.classList.add('border-pink-500', 'bg-slate-800');
    const lang = btn.dataset.lang;
    applyTranslations(lang);
    // Auto proceed to Screen 1 (Welcome) upon language selection
    switchStep(stepLang, stepWelcome);
  });
});

btnLangNext.addEventListener('click', () => {
  switchStep(stepLang, stepWelcome);
});

// Screen 1 Event Handlers
btnWelcomeBack.addEventListener('click', () => {
  switchStep(stepWelcome, stepLang);
});

btnWelcomeNext.addEventListener('click', async () => {
  switchStep(stepWelcome, stepOptions);
  
  if (!defaultPaths.localInstall && window.api && window.api.getDefaultPaths) {
    try {
      defaultPaths = await window.api.getDefaultPaths();
      currentTargetPath = defaultPaths.localInstall;
      pathInput.value = currentTargetPath;
    } catch (err) {
      console.error('Failed to load default paths:', err);
    }
  }
});

// Screen 2 Event Handlers
function handleModeChange(mode) {
  selectedMode = mode;
  modeCards.forEach(c => {
    c.classList.remove('border-pink-500/80', 'bg-pink-500/5', 'border-sky-500/80', 'bg-sky-500/5');
    c.classList.add('border-slate-800');
  });

  if (mode === 'local') {
    const localCard = document.querySelector('label[for="mode-local"]');
    localCard.classList.remove('border-slate-800');
    localCard.classList.add('border-pink-500/80', 'bg-pink-500/5');
    currentTargetPath = defaultPaths.localInstall || currentTargetPath;
    
    document.getElementById('label-desktop-shortcut').classList.remove('hidden');
    document.getElementById('label-start-shortcut').classList.remove('hidden');
    document.getElementById('label-taskbar-pin').classList.remove('hidden');
  } else {
    const portableCard = document.querySelector('label[for="mode-portable"]');
    portableCard.classList.remove('border-slate-800');
    portableCard.classList.add('border-sky-500/80', 'bg-sky-500/5');
    currentTargetPath = defaultPaths.portableInstall || currentTargetPath;
    
    chkTaskbarPin.checked = false;
    chkStartShortcut.checked = false;
  }
  
  pathInput.value = currentTargetPath;
}

radioLocal.addEventListener('change', () => handleModeChange('local'));
radioPortable.addEventListener('change', () => handleModeChange('portable'));

modeCards.forEach(card => {
  card.addEventListener('click', () => {
    const radio = card.querySelector('input[type="radio"]');
    radio.checked = true;
    handleModeChange(radio.value);
  });
});

const channelCards = document.querySelectorAll('.channel-card');
channelCards.forEach(card => {
  card.addEventListener('click', () => {
    const radio = card.querySelector('input[type="radio"]');
    if (radio) {
      radio.checked = true;
      channelCards.forEach(c => {
        c.classList.remove('border-pink-500/80', 'bg-pink-500/5');
        c.classList.add('border-slate-800');
      });
      card.classList.remove('border-slate-800');
      card.classList.add('border-pink-500/80', 'bg-pink-500/5');
    }
  });
});

btnBrowsePath.addEventListener('click', async () => {
  if (window.api && window.api.selectDirectory) {
    const dir = await window.api.selectDirectory(currentTargetPath);
    if (dir) {
      currentTargetPath = dir;
      pathInput.value = currentTargetPath;
    }
  }
});

btnOptionsBack.addEventListener('click', () => {
  switchStep(stepOptions, stepWelcome);
});

// Titlebar controls
btnMinimize.addEventListener('click', () => window.api.minimize());
btnClose.addEventListener('click', () => window.api.close());

// Screen 3: Installation & Dependency Check Pipeline
btnOptionsInstall.addEventListener('click', async () => {
  const targetDir = pathInput.value.trim();
  if (!targetDir) {
    alert('Vui lòng chọn thư mục cài đặt hợp lệ.');
    return;
  }
  currentTargetPath = targetDir;
  
  switchStep(stepOptions, stepProgress);
  btnClose.style.display = 'none'; // Lock close button

  const t = translations[currentLang] || translations.vi;

  const updateMajorProgress = (statusText, percent) => {
    majorProgressStatus.textContent = statusText;
    majorProgressPercent.textContent = `${percent}%`;
    majorProgressFill.style.width = `${percent}%`;
  };

  try {
    // 1. EXTRACT APP ZIP
    updateMajorProgress(t.statusExtract, 15);
    const extractRes = await window.api.extractApp({ destPath: currentTargetPath });
    if (!extractRes.success) {
      throw new Error(`Lỗi giải nén tệp tin ứng dụng: ${extractRes.error}`);
    }

    // If portable mode, create portable.tag marker file
    if (selectedMode === 'portable' && window.api && window.api.createPortableTag) {
      await window.api.createPortableTag({ targetPath: currentTargetPath });
    }

    const statusExtract = document.getElementById('status-extract');
    statusExtract.querySelector('.status-icon').innerHTML = `<span class="text-emerald-400 font-bold">✓</span>`;
    statusExtract.classList.add('border-emerald-500/30', 'bg-emerald-500/5');

    // 2. CHECK EXISTING DEPENDENCIES
    updateMajorProgress(t.preparing, 30);
    const depCheck = await window.api.checkDependencies({ targetPath: currentTargetPath });

    const binDir = selectedMode === 'portable' ? `${currentTargetPath}\\bin` : `${currentTargetPath}\\bin`;

    // Download Dependency Helper
    const processDependency = async (depKey, depName, url, targetFile, progressPercent) => {
      const statusEl = document.getElementById(`status-${depKey}`);
      const detailEl = document.getElementById(`${depKey}-detail`);
      const iconEl = statusEl.querySelector('.status-icon');
      const barContainer = document.getElementById(`${depKey}-bar-container`);

      if (depCheck[depKey]) {
        // Already exists -> Skip
        detailEl.textContent = t.ready;
        detailEl.className = "text-[11px] text-emerald-400 font-semibold";
        iconEl.innerHTML = `<span class="text-emerald-400 font-bold">✓</span>`;
        statusEl.classList.add('border-emerald-500/30', 'bg-emerald-500/5');
        updateMajorProgress(`${depName}: ${t.ready}`, progressPercent);
        return;
      }

      // Download missing binary
      updateMajorProgress(`${t.downloading} ${depName}...`, progressPercent - 10);
      iconEl.innerHTML = `<svg class="animate-spin w-4 h-4 text-pink-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" class="opacity-25"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>`;
      barContainer.classList.remove('hidden');

      const destPath = `${binDir}\\${targetFile}`;
      const res = await window.api.downloadFile({ url, destPath, fileId: depKey });
      
      barContainer.classList.add('hidden');
      if (!res.success) {
        throw new Error(`Tải ${depName} thất bại: ${res.error}`);
      }

      detailEl.textContent = t.installedSuccess;
      detailEl.className = "text-[11px] text-emerald-400 font-semibold";
      iconEl.innerHTML = `<span class="text-emerald-400 font-bold">✓</span>`;
      statusEl.classList.add('border-emerald-500/30', 'bg-emerald-500/5');
    };

    // Download Progress Listener
    const removeProgressListener = window.api.onDownloadProgress((data) => {
      const { fileId, percent, receivedBytes, totalBytes } = data;
      const detailEl = document.getElementById(`${fileId}-detail`);
      const fillEl = document.getElementById(`${fileId}-bar`);
      if (detailEl && fillEl) {
        const recMB = (receivedBytes / (1024 * 1024)).toFixed(1);
        const totMB = (totalBytes / (1024 * 1024)).toFixed(1);
        detailEl.textContent = `${recMB}/${totMB}MB (${Math.round(percent)}%)`;
        fillEl.style.width = `${percent}%`;
      }
    });

    // 2. DEPENDENCY RESOLUTION (WINGET VS DIRECT BIN DOWNLOAD)
    const selectedSource = document.querySelector('input[name="dep-source"]:checked')?.value || 'bin';
    const ffmpegUrl = 'https://github.com/yt-dlp/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip';
    const ffmpegFallbackUrl = 'https://github.com/GyanD/codexffmpeg/releases/download/7.0.2/ffmpeg-7.0.2-full_build.zip';
    const ffmpegZipPath = `${binDir}\\ffmpeg.zip`;

    if (selectedSource === 'winget') {
      // 2. YT-DLP via Winget
      if (!depCheck.ytdlp) {
        updateMajorProgress('Cài đặt yt-dlp qua Winget...', 45);
        const statusEl = document.getElementById('status-ytdlp');
        const detailEl = document.getElementById('ytdlp-detail');
        const iconEl = statusEl ? statusEl.querySelector('.status-icon') : null;
        if (iconEl) iconEl.innerHTML = `<svg class="animate-spin w-4 h-4 text-pink-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" class="opacity-25"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>`;
        if (detailEl) detailEl.textContent = 'Winget...';

        const wingetRes = await window.api.installWingetPackage({ packageId: 'yt-dlp.yt-dlp' });
        if (wingetRes.success) {
          if (detailEl) {
            detailEl.textContent = 'Winget OK';
            detailEl.className = "text-[11px] text-emerald-400 font-semibold";
          }
          if (iconEl) iconEl.innerHTML = `<span class="text-emerald-400 font-bold">✓</span>`;
          if (statusEl) statusEl.classList.add('border-emerald-500/30', 'bg-emerald-500/5');
        } else {
          console.warn('Winget yt-dlp failed, falling back to bin download:', wingetRes.error);
          await processDependency(
            'ytdlp',
            'yt-dlp.exe',
            'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe',
            'yt-dlp.exe',
            55
          );
        }
      } else {
        const statusEl = document.getElementById('status-ytdlp');
        const detailEl = document.getElementById('ytdlp-detail');
        if (detailEl) {
          detailEl.textContent = t.ready;
          detailEl.className = "text-[11px] text-emerald-400 font-semibold";
        }
        if (statusEl) {
          const iconEl = statusEl.querySelector('.status-icon');
          if (iconEl) iconEl.innerHTML = `<span class="text-emerald-400 font-bold">✓</span>`;
          statusEl.classList.add('border-emerald-500/30', 'bg-emerald-500/5');
        }
      }

      // 3. FFMPEG & FFPROBE via Winget
      if (!depCheck.ffmpeg || !depCheck.ffprobe) {
        updateMajorProgress('Cài đặt FFmpeg qua Winget...', 75);
        const statusEl = document.getElementById('status-ffmpeg');
        const detailEl = document.getElementById('ffmpeg-detail');
        const iconEl = statusEl ? statusEl.querySelector('.status-icon') : null;
        if (iconEl) iconEl.innerHTML = `<svg class="animate-spin w-4 h-4 text-pink-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" class="opacity-25"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>`;
        if (detailEl) detailEl.textContent = 'Winget...';

        const wingetFFmpeg = await window.api.installWingetPackage({ packageId: 'Gyan.FFmpeg' });
        if (wingetFFmpeg.success) {
          if (detailEl) {
            detailEl.textContent = 'Winget OK';
            detailEl.className = "text-[11px] text-emerald-400 font-semibold";
          }
          if (iconEl) iconEl.innerHTML = `<span class="text-emerald-400 font-bold">✓</span>`;
          if (statusEl) statusEl.classList.add('border-emerald-500/30', 'bg-emerald-500/5');
        } else {
          console.warn('Winget FFmpeg failed, falling back to bin download:', wingetFFmpeg.error);
          let downloadSuccess = false;
          try {
            await processDependency('ffmpeg', 'ffmpeg.exe', ffmpegUrl, 'ffmpeg.zip', 75);
            downloadSuccess = true;
          } catch (err) {
            await processDependency('ffmpeg', 'ffmpeg.exe', ffmpegFallbackUrl, 'ffmpeg.zip', 75);
            downloadSuccess = true;
          }
          if (downloadSuccess) {
            updateMajorProgress('Giải nén FFMPEG & FFPROBE...', 80);
            await window.api.unzipFile({ zipPath: ffmpegZipPath, destPath: binDir });
          }
        }
      }
    } else {
      // Direct BIN Download Flow (Default)
      await processDependency(
        'ytdlp',
        'yt-dlp.exe',
        'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe',
        'yt-dlp.exe',
        55
      );

      if (!depCheck.ffmpeg || !depCheck.ffprobe) {
        let downloadSuccess = false;
        try {
          await processDependency(
            'ffmpeg',
            'ffmpeg.exe',
            ffmpegUrl,
            'ffmpeg.zip',
            75
          );
          downloadSuccess = true;
        } catch (err) {
          console.warn('Primary FFmpeg download failed, trying fallback URL...', err);
          await processDependency(
            'ffmpeg',
            'ffmpeg.exe',
            ffmpegFallbackUrl,
            'ffmpeg.zip',
            75
          );
          downloadSuccess = true;
        }

        if (downloadSuccess) {
          updateMajorProgress('Giải nén FFMPEG & FFPROBE...', 80);
          await window.api.unzipFile({ zipPath: ffmpegZipPath, destPath: binDir });
        }
      } else {
        updateMajorProgress('FFMPEG: ' + t.ready, 75);
      }
    }

    // Update UI status for FFMPEG & FFPROBE after extraction or winget
    const postCheck = await window.api.checkDependencies({ targetPath: currentTargetPath });
    ['ffmpeg', 'ffprobe'].forEach((depKey) => {
      const statusEl = document.getElementById(`status-${depKey}`);
      const detailEl = document.getElementById(`${depKey}-detail`);
      if (statusEl && detailEl && postCheck[depKey]) {
        detailEl.textContent = t.ready;
        detailEl.className = "text-[11px] text-emerald-400 font-semibold";
        const iconEl = statusEl.querySelector('.status-icon');
        if (iconEl) iconEl.innerHTML = `<span class="text-emerald-400 font-bold">✓</span>`;
        statusEl.classList.add('border-emerald-500/30', 'bg-emerald-500/5');
      }
    });

    removeProgressListener();

    updateMajorProgress('Hoàn tất giải nén & chuẩn bị!', 100);
    
    // Transition to Screen 4 (Chrome Extension prompt)
    setTimeout(() => {
      switchStep(stepProgress, stepChromeExt);
      btnClose.style.display = 'flex';
    }, 600);

  } catch (err) {
    alert(`Lỗi trong quá trình cài đặt: ${err.message}`);
    switchStep(stepProgress, stepOptions);
    btnClose.style.display = 'flex';
  }
});

// Screen 4 Event Handlers (Chrome Ext)
const btnExtBack = document.getElementById('btn-ext-back');

if (btnExtBack) {
  btnExtBack.addEventListener('click', () => {
    switchStep(stepChromeExt, stepOptions);
  });
}

async function proceedToFinishScreen() {
  if (chkInstallExtension.checked) {
    try {
      await window.api.copyExtension({ targetPath: currentTargetPath });
    } catch (err) {
      console.warn('Extension copy failed:', err);
    }
  }
  switchStep(stepChromeExt, stepFinish);
}

btnExtSkip.addEventListener('click', proceedToFinishScreen);
btnExtNext.addEventListener('click', proceedToFinishScreen);

// Screen 5 Event Handlers (Finish)
btnFinish.addEventListener('click', async () => {
  btnFinish.disabled = true;
  btnFinish.classList.add('opacity-50');

  const options = {
    appPath: currentTargetPath,
    desktop: chkDesktopShortcut.checked && selectedMode === 'local',
    startMenu: chkStartShortcut.checked && selectedMode === 'local'
  };

  try {
    if (options.desktop || options.startMenu) {
      await window.api.createShortcuts(options);
    }
    if (chkTaskbarPin.checked && selectedMode === 'local') {
      await window.api.pinTaskbar({ appPath: currentTargetPath });
    }
    if (chkLaunchApp.checked) {
      await window.api.launchApp({ appPath: currentTargetPath });
    }
  } catch (err) {
    console.error('Error in final setup options:', err);
  } finally {
    window.api.close();
  }
});

// Initial Setup
applyTranslations('vi');
