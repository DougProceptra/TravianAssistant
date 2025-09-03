ta-iron').textContent = this.formatNumber(res.iron || 0);
      document.getElementById('ta-iron-prod').textContent = prod.iron ? '+' + this.formatNumber(prod.iron) + '/h' : '-';
      
      document.getElementById('ta-crop').textContent = this.formatNumber(res.crop || 0);
      document.getElementById('ta-crop-prod').textContent = prod.crop ? '+' + this.formatNumber(prod.crop) + '/h' : '-';
      
      document.getElementById('ta-pop').textContent = this.gameData.population || '-';
    }
    
    formatNumber(num) {
      if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
      if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
      return num.toString();
    }
    
    async syncToBackend() {
      try {
        await fetch(CONFIG.backendUrl + '/api/village', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: CONFIG.userId,
            village: this.gameData
          })
        });
        this.updateSyncStatus('connected');
      } catch (error) {
        console.error('[TLA] Sync error:', error);
        this.updateSyncStatus('offline');
      }
    }
    
    updateSyncStatus(status) {
      this.syncStatus = status;
      const indicator = document.querySelector('.sync-indicator');
      if (indicator) {
        indicator.className = 'sync-indicator ' + status;
      }
    }
  }
  
  // Initialize when page is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new TravianHUD());
  } else {
    new TravianHUD();
  }
})();