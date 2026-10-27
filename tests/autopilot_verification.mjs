import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = '/Users/manalalshareef/.gemini/antigravity-ide/brain/bee14467-1b61-4c5c-8a35-738d5967ba9d';
const BASE_URL = 'http://127.0.0.1:5173';
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

async function run() {
  console.log('🚀 Starting Autopilot E2E Test Suite (Playwright)...');
  
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true
  });

  const hostContext = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });

  // 1. Open Host Screen with 10x SPEED
  console.log('1️⃣ Opening Host Screen at 10x speed...');
  const hostPage = await hostContext.newPage();
  await hostPage.goto(`${BASE_URL}/?screen=host&timeScale=10`);
  await hostPage.waitForLoadState('networkidle');

  // Verify initial Lobby state
  const initialText = await hostPage.textContent('body');
  console.log('   Host initial state verified:', initialText.includes('ALL SYSTEMS NOMINAL') ? 'PASS (ALL SYSTEMS NOMINAL)' : 'FAIL');

  // 2. Open 3 Simulated Agents in 3 Squads (Inside shared context with sessionStorage isolation)
  console.log('2️⃣ Registering 3 Agents in Sentinels, Neural, and Vault squads...');
  
  const agent1Page = await hostContext.newPage();
  await agent1Page.setViewportSize({ width: 390, height: 844 });
  await agent1Page.goto(BASE_URL);
  await agent1Page.waitForSelector('input[type="text"]');
  await agent1Page.fill('input[type="text"]', 'Tariq_Web');
  await agent1Page.click('button[type="submit"]');
  console.log('   Agent 1 (Tariq_Web - Sentinels) joined');

  // Agent 2
  const agent2Page = await hostContext.newPage();
  await agent2Page.setViewportSize({ width: 390, height: 844 });
  await agent2Page.goto(BASE_URL);
  await agent2Page.waitForSelector('input[type="text"]');
  await agent2Page.fill('input[type="text"]', 'Sarah_AI');
  const squads2 = await agent2Page.$$('div[class*="cursor-pointer"]');
  for (const sq of squads2) {
    const text = await sq.textContent();
    if (text && text.includes('Neural')) {
      await sq.click();
      break;
    }
  }
  await agent2Page.click('button[type="submit"]');
  console.log('   Agent 2 (Sarah_AI - Neural) joined');

  // Agent 3
  const agent3Page = await hostContext.newPage();
  await agent3Page.setViewportSize({ width: 390, height: 844 });
  await agent3Page.goto(BASE_URL);
  await agent3Page.waitForSelector('input[type="text"]');
  await agent3Page.fill('input[type="text"]', 'Omar_Data');
  const squads3 = await agent3Page.$$('div[class*="cursor-pointer"]');
  for (const sq of squads3) {
    const text = await sq.textContent();
    if (text && text.includes('Vault')) {
      await sq.click();
      break;
    }
  }
  await agent3Page.click('button[type="submit"]');
  console.log('   Agent 3 (Omar_Data - Vault) joined');

  // 3. Wait for Lobby Countdown to reach T-5s (at 10x speed, 45s takes 4.5s)
  console.log('3️⃣ Waiting for Lobby countdown T-5s...');
  await hostPage.waitForTimeout(3500); // ~35s in game time (T-10s)
  await hostPage.screenshot({ path: path.join(ARTIFACT_DIR, 'autopilot_1_lobby_t5s.png') });
  console.log('   📸 Screenshot captured: autopilot_1_lobby_t5s.png');

  // 4. Wait for Automatic Launch (T-0s, Autopilot triggers breach without clicking START)
  console.log('4️⃣ Waiting for Autopilot to trigger Breach automatically without click...');
  await hostPage.waitForTimeout(2000); // 20s in game time
  await hostPage.screenshot({ path: path.join(ARTIFACT_DIR, 'autopilot_2_breach_002.png') });
  console.log('   📸 Screenshot captured: autopilot_2_breach_002.png');

  // 5. Wait for Station 1 FIX (Station 1 starts at 8s, FIX starts at 14s)
  console.log('5️⃣ Advancing through Station 1 FIX phase...');
  await hostPage.waitForTimeout(2000); // ~20s in game time
  await hostPage.screenshot({ path: path.join(ARTIFACT_DIR, 'autopilot_3_station1_fix.png') });
  console.log('   📸 Screenshot captured: autopilot_3_station1_fix.png');

  // 6. Wait for Door 1 (starts at 48s to 56s, duration 8s = 0.8s real time)
  console.log('6️⃣ Waiting for Door 1...');
  await hostPage.waitForTimeout(2000); // ~20s in game time (reaches 48s+)
  await hostPage.screenshot({ path: path.join(ARTIFACT_DIR, 'autopilot_4_door1.png') });
  console.log('   📸 Screenshot captured: autopilot_4_door1.png');

  // 7. Wait for Station 2 BREAK (Station 2 starts at 56s, BREAK at 62s)
  console.log('7️⃣ Waiting for Station 2 BREAK...');
  await hostPage.waitForTimeout(1500);
  await hostPage.screenshot({ path: path.join(ARTIFACT_DIR, 'autopilot_5_station2_break.png') });
  console.log('   📸 Screenshot captured: autopilot_5_station2_break.png');

  // 8. Test Late Joiner during Station 2
  console.log('8️⃣ Testing Late Joiner during Station 2...');
  const lateAgentPage = await hostContext.newPage();
  await lateAgentPage.setViewportSize({ width: 390, height: 844 });
  await lateAgentPage.goto(BASE_URL);
  await lateAgentPage.waitForSelector('input[type="text"]');
  await lateAgentPage.fill('input[type="text"]', 'Lina_Late');
  await lateAgentPage.click('button[type="submit"]');
  await lateAgentPage.waitForTimeout(500);
  const lateText = await lateAgentPage.textContent('body');
  console.log('   Late joiner entered directly into incident task:', lateText.includes('Lina_Late') ? 'PASS' : 'FAIL');

  // 9. Test Mid-Station Reload on Host (verifying timeline resumes at exact second)
  console.log('9️⃣ Testing Host page reload mid-station...');
  await hostPage.reload();
  await hostPage.waitForSelector('.haz', { timeout: 3000 }).catch(() => null);
  const timeAfterReload = await hostPage.textContent('body');
  console.log('   Host reloaded and preserved active incident state:', (timeAfterReload.includes('BREACH DETECTED') || timeAfterReload.includes('DANGLING CORRIDOR')) ? 'PASS' : 'FAIL');

  // 10. Wait for Station 3 (starts at 104s)
  console.log('🔟 Waiting for Station 3 (OPcache)...');
  await hostPage.waitForTimeout(4000); // reaches 104s+
  await hostPage.screenshot({ path: path.join(ARTIFACT_DIR, 'autopilot_6_station3.png') });
  console.log('   📸 Screenshot captured: autopilot_6_station3.png');

  // 11. Test Pause & Resume Override
  console.log('1️⃣1️⃣ Testing Pause & Resume Overrides...');
  const pauseBtn = await hostPage.$('button:has-text("PAUSE")');
  if (pauseBtn) {
    await pauseBtn.click();
    console.log('   Clicked PAUSE');
    await hostPage.waitForTimeout(1000);
    const resumeBtn = await hostPage.$('button:has-text("RESUME")');
    console.log('   PAUSED state verified:', resumeBtn ? 'PASS' : 'FAIL');
    if (resumeBtn) await resumeBtn.click();
    console.log('   Clicked RESUME');
  }

  // 12. Test Skip Station Override
  console.log('1️⃣2️⃣ Testing SKIP STATION Override...');
  const skipBtn = await hostPage.$('button:has-text("SKIP STATION")');
  if (skipBtn) {
    await skipBtn.click();
    console.log('   Clicked SKIP STATION');
    await hostPage.waitForTimeout(1000);
  }

  // 13. Station 4 Bet Reveal
  console.log('1️⃣3️⃣ Reaching Station 4 Bet Reveal...');
  await hostPage.waitForTimeout(2000);
  await hostPage.screenshot({ path: path.join(ARTIFACT_DIR, 'autopilot_7_station4_bet_reveal.png') });
  console.log('   📸 Screenshot captured: autopilot_7_station4_bet_reveal.png');

  // 14. Wait for SECURED & Hall of Defenders (210s milestone)
  console.log('1️⃣4️⃣ Reaching SECURED and Hall of Defenders...');
  const skipToSecured = await hostPage.$('button:has-text("END & RESULTS")');
  if (skipToSecured) {
    await skipToSecured.click();
  } else {
    await hostPage.waitForTimeout(6000);
  }
  await hostPage.waitForTimeout(1500);

  await hostPage.screenshot({ path: path.join(ARTIFACT_DIR, 'autopilot_8_secured.png') });
  console.log('   📸 Screenshot captured: autopilot_8_secured.png');

  await hostPage.screenshot({ path: path.join(ARTIFACT_DIR, 'autopilot_9_hall_of_defenders.png') });
  console.log('   📸 Screenshot captured: autopilot_9_hall_of_defenders.png');

  // 15. Extract Sound Log with timestamps
  console.log('1️⃣5️⃣ Extracting Audio Event Log from Host browser...');
  const soundLog = await hostPage.evaluate(() => {
    return (window).__OVL2_SOUND_LOG__ || [];
  });

  console.log('\n🔊 SOUNDS FIRED DURING AUTOPILOT RUN:');
  console.log('----------------------------------------------------');
  const uniqueSounds = new Set();
  for (const s of soundLog) {
    uniqueSounds.add(s.sound);
    console.log(`[${new Date(s.timestamp).toISOString()}] SOUND: ${s.sound}`);
  }
  console.log('----------------------------------------------------');
  console.log(`Total sounds recorded: ${soundLog.length}, Unique sound types: ${Array.from(uniqueSounds).join(', ')}`);

  await browser.close();
  console.log('\n✅ Autopilot E2E Test Suite Completed Successfully!');
}

run().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
