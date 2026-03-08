"use client";

interface HowToPlayModalProps {
  open: boolean;
  onClose: () => void;
}

export function HowToPlayModal({ open, onClose }: HowToPlayModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="modalBackdrop" role="presentation">
      <section className="modalCard" role="dialog" aria-modal="true" aria-labelledby="howto-modal-title">
        <header className="modalHeader">
          <div>
            <h2 id="howto-modal-title" className="modalTitle">
              How to play
            </h2>
            <p className="modalCopy">Find the hidden contiguous U.S. state in six guesses.</p>
          </div>
          <button className="modalClose" type="button" aria-label="Close how to play dialog" onClick={onClose}>
            ×
          </button>
        </header>

        <div className="modalBody">
          <ul className="howToList">
            <li>Each guess returns direction and rounded distance from your guess to the target.</li>
            <li>Population, GDP per capita, and land area show whether the target is higher, lower, or similar.</li>
            <li>Export tells you whether the target shares the same top export family.</li>
            <li>The map colors guessed states by proximity so the board is readable on a shared screen.</li>
            <li>Daily puzzles are deterministic. Random mode gives you a fresh local board immediately.</li>
          </ul>
        </div>

        <footer className="modalFooter">
          <button className="button" type="button" onClick={onClose}>
            Start playing
          </button>
        </footer>
      </section>
    </div>
  );
}
