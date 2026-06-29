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
};

// ==========================
// PROFILE ENDPOINTS
// ==========================
export const profileEndpoints = {
  GET_USER_DETAILS_API: BASE_URL + "/api/profile/getUserDetails",
  GET_USER_ENROLLED_COURSES_API:
    BASE_URL + "/api/profile/getEnrolledCourses",
  GET_INSTRUCTOR_DATA_API:
    BASE_URL + "/api/profile/instructorDashboard",
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

// ==========================
// STUDENT ENDPOINTS
// (Update only if these routes exist)
// ==========================
export const studentEndpoints = {
  COURSE_PAYMENT_API:
    BASE_URL + "/api/payment/capturePayment",

  COURSE_VERIFY_API:
    BASE_URL + "/api/payment/verifyPayment",

  SEND_PAYMENT_SUCCESS_EMAIL_API:
    BASE_URL + "/api/payment/sendPaymentSuccessEmail",
};

// ==========================
// COURSE ENDPOINTS
// (Update only if these routes exist)
// ==========================
export const courseEndpoints = {
  GET_ALL_COURSE_API:
    BASE_URL + "/api/course/getAllCourses",

  COURSE_DETAILS_API:
    BASE_URL + "/api/course/getCourseDetails",

  EDIT_COURSE_API:
    BASE_URL + "/api/course/editCourse",

  COURSE_CATEGORIES_API:
    BASE_URL + "/api/course/showAllCategories",

  CREATE_COURSE_API:
    BASE_URL + "/api/course/createCourse",

  CREATE_SECTION_API:
    BASE_URL + "/api/course/addSection",

  CREATE_SUBSECTION_API:
    BASE_URL + "/api/course/addSubSection",

  UPDATE_SECTION_API:
    BASE_URL + "/api/course/updateSection",

  UPDATE_SUBSECTION_API:
    BASE_URL + "/api/course/updateSubSection",

  GET_ALL_INSTRUCTOR_COURSES_API:
    BASE_URL + "/api/course/getInstructorCourses",

  DELETE_SECTION_API:
    BASE_URL + "/api/course/deleteSection",

  DELETE_SUBSECTION_API:
    BASE_URL + "/api/course/deleteSubSection",

  DELETE_COURSE_API:
    BASE_URL + "/api/course/deleteCourse",

  GET_FULL_COURSE_DETAILS_AUTHENTICATED:
    BASE_URL + "/api/course/getFullCourseDetails",

  LECTURE_COMPLETION_API:
    BASE_URL + "/api/course/updateCourseProgress",

  CREATE_RATING_API:
    BASE_URL + "/api/course/createRating",
};

// ==========================
// RATINGS
// ==========================
export const ratingsEndpoints = {
  REVIEWS_DETAILS_API:
    BASE_URL + "/api/course/getReviews",
};

// ==========================
// CATEGORIES
// ==========================
export const categories = {
  CATEGORIES_API:
    BASE_URL + "/api/course/showAllCategories",
};

// ==========================
// CATALOG
// ==========================
export const catalogData = {
  CATALOGPAGEDATA_API:
    BASE_URL + "/api/course/getCategoryPageDetails",
};

// ==========================
// CONTACT
// ==========================
export const contactusEndpoint = {
  CONTACT_US_API:
    BASE_URL + "/api/reach/contact",
};