(function () {
  "use strict";

  var AUTH_TIMEOUT_MS = 20_000;
  var DELETE_TIMEOUT_MS = 60_000;
  var LOGOUT_TIMEOUT_MS = 5_000;
  var EXPECTED_PROJECT_ORIGIN = "https://brdjnhfvytdmsnwexras.supabase.co";
  var CONFIG = globalThis.JANANI_ACCOUNT_DELETION_CONFIG;

  var form = document.getElementById("deletion-form");
  var emailInput = document.getElementById("email");
  var passwordInput = document.getElementById("password");
  var confirmationInput = document.getElementById("confirmation");
  var acknowledgementInput = document.getElementById("acknowledgement");
  var submitButton = document.getElementById("submit-button");
  var status = document.getElementById("status");

  function setStatus(kind, message, focusStatus) {
    status.dataset.kind = kind;
    status.textContent = message;
    status.setAttribute("role", kind === "error" ? "alert" : "status");
    if (focusStatus) status.focus();
  }

  function clearSensitiveFields() {
    emailInput.value = "";
    passwordInput.value = "";
    confirmationInput.value = "";
    acknowledgementInput.checked = false;
  }

  function rejectLocal(message, field) {
    setStatus("error", message, false);
    clearSensitiveFields();
    field.focus();
  }

  function isValidConfig(candidate) {
    if (!candidate || candidate.projectOrigin !== EXPECTED_PROJECT_ORIGIN) return false;
    if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(candidate.publishableKey)) return false;

    try {
      return new URL(candidate.authUrl).origin === EXPECTED_PROJECT_ORIGIN &&
        new URL(candidate.logoutUrl).origin === EXPECTED_PROJECT_ORIGIN &&
        new URL(candidate.deleteUrl).origin === EXPECTED_PROJECT_ORIGIN &&
        candidate.authUrl === EXPECTED_PROJECT_ORIGIN + "/auth/v1/token?grant_type=password" &&
        candidate.logoutUrl === EXPECTED_PROJECT_ORIGIN + "/auth/v1/logout?scope=local" &&
        candidate.deleteUrl === EXPECTED_PROJECT_ORIGIN + "/functions/v1/delete-account";
    } catch (_error) {
      return false;
    }
  }

  function timeoutController(milliseconds) {
    var controller = new AbortController();
    var timer = setTimeout(function () {
      controller.abort();
    }, milliseconds);

    return {
      signal: controller.signal,
      cancel: function () {
        clearTimeout(timer);
      }
    };
  }

  async function authenticate(email, password) {
    var timeout = timeoutController(AUTH_TIMEOUT_MS);
    try {
      var response = await fetch(CONFIG.authUrl, {
        method: "POST",
        headers: {
          apikey: CONFIG.publishableKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email: email, password: password }),
        cache: "no-store",
        credentials: "omit",
        referrerPolicy: "no-referrer",
        signal: timeout.signal
      });

      if (!response.ok) return null;
      var payload = await response.json();
      return payload && typeof payload.access_token === "string"
        ? payload.access_token
        : null;
    } catch (_error) {
      return null;
    } finally {
      timeout.cancel();
    }
  }

  async function logoutSession(accessToken) {
    if (!accessToken) return;

    var timeout = timeoutController(LOGOUT_TIMEOUT_MS);
    try {
      await fetch(CONFIG.logoutUrl, {
        method: "POST",
        headers: {
          apikey: CONFIG.publishableKey,
          Authorization: "Bearer " + accessToken
        },
        cache: "no-store",
        credentials: "omit",
        keepalive: true,
        referrerPolicy: "no-referrer",
        signal: timeout.signal
      });
    } catch (_error) {
      // Best effort: deletion may already have invalidated the access token.
    } finally {
      timeout.cancel();
    }
  }

  async function requestDeletion(accessToken, password) {
    var timeout = timeoutController(DELETE_TIMEOUT_MS);
    try {
      var response = await fetch(CONFIG.deleteUrl, {
        method: "POST",
        headers: {
          apikey: CONFIG.publishableKey,
          Authorization: "Bearer " + accessToken,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          confirmation: "DELETE",
          current_password: password
        }),
        cache: "no-store",
        credentials: "omit",
        referrerPolicy: "no-referrer",
        signal: timeout.signal
      });

      if (!response.ok) return { outcome: "unknown" };

      var payload = await response.json();
      if (!payload || payload.ok !== true) return { outcome: "unknown" };

      return {
        outcome: "deleted",
        storageCleanupComplete: payload.storage_cleanup_complete === true
      };
    } catch (_error) {
      // After this request starts, a timeout or network failure cannot prove
      // that the irreversible server operation did not complete.
      return { outcome: "unknown" };
    } finally {
      timeout.cancel();
    }
  }

  window.addEventListener("pagehide", clearSensitiveFields);
  window.addEventListener("pageshow", function (event) {
    if (event.persisted) clearSensitiveFields();
  });

  if (!isValidConfig(CONFIG)) {
    clearSensitiveFields();
    submitButton.disabled = true;
    setStatus(
      "error",
      "Account deletion is temporarily unavailable. Please use the in-app control and try this page again later.",
      true
    );
    return;
  }

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    if (submitButton.disabled) return;

    var email = emailInput.value.trim();
    var password = passwordInput.value;

    if (!emailInput.checkValidity()) {
      rejectLocal("Enter the email address for your Janani account.", emailInput);
      return;
    }
    if (!passwordInput.checkValidity()) {
      rejectLocal("Enter your current password.", passwordInput);
      return;
    }
    if (confirmationInput.value !== "DELETE") {
      rejectLocal("Type DELETE exactly to confirm.", confirmationInput);
      return;
    }
    if (!acknowledgementInput.checked) {
      rejectLocal(
        "Confirm that you understand this action is permanent.",
        acknowledgementInput
      );
      return;
    }

    submitButton.disabled = true;
    form.setAttribute("aria-busy", "true");
    setStatus("working", "Verifying your account...", false);

    var accessToken = null;
    try {
      accessToken = await authenticate(email, password);
      if (!accessToken) {
        setStatus(
          "error",
          "We could not verify those credentials. Check them and try again.",
          true
        );
        return;
      }

      setStatus("working", "Deleting your account. Keep this page open...", false);
      var result = await requestDeletion(accessToken, password);

      if (result.outcome === "deleted") {
        if (result.storageCleanupComplete) {
          setStatus(
            "success",
            "Your Janani account and associated data have been deleted.",
            true
          );
        } else {
          setStatus(
            "warning",
            "Your Janani account has been deleted. Cleanup of any protected stored files was recorded and may continue asynchronously.",
            true
          );
        }
        return;
      }

      setStatus(
        "warning",
        "We could not confirm the final result. Your account may already be deleted. Do not submit another deletion request immediately; try signing in again later.",
        true
      );
    } finally {
      await logoutSession(accessToken);
      clearSensitiveFields();
      accessToken = null;
      password = "";
      email = "";
      submitButton.disabled = false;
      form.removeAttribute("aria-busy");
    }
  });
})();
