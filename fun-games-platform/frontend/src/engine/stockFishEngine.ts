const stockfish = new (window as any).Worker('stockfish.js');

let engine: Worker;

export const initEngine = () => {
  engine = stockfish;
};

export const setPosition = (fen: string) => {
  engine.postMessage(`position fen ${fen}`);
};

export const getBestMove = (depth: number, callback: (move: string) => void) => {
  engine.postMessage(`go depth ${depth}`);

  engine.onmessage = (event: any) => {
    const message = typeof event === 'object' ? event.data : event;
    if (message.startsWith('bestmove')) {
      const move = message.split(' ')[1];
      callback(move);
    }
  };
};
