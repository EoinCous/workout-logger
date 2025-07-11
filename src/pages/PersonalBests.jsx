import { useWorkout } from "../context/WorkoutContext";

const PersonalBests = () => {
    const { personalBests } = useWorkout();

    return (
        <div>
            <h2>🏆 Personal Bests</h2>
            {Object.values(personalBests).map(pb => (
            <div key={pb.exerciseId}>
                <h3>{pb.name}</h3>
                <p>{pb.weight}kg × {pb.reps} reps</p>
                <small>on {new Date(pb.date).toLocaleDateString()}</small>
            </div>
            ))}
        </div>
    )
}

export default PersonalBests;