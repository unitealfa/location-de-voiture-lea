import { useEffect, useState } from "react";
import VerificationDialog from "../components/VerificationDialog";
import {
  confirmAdminPasswordChange,
  confirmAdminProfileUpdate,
  getAdminProfile,
  requestAdminPasswordChange,
  requestAdminProfileUpdate,
  resendAdminPasswordCode,
  resendAdminProfileUpdateCode
} from "../services/adminProfileService";

function AdminProfile({ content, admin, onAdminUpdated, onBackClick }) {
  const [profileForm, setProfileForm] = useState({
    username: admin.username,
    email: admin.email
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: ""
  });
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isProfileSubmitting, setIsProfileSubmitting] = useState(false);
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);
  const [verificationDialog, setVerificationDialog] = useState(null);

  useEffect(() => {
    setProfileForm({
      username: admin.username,
      email: admin.email
    });
  }, [admin.email, admin.username]);

  const updateProfileField = (event) => {
    const { name, value } = event.target;
    setProfileForm((currentValues) => ({
      ...currentValues,
      [name]: value
    }));
  };

  const updatePasswordField = (event) => {
    const { name, value } = event.target;
    setPasswordForm((currentValues) => ({
      ...currentValues,
      [name]: value
    }));
  };

  const openVerificationDialog = (requestResult, purpose) => {
    setVerificationDialog({
      purpose,
      purposeLabel:
        purpose === "password"
          ? content.passwordSectionTitle
          : content.profileSectionTitle,
      title:
        purpose === "password"
          ? content.verificationTitle
          : content.profileSectionTitle,
      verificationId: requestResult.verificationId,
      maskedEmail: requestResult.maskedEmail,
      expiresAt: requestResult.expiresAt
    });
  };

  const refreshAdminProfile = async () => {
    const response = await getAdminProfile();
    onAdminUpdated(response.admin);
    return response.admin;
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setIsProfileSubmitting(true);
    setProfileMessage("");
    setProfileError("");

    try {
      const response = await requestAdminProfileUpdate(profileForm);
      setProfileMessage(response.message);
      openVerificationDialog(response, "profile");
    } catch (error) {
      setProfileError(error.message || "Modification du profile impossible.");
    } finally {
      setIsProfileSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setIsPasswordSubmitting(true);
    setPasswordMessage("");
    setPasswordError("");

    try {
      const response = await requestAdminPasswordChange(passwordForm);
      setPasswordMessage(response.message);
      openVerificationDialog(response, "password");
    } catch (error) {
      setPasswordError(error.message || "Modification du mot de passe impossible.");
    } finally {
      setIsPasswordSubmitting(false);
    }
  };

  const handleVerificationConfirm = async ({ verificationId, code }) => {
    if (!verificationDialog) {
      return;
    }

    if (verificationDialog.purpose === "profile") {
      const response = await confirmAdminProfileUpdate({
        verificationId,
        code
      });

      onAdminUpdated(response.admin);
      setProfileMessage(response.message);
      setProfileError("");
      setVerificationDialog(null);
      return;
    }

    const response = await confirmAdminPasswordChange({
      verificationId,
      code
    });

    await refreshAdminProfile();
    setPasswordForm({
      currentPassword: "",
      newPassword: ""
    });
    setPasswordMessage(response.message);
    setPasswordError("");
    setVerificationDialog(null);
  };

  const handleVerificationResend = async ({ verificationId }) => {
    if (!verificationDialog) {
      return;
    }

    const response =
      verificationDialog.purpose === "profile"
        ? await resendAdminProfileUpdateCode({ verificationId })
        : await resendAdminPasswordCode({ verificationId });

    setVerificationDialog((currentValue) => ({
      ...currentValue,
      verificationId: response.verificationId,
      maskedEmail: response.maskedEmail,
      expiresAt: response.expiresAt
    }));
  };

  return (
    <>
      <main className="profile-page">
        <section className="profile-page__hero">
          <p className="admin-home-card__eyebrow">{content.eyebrow}</p>
          <h1>{content.title}</h1>
          <p className="admin-home-card__text">{content.description}</p>
        </section>

        <section className="profile-grid">
          <form className="profile-card" onSubmit={handleProfileSubmit}>
            <h2>{content.profileSectionTitle}</h2>

            <label className="login-form__field">
              <span>{content.profileUsernameLabel}</span>
              <input
                type="text"
                name="username"
                value={profileForm.username}
                onChange={updateProfileField}
              />
            </label>

            <label className="login-form__field">
              <span>{content.profileEmailLabel}</span>
              <input
                type="email"
                name="email"
                value={profileForm.email}
                onChange={updateProfileField}
              />
            </label>

            {profileError ? (
              <p className="login-form__message login-form__message--error">
                {profileError}
              </p>
            ) : null}

            {profileMessage ? (
              <p className="login-form__message login-form__message--success">
                {profileMessage}
              </p>
            ) : null}

            <button
              type="submit"
              className="login-form__submit"
              disabled={isProfileSubmitting}
            >
              {content.profileSubmitLabel}
            </button>
          </form>

          <form className="profile-card" onSubmit={handlePasswordSubmit}>
            <h2>{content.passwordSectionTitle}</h2>
            <p className="profile-card__text">
              {content.passwordSectionDescription}
            </p>

            <label className="login-form__field">
              <span>{content.currentPasswordLabel}</span>
              <input
                type="password"
                name="currentPassword"
                value={passwordForm.currentPassword}
                onChange={updatePasswordField}
                placeholder={content.currentPasswordPlaceholder}
                autoComplete="current-password"
              />
            </label>

            <label className="login-form__field">
              <span>{content.newPasswordLabel}</span>
              <input
                type="password"
                name="newPassword"
                value={passwordForm.newPassword}
                onChange={updatePasswordField}
                placeholder={content.newPasswordPlaceholder}
                autoComplete="new-password"
              />
            </label>

            {passwordError ? (
              <p className="login-form__message login-form__message--error">
                {passwordError}
              </p>
            ) : null}

            {passwordMessage ? (
              <p className="login-form__message login-form__message--success">
                {passwordMessage}
              </p>
            ) : null}

            <button
              type="submit"
              className="login-form__submit"
              disabled={isPasswordSubmitting}
            >
              {content.passwordSubmitLabel}
            </button>
          </form>
        </section>

        <div className="profile-page__back">
          <button type="button" className="login-card__back" onClick={onBackClick}>
            {content.backLabel}
          </button>
        </div>
      </main>

      {verificationDialog ? (
        <VerificationDialog
          content={content}
          dialog={verificationDialog}
          onConfirm={handleVerificationConfirm}
          onResend={handleVerificationResend}
          onClose={() => setVerificationDialog(null)}
        />
      ) : null}
    </>
  );
}

export default AdminProfile;
