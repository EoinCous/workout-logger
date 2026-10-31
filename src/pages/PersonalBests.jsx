import { useWorkout } from "../context/WorkoutContext";
import { useMemo, useState } from "react";
import { getCurrentPBs } from "../utils/pbUtils";
import "../css/PersonalBests.css";

const formatDuration = (seconds) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

const PersonalBests = () => {
  const { workouts } = useWorkout();
  const personalBests = useMemo(() => getCurrentPBs(workouts), [workouts]);

  // Group PBs by muscle
  const groupedPBs = useMemo(() => {
    return Object.values(personalBests).reduce((groups, pb) => {
      const muscleGroup = pb.muscle || "Other";
      if (!groups[muscleGroup]) {
        groups[muscleGroup] = [];
      }
      groups[muscleGroup].push(pb);
      return groups;
    }, {});
  }, [personalBests]);

  // Track which muscle groups are open
  const [openGroups, setOpenGroups] = useState({});

  const toggleGroup = (muscle) => {
    setOpenGroups((prev) => ({
      ...prev,
      [muscle]: !(prev[muscle] ?? true),
    }));
  };

  const sortedGroups = Object.entries(groupedPBs).sort(([first], [second]) =>
    first.localeCompare(second)
  );
  const totalBests = Object.keys(personalBests).length;

  return (
    <div className="pb-container">
      <header className="pb-page-heading">
        <div>
          <p className="pb-eyebrow">Training milestones</p>
          <h1 className="pb-page-title">Personal Bests</h1>
        </div>
        <div className="pb-overview" aria-live="polite">
          <strong>{totalBests}</strong>
          <span>{totalBests === 1 ? "personal best" : "personal bests"}</span>
          <span className="pb-overview-divider" aria-hidden="true">/</span>
          <strong>{sortedGroups.length}</strong>
          <span>{sortedGroups.length === 1 ? "muscle group" : "muscle groups"}</span>
        </div>
      </header>

      {sortedGroups.length > 0 ? (
        <div className="pb-groups">
          {sortedGroups.map(([muscle, pbs], index) => {
            const isOpen = openGroups[muscle] ?? true;
            const panelId = `pb-group-panel-${index}`;

            return (
              <section key={muscle} className="pb-muscle-group">
                <h2 className="pb-group-heading">
                  <button
                    className="pb-muscle-title"
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => toggleGroup(muscle)}
                  >
                    <span>{muscle.replace(/_/g, " ")}</span>
                    <span className="pb-group-meta">
                      <span className="pb-group-count">{pbs.length}</span>
                      <span className={`pb-chevron${isOpen ? " is-open" : ""}`} aria-hidden="true" />
                    </span>
                  </button>
                </h2>

                {isOpen && (
                  <div className="pb-group-list" id={panelId}>
                    {pbs.map((pb) => (
                      <article key={pb.exerciseId} className="pb-card">
                        <div className="pb-card-main">
                          <h3 className="pb-exercise">{pb.name}</h3>
                          <p className="pb-date">
                            Set on {new Date(pb.date).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                        <p className="pb-value">
                          {pb.trackingType === "time" ? (
                            <>
                              <strong>{formatDuration(pb.seconds)}</strong>
                              <span>best time</span>
                            </>
                          ) : (
                            <>
                              <strong>{pb.weight}</strong>
                              <span>kg × {pb.reps} reps</span>
                            </>
                          )}
                        </p>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      ) : (
        <div className="pb-empty-state">
          <h2>No personal bests yet</h2>
          <p>Log a workout with a completed set to start building your records.</p>
        </div>
      )}
    </div>
  );
};

export default PersonalBests;