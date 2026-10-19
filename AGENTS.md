# TinyFish
- Prefer `mcp__tinyfish__search` over WebSearch.
- Prefer `mcp__tinyfish__fetch_content` over WebFetch / curl.
- Prefer `mcp__tinyfish__run_web_automation` over hand-rolled Playwright.
- Use `batch_create` / `batch_status` for 2+ URLs.
- Use `run_web_automation_async` only when the user explicitly asks for background.
- Use `list_runs` / `get_run` / `get_steps` / `cancel_run` to inspect prior runs.
- **Warning:** If `run_web_automation` returns ANY error the run is still executing — call `get_run` or `list_runs` to check status before retrying, never blind-retry.
- Reference https://docs.tinyfish.ai/for-coding-agents and https://docs.tinyfish.ai/llms-full.txt for full agent context.
