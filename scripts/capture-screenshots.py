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
    
    # 1. Landing Hero (1440x900)
    print('1. Capturing 01-landing-hero.png...')
    context = browser.new_context(viewport={'width': 1440, 'height': 900}, device_scale_factor=2)
    page = context.new_page()
    page.goto('http://localhost:3000')
    page.wait_for_selector('.hero-demo')
    page.add_style_tag(content=HIDE_DEV_TOOLS)
    page.wait_for_timeout(2000)
    page.screenshot(path='docs/images/01-landing-hero.png')
    context.close()

    # 2. Login Context
    context = browser.new_context(viewport={'width': 1440, 'height': 1180}, device_scale_factor=2)
    page = context.new_page()
    page.goto('http://localhost:3000/login')
    page.add_style_tag(content=HIDE_DEV_TOOLS)
    page.fill('input[name="email"]', 'alex@pulseflow.dev')
    page.fill('input[name="password"]', 'Password12345!')
    with page.expect_response(lambda r: '/api/auth/' in r.url):
        page.click('button[type="submit"]')
    page.wait_for_timeout(1000)

    # 3. Workspace Dashboard with Capacity Radar
    print('2. Capturing 02-workspace-dashboard.png...')
    page.goto('http://localhost:3000/w/pulseflow-eng')
    page.wait_for_selector('.task-row')
    page.add_style_tag(content=HIDE_DEV_TOOLS)
    
    # Open Team Workload details if present
    workload_details = page.locator('details.secondary-tools', has_text='Team workload')
    if workload_details.count() > 0:
        workload_details.locator('summary').click()
        page.wait_for_timeout(500)
    
    page.screenshot(path='docs/images/02-workspace-dashboard.png')

    # 4. Blocker Brief Drawer with AI summary and code snippet
    print('3. Capturing 03-blocker-brief.png...')
    # Open TSK-03
    page.locator('.task-row', has_text='TSK-03').locator('.task-primary').click()
    page.wait_for_selector('.drawer')
    page.add_style_tag(content=HIDE_DEV_TOOLS)
    page.wait_for_timeout(500)
    
    # Open Blockers & discussion
    discussion_details = page.locator('details.task-discussions summary')
    if discussion_details.count() > 0:
        discussion_details.click()
        page.wait_for_timeout(500)
    
    # Click thread card
    thread_card = page.locator('.thread-card').first
    if thread_card.count() > 0:
        thread_card.click()
        page.wait_for_timeout(800)
    
    # Scroll drawer so the AI brief and code solution are nicely centered
    page.evaluate('''() => {
        const brief = document.querySelector('.brief-card');
        if (brief) {
            brief.scrollIntoView({ behavior: 'instant', block: 'start' });
        }
    }''')
    page.wait_for_timeout(500)
    page.screenshot(path='docs/images/03-blocker-brief.png')
    
    # Close drawer
    close_btn = page.locator('.drawer-top button.icon-button')
    if close_btn.count() > 0:
        close_btn.click()
        page.wait_for_timeout(500)

    # 5. Planning Suite - Gantt View (1440x900)
    print('4. Capturing 04-planning-gantt.png...')
    page.set_viewport_size({'width': 1440, 'height': 900})
    page.goto('http://localhost:3000/w/pulseflow-eng/plan')
    page.wait_for_selector('.planner-toolbar')
    page.add_style_tag(content=HIDE_DEV_TOOLS)
    page.get_by_role('button', name='gantt', exact=True).click()
    page.wait_for_timeout(1000)
    page.screenshot(path='docs/images/04-planning-gantt.png')

    # 6. Planning Suite - Sprints View
    print('5. Capturing 05-planning-sprints.png...')
    page.get_by_role('button', name='sprints', exact=True).click()
    page.wait_for_timeout(1000)
    page.screenshot(path='docs/images/05-planning-sprints.png')

    # 7. Planning Suite - Goals View
    print('6. Capturing 06-planning-goals.png...')
    page.get_by_role('button', name='goals', exact=True).click()
    page.wait_for_timeout(1000)
    page.screenshot(path='docs/images/06-planning-goals.png')

    context.close()
    browser.close()

print('All screenshots refreshed successfully!')
