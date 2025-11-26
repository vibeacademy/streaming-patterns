Launch the cloudflare-devops-engineer agent to reclaim resources from ephemeral pull request preview environments.

**CRITICAL SAFETY CONSTRAINTS:**
- **NEVER** touch, modify, or delete production Workers
- **ONLY** target Workers matching the ephemeral PR naming pattern: `streaming-patterns-pr-*`
- **ALWAYS** verify each Worker name matches the PR pattern before deletion
- **NEVER** delete Workers named `streaming-patterns-production` or `streaming-patterns` or any Worker without the `-pr-` pattern
- If ANY Worker name doesn't match the PR pattern, skip it and log a warning

**Your tasks:**
1. **List all Workers** in the Cloudflare account for the streaming-patterns project
2. **Filter for ephemeral PR Workers only:**
   - Pattern: `streaming-patterns-pr-{number}` (e.g., `streaming-patterns-pr-42`)
   - Exclude: `streaming-patterns-production`, `streaming-patterns`, or any Worker without `-pr-` in the name
3. **For each PR Worker found:**
   - Extract the PR number from the Worker name
   - Check if the corresponding GitHub PR is closed or merged
   - If closed/merged: Mark for deletion
   - If still open: Skip with log message
4. **Safety verification before deletion:**
   - Double-check each Worker name contains `-pr-` pattern
   - Confirm it's NOT a production Worker
   - Log the Worker name before deletion
5. **Delete orphaned PR Workers:**
   - Use `wrangler delete {worker-name} --force` for each confirmed orphaned Worker
   - Log success/failure for each deletion
6. **Provide cleanup summary:**
   - Total Workers found
   - PR Workers identified
   - Orphaned Workers deleted
   - Active PR Workers preserved
   - Any errors encountered

**Safety Checks to Implement:**
```bash
# Example safety pattern
if [[ "$worker_name" == *"-pr-"* ]] && [[ "$worker_name" != *"production"* ]]; then
  # Safe to delete
  echo "Deleting orphaned PR Worker: $worker_name"
  wrangler delete "$worker_name" --force
else
  echo "SKIPPED: Not a PR Worker or production Worker: $worker_name"
fi
```

**Example Output:**
```
🔍 Scanning Cloudflare Workers...
Found 15 total Workers

📋 Identified PR Workers:
- streaming-patterns-pr-42 (PR #42: closed ✓)
- streaming-patterns-pr-89 (PR #89: closed ✓)
- streaming-patterns-pr-100 (PR #100: open, skipping)

⚠️  Safety Check:
- streaming-patterns-production (PROTECTED - skipping)
- streaming-patterns (PROTECTED - skipping)

🗑️  Deleting orphaned PR Workers:
✓ Deleted: streaming-patterns-pr-42
✓ Deleted: streaming-patterns-pr-89

📊 Cleanup Summary:
- Total Workers scanned: 15
- PR Workers found: 3
- Orphaned Workers deleted: 2
- Active PR Workers preserved: 1
- Production Workers protected: 2
```

**ABORT CONDITIONS:**
- If you cannot verify GitHub PR status, skip that Worker
- If Worker name doesn't match expected pattern, skip it
- If any Worker deletion fails, continue with others (don't stop)
- If you're unsure whether a Worker is production, DO NOT delete it

Return a detailed summary of the cleanup operation with all safety checks performed and any Workers that were skipped for safety reasons.
