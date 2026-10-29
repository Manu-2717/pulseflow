import os
import time
from playwright.sync_api import sync_playwright

os.makedirs('docs/images', exist_ok=True)

HIDE_DEV_TOOLS = '''
  nextjs-portal,
  [data-nextjs-toast],
  [data-nextjs-dialog-overlay],
  #nextjs-dev-overlay,
  div[data-next-badge] {
    display: none !important;
  }
'''

with sync_playwright() as p:
    browser = p.chromium.launch()

    # 1. Landing Hero
    print('1. Capturing landing-hero.png...')
    ctx1 = browser.new_context(viewport={'width': 1360, 'height': 820}, device_scale_factor=2)
    p1 = ctx1.new_page()
    p1.goto('http://localhost:3000')
    p1.wait_for_selector('.hero-demo')
    p1.add_style_tag(content=HIDE_DEV_TOOLS)
    p1.wait_for_timeout(1500)
    p1.screenshot(path='docs/images/landing-hero.png')
    ctx1.close()

    # Log in session for authenticated views
    ctx2 = browser.new_context(viewport={'width': 1360, 'height': 880}, device_scale_factor=2)
    p2 = ctx2.new_page()
    p2.goto('http://localhost:3000/login')
    p2.add_style_tag(content=HIDE_DEV_TOOLS)
    p2.fill('input[name="email"]', 'alex@pulseflow.dev')
    p2.fill('input[name="password"]', 'Password12345!')
    with p2.expect_response(lambda r: '/api/auth/' in r.url):
        p2.click('button[type="submit"]')
    p2.wait_for_timeout(1000)

    # 2. Main Dashboard & Tasks View
    print('2. Capturing dashboard.png...')
    p2.goto('http://localhost:3000/w/pulseflow-eng')
    p2.wait_for_selector('.task-row')
    p2.add_style_tag(content=HIDE_DEV_TOOLS)
    p2.wait_for_timeout(1000)
    p2.screenshot(path='docs/images/dashboard.png')

    # 3. Blocker Brief Drawer with AI summary & code patch
    print('3. Capturing blocker-brief.png...')
    p2.locator('.task-row', has_text='TSK-03').locator('.task-primary').click()
    p2.wait_for_selector('.drawer')
    p2.add_style_tag(content=HIDE_DEV_TOOLS)
    p2.wait_for_timeout(500)

    # Open Blockers & discussion
    disc = p2.locator('details.task-discussions summary')
    if disc.count() > 0:
        disc.click()
        p2.wait_for_timeout(500)

    # Click thread card
    thread = p2.locator('.thread-card').first
    if thread.count() > 0:
        thread.click()
        p2.wait_for_timeout(800)

    # Scroll drawer so the AI brief and code solution are prominently framed
    p2.evaluate('''() => {
        const brief = document.querySelector('.brief-card');
        if (brief) {
            brief.scrollIntoView({ behavior: 'instant', block: 'start' });
        }
    }''')
    p2.wait_for_timeout(600)
    p2.screenshot(path='docs/images/blocker-brief.png')

    # Close drawer
    close_btn = p2.locator('.drawer-top button.icon-button')
    if close_btn.count() > 0:
        close_btn.click()
        p2.wait_for_timeout(400)

    # 4. Capacity Radar Cards (Focused Crop/View)
    print('4. Capturing capacity-radar.png...')
    workload = p2.locator('details.secondary-tools', has_text='Team workload')
    if workload.count() > 0:
        workload.locator('summary').click()
        p2.wait_for_timeout(500)
    
    cap = p2.locator('.capacity-section')
    if cap.count() > 0:
        cap.scroll_into_view_if_needed()
        p2.wait_for_timeout(500)
        p2.screenshot(path='docs/images/capacity-radar.png')

    # 5. Planning Suite - Gantt View
    print('5. Capturing planning-gantt.png...')
    p2.goto('http://localhost:3000/w/pulseflow-eng/plan')
    p2.wait_for_selector('.planner-toolbar')
    p2.add_style_tag(content=HIDE_DEV_TOOLS)
    p2.get_by_role('button', name='gantt', exact=True).click()
    p2.wait_for_timeout(1000)
    p2.screenshot(path='docs/images/planning-gantt.png')

    ctx2.close()
    browser.close()

print('Compact visual assets captured successfully!')
