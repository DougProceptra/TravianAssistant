// Complete Troop Data for Travian T4.6
// All 5 tribes with full statistics

const COMPLETE_TROOP_DATA = {
  // ROMANS - Balanced units with good defense
  romans: [
    { id: 1, name: 'Legionnaire', attack: 40, def_inf: 35, def_cav: 50, speed: 6, carry: 50, wood: 120, clay: 100, iron: 150, crop: 30, time: '0:26:40', upkeep: 1 },
    { id: 2, name: 'Praetorian', attack: 30, def_inf: 65, def_cav: 35, speed: 5, carry: 20, wood: 100, clay: 130, iron: 160, crop: 70, time: '0:29:20', upkeep: 1 },
    { id: 3, name: 'Imperian', attack: 70, def_inf: 40, def_cav: 25, speed: 7, carry: 50, wood: 150, clay: 160, iron: 210, crop: 80, time: '0:32:00', upkeep: 1 },
    { id: 4, name: 'Equites Legati', attack: 0, def_inf: 20, def_cav: 10, speed: 16, carry: 0, wood: 140, clay: 160, iron: 20, crop: 40, time: '0:22:40', upkeep: 2 },
    { id: 5, name: 'Equites Imperatoris', attack: 120, def_inf: 65, def_cav: 50, speed: 14, carry: 100, wood: 550, clay: 440, iron: 320, crop: 100, time: '0:44:00', upkeep: 3 },
    { id: 6, name: 'Equites Caesaris', attack: 180, def_inf: 80, def_cav: 105, speed: 10, carry: 70, wood: 550, clay: 640, iron: 800, crop: 180, time: '0:58:40', upkeep: 4 },
    { id: 7, name: 'Battering Ram', attack: 60, def_inf: 30, def_cav: 75, speed: 4, carry: 0, wood: 900, clay: 360, iron: 500, crop: 70, time: '1:16:40', upkeep: 3 },
    { id: 8, name: 'Fire Catapult', attack: 75, def_inf: 60, def_cav: 10, speed: 3, carry: 0, wood: 950, clay: 1350, iron: 600, crop: 90, time: '2:30:00', upkeep: 6 },
    { id: 9, name: 'Senator', attack: 50, def_inf: 40, def_cav: 30, speed: 4, carry: 0, wood: 30750, clay: 27200, iron: 45000, crop: 37500, time: '25:11:40', upkeep: 5 },
    { id: 10, name: 'Settler', attack: 0, def_inf: 80, def_cav: 80, speed: 5, carry: 3000, wood: 5800, clay: 5300, iron: 7200, crop: 5500, time: '7:28:20', upkeep: 1 }
  ],

  // TEUTONS - Strong offense, weak defense
  teutons: [
    { id: 1, name: 'Clubswinger', attack: 40, def_inf: 20, def_cav: 5, speed: 7, carry: 60, wood: 95, clay: 75, iron: 40, crop: 40, time: '0:12:00', upkeep: 1 },
    { id: 2, name: 'Spearman', attack: 10, def_inf: 35, def_cav: 60, speed: 7, carry: 40, wood: 145, clay: 70, iron: 85, crop: 40, time: '0:18:40', upkeep: 1 },
    { id: 3, name: 'Axeman', attack: 60, def_inf: 30, def_cav: 30, speed: 6, carry: 50, wood: 130, clay: 120, iron: 170, crop: 70, time: '0:20:00', upkeep: 1 },
    { id: 4, name: 'Scout', attack: 0, def_inf: 10, def_cav: 5, speed: 9, carry: 0, wood: 160, clay: 100, iron: 50, crop: 50, time: '0:18:40', upkeep: 1 },
    { id: 5, name: 'Paladin', attack: 55, def_inf: 100, def_cav: 40, speed: 10, carry: 110, wood: 370, clay: 270, iron: 290, crop: 75, time: '0:40:00', upkeep: 2 },
    { id: 6, name: 'Teutonic Knight', attack: 150, def_inf: 50, def_cav: 75, speed: 9, carry: 80, wood: 450, clay: 515, iron: 480, crop: 80, time: '0:49:20', upkeep: 3 },
    { id: 7, name: 'Ram', attack: 65, def_inf: 30, def_cav: 80, speed: 4, carry: 0, wood: 1000, clay: 300, iron: 350, crop: 70, time: '1:13:20', upkeep: 3 },
    { id: 8, name: 'Catapult', attack: 50, def_inf: 60, def_cav: 10, speed: 3, carry: 0, wood: 900, clay: 1200, iron: 600, crop: 60, time: '2:30:00', upkeep: 6 },
    { id: 9, name: 'Chief', attack: 40, def_inf: 60, def_cav: 40, speed: 4, carry: 0, wood: 35500, clay: 26600, iron: 25000, crop: 27200, time: '19:35:00', upkeep: 4 },
    { id: 10, name: 'Settler', attack: 10, def_inf: 80, def_cav: 80, speed: 5, carry: 3000, wood: 7200, clay: 5500, iron: 5800, crop: 6500, time: '8:36:40', upkeep: 1 }
  ],

  // GAULS - Strong defense, fast units
  gauls: [
    { id: 1, name: 'Phalanx', attack: 15, def_inf: 40, def_cav: 50, speed: 7, carry: 30, wood: 100, clay: 130, iron: 55, crop: 30, time: '0:17:20', upkeep: 1 },
    { id: 2, name: 'Swordsman', attack: 65, def_inf: 35, def_cav: 20, speed: 6, carry: 45, wood: 140, clay: 150, iron: 185, crop: 60, time: '0:24:00', upkeep: 1 },
    { id: 3, name: 'Pathfinder', attack: 0, def_inf: 20, def_cav: 10, speed: 17, carry: 0, wood: 170, clay: 150, iron: 20, crop: 40, time: '0:22:40', upkeep: 2 },
    { id: 4, name: 'Theutates Thunder', attack: 90, def_inf: 25, def_cav: 40, speed: 19, carry: 75, wood: 350, clay: 450, iron: 230, crop: 60, time: '0:41:20', upkeep: 2 },
    { id: 5, name: 'Druidrider', attack: 45, def_inf: 115, def_cav: 55, speed: 16, carry: 35, wood: 360, clay: 330, iron: 280, crop: 120, time: '0:42:40', upkeep: 2 },
    { id: 6, name: 'Haeduan', attack: 140, def_inf: 60, def_cav: 165, speed: 13, carry: 65, wood: 500, clay: 620, iron: 675, crop: 170, time: '0:52:00', upkeep: 3 },
    { id: 7, name: 'Ram', attack: 50, def_inf: 30, def_cav: 105, speed: 4, carry: 0, wood: 950, clay: 555, iron: 330, crop: 75, time: '1:23:20', upkeep: 3 },
    { id: 8, name: 'Trebuchet', attack: 70, def_inf: 45, def_cav: 10, speed: 3, carry: 0, wood: 960, clay: 1450, iron: 630, crop: 90, time: '2:30:00', upkeep: 6 },
    { id: 9, name: 'Chieftain', attack: 40, def_inf: 50, def_cav: 50, speed: 5, carry: 0, wood: 30750, clay: 45400, iron: 31000, crop: 37500, time: '24:16:40', upkeep: 4 },
    { id: 10, name: 'Settler', attack: 0, def_inf: 80, def_cav: 80, speed: 5, carry: 3000, wood: 5500, clay: 7000, iron: 5300, crop: 4900, time: '6:18:20', upkeep: 1 }
  ],

  // EGYPTIANS - Unique mechanics, strong economy
  egyptians: [
    { id: 1, name: 'Slave Militia', attack: 10, def_inf: 30, def_cav: 20, speed: 7, carry: 20, wood: 45, clay: 60, iron: 30, crop: 15, time: '0:16:40', upkeep: 1 },
    { id: 2, name: 'Ash Warden', attack: 30, def_inf: 55, def_cav: 40, speed: 6, carry: 35, wood: 115, clay: 100, iron: 145, crop: 60, time: '0:22:00', upkeep: 1 },
    { id: 3, name: 'Khopesh Warrior', attack: 65, def_inf: 50, def_cav: 20, speed: 7, carry: 45, wood: 170, clay: 180, iron: 220, crop: 80, time: '0:24:40', upkeep: 1 },
    { id: 4, name: 'Sopdu Explorer', attack: 0, def_inf: 20, def_cav: 10, speed: 16, carry: 0, wood: 170, clay: 150, iron: 20, crop: 40, time: '0:20:00', upkeep: 2 },
    { id: 5, name: 'Anhur Guard', attack: 50, def_inf: 110, def_cav: 50, speed: 15, carry: 50, wood: 360, clay: 330, iron: 280, crop: 120, time: '0:34:40', upkeep: 2 },
    { id: 6, name: 'Resheph Chariot', attack: 110, def_inf: 120, def_cav: 150, speed: 10, carry: 65, wood: 450, clay: 560, iron: 610, crop: 180, time: '0:46:40', upkeep: 3 },
    { id: 7, name: 'Ram', attack: 55, def_inf: 30, def_cav: 95, speed: 4, carry: 0, wood: 995, clay: 575, iron: 340, crop: 80, time: '1:23:20', upkeep: 3 },
    { id: 8, name: 'Stone Catapult', attack: 65, def_inf: 55, def_cav: 10, speed: 3, carry: 0, wood: 980, clay: 1510, iron: 660, crop: 100, time: '2:30:00', upkeep: 6 },
    { id: 9, name: 'Nomarch', attack: 40, def_inf: 50, def_cav: 50, speed: 4, carry: 0, wood: 30750, clay: 27200, iron: 45000, crop: 37500, time: '21:50:00', upkeep: 4 },
    { id: 10, name: 'Settler', attack: 0, def_inf: 80, def_cav: 80, speed: 5, carry: 3000, wood: 6100, clay: 4600, iron: 4800, crop: 5400, time: '7:41:40', upkeep: 1 }
  ],

  // HUNS - Mobile cavalry, unique mechanics
  huns: [
    { id: 1, name: 'Mercenary', attack: 35, def_inf: 40, def_cav: 30, speed: 6, carry: 50, wood: 130, clay: 80, iron: 40, crop: 40, time: '0:16:40', upkeep: 1 },
    { id: 2, name: 'Bowman', attack: 30, def_inf: 25, def_cav: 40, speed: 7, carry: 30, wood: 140, clay: 110, iron: 60, crop: 60, time: '0:20:00', upkeep: 1 },
    { id: 3, name: 'Spotter', attack: 0, def_inf: 10, def_cav: 5, speed: 19, carry: 0, wood: 170, clay: 150, iron: 20, crop: 40, time: '0:23:20', upkeep: 2 },
    { id: 4, name: 'Steppe Rider', attack: 120, def_inf: 30, def_cav: 15, speed: 16, carry: 80, wood: 290, clay: 370, iron: 190, crop: 45, time: '0:36:40', upkeep: 2 },
    { id: 5, name: 'Marksman', attack: 50, def_inf: 40, def_cav: 105, speed: 14, carry: 50, wood: 320, clay: 350, iron: 330, crop: 50, time: '0:41:20', upkeep: 2 },
    { id: 6, name: 'Marauder', attack: 155, def_inf: 80, def_cav: 50, speed: 10, carry: 70, wood: 450, clay: 560, iron: 610, crop: 140, time: '0:50:00', upkeep: 3 },
    { id: 7, name: 'Ram', attack: 65, def_inf: 30, def_cav: 90, speed: 4, carry: 0, wood: 1060, clay: 330, iron: 360, crop: 70, time: '1:24:10', upkeep: 3 },
    { id: 8, name: 'Catapult', attack: 45, def_inf: 55, def_cav: 10, speed: 3, carry: 0, wood: 950, clay: 1280, iron: 620, crop: 60, time: '2:30:00', upkeep: 6 },
    { id: 9, name: 'Logades', attack: 40, def_inf: 60, def_cav: 40, speed: 4, carry: 0, wood: 37200, clay: 27600, iron: 25200, crop: 27600, time: '25:11:40', upkeep: 5 },
    { id: 10, name: 'Settler', attack: 10, def_inf: 80, def_cav: 80, speed: 5, carry: 3000, wood: 5800, clay: 5300, iron: 7200, crop: 5500, time: '6:23:20', upkeep: 1 }
  ]
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = COMPLETE_TROOP_DATA;
}

// Make available in browser
if (typeof window !== 'undefined') {
  window.COMPLETE_TROOP_DATA = COMPLETE_TROOP_DATA;
}

console.log('Complete troop data loaded for all 5 tribes');
console.log('Access via: COMPLETE_TROOP_DATA.romans, .teutons, .gauls, .egyptians, .huns');
