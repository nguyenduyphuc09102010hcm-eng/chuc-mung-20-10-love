document.addEventListener('DOMContentLoaded', () => {
  let config = StorageManager.getConfig();

  // 1. Tạo hiệu ứng trái tim bay nền
  const heartsContainer = document.getElementById('floating-hearts');
  for (let i = 0; i < 15; i++) {
    const heart = document.createElement('div');
    heart.className = 'heart';
    heart.innerHTML = ['❤️', '🌸', '✨', '💐', '💖'][Math.floor(Math.random() * 5)];
    heart.style.left = Math.random() * 100 + 'vw';
    heart.style.animationDuration = (4 + Math.random() * 4) + 's';
    heart.style.animationDelay = (Math.random() * 5) + 's';
    heartsContainer.appendChild(heart);
  }

  // 2. Xử lý cá nhân hóa qua URL parameter (?to=...)
  const urlParams = new URLSearchParams(window.location.search);
  const recipientId = urlParams.get('to');
  let currentRecipient = null;

  if (recipientId && config.recipients) {
    currentRecipient = config.recipients.find(r => r.id === recipientId);
  }

  // Áp dụng cấu hình giao diện & màu sắc
  applyConfig(config, currentRecipient);

  // 3. Điều hướng màn hình
  const welcomeScreen = document.getElementById('welcome-screen');
  const mainScreen = document.getElementById('main-screen');
  const endScreen = document.getElementById('end-screen');
  const startBtn = document.getElementById('start-btn');
  const goToKellBtn = document.getElementById('go-to-end-btn');
  const restartBtn = document.getElementById('restart-btn');

  startBtn.addEventListener('click', () => {
    welcomeScreen.classList.remove('active');
    mainScreen.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  goToKellBtn.addEventListener('click', () => {
    mainScreen.classList.remove('active');
    endScreen.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  restartBtn.addEventListener('click', () => {
    endScreen.classList.remove('active');
    welcomeScreen.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // 4. Render Hộp Quà, Thư và Mini Game
  renderGiftBoxes(config.giftBoxes);
  renderSecretLetters(config.secretLetters);
  renderMiniGame(config.miniGame);

  // 5. Xử lý Modal hiển thị
  const modal = document.getElementById('content-modal');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const modalOkBtn = document.getElementById('modal-ok-btn');
  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body');

  function showModal(title, body) {
    modalTitle.textContent = title;
    modalBody.textContent = body;
    modal.classList.add('active');
  }

  closeModalBtn.addEventListener('click', () => modal.classList.remove('active'));
  modalOkBtn.addEventListener('click', () => modal.classList.remove('active'));
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
  });

  // 6. Xử lý Bảng Chỉnh Sửa (Editor Mode)
  const openEditorBtn = document.getElementById('open-editor-btn');
  const closeEditorBtn = document.getElementById('close-editor-btn');
  const editorPanel = document.getElementById('editor-panel');

  openEditorBtn.addEventListener('click', () => {
    loadEditorData(config);
    editorPanel.classList.add('active');
  });

  closeEditorBtn.addEventListener('click', () => {
    editorPanel.classList.remove('active');
    // Reload để cập nhật giao diện mới
    config = StorageManager.getConfig();
    applyConfig(config, currentRecipient);
    renderGiftBoxes(config.giftBoxes);
    renderSecretLetters(config.secretLetters);
    renderMiniGame(config.miniGame);
  });

  // Tabs trong editor
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).classList.add('active');
    });
  });

  // Lưu cấu hình chung
  document.getElementById('save-general-btn').addEventListener('click', () => {
    config.general.websiteTitle = document.getElementById('edit-websiteTitle').value;
    config.general.welcomeTitle = document.getElementById('edit-welcomeTitle').value;
    config.general.welcomeSubtitle = document.getElementById('edit-welcomeSubtitle').value;
    config.general.mainGreeting = document.getElementById('edit-mainGreeting').value;
    config.general.senderName = document.getElementById('edit-senderName').value;
    config.general.primaryColor = document.getElementById('edit-primaryColor').value;
    
    StorageManager.saveConfig(config);
    alert('Đã lưu thay đổi thành công! 🌸');
  });

  // Thêm người nhận mới
  document.getElementById('add-recipient-btn').addEventListener('click', () => {
    const id = document.getElementById('new-rec-id').value.trim();
    const name = document.getElementById('new-rec-name').value.trim();
    const greeting = document.getElementById('new-rec-greeting').value.trim();

    if (!id || !name) {
      alert('Vui lòng nhập ID và Tên hiển thị!');
      return;
    }

    if (!config.recipients) config.recipients = [];
    config.recipients.push({
      id: id,
      name: name,
      displayName: name,
      customGreeting: greeting || config.general.mainGreeting,
      sender: config.general.senderName
    });

    StorageManager.saveConfig(config);
    loadRecipientsMgmt(config.recipients);
    document.getElementById('new-rec-id').value = '';
    document.getElementById('new-rec-name').value = '';
    document.getElementById('new-rec-greeting').value = '';
    alert('Đã thêm người nhận thành công!');
  });

  // Export JSON
  document.getElementById('export-json-btn').addEventListener('click', () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(config, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "config-2010.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  });

  // Import JSON
  document.getElementById('import-json-file').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(evt) {
      try {
        const importedConfig = JSON.parse(evt.target.result);
        config = importedConfig;
        StorageManager.saveConfig(config);
        alert('Nhập cấu hình thành công! Hãy đóng bảng chỉnh sửa để xem kết quả.');
      } catch (err) {
        alert('File JSON không hợp lệ!');
      }
    };
    reader.readAsText(file);
  });

  // Reset Default
  document.getElementById('reset-default-btn').addEventListener('click', () => {
    if (confirm('Bạn có chắc muốn khôi phục mặc định? Mọi chỉnh sửa sẽ bị xóa.')) {
      config = StorageManager.resetConfig();
      loadEditorData(config);
      alert('Đã khôi phục mặc định thành công!');
    }
  });

  // --- Helper Functions ---
  function applyConfig(cfg, recipient) {
    document.getElementById('page-title').textContent = cfg.general.websiteTitle;
    document.getElementById('welcome-title').textContent = cfg.general.welcomeTitle;
    document.getElementById('welcome-subtitle').textContent = cfg.general.welcomeSubtitle;
    
    // Màu sắc
    document.documentElement.style.setProperty('--primary', cfg.general.primaryColor);
    
    // Cá nhân hóa tên
    const nameDisplay = recipient ? recipient.displayName : cfg.general.defaultRecipientName;
    const greetingText = recipient ? recipient.customGreeting : cfg.general.mainGreeting;
    const senderText = recipient ? recipient.sender : cfg.general.senderName;

    document.getElementById('recipient-greeting-badge').textContent = recipient ? `Dành riêng cho: ${nameDisplay} ❤️` : '';
    document.getElementById('main-title-display').textContent = cfg.general.websiteTitle;
    document.getElementById('recipient-name-display').textContent = `Gửi ${nameDisplay}`;
    document.getElementById('main-greeting-text').textContent = greetingText;
    document.getElementById('sender-name-display').textContent = `-- Từ ${senderText} --`;

    document.getElementById('end-title').textContent = cfg.general.endScreenTitle || "Chúc Mừng 20/10 Thật Ý Nghĩa! 🌸";
    document.getElementById('end-message').textContent = cfg.general.endScreenMsg || cfg.general.mainGreeting;
  }

  function renderGiftBoxes(boxes) {
    const container = document.getElementById('gift-grid-container');
    container.innerHTML = '';
    boxes.forEach(box => {
      const div = document.createElement('div');
      div.className = 'gift-box';
      div.innerHTML = `
        <div class="gift-icon">${box.icon}</div>
        <div style="font-weight: 600; font-size: 0.95rem;">${box.title}</div>
      `;
      div.addEventListener('click', () => {
        div.classList.add('opened');
        showModal(box.title, box.message);
      });
      container.appendChild(div);
    });
  }

  function renderSecretLetters(letters) {
    const container = document.getElementById('letters-container');
    container.innerHTML = '';
    letters.forEach(letter => {
      const div = document.createElement('div');
      div.className = 'letter-card';
      div.innerHTML = `
        <h3 style="margin-bottom: 5px; font-size: 1.1rem;"><i class="fa-solid fa-envelope-open-text"></i> ${letter.title}</h3>
        <p style="margin: 0; font-size: 0.9rem; color: #666;">${letter.subtitle}</p>
      `;
      div.addEventListener('click', () => {
        showModal(letter.title, letter.content + `\n\n(Gửi từ: ${letter.sender})`);
      });
      container.appendChild(div);
    });
  }

  function renderMiniGame(game) {
    document.getElementById('game-question').textContent = game.question;
    const optContainer = document.getElementById('game-options-container');
    optContainer.innerHTML = '';
    const resultMsg = document.getElementById('game-result-msg');
    resultMsg.style.display = 'none';

    game.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'game-btn';
      btn.textContent = opt.text;
      btn.addEventListener('click', () => {
        resultMsg.style.display = 'block';
        if (opt.correct) {
          resultMsg.style.color = '#27ae60';
          resultMsg.textContent = game.successMessage;
        } else {
          resultMsg.style.color = '#c0392b';
          resultMsg.textContent = game.failureMessage;
        }
      });
      optContainer.appendChild(btn);
    });
  }

  function loadEditorData(cfg) {
    document.getElementById('edit-websiteTitle').value = cfg.general.websiteTitle;
    document.getElementById('edit-welcomeTitle').value = cfg.general.welcomeTitle;
    document.getElementById('edit-welcomeSubtitle').value = cfg.general.welcomeSubtitle;
    document.getElementById('edit-mainGreeting').value = cfg.general.mainGreeting;
    document.getElementById('edit-senderName').value = cfg.general.senderName;
    document.getElementById('edit-primaryColor').value = cfg.general.primaryColor;
    
    document.getElementById('edit-gameQuestion').value = cfg.miniGame.question;
    document.getElementById('edit-gameSuccess').value = cfg.miniGame.successMessage;

    loadRecipientsMgmt(cfg.recipients);
  }

  function loadRecipientsMgmt(recipients) {
    const listContainer = document.getElementById('recipients-mgmt-list');
    listContainer.innerHTML = '';
    if (!recipients || recipients.length === 0) {
      listContainer.innerHTML = '<p>Chưa có người nhận nào được tạo.</p>';
      return;
    }

    recipients.forEach((rec, index) => {
      const currentUrl = window.location.origin + window.location.pathname;
      const personalLink = `${currentUrl}?to=${rec.id}`;

      const div = document.createElement('div');
      div.className = 'recipient-item';
      div.innerHTML = `
        <div>
          <strong>${rec.displayName}</strong> (ID: <code>${rec.id}</code>)<br>
          <small style="color: #666; word-break: break-all;">${personalLink}</small>
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="btn" style="padding: 6px 12px; font-size: 0.85rem;" onclick="navigator.clipboard.writeText('${personalLink}'); alert('Đã sao chép link của ${rec.displayName}!');">Sao chép link</button>
          <button class="btn" style="padding: 6px 12px; font-size: 0.85rem; background: #e74c3c;" onclick="deleteRecipient(${index})">Xóa</button>
        </div>
      `;
      listContainer.appendChild(div);
    });
  }

  window.deleteRecipient = function(index) {
    if (confirm('Bạn có chắc muốn xóa người nhận này?')) {
      config.recipients.splice(index, 1);
      StorageManager.saveConfig(config);
      loadRecipientsMgmt(config.recipients);
    }
  };
});
