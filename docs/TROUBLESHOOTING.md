# Troubleshooting Guide

This guide covers common issues developers encounter when working with the Streaming Patterns Library and their solutions.

## Table of Contents

1. [Installation Issues](#installation-issues)
2. [Development Server Problems](#development-server-problems)
3. [Build Errors](#build-errors)
4. [Runtime Issues](#runtime-issues)
5. [Pattern-Specific Troubleshooting](#pattern-specific-troubleshooting)
6. [Getting Help](#getting-help)

---

## Installation Issues

### Node.js Version Requirements

**Problem**: Installation fails or shows warnings about unsupported Node.js version.

**Solution**: This project requires Node.js 18.0.0 or higher.

Check your current Node.js version:
```bash
node --version
```

If your version is below 18.0.0, upgrade Node.js:

**Using nvm (recommended):**
```bash
# Install Node 18 LTS
nvm install 18

# Use Node 18
nvm use 18

# Set as default
nvm alias default 18
```

**Using official installer:**
- Download from [nodejs.org](https://nodejs.org)
- Install the LTS version (18.x or higher)

After upgrading, verify the installation:
```bash
node --version  # Should show v18.x.x or higher
npm --version   # Should show 9.x.x or higher
```

---

### npm install Fails

**Problem**: `npm install` fails with EACCES, permission errors, or network timeouts.

**Solution 1: Permission Issues (macOS/Linux)**
```bash
# Never use sudo with npm install
# Instead, fix npm permissions:
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'

# Add to your ~/.bashrc or ~/.zshrc:
export PATH=~/.npm-global/bin:$PATH

# Reload shell config
source ~/.bashrc  # or source ~/.zshrc

# Try installation again
npm install
```

**Solution 2: Network/Registry Issues**
```bash
# Clear npm cache
npm cache clean --force

# Try with a different registry
npm install --registry https://registry.npmjs.org/

# If behind a proxy, configure it:
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080
```

**Solution 3: Lock File Conflicts**
```bash
# Remove lock file and node_modules
rm -rf node_modules package-lock.json

# Reinstall from scratch
npm install
```

---

### TypeScript Installation Issues

**Problem**: TypeScript types not found or version conflicts.

**Solution**: Ensure TypeScript 5.6+ is installed:
```bash
# Check TypeScript version
npx tsc --version

# If below 5.6, reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Verify devDependencies includes typescript@^5.6.3
npm list typescript
```

---

## Development Server Problems

### Port 5173 Already in Use

**Problem**: Error message `Port 5173 is in use` when running `npm run dev`.

**Solution 1: Kill the Process Using Port 5173**

**macOS/Linux:**
```bash
# Find the process using port 5173
lsof -ti:5173

# Kill the process
kill -9 $(lsof -ti:5173)

# Or combine both commands
lsof -ti:5173 | xargs kill -9

# Start dev server again
npm run dev
```

**Windows (PowerShell):**
```powershell
# Find process on port 5173
netstat -ano | findstr :5173

# Kill process by PID (replace <PID> with actual number)
taskkill /PID <PID> /F

# Start dev server again
npm run dev
```

**Solution 2: Use a Different Port**

Edit `vite.config.ts` to change the port:
```typescript
export default defineConfig({
  server: {
    port: 5174, // or any available port
    strictPort: false, // allows fallback to another port
  },
});
```

---

### Dev Server Starts but Page Won't Load

**Problem**: Server starts successfully but browser shows "Cannot connect" or blank page.

**Solution**:

1. **Verify the correct URL**: Open `http://localhost:5173` (not https)

2. **Check browser console** for errors (F12 → Console tab)

3. **Clear browser cache**:
   - Chrome/Edge: Ctrl+Shift+Delete (Cmd+Shift+Delete on macOS)
   - Select "Cached images and files"
   - Click "Clear data"

4. **Try incognito/private mode** to rule out extension conflicts

5. **Check firewall settings**: Ensure localhost traffic is allowed

6. **Restart the dev server**:
   ```bash
   # Stop server (Ctrl+C)
   # Clear Vite cache
   rm -rf node_modules/.vite

   # Restart
   npm run dev
   ```

---

### Hot Module Replacement (HMR) Not Working

**Problem**: Changes to code don't reflect in browser without manual refresh.

**Solution**:

1. **Check console for HMR errors**:
   - Open browser DevTools (F12)
   - Look for messages like "HMR disconnected"

2. **Verify file watchers**:
   ```bash
   # macOS: Increase file watcher limit
   echo "kern.maxfiles=65536\nkern.maxfilesperproc=65536" | sudo tee -a /etc/sysctl.conf
   sudo sysctl -w kern.maxfiles=65536
   sudo sysctl -w kern.maxfilesperproc=65536

   # Linux: Increase file watcher limit
   echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
   sudo sysctl -p
   ```

3. **Restart dev server with cleared cache**:
   ```bash
   rm -rf node_modules/.vite
   npm run dev
   ```

4. **Ensure you're editing files inside `src/`**: Files outside `src/` may not trigger HMR

---

### Slow Development Server

**Problem**: Dev server takes a long time to start or respond to changes.

**Solution**:

1. **Check Node.js memory**: This project uses increased memory allocation for tests:
   ```bash
   # Check if NODE_OPTIONS is set globally
   echo $NODE_OPTIONS

   # If set, unset it for dev server
   unset NODE_OPTIONS
   npm run dev
   ```

2. **Disable unnecessary browser extensions** that might slow down DevTools

3. **Close unused applications** to free up system resources

4. **Use faster filesystem** (SSD recommended over HDD)

5. **Update dependencies**:
   ```bash
   npm update
   ```

---

## Build Errors

### TypeScript Compilation Errors

**Problem**: `npm run build` fails with TypeScript errors.

**Common Error 1: "Type 'any' is not allowed"**

This project uses TypeScript strict mode. Replace `any` types with proper types:

```typescript
// ❌ WRONG
function handleData(data: any) { ... }

// ✅ CORRECT
interface StreamData {
  type: string;
  payload: Record<string, unknown>;
}
function handleData(data: StreamData) { ... }
```

**Common Error 2: "Object is possibly 'undefined'"**

Use optional chaining or null checks:

```typescript
// ❌ WRONG
const name = user.profile.name;

// ✅ CORRECT
const name = user?.profile?.name ?? 'Unknown';
```

**Common Error 3: Missing type imports**

Ensure types are properly imported:

```typescript
import type { ReactNode } from 'react';
import type { StreamEvent } from './types';
```

**Run type checking without building**:
```bash
npm run type-check
```

---

### Build Fails with Memory Issues

**Problem**: Build process crashes with "JavaScript heap out of memory"

**Solution**:
```bash
# Increase Node.js memory limit for build
NODE_OPTIONS="--max-old-space-size=4096" npm run build

# Or add to package.json scripts (already configured for tests)
"build": "NODE_OPTIONS='--max-old-space-size=4096' tsc && vite build"
```

---

### Build Succeeds but Assets Missing

**Problem**: Build completes but images, fonts, or other assets don't load in production.

**Solution**:

1. **Verify asset paths**: Use relative paths or Vite's asset handling:
   ```tsx
   // ❌ WRONG
   <img src="/public/logo.svg" />

   // ✅ CORRECT (import method)
   import logoUrl from '@/assets/logo.svg';
   <img src={logoUrl} />

   // ✅ CORRECT (public folder method)
   <img src="/logo.svg" />  // Place file in /public/logo.svg
   ```

2. **Check build output**:
   ```bash
   npm run build
   ls -la dist/assets/
   ```

3. **Preview production build locally**:
   ```bash
   npm run preview
   # Opens http://localhost:4173
   ```

---

### Chunk Size Warnings

**Problem**: Build shows warnings about large chunk sizes.

**Solution**: This is informational, not an error. The project is configured to warn at 600KB.

To reduce chunk size:
1. Check if large dependencies are tree-shaken properly
2. Verify code splitting is working (see `vite.config.ts`)
3. Consider lazy loading large components:
   ```tsx
   const LargeComponent = lazy(() => import('./LargeComponent'));
   ```

---

## Runtime Issues

### Blank Page After Deployment

**Problem**: Production build shows blank page or "Uncaught SyntaxError".

**Solution**:

1. **Check browser console** (F12) for specific errors

2. **Verify base path** in `vite.config.ts` matches deployment:
   ```typescript
   export default defineConfig({
     base: '/', // or '/streaming-patterns/' if subdirectory
   });
   ```

3. **Check browser compatibility**: Target browsers must support ES2020:
   - Chrome 80+
   - Firefox 74+
   - Safari 14+
   - Edge 80+

4. **Ensure MIME types** are configured on server:
   - `.js` → `application/javascript`
   - `.css` → `text/css`
   - `.json` → `application/json`

---

### Network Inspector Not Showing Events

**Problem**: Pattern demos work but Network Inspector panel is empty.

**Solution**:

**Issue 1: Events not captured**

Verify the pattern is using the network capture hook:

```tsx
// In pattern demo component
import { useNetworkCapture } from '@/lib/hooks/useNetworkCapture';

function MyPatternDemo() {
  const { captureEvent, events } = useNetworkCapture();

  // Ensure events are being captured
  useEffect(() => {
    // When stream event arrives:
    captureEvent({
      type: 'reasoning',
      data: reasoningStep,
      timestamp: Date.now()
    });
  }, [reasoningData, captureEvent]);

  return (
    <NetworkInspector events={events} />
  );
}
```

**Issue 2: Inspector component not rendered**

Ensure `<NetworkInspector>` is included in your pattern demo:

```tsx
import { NetworkInspector } from '@/components/NetworkInspector';

<NetworkInspector events={events} />
```

**Issue 3: Events cleared on re-render**

Check that `events` state persists correctly. Use `useRef` if needed:

```tsx
const eventsRef = useRef<StreamEvent[]>([]);
```

---

### Mock Stream Not Working

**Problem**: Pattern demo doesn't stream or shows static content.

**Solution**:

1. **Verify async generator** is working:
   ```typescript
   // In mockStream.ts
   export async function* createMockStream() {
     for (const event of fixture.events) {
       await new Promise(resolve => setTimeout(resolve, 300)); // delay
       yield event;
     }
   }
   ```

2. **Check hook consumption**:
   ```tsx
   useEffect(() => {
     let cancelled = false;

     (async () => {
       const stream = createMockStream();

       for await (const event of stream) {
         if (cancelled) break;
         // Handle event
       }
     })();

     return () => { cancelled = true; };
   }, []);
   ```

3. **Verify fixture data** exists and is properly formatted:
   ```typescript
   // fixtures.ts should export valid data
   export const sprintPlanningFixture: StreamEvent[] = [
     { type: 'reasoning', data: {...}, timestamp: Date.now() },
     // ...
   ];
   ```

---

### React Router Navigation Issues

**Problem**: Pattern links don't work or show 404 errors.

**Solution**:

1. **Use `Link` from react-router-dom**:
   ```tsx
   import { Link } from 'react-router-dom';

   // ❌ WRONG
   <a href="/patterns/chain-of-reasoning">Pattern</a>

   // ✅ CORRECT
   <Link to="/patterns/chain-of-reasoning">Pattern</Link>
   ```

2. **Verify routes are defined** in `App.tsx`

3. **For production deployments**, configure server to handle client-side routing:
   - Cloudflare Workers: Already configured in `_worker.ts`
   - Other hosts: Ensure all routes serve `index.html`

---

### Styling Issues / CSS Not Loading

**Problem**: Components appear unstyled or have broken layouts.

**Solution**:

1. **Check CSS import** in component:
   ```tsx
   import styles from './Component.module.css';
   ```

2. **Verify CSS module naming**:
   ```css
   /* Component.module.css */
   .container { ... }
   ```

   ```tsx
   <div className={styles.container}>
   ```

3. **Clear Vite cache**:
   ```bash
   rm -rf node_modules/.vite
   npm run dev
   ```

4. **Check browser DevTools** (F12 → Elements) to see if styles are applied

---

## Pattern-Specific Troubleshooting

### Chain-of-Reasoning Pattern

**Issue**: Reasoning steps not appearing sequentially.

**Solution**: Verify delay timing in mock stream:
```typescript
// mockStream.ts
const delays = { fast: 50, normal: 300, slow: 1000 };
await new Promise(resolve => setTimeout(resolve, delays.normal));
```

**Issue**: Bead-line layout broken.

**Solution**: Check flexbox styles in `ReasoningBeadline.module.css`:
```css
.beadline {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}
```

---

### Agent-Await-Prompt Pattern

**Issue**: Input prompt not pausing stream.

**Solution**: Ensure `await_input` event properly suspends the generator:
```typescript
async function* createAwaitPromptStream() {
  // Stream reasoning...

  yield { type: 'await_input', prompt: 'Enter cost center:' };

  // Wait for user input before continuing
  const userInput = await waitForInput();

  // Resume streaming...
}
```

---

### Tabular Stream View Pattern

**Issue**: Table rows render out of order.

**Solution**: Ensure rows have stable keys:
```tsx
{rows.map(row => (
  <tr key={row.id}>{/* Use stable ID, not index */}</tr>
))}
```

---

### Memory Timeline Pattern

**Issue**: Memory cards not updating across turns.

**Solution**: Verify memory state is preserved:
```tsx
const [memory, setMemory] = useState<MemoryEntry[]>([]);

// Accumulate, don't replace
setMemory(prev => [...prev, newEntry]);
```

---

### Performance Issues with Patterns

**Problem**: Pattern demo becomes slow or unresponsive.

**Solution**:

1. **Memoize expensive components**:
   ```tsx
   const ReasoningBead = memo(function ReasoningBead({ step }) {
     return <div>{step.summary}</div>;
   });
   ```

2. **Virtualize long lists** (100+ items):
   ```bash
   npm install @tanstack/react-virtual
   ```

3. **Debounce rapid updates**:
   ```tsx
   const debouncedUpdate = useMemo(
     () => debounce((text) => setText(text), 16), // 60fps
     []
   );
   ```

---

## Browser Compatibility

### Supported Browsers

This project targets modern browsers (ES2020 support):

- ✅ Chrome 80+ (2020)
- ✅ Firefox 74+ (2020)
- ✅ Safari 14+ (2020)
- ✅ Edge 80+ (2020)

### Unsupported Browsers

- ❌ Internet Explorer (all versions)
- ❌ Safari < 14
- ❌ Chrome < 80

**Solution**: Use a modern browser or update to the latest version.

---

## Development vs Production Differences

### Environment Detection

Check which environment you're running:
```typescript
const isDev = import.meta.env.DEV;
const isProd = import.meta.env.PROD;
```

### Common Differences

1. **Build Optimization**: Production builds are minified and optimized
2. **Source Maps**: Enabled in production for debugging
3. **HMR**: Only available in development
4. **Error Messages**: More verbose in development

### Testing Production Locally

Always preview production build before deploying:
```bash
npm run build
npm run preview
# Open http://localhost:4173
```

---

## Getting Help

### Before Asking for Help

1. **Check this troubleshooting guide** for your specific issue
2. **Search existing GitHub issues**: [Issues](https://github.com/vibeacademy/streaming-patterns/issues)
3. **Read the documentation**:
   - [README.md](../README.md) - Project overview
   - [CLAUDE.md](../CLAUDE.md) - Development standards
   - [PRODUCT-REQUIREMENTS.md](./PRODUCT-REQUIREMENTS.md) - Specifications

### How to Report a Bug

Create a [GitHub issue](https://github.com/vibeacademy/streaming-patterns/issues/new) with:

1. **Clear title**: Describe the problem concisely
2. **Environment details**:
   ```bash
   node --version
   npm --version
   # Browser name and version
   # Operating system
   ```
3. **Steps to reproduce**: Exact commands/actions that cause the issue
4. **Expected behavior**: What should happen
5. **Actual behavior**: What actually happens
6. **Error messages**: Full error output (use code blocks)
7. **Screenshots/GIFs**: If applicable

### Community Support

- **GitHub Discussions**: Ask questions and share ideas
- **Project Board**: Track development progress at https://github.com/orgs/vibeacademy/projects/3
- **Pull Requests**: Contribute fixes and improvements

### Contributing

Found a bug and know how to fix it?

1. Read [CLAUDE.md](../CLAUDE.md) for development standards
2. Fork the repository
3. Create a feature branch: `feature/fix-issue-description`
4. Implement the fix with tests
5. Submit a pull request

---

## Quick Reference

### Essential Commands

```bash
# Development
npm install                  # Install dependencies
npm run dev                  # Start dev server
npm run type-check          # Check TypeScript
npm run lint                # Lint code

# Testing
npm test                    # Run tests (watch mode)
npm run test:run            # Run tests once
npm run test:coverage       # Run with coverage

# Building
npm run build               # Build for production
npm run preview             # Preview production build

# Debugging
rm -rf node_modules/.vite   # Clear Vite cache
rm -rf node_modules         # Remove dependencies
npm cache clean --force     # Clear npm cache
```

### Port Reference

- **Development**: http://localhost:5173 (Vite dev server)
- **Preview**: http://localhost:4173 (Production build preview)
- **Test UI**: http://localhost:51204 (Vitest UI, if running)

### File Paths

- **Source code**: `/src`
- **Documentation**: `/docs`
- **Tests**: Tests live alongside source files (`*.test.tsx`)
- **Configuration**: Root directory (`vite.config.ts`, `tsconfig.json`, etc.)

---

## Still Having Issues?

If this guide didn't solve your problem:

1. **Double-check the error message** - Often contains the solution
2. **Try the "nuclear option"**:
   ```bash
   rm -rf node_modules package-lock.json
   npm cache clean --force
   npm install
   npm run dev
   ```
3. **Create a GitHub issue** with full details (see "How to Report a Bug" above)

We're here to help! 🚀
