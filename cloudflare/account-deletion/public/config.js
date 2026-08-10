(function () {
  "use strict";

  var projectOrigin = "https://brdjnhfvytdmsnwexras.supabase.co";
  var config = Object.freeze({
    projectOrigin: projectOrigin,
    publishableKey: "sb_publishable_wiBPBf53MoVIuMxnb78GZw_185gD-8_",
    authUrl: projectOrigin + "/auth/v1/token?grant_type=password",
    logoutUrl: projectOrigin + "/auth/v1/logout?scope=local",
    deleteUrl: projectOrigin + "/functions/v1/delete-account"
  });

  Object.defineProperty(globalThis, "JANANI_ACCOUNT_DELETION_CONFIG", {
    configurable: false,
    enumerable: false,
    value: config,
    writable: false
  });
})();
