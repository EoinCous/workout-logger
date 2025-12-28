import "../css/LoadingScreen.css";

export default function LoadingScreen({
  message = "Checking your session",
}) {
  return (
    <div className="loading-screen">
      <img
        src="/images/replog-icon-1.png"
        alt="RepLog"
        className="loading-logo"
      />
      <p>
        {message}
        <span className="dots">
          <span>.</span>
          <span>.</span>
          <span>.</span>
        </span>
      </p>
    </div>
  );
}