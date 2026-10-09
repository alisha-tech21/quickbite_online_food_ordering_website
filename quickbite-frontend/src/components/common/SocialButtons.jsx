const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 48 48">
    <path
      fill="#FFC107"
      d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"
    />
    <path
      fill="#FF3D00"
      d="m6.3 14.7 6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
    />
    <path
      fill="#4CAF50"
      d="M24 44c5.4 0 10.3-2.1 14-5.5l-6.5-5.5c-2 1.4-4.6 2.3-7.5 2.3-5.3 0-9.7-3.4-11.3-8.1l-6.5 5C9.6 39.6 16.2 44 24 44z"
    />
    <path
      fill="#1976D2"
      d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.3-4.1 5.7l6.5 5.5C41.5 36.6 44 30.8 44 24c0-1.3-.1-2.7-.4-3.5z"
    />
  </svg>
);

const AppleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.87-1.9 1.531-2.926 1.531-.11 0-.216-.02-.3-.033-.017-.09-.05-.28-.05-.48 0-1.14.564-2.27 1.24-3.05.706-.83 1.913-1.52 2.94-1.61.05.13.13.29.13.44v.12zM20.6 17.28c-.42.94-.622 1.36-1.16 2.19-.752 1.15-1.813 2.58-3.13 2.6-1.166.02-1.466-.76-3.05-.75-1.585.01-1.912.77-3.083.75-1.312-.02-2.316-1.31-3.068-2.46-2.11-3.2-2.33-6.96-1.03-8.96.92-1.42 2.37-2.26 3.73-2.26 1.39 0 2.264.77 3.415.77 1.114 0 1.79-.77 3.4-.77 1.21 0 2.49.66 3.4 1.8-2.99 1.64-2.51 5.9.076 7.09z" />
  </svg>
);

const SocialButtons = ({ mode = "in" }) => {
  const googleLabel = mode === "in" ? "Google" : "Sign up with Google";
  const appleLabel = mode === "in" ? "Apple" : "Sign up with Apple";
  return (
    <div className="grid grid-cols-2 gap-3">
      <button type="button" className="qb-btn-secondary">
        <GoogleIcon />
        {googleLabel}
      </button>
      <button type="button" className="qb-btn-secondary">
        <AppleIcon />
        {appleLabel}
      </button>
    </div>
  );
};

export default SocialButtons;
