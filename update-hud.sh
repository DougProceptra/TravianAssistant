#!/bin/bash
echo "Updating HUD with position memory..."

# Backup old file
cp packages/extension/dist/content.js packages/extension/dist/content.js.backup

# Download the fixed version directly from GitHub
curl -s https://raw.githubusercontent.com/DougProceptra/TravianAssistant/main/packages/extension/dist/content.js > packages/extension/dist/content-temp.js

# If download failed, create manually
if [ ! -s packages/extension/dist/content-temp.js ]; then
  echo "Creating new content.js with position memory..."
  
  # Write the new file in chunks to avoid paste issues
  cat > packages/extension/dist/content.js << 'EOF'
// TravianAssistant V2 - Position Memory Edition
console.log('[TLA] Settlement Race with Position Memory Active!');

const CONFIG = {
  backendUrl: 'https://workspace.dougdostal.repl.co',
  accountId: localStorage.getItem('TLA_ACCOUNT_ID') || null,
  updateInterval: 60000
};

if (!CONFIG.accountId) {
  const email = localStorage.getItem('TLA_EMAIL') || prompt('Enter email:');
  if (email) {
    localStorage.setItem('TLA_EMAIL', email);
    CONFIG.accountId = btoa(email).replace(/[^a-zA-Z0-9]/g, '');
    localStorage.setItem('TLA_ACCOUNT_ID', CONFIG.accountId);
  }
}

class SettlementHUD {
  constructor() {
    this.isDragging = false;
    this.dragOffset = {x:0, y:0};
    this.position = JSON.parse(localStorage.getItem('TLA_POS') || '{"top":10,"right":10}');
  }
  
  inject() {
    if (document.getElementById('tla-hud')) return;
    
    const hud = document.createElement('div');
    hud.id = 'tla-hud';
    hud.style.cssText = 'position:fixed;top:' + this.position.top + 'px;right:' + this.position.right + 'px;width:320px;background:white;border:2px solid #4CAF50;border-radius:5px;box-shadow:0 2px 10px rgba(0,0,0,0.2);z-index:10000;font-family:Arial,sans-serif;';
    
    hud.innerHTML = '<div class="tla-header" style="background:#4CAF50;color:white;padding:8px;cursor:move;user-select:none;">🏰 Settlement Race<button class="tla-min" style="float:right;background:none;border:none;color:white;cursor:pointer;">_</button></div><div class="tla-content" style="padding:10px;"><div class="tla-res" style="background:#f0f0f0;padding:8px;border-radius:3px;margin-bottom:10px;">Loading...</div><div class="tla-info"></div><div class="tla-sync" style="text-align:right;font-size:12px;color:#666;">Syncing...</div></div>';
    
    document.body.appendChild(hud);
    this.attachEvents(hud);
    this.update();
    setInterval(() => this.update(), 60000);
  }
  
  attachEvents(hud) {
    const header = hud.querySelector('.tla-header');
    
    header.addEventListener('mousedown', (e) => {
      if (e.target.className === 'tla-min') {
        const c = hud.querySelector('.tla-content');
        c.style.display = c.style.display === 'none' ? 'block' : 'none';
        return;
      }
      this.isDragging = true;
      const rect = hud.getBoundingClientRect();
      this.dragOffset = {x: e.clientX - rect.left, y: e.clientY - rect.top};
    });
    
    document.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      const x = e.clientX - this.dragOffset.x;
      const y = e.clientY - this.dragOffset.y;
      hud.style.left = x + 'px';
      hud.style.top = y + 'px';
      hud.style.right = 'auto';
    });
    
    document.addEventListener('mouseup', () => {
      if (this.isDragging) {
        this.isDragging = false;
        const rect = hud.getBoundingClientRect();
        this.position = {top: rect.top, right: window.innerWidth - rect.right};
        localStorage.setItem('TLA_POS', JSON.stringify(this.position));
        console.log('[TLA] Position saved');
      }
    });
  }
  
  async update() {
    const data = {
      lumber: parseInt((document.querySelector('#l1')?.textContent || '0').replace(/\D/g, '')) || 0,
      clay: parseInt((document.querySelector('#l2')?.textContent || '0').replace(/\D/g, '')) || 0,
      iron: parseInt((document.querySelector('#l3')?.textContent || '0').replace(/\D/g, '')) || 0,
      crop: parseInt((document.querySelector('#l4')?.textContent || '0').replace(/\D/g, '')) || 0,
      pop: parseInt((document.querySelector('.population')?.textContent || '0').replace(/\D/g, '')) || 0
    };
    
    document.querySelector('.tla-res').innerHTML = '🪵 ' + data.lumber + ' 🧱 ' + data.clay + ' ⚒️ ' + data.iron + ' 🌾 ' + data.crop;
    document.querySelector('.tla-info').innerHTML = 'Pop: ' + data.pop;
    
    try {
      const r = await fetch(CONFIG.backendUrl + '/api/village', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({accountId: CONFIG.accountId, village: data})
      });
      document.querySelector('.tla-sync').textContent = r.ok ? '✅ Synced' : '⚠️ Error';
    } catch(e) {
      document.querySelector('.tla-sync').textContent = '❌ Offline';
    }
  }
}

new SettlementHUD().inject();
EOF
  
else
  mv packages/extension/dist/content-temp.js packages/extension/dist/content.js
fi

echo "✅ HUD updated successfully!"
echo "📦 Now download the dist folder and reload in Chrome"
