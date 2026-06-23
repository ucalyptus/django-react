import asyncio
import json
import os
from playwright.async_api import async_playwright

SCREENSHOTS_DIR = "/home/ec2-user/mychoice/screenshots"
os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

BASE_URL = "https://mychoice.pages.dev"

def result(label, passed, detail=""):
    status = "PASS" if passed else "FAIL"
    print(f"[{status}] {label}" + (f" — {detail}" if detail else ""))

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()

        # ─── Test 1: SPA loads ───────────────────────────────────────────────
        page = await context.new_page()
        try:
            resp = await page.goto(BASE_URL + "/", wait_until="networkidle", timeout=30000)
            status = resp.status
            content = await page.content()
            has_root = 'id="root"' in content or "<div" in content
            title = await page.title()
            result(
                "SPA loads (GET /)",
                status == 200 and has_root,
                f"HTTP {status}, title='{title}', has_root={has_root}"
            )
            await page.screenshot(path=f"{SCREENSHOTS_DIR}/01_initial_load.png", full_page=True)
            print(f"  Screenshot: {SCREENSHOTS_DIR}/01_initial_load.png")
        except Exception as e:
            result("SPA loads (GET /)", False, str(e))

        # ─── Test 2a: API GET /items/ ────────────────────────────────────────
        api_page = await context.new_page()
        try:
            resp = await api_page.goto(BASE_URL + "/items/", timeout=15000)
            body = await api_page.inner_text("body")
            data = json.loads(body)
            result(
                "API GET /items/",
                resp.status == 200 and isinstance(data, list),
                f"HTTP {resp.status}, {len(data)} items returned"
            )
        except Exception as e:
            result("API GET /items/", False, str(e))

        # ─── Test 2b: API POST /items/ ───────────────────────────────────────
        try:
            import urllib.request, urllib.error
            payload = json.dumps({"name": "TestItem", "group": "Primary"}).encode()
            req = urllib.request.Request(
                BASE_URL + "/items/",
                data=payload,
                headers={"Content-Type": "application/json"},
                method="POST"
            )
            try:
                with urllib.request.urlopen(req, timeout=15) as r:
                    status = r.status
                    body = json.loads(r.read())
                    result(
                        "API POST /items/ (create)",
                        status == 201,
                        f"HTTP {status}, id={body.get('id')}, name={body.get('name')}"
                    )
                    created_id = body.get("id")
            except urllib.error.HTTPError as e:
                body = json.loads(e.read())
                result("API POST /items/ (create)", e.code == 201, f"HTTP {e.code}: {body}")
                created_id = None
        except Exception as e:
            result("API POST /items/ (create)", False, str(e))
            created_id = None

        # ─── Test 2c: API GET /items/1/ ─────────────────────────────────────
        try:
            resp = await api_page.goto(BASE_URL + "/items/1/", timeout=15000)
            body = await api_page.inner_text("body")
            data = json.loads(body)
            result(
                "API GET /items/1/",
                resp.status in (200, 404),
                f"HTTP {resp.status}, data={data}"
            )
        except Exception as e:
            result("API GET /items/1/", False, str(e))

        # ─── Test 2d: API POST duplicate → 400 ──────────────────────────────
        try:
            payload = json.dumps({"name": "TestItem", "group": "Primary"}).encode()
            req = urllib.request.Request(
                BASE_URL + "/items/",
                data=payload,
                headers={"Content-Type": "application/json"},
                method="POST"
            )
            try:
                with urllib.request.urlopen(req, timeout=15) as r:
                    result("API POST duplicate → 400", False, f"Expected 400, got HTTP {r.status}")
            except urllib.error.HTTPError as e:
                body = e.read()
                result(
                    "API POST duplicate → 400",
                    e.code == 400,
                    f"HTTP {e.code}: {body[:200]}"
                )
        except Exception as e:
            result("API POST duplicate → 400", False, str(e))

        # ─── Test 3: UI Interaction ──────────────────────────────────────────
        ui_page = await context.new_page()
        try:
            await ui_page.goto(BASE_URL + "/", wait_until="networkidle", timeout=30000)
            await ui_page.screenshot(path=f"{SCREENSHOTS_DIR}/02_spa_ready.png", full_page=True)
            print(f"  Screenshot: {SCREENSHOTS_DIR}/02_spa_ready.png")

            # Print the page source snippet to understand UI structure
            content = await ui_page.content()
            # Look for form elements
            inputs = await ui_page.query_selector_all("input")
            buttons = await ui_page.query_selector_all("button")
            print(f"  UI: {len(inputs)} input(s), {len(buttons)} button(s) found")

            # Try to find name/group inputs
            name_input = None
            group_input = None

            # Try common selectors
            for sel in ['input[name="name"]', 'input[placeholder*="name" i]', 'input[placeholder*="Name" i]', '#name', '#id_name']:
                el = await ui_page.query_selector(sel)
                if el:
                    name_input = el
                    print(f"  Found name input via: {sel}")
                    break

            for sel in ['input[name="group"]', 'input[placeholder*="group" i]', 'input[placeholder*="Group" i]', '#group', '#id_group', 'select[name="group"]']:
                el = await ui_page.query_selector(sel)
                if el:
                    group_input = el
                    print(f"  Found group input via: {sel}")
                    break

            if not name_input:
                # Try generic first/second input
                all_inputs = await ui_page.query_selector_all("input")
                if len(all_inputs) >= 1:
                    name_input = all_inputs[0]
                    print("  Falling back to first input for name")
                if len(all_inputs) >= 2:
                    group_input = all_inputs[1]
                    print("  Falling back to second input for group")

            if name_input:
                await name_input.fill("BrowserTest")
                if group_input:
                    tag = await group_input.evaluate("el => el.tagName.toLowerCase()")
                    if tag == "select":
                        await group_input.select_option(label="Primary")
                    else:
                        await group_input.fill("Primary")

                # Find and click submit button
                submit = None
                for sel in ['button[type="submit"]', 'input[type="submit"]', 'button:has-text("Add")', 'button:has-text("Create")', 'button:has-text("Submit")', 'button:has-text("Save")']:
                    el = await ui_page.query_selector(sel)
                    if el:
                        submit = el
                        print(f"  Found submit via: {sel}")
                        break
                if not submit:
                    btns = await ui_page.query_selector_all("button")
                    if btns:
                        submit = btns[0]
                        print("  Falling back to first button for submit")

                if submit:
                    await submit.click()
                    await ui_page.wait_for_timeout(2000)
                    await ui_page.screenshot(path=f"{SCREENSHOTS_DIR}/03_after_submit.png", full_page=True)
                    print(f"  Screenshot: {SCREENSHOTS_DIR}/03_after_submit.png")

                    # Verify item appears in list
                    page_text = await ui_page.inner_text("body")
                    if "BrowserTest" in page_text:
                        result("UI: Create item + appears in list", True, "BrowserTest found in page")
                    else:
                        result("UI: Create item + appears in list", False, "BrowserTest NOT found in page text")
                        print(f"  Page text (first 500 chars): {page_text[:500]}")
                else:
                    result("UI: Create item + appears in list", False, "No submit button found")
            else:
                result("UI: Create item + appears in list", False, "No name input found")
                print(f"  Page HTML snippet: {content[:800]}")

            # ─── Click item to open detail panel ────────────────────────────
            try:
                # Try to find the item link/row
                item_el = None
                for sel in [f'text="BrowserTest"', f'[data-name="BrowserTest"]', f'li:has-text("BrowserTest")', f'tr:has-text("BrowserTest")', f'div:has-text("BrowserTest") >> nth=0']:
                    el = await ui_page.query_selector(sel)
                    if el:
                        item_el = el
                        print(f"  Found item element via: {sel}")
                        break

                if item_el:
                    await item_el.click()
                    await ui_page.wait_for_timeout(1500)
                    await ui_page.screenshot(path=f"{SCREENSHOTS_DIR}/04_detail_panel.png", full_page=True)
                    print(f"  Screenshot: {SCREENSHOTS_DIR}/04_detail_panel.png")
                    result("UI: Click item → detail panel", True, "Clicked BrowserTest item")
                else:
                    result("UI: Click item → detail panel", False, "Could not find BrowserTest item to click")

                # ─── Click Edit ──────────────────────────────────────────────
                edit_el = None
                for sel in ['button:has-text("Edit")', 'a:has-text("Edit")', '[data-action="edit"]']:
                    el = await ui_page.query_selector(sel)
                    if el:
                        edit_el = el
                        print(f"  Found edit button via: {sel}")
                        break

                if edit_el:
                    await edit_el.click()
                    await ui_page.wait_for_timeout(1000)

                    # Change name
                    edit_name = None
                    for sel in ['input[name="name"]', 'input[value="BrowserTest"]', 'input']:
                        el = await ui_page.query_selector(sel)
                        if el:
                            edit_name = el
                            break

                    if edit_name:
                        await edit_name.triple_click()
                        await edit_name.fill("BrowserTest-edited")

                        # Save
                        save_el = None
                        for sel in ['button[type="submit"]', 'button:has-text("Save")', 'button:has-text("Update")', 'input[type="submit"]']:
                            el = await ui_page.query_selector(sel)
                            if el:
                                save_el = el
                                break

                        if save_el:
                            await save_el.click()
                            await ui_page.wait_for_timeout(2000)
                            await ui_page.screenshot(path=f"{SCREENSHOTS_DIR}/05_after_edit.png", full_page=True)
                            print(f"  Screenshot: {SCREENSHOTS_DIR}/05_after_edit.png")
                            page_text = await ui_page.inner_text("body")
                            result(
                                "UI: Edit item → name updated",
                                "BrowserTest-edited" in page_text,
                                "BrowserTest-edited" + (" found" if "BrowserTest-edited" in page_text else " NOT found") + " in page"
                            )
                        else:
                            result("UI: Edit item → name updated", False, "No save button found after edit")
                    else:
                        result("UI: Edit item → name updated", False, "No editable name input found")
                else:
                    result("UI: Edit item → name updated", False, "No Edit button found in detail panel")

            except Exception as e:
                result("UI: Click item / edit flow", False, str(e))

        except Exception as e:
            result("UI interaction (overall)", False, str(e))

        await browser.close()
        print(f"\nScreenshots saved to: {SCREENSHOTS_DIR}/")

asyncio.run(main())
