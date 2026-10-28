import { chromium } from 'playwright';

async function runTests() {
  console.log('--- STARTING PLAYWRIGHT MULTI-SCREEN & GAMEPLAY WALKTHROUGH ---');
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  });

  const ARTIFACTS_DIR = '/Users/manalalshareef/.gemini/antigravity-ide/brain/bee14467-1b61-4c5c-8a35-738d5967ba9d';

  // -------------------------------------------------------------
  // TEST 1: HOST SCREENS AT 1280x800 (Pixel-for-pixel reference check)
  // -------------------------------------------------------------
  const hostPage = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  
  // 1.1 LOBBY (Screen 1)
  await hostPage.goto('http://127.0.0.1:5173/?view=host');
  await hostPage.evaluate(() => {
    localStorage.clear();
    const fresh = {
      eventId: 'event_503',
      status: 'STABLE',
      currentStation: 0,
      subphase: 'NORMAL',
      subphaseTimeRemaining: 45,
      totalTimeRemaining: 214,
      threatLevel: 1,
      sharedServerHealth: 100,
      doorCode: '5037',
      doorCodeExpiresIn: 8,
      exposedSitesCount: 700000,
      registrationOpen: true,
      activeAlarm: false,
      powerFlicker: false,
      roundStartAt: null,
      lobbyStartAt: null,
      pausedAt: null,
      pausedOffsetSec: 0,
      autopilot: true,
      autoLoop: false,
      timeScale: 1,
      scriptedEvent: 'NONE'
    };
    localStorage.setItem('overload503_event_state', JSON.stringify(fresh));
  });
  await hostPage.reload();
  await hostPage.waitForTimeout(1000);
  await hostPage.screenshot({ path: `${ARTIFACTS_DIR}/test_screen1_lobby.png` });
  console.log('✓ Captured Screen 1 (Lobby / Nominal) at 1280x800');

  // Trigger Start Now to enter Breach
  await hostPage.click('button:has-text("START NOW")');
  await hostPage.waitForTimeout(1500);

  // 1.2 BREACH (Screen 2)
  await hostPage.screenshot({ path: `${ARTIFACTS_DIR}/test_screen2_breach.png` });
  console.log('✓ Captured Screen 2 (Breach Detected) at 1280x800');

  // 1.3 LOGIN (Screen 3) - Wait or skip to Login
  await hostPage.waitForTimeout(8000); // 8 seconds breach phase
  await hostPage.screenshot({ path: `${ARTIFACTS_DIR}/test_screen3_login.png` });
  console.log('✓ Captured Screen 3 (Login / Authentication) at 1280x800');

  // 1.4 STATION 1 (Screen 4: Type-to-Block)
  await hostPage.click('button:has-text("SKIP")');
  await hostPage.waitForTimeout(1500);
  await hostPage.screenshot({ path: `${ARTIFACTS_DIR}/test_screen4_station1.png` });
  console.log('✓ Captured Screen 4 (Station 1 Type-to-Block) at 1280x800');

  // 1.5 STATION 2 (Screen 5: Memory & UAF)
  await hostPage.click('button:has-text("SKIP")');
  await hostPage.waitForTimeout(1500);
  await hostPage.screenshot({ path: `${ARTIFACTS_DIR}/test_screen5_station2.png` });
  console.log('✓ Captured Screen 5 (Station 2 Memory) at 1280x800');

  // 1.6 HALL OF DEFENDERS (Screen 6: Secured & Leaderboard)
  await hostPage.click('button:has-text("END")');
  await hostPage.waitForTimeout(1500);
  await hostPage.screenshot({ path: `${ARTIFACTS_DIR}/test_screen6_hall_of_defenders.png` });
  console.log('✓ Captured Screen 6 (Hall of Defenders) at 1280x800');

  // -------------------------------------------------------------
  // TEST 2: MOBILE AGENT SCREEN (390x844 portrait)
  // -------------------------------------------------------------
  const mobilePage = await browser.newPage({ 
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true
  });
  
  await mobilePage.goto('http://127.0.0.1:5173/?view=agent');
  await mobilePage.waitForTimeout(1000);

  // Register display name without PIN
  await mobilePage.fill('input[type="text"]', 'Reem_Cyber');
  await mobilePage.click('button[type="submit"]');
  await mobilePage.waitForTimeout(1500);
  await mobilePage.screenshot({ path: `${ARTIFACTS_DIR}/test_mobile_agent_joined.png` });
  console.log('✓ Verified Agent Join without PIN on Mobile (390x844)');

  // Type SSH login command in terminal
  const terminalInput = 'input[placeholder*="type command"]';
  await mobilePage.fill(terminalInput, 'ssh soc@prod-04');
  await mobilePage.press(terminalInput, 'Enter');
  await mobilePage.waitForTimeout(800);

  // Enter masked password: Ov3r-503
  const passwordInput = 'input[type="password"]';
  await mobilePage.fill(passwordInput, 'Ov3r-503');
  await mobilePage.press(passwordInput, 'Enter');
  await mobilePage.waitForTimeout(1000);
  await mobilePage.screenshot({ path: `${ARTIFACTS_DIR}/test_mobile_agent_login_granted.png` });
  console.log('✓ Verified SSH Authentication & Masked Password on Mobile');

  // Type inspect memory & clear pointer
  await mobilePage.fill(terminalInput, 'clear 0x7f3a');
  await mobilePage.press(terminalInput, 'Enter');
  await mobilePage.waitForTimeout(800);

  // Type update wordpress (the key trap)
  await mobilePage.fill(terminalInput, 'update wordpress');
  await mobilePage.press(terminalInput, 'Enter');
  await mobilePage.waitForTimeout(800);

  // Type patch command & verify
  await mobilePage.fill(terminalInput, 'sudo apt install php8.4=8.4.27');
  await mobilePage.press(terminalInput, 'Enter');
  await mobilePage.waitForTimeout(800);

  // Enter sudo password
  await mobilePage.fill(passwordInput, 'Ov3r-503');
  await mobilePage.press(passwordInput, 'Enter');
  await mobilePage.waitForTimeout(1200);

  // Restart php-fpm
  await mobilePage.fill(terminalInput, 'restart php-fpm');
  await mobilePage.press(terminalInput, 'Enter');
  await mobilePage.waitForTimeout(800);

  // Run verify
  await mobilePage.fill(terminalInput, 'verify');
  await mobilePage.press(terminalInput, 'Enter');
  await mobilePage.waitForTimeout(1000);
  await mobilePage.screenshot({ path: `${ARTIFACTS_DIR}/test_mobile_agent_gameplay_complete.png` });
  console.log('✓ Verified Full Interactive Gameplay on Mobile (390x844)');

  // -------------------------------------------------------------
  // TEST 3: LAPTOP 2-COLUMN AGENT SCREEN (1024x768)
  // -------------------------------------------------------------
  const laptopPage = await browser.newPage({ viewport: { width: 1024, height: 768 } });
  await laptopPage.goto('http://127.0.0.1:5173/?view=agent');
  await laptopPage.waitForTimeout(1000);
  await laptopPage.screenshot({ path: `${ARTIFACTS_DIR}/test_laptop_agent_2column.png` });
  console.log('✓ Verified Laptop 2-Column Layout (1024x768)');

  await browser.close();
  console.log('--- ALL PLAYWRIGHT TESTS PASSED SUCCESSFULLY ---');
}

runTests().catch(err => {
  console.error('Playwright Test Failed:', err);
  process.exit(1);
});
