// Simple village finder for Travian
console.log('=== Finding Village List ===');

// Method 1: Find by "Villages" text
const allDivs = document.querySelectorAll('div');
let villageContainer = null;

allDivs.forEach(div => {
  const text = div.textContent || '';
  if (text.includes('Villages') && text.includes('6/6')) {
    console.log('Found "Villages 6/6" in:', div);
    villageContainer = div;
  }
});

// Method 2: Find all links with coordinates
const coordLinks = [];
document.querySelectorAll('a').forEach(link => {
  const text = link.textContent || '';
  if (text.match(/\(\d+\|\d+\)/)) {
    coordLinks.push({
      text: text.trim(),
      href: link.href,
      parent: link.parentElement
    });
  }
});

console.log(`\nFound ${coordLinks.length} links with coordinates:`);
coordLinks.forEach(link => console.log(link.text, link.href));

// Method 3: Find newdid links
const newdidLinks = document.querySelectorAll('a[href*="newdid"]');
console.log(`\nFound ${newdidLinks.length} village switch links`);

if (newdidLinks.length > 0) {
  const parent = newdidLinks[0].closest('div[class], ul, ol');
  console.log('\nVillage list container:', parent);
  console.log('Container ID:', parent?.id || 'no id');
  console.log('Container classes:', parent?.className || 'no classes');
  
  // Generate the fix
  if (parent) {
    const selector = parent.id ? `#${parent.id}` : `.${parent.className.split(' ')[0]}`;
    console.log('\n✅ FIX FOR village-navigator.ts:');
    console.log(`const villageSwitcher = document.querySelector('${selector}');`);
  }
}
