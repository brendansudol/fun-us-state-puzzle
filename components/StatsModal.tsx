"use client";

import type { StoredStats } from "@/lib/types";

interface StatsModalProps {
  open: boolean;
  stats: StoredStats;
  onClose: () => void;
}

export function StatsModal({ open, stats, onClose }: StatsModalProps) {
  if (!open) {
    return null;
  }

  const winRate = stats.played === 0 ? 0 : Math.round((stats.won / stats.played) * 100);

  return (
    <div className="modalBackdrop" role="presentation">
      <section className="modalCard" role="dialog" aria-modal="true" aria-labelledby="stats-modal-title">
        <header className="modalHeader">
          <div>
            <h2 id="stats-modal-title" className="modalTitle">
              Daily stats
            </h2>
            <p className="modalCopy">Stored locally in your browser.</p>
          </div>
          <button className="modalClose" type="button" aria-label="Close stats dialog" onClick={onClose}>
            ×
          </button>
        </header>

        <div className="modalBody">
          <div className="statsGrid">
            <div className="statsItem">
              Played
              <strong>{stats.played}</strong>
            </div>
            <div className="statsItem">
              Won
              <strong>{stats.won}</strong>
            </div>
            <div className="statsItem">
              Win %
              <strong>{winRate}%</strong>
            </div>
            <div className="statsItem">
              Current streak
              <strong>{stats.currentDailyStreak}</strong>
            </div>
            <div className="statsItem">
              Max streak
              <strong>{stats.maxDailyStreak}</strong>
            </div>
            <div className="statsItem">
              Completed dailies
              <strong>{stats.completedDailyIds.length}</strong>
            </div>
          </div>

          <div className="sectionHeader" style={{ marginTop: "18px" }}>
            <h3 className="sectionTitle">Guess distribution</h3>
          </div>

          <div className="distGrid">
            {Object.entries(stats.guessDistribution).map(([bucket, count]) => (
              <div key={bucket} className="distItem">
                {bucket}
                <strong>{count}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
