const puppeteer = require('puppeteer-core');

async function test() {
    console.log('Testing Chrome...');
    try {
        const browser = await puppeteer.launch({
            executablePath: '/home/runner/.nix-profile/bin/chromium',
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            timeout: 10000 // 10 second timeout
        });
        console.log('✅ Chrome launched!');
        
        const page = await browser.newPage();
        await page.goto('http://example.com', { timeout: 10000 });
        const title = await page.title();
        console.log('✅ Page loaded! Title:', title);
        
        await browser.close();
        console.log('✅ Test complete!');
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
    process.exit(0);
}

test();
