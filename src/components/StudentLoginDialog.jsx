import { useEffect, useState } from "react";
import { LoaderCircle, LockKeyhole, ShieldCheck, X } from "lucide-react";

export default function StudentLoginDialog({ isOpen, isConfigured, onClose, onSignIn, onPreview }) {
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName("");
      setPin("");
      setError("");
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(event) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName || !/^\d{4}$/.test(pin)) {
      setError("Enter your name and 4-digit PIN.");
      return;
    }

    setError("");
    setIsSubmitting(true);
    try {
      await onSignIn(trimmedName, pin);
    } catch {
      setError("The name or PIN does not match. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="student-dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="student-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="student-login-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="dialog-close" type="button" onClick={onClose} aria-label="Close sign in">
          <X size={20} />
        </button>

        <span className="student-dialog-icon"><LockKeyhole size={25} /></span>
        <p className="section-label">Student access</p>
        <h2 id="student-login-title">Welcome back</h2>
        <p className="student-dialog-intro">Use the name and 4-digit PIN provided by your teacher.</p>

        <form className="student-login-form" onSubmit={handleSubmit}>
          <label>
            <span>Your name</span>
            <input value={name} onChange={(event) => setName(event.target.value)} type="text" name="student-name" autoComplete="username" placeholder="Student name" disabled={!isConfigured || isSubmitting} autoFocus />
          </label>
          <label>
            <span>4-digit PIN</span>
            <input value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 4))} type="password" name="student-pin" inputMode="numeric" autoComplete="current-password" placeholder="••••" disabled={!isConfigured || isSubmitting} />
          </label>
          {error ? <p className="student-login-error" role="alert">{error}</p> : null}
          <button type="submit" disabled={!isConfigured || isSubmitting}>
            {isSubmitting ? <><LoaderCircle className="is-spinning" size={18} /> Signing in...</> : "Continue learning"}
          </button>
        </form>

        <div className="student-login-note">
          <ShieldCheck size={17} />
          <span>{isConfigured ? "Your learning progress is saved privately for your teacher." : "Secure student accounts will be enabled when the private learning database is connected."}</span>
        </div>

        {import.meta.env.DEV ? (
          <button className="student-preview-button" type="button" onClick={onPreview}>
            Preview as Demo Student
          </button>
        ) : null}
      </section>
    </div>
  );
}
