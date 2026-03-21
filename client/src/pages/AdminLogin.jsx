import { useState } from "react";
import { loginAdmin } from "../services/adminAuthService";

function AdminLogin({ content, onBackClick, onLoginSuccess }) {
  const [formValues, setFormValues] = useState({
    login: "",
    password: ""
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((currentValues) => ({
      ...currentValues,
      [name]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await loginAdmin(formValues);
      setSuccessMessage(
        `${response.message} ${response.admin.username} est connecte.`
      );
      onLoginSuccess(response.admin);
    } catch (error) {
      setErrorMessage(error.message || content.errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-card">
        <p className="login-card__eyebrow">{content.eyebrow}</p>
        <h1>{content.title}</h1>
        <p className="login-card__text">{content.description}</p>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="login-form__field">
            <span>{content.loginLabel}</span>
            <input
              type="text"
              name="login"
              value={formValues.login}
              onChange={handleChange}
              placeholder={content.loginPlaceholder}
              autoComplete="username"
            />
          </label>

          <label className="login-form__field">
            <span>{content.passwordLabel}</span>
            <input
              type="password"
              name="password"
              value={formValues.password}
              onChange={handleChange}
              placeholder={content.passwordPlaceholder}
              autoComplete="current-password"
            />
          </label>

          {errorMessage ? (
            <p className="login-form__message login-form__message--error">
              {errorMessage}
            </p>
          ) : null}

          {successMessage ? (
            <p className="login-form__message login-form__message--success">
              {successMessage}
            </p>
          ) : null}

          <button
            type="submit"
            className="login-form__submit"
            disabled={isSubmitting}
          >
            {content.submitLabel}
          </button>
        </form>

        <button type="button" className="login-card__back" onClick={onBackClick}>
          {content.backLabel}
        </button>
      </section>
    </main>
  );
}

export default AdminLogin;
