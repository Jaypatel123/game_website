// stockFishEngine.tsx
let engine: Worker | null = null;

export const initEngine = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      // Use local Stockfish file (make sure you've downloaded it to public/workers/stockfish.js)
      engine = new Worker('/workers/stockfish.js');
      
      engine.onmessage = (event) => {
        const message = event.data;
        if (typeof message === 'string' && message.includes('Stockfish')) {
          resolve();
        }
      };

      engine.onerror = (error) => {
        console.error('Worker error:', error);
        reject(error);
      };

    } catch (error) {
      reject(error);
    }
  });
};

export const setPosition = (fen: string) => {
  if (!engine) throw new Error('Engine not initialized');
  engine.postMessage(`position fen ${fen}`);
};

// Changed to return Promise instead of using callback
export const getBestMove = (depth: number = 15): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!engine) {
      reject(new Error('Engine not initialized'));
      return;
    }

    const timeout = setTimeout(() => {
      reject(new Error('Timeout waiting for best move'));
    }, 10000); // 10 second timeout

    const messageHandler = (event: MessageEvent) => {
      const message = event.data;
      if (typeof message === 'string' && message.startsWith('bestmove')) {
        clearTimeout(timeout);
        engine!.removeEventListener('message', messageHandler);
        const move = message.split(' ')[1];
        resolve(move || '(none)');
      }
    };

    engine.addEventListener('message', messageHandler);
    engine.postMessage(`go depth ${depth}`);
  });
};

export const stopEngine = () => {
  if (engine) {
    engine.terminate();
    engine = null;
  }
};

// Optional: Add engine evaluation
export const getEvaluation = (depth: number = 15): Promise<number> => {
  return new Promise((resolve, reject) => {
    if (!engine) {
      reject(new Error('Engine not initialized'));
      return;
    }

    const timeout = setTimeout(() => {
      reject(new Error('Timeout waiting for evaluation'));
    }, 10000);

    let lastScore = 0;

    const messageHandler = (event: MessageEvent) => {
      const message = event.data;
      if (typeof message === 'string') {
        // Parse evaluation from info lines
        if (message.includes('info depth') && message.includes('score cp')) {
          const scoreMatch = message.match(/score cp (-?\d+)/);
          if (scoreMatch) {
            lastScore = parseInt(scoreMatch[1]) / 100; // Convert centipawns to pawns
          }
        }
        
        if (message.startsWith('bestmove')) {
          clearTimeout(timeout);
          engine!.removeEventListener('message', messageHandler);
          resolve(lastScore);
        }
      }
    };

    engine.addEventListener('message', messageHandler);
    engine.postMessage(`go depth ${depth}`);
  });
};