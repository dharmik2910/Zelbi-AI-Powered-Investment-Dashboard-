const BASE_URL = process.env.REACT_APP_API_URL;

// ==========================
// AUTH ENDPOINTS
// ==========================
export const endpoints = {
  SENDOTP_API: BASE_URL + "/api/auth/sendotp",
  SIGNUP_API: BASE_URL + "/api/auth/signup",
  LOGIN_API: BASE_URL + "/api/auth/login",
  RESETPASSTOKEN_API: BASE_URL + "/api/auth/reset-password-token",
  RESETPASSWORD_API: BASE_URL + "/api/auth/reset-password",
  CHANGE_PASSWORD_API: BASE_URL + "/api/auth/changepassword",
  GOOGLE_AUTH_API: BASE_URL + "/api/auth/google-auth",
};

// ==========================
// PROFILE ENDPOINTS
// ==========================
export const profileEndpoints = {
  GET_USER_DETAILS_API: BASE_URL + "/api/profile/getUserDetails",
};

// ==========================
// SETTINGS ENDPOINTS
// ==========================
export const settingsEndpoints = {
  UPDATE_DISPLAY_PICTURE_API:
    BASE_URL + "/api/profile/updateDisplayPicture",

  UPDATE_PROFILE_API:
    BASE_URL + "/api/profile/updateProfile",

  CHANGE_PASSWORD_API:
    BASE_URL + "/api/auth/changepassword",

  DELETE_PROFILE_API:
    BASE_URL + "/api/profile/deleteProfile",
};
