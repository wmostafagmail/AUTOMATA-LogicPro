import {StrictMode} from 'react';
import {createRoot, type Root} from 'react-dom/client';
import './index.css';

function getErrorDetails(error: unknown) {
  if (error instanceof Error) {
    return {
      message: error.message || 'Unknown startup error',
      stack: error.stack || null,
    };
  }

  if (typeof error === 'string') {
    return {
      message: error,
      stack: null,
    };
  }

  return {
    message: JSON.stringify(error, null, 2),
    stack: null,
  };
}

function renderStartupError(root: Root, error: unknown) {
  const details = getErrorDetails(error);
  root.render(
    <div className="min-h-screen bg-[#050b17] px-6 py-8 text-slate-100">
      <div className="mx-auto max-w-5xl rounded-2xl border border-rose-500/40 bg-[#140a14] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
        <div className="text-sm font-bold uppercase tracking-[0.28em] text-rose-300">Startup Error</div>
        <h1 className="mt-3 text-2xl font-bold text-white">The app hit a runtime error while loading.</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-300">
          This screen is temporary and is here to expose the exact exception instead of leaving a white page.
        </p>

        <div className="mt-6 rounded-xl border border-white/10 bg-black/30 p-4">
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Message</div>
          <pre className="mt-2 whitespace-pre-wrap break-words font-mono text-sm leading-relaxed text-rose-100">
            {details.message}
          </pre>
        </div>

        {details.stack && (
          <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-4">
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Stack</div>
            <pre className="mt-2 max-h-[55vh] overflow-auto whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-slate-300">
              {details.stack}
            </pre>
          </div>
        )}
      </div>
    </div>,
  );
}

const container = document.getElementById('root');

if (!container) {
  throw new Error('Root container #root was not found.');
}

const root = createRoot(container);

window.addEventListener('error', (event) => {
  renderStartupError(root, event.error || event.message);
});

window.addEventListener('unhandledrejection', (event) => {
  renderStartupError(root, event.reason);
});

async function bootstrap() {
  try {
    const {default: App} = await import('./App.tsx');
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  } catch (error) {
    renderStartupError(root, error);
  }
}

void bootstrap();
