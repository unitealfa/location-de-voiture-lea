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
      <main className="admin-profile-page">
        <section className="admin-profile-page__section vehica-login-register-page">
          <div className="admin-profile-page__container vehica-login-register-wide-container">
            <div className="vehica-panel-login-register admin-profile-page__panel">
              <form className="vehica-login vehica-active" onSubmit={handleProfileSubmit}>
                <div className="vehica-login__inner">
                  <h2>{content.profileSectionTitle}</h2>
                  <h3>{content.description}</h3>

                  {profileError ? (
                    <div className="vehica-register-login-notice">{profileError}</div>
                  ) : null}

                  {profileMessage ? (
                    <div className="vehica-register-login-notice">{profileMessage}</div>
                  ) : null}

                  <div className="vehica-fields">
                    <div className="vehica-field">
                      <input
                        type="text"
                        name="username"
                        value={profileForm.username}
                        onChange={updateProfileField}
                        placeholder={content.profileUsernameLabel}
                      />
                    </div>

                    <div className="vehica-field">
                      <input
                        type="email"
                        name="email"
                        value={profileForm.email}
                        onChange={updateProfileField}
                        placeholder={content.profileEmailLabel}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="vehica-button admin-profile-page__submit"
                    disabled={isProfileSubmitting}
                  >
                    {content.profileSubmitLabel}
                  </button>
                </div>
              </form>

              <form className="vehica-register vehica-active" onSubmit={handlePasswordSubmit}>
                <div className="vehica-register__inner">
                  <h2>{content.passwordSectionTitle}</h2>
                  <h3>{content.passwordSectionDescription}</h3>

                  {passwordError ? (
                    <div className="vehica-register-login-notice">{passwordError}</div>
                  ) : null}

                  {passwordMessage ? (
                    <div className="vehica-register-login-notice">{passwordMessage}</div>
                  ) : null}

                  <div className="vehica-fields">
                    <div className="vehica-field">
                      <input
                        type="password"
                        name="currentPassword"
                        value={passwordForm.currentPassword}
                        onChange={updatePasswordField}
                        placeholder={content.currentPasswordPlaceholder}
                        autoComplete="current-password"
                      />
                    </div>

                    <div className="vehica-field">
                      <input
                        type="password"
                        name="newPassword"
                        value={passwordForm.newPassword}
                        onChange={updatePasswordField}
                        placeholder={content.newPasswordPlaceholder}
                        autoComplete="new-password"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="vehica-button admin-profile-page__submit"
                    disabled={isPasswordSubmitting}
                  >
                    {content.passwordSubmitLabel}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="admin-profile-page__back-row">
            <button
              type="button"
              className="admin-profile-page__back-button"
              onClick={onBackClick}
            >
              {content.backLabel}
            </button>
          </div>
        </section>
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
