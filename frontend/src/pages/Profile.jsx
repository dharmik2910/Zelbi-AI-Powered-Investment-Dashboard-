import { useState, useRef, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  FaUser,
  FaKey,
  FaCreditCard,
  FaTrash,
  FaCamera,
  FaSpinner,
  FaCalendarAlt,
  FaPhone,
  FaInfoCircle,
  FaCrown,
  FaRobot,
  FaEnvelope,
  FaSignOutAlt,
  FaChevronDown,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import useOnClickOutside from "../hooks/useOnClickOutside";
import { logout } from "../services/operations/authAPI";
import {
  updateDisplayPicture,
  updateProfile,
  changePassword,
  deleteProfile
} from "../services/operations/SettingsAPI";

const GENDER_OPTIONS = [
  { value: "", label: "Select Gender" },
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
  { value: "Other", label: "Other" },
  { value: "Prefer not to say", label: "Prefer not to say" },
];

function GenderSelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useOnClickOutside(ref, () => setOpen(false));

  const selectedLabel =
    GENDER_OPTIONS.find((option) => option.value === value)?.label ||
    "Select Gender";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full bg-[#1a1a1a] text-white rounded-md px-4 py-3 border border-white/10 focus:outline-none focus:border-[#3affa3] transition-colors flex items-center justify-between gap-2"
      >
        <span className={value ? "text-white" : "text-gray-500 truncate"}>
          {selectedLabel}
        </span>
        <FaChevronDown
          className={`text-gray-500 text-xs shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""
            }`}
        />
      </button>
      {open && (
        <ul className="absolute z-50 left-0 right-0 mt-1 bg-[#1a1a1a] border border-white/10 rounded-md shadow-lg overflow-hidden">
          {GENDER_OPTIONS.map((option) => (
            <li key={option.value || "placeholder"}>
              <button
                type="button"
                onClick={() => {
                  onChange({ target: { name: "gender", value: option.value } });
                  setOpen(false);
                }}
                className={`w-full text-left px-4 py-3 text-sm transition-colors ${value === option.value
                  ? "bg-[#3affa3]/10 text-[#3affa3]"
                  : "text-white hover:bg-white/5"
                  }`}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const getOriginalProfileData = (user) => ({
  firstName: user?.firstName || "",
  lastName: user?.lastName || "",
  dateOfBirth: user?.additionalDetails?.dateOfBirth || "",
  about: user?.additionalDetails?.about || "",
  contactNumber: user?.additionalDetails?.contactNumber || "",
  gender: user?.additionalDetails?.gender || "",
});

export default function Profile() {
  const { user } = useSelector((state) => state.profile);
  const { token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Active tab state
  const [activeTab, setActiveTab] = useState("profile");

  // Loading states
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // Edit Profile Form State
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    dateOfBirth: user?.additionalDetails?.dateOfBirth || "",
    about: user?.additionalDetails?.about || "",
    contactNumber: user?.additionalDetails?.contactNumber || "",
    gender: user?.additionalDetails?.gender || "",
  });

  // Password Form State
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Update profile state when user loads/changes
  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        dateOfBirth: user.additionalDetails?.dateOfBirth || "",
        about: user.additionalDetails?.about || "",
        contactNumber: user.additionalDetails?.contactNumber || "",
        gender: user.additionalDetails?.gender || "",
      });
    }
  }, [user]);

  useEffect(() => {
    document.title = "Zelbi | My Profile";
    return () => {
      document.title = "Zelbi";
    };
  }, []);

  // Handle Profile Form Change
  const handleProfileChange = (e) => {
    setProfileData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Handle Password Form Change
  const handlePasswordChange = (e) => {
    setPasswordData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Handle Profile Submit
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      await dispatch(updateProfile(token, profileData));
    } catch (err) {
      console.error(err);
    } finally {
      setProfileLoading(false);
    }
  };

  // Handle Password Submit
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match!");
      return;
    }
    setPasswordLoading(true);
    try {
      await changePassword(token, {
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword,
      });
      setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      console.error(err);
    } finally {
      setPasswordLoading(false);
    }
  };

  // Handle Avatar Click & Change
  const handleAvatarClick = () => {
    fileInputRef.current.click();
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("displayPicture", file);

    setAvatarLoading(true);
    try {
      await dispatch(updateDisplayPicture(token, formData));
    } catch (err) {
      console.error(err);
    } finally {
      setAvatarLoading(false);
    }
  };

  // Handle Account Deletion
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      toast.error("Please type 'DELETE' to confirm.");
      return;
    }
    try {
      await dispatch(deleteProfile(token, navigate));
    } catch (err) {
      console.error(err);
    }
  };

  const planLimits = { free: 5, pro: 100, elite: Infinity };
  const currentPlan = user?.subscriptionPlan || "free";
  const promptLimit = planLimits[currentPlan] || 5;
  const promptCount = user?.aiPromptCount || 0;
  const usagePercentage = Math.min((promptCount / promptLimit) * 100, 100);

  const originalProfileData = useMemo(() => getOriginalProfileData(user), [user]);

  const isProfileDirty = useMemo(
    () =>
      Object.keys(originalProfileData).some(
        (key) => profileData[key] !== originalProfileData[key]
      ),
    [profileData, originalProfileData]
  );

  const isProfileValid = profileData.firstName.trim().length > 0;
  const canSaveProfile = isProfileDirty && isProfileValid && !profileLoading;

  const isPasswordFormValid = useMemo(() => {
    const { oldPassword, newPassword, confirmPassword } = passwordData;
    return (
      oldPassword.trim() !== "" &&
      newPassword.trim() !== "" &&
      confirmPassword.trim() !== "" &&
      newPassword === confirmPassword
    );
  }, [passwordData]);

  const canUpdatePassword = isPasswordFormValid && !passwordLoading;

  const tabs = [
    { id: "profile", name: "My Profile", icon: FaUser },
    { id: "password", name: "Security", icon: FaKey },
    { id: "subscription", name: "Subscription", icon: FaCreditCard },
    { id: "danger", name: "Delete Account", icon: FaTrash },
  ];

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <div className="max-w-6xl mx-auto w-full px-4 pt-8 pb-12 sm:px-6 md:px-8 mt-16 md:mt-12">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Account Settings</h1>
            <p className="text-gray-400 text-sm mt-1">Manage your profile, security settings, and subscription plans.</p>
          </div>
          <div className="flex items-center gap-3 bg-[#101010] px-4 py-2.5 rounded-xl border border-white/5">
            <FaCrown className={`text-xl ${currentPlan === "free" ? "text-gray-400" : currentPlan === "pro" ? "text-cyan-400" : "text-amber-400"}`} />
            <div>
              <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">Current Plan</div>
              <div className="text-sm font-semibold capitalize text-[#3affa3]">{currentPlan}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* Navigation Sidebar */}
          <div className="lg:col-span-1 flex flex-col gap-2 lg:sticky lg:top-24 lg:self-start">
            <div className="flex lg:flex-col overflow-x-auto lg:overflow-visible border-b lg:border-b-0 border-white/10 pb-4 lg:pb-0 gap-1 scrollbar-none">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-all duration-200 shrink-0 ${activeTab === tab.id
                      ? "bg-[#3affa3] text-black shadow-lg shadow-[#3affa3]/10 font-semibold"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                      }`}
                  >
                    <Icon className="text-base" />
                    {tab.name}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => dispatch(logout(navigate))}
              className="flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-all duration-200 shrink-0 text-gray-400 hover:text-white hover:bg-white/5 border-t border-white/10 lg:mt-2"
            >
              <FaSignOutAlt className="text-base" />
              Sign Out
            </button>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3 bg-[#101010] rounded-2xl p-6 border border-white/5 shadow-xl">

            {/* 1. MY PROFILE TAB */}
            {activeTab === "profile" && (
              <div className="space-y-8 animate-fadeIn">
                <div className="flex flex-col sm:flex-row items-center gap-6 border-b border-white/5 pb-6">
                  {/* Avatar Upload */}
                  <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-[#3affa3] transition-colors duration-300 bg-neutral-900 flex items-center justify-center">
                      {avatarLoading ? (
                        <FaSpinner className="animate-spin text-2xl text-[#3affa3]" />
                      ) : user?.image ? (
                        <img
                          src={user.image}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FaUser className="text-4xl text-gray-600" />
                      )}
                    </div>
                    <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <FaCamera className="text-white text-xl" />
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleAvatarChange}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>

                  <div className="text-center sm:text-left">
                    <h2 className="text-xl font-bold text-white">
                      {user?.firstName} {user?.lastName || ""}
                    </h2>
                    <p className="text-gray-400 text-sm flex items-center justify-center sm:justify-start gap-2 mt-1">
                      <FaEnvelope className="text-xs text-gray-500" />
                      {user?.email}
                    </p>
                    <button
                      onClick={handleAvatarClick}
                      className="mt-3 text-xs font-semibold text-[#3affa3] hover:underline"
                    >
                      Change Display Picture
                    </button>
                  </div>
                </div>

                {/* Profile Edit Form */}
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <h3 className="text-lg font-semibold text-white border-b border-white/5 pb-2">Personal Details</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={profileData.firstName}
                        onChange={handleProfileChange}
                        required
                        className="w-full bg-[#1a1a1a] text-white rounded-md px-4 py-3 border border-white/10 focus:outline-none focus:border-[#3affa3] transition-colors"
                        placeholder="John"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={profileData.lastName}
                        onChange={handleProfileChange}
                        className="w-full bg-[#1a1a1a] text-white rounded-md px-4 py-3 border border-white/10 focus:outline-none focus:border-[#3affa3] transition-colors"
                        placeholder="Doe"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                        Contact Number
                      </label>
                      <div className="relative">
                        <FaPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
                        <input
                          type="tel"
                          name="contactNumber"
                          value={profileData.contactNumber}
                          onChange={handleProfileChange}
                          className="w-full bg-[#1a1a1a] text-white rounded-md pl-10 pr-4 py-3 border border-white/10 focus:outline-none focus:border-[#3affa3] transition-colors"
                          placeholder="9876543210"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                        Gender
                      </label>
                      <GenderSelect
                        value={profileData.gender}
                        onChange={handleProfileChange}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                        Date of Birth
                      </label>
                      <div className="relative">
                        <FaCalendarAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
                        <input
                          type="date"
                          name="dateOfBirth"
                          value={profileData.dateOfBirth}
                          onChange={handleProfileChange}
                          className="w-full bg-[#1a1a1a] text-white rounded-md pl-10 pr-4 py-3 border border-white/10 focus:outline-none focus:border-[#3affa3] transition-colors"
                        />
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                        Bio / About
                      </label>
                      <div className="relative">
                        <FaInfoCircle className="absolute left-4 top-4 text-gray-500 text-sm" />
                        <textarea
                          name="about"
                          rows="3"
                          value={profileData.about}
                          onChange={handleProfileChange}
                          className="w-full bg-[#1a1a1a] text-white rounded-md pl-10 pr-4 py-3 border border-white/10 focus:outline-none focus:border-[#3affa3] transition-colors"
                          placeholder="Tell us about yourself..."
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-white/5">
                    <button
                      type="submit"
                      disabled={!canSaveProfile}
                      className="bg-[#3affa3] hover:bg-[#2de88f] text-black font-semibold px-6 py-3 rounded-md transition-all duration-300 flex items-center gap-2 shadow-lg shadow-[#3affa3]/10 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#3affa3]"
                    >
                      {profileLoading && <FaSpinner className="animate-spin" />}
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* 2. SECURITY TAB */}
            {activeTab === "password" && (
              <form onSubmit={handlePasswordSubmit} className="space-y-6 animate-fadeIn">
                <div>
                  <h3 className="text-lg font-semibold text-white">Change Password</h3>
                  <p className="text-gray-400 text-xs mt-1">Ensure your account is using a long, random password to stay secure.</p>
                </div>

                <div className="space-y-5 border-t border-white/5 pt-6">
                  <div className="relative">
                    <input
                      type={showPassword.current ? "text" : "password"}
                      name="oldPassword"
                      value={passwordData.oldPassword}
                      onChange={handlePasswordChange}
                      required
                      placeholder="Enter current password"
                      className="w-full bg-[#1a1a1a] text-white rounded-md px-4 pr-12 py-3 border border-white/10 focus:outline-none focus:border-[#3affa3] transition-colors"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword((prev) => ({
                          ...prev,
                          current: !prev.current,
                        }))
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#3affa3]"
                    >
                      {showPassword.current ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type={showPassword.new ? "text" : "password"}
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      required
                      placeholder="Enter new password"
                      className="w-full bg-[#1a1a1a] text-white rounded-md px-4 pr-12 py-3 border border-white/10 focus:outline-none focus:border-[#3affa3]"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword((prev) => ({
                          ...prev,
                          new: !prev.new,
                        }))
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#3affa3]"
                    >
                      {showPassword.new ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type={showPassword.confirm ? "text" : "password"}
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      required
                      placeholder="Confirm new password"
                      className="w-full bg-[#1a1a1a] text-white rounded-md px-4 pr-12 py-3 border border-white/10 focus:outline-none focus:border-[#3affa3]"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword((prev) => ({
                          ...prev,
                          confirm: !prev.confirm,
                        }))
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#3affa3]"
                    >
                      {showPassword.confirm ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-white/5">
                  <button
                    type="submit"
                    disabled={!canUpdatePassword}
                    className="bg-[#3affa3] hover:bg-[#2de88f] text-black font-semibold px-6 py-3 rounded-md transition-all duration-300 flex items-center gap-2 shadow-lg shadow-[#3affa3]/10 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#3affa3]"
                  >
                    {passwordLoading && <FaSpinner className="animate-spin" />}
                    Update Password
                  </button>
                </div>
              </form>
            )}

            {/* 3. SUBSCRIPTION TAB */}
            {activeTab === "subscription" && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h3 className="text-lg font-semibold text-white">Subscription Details</h3>
                  <p className="text-gray-400 text-xs mt-1">Review your current plan benefits and assistant limits.</p>
                </div>

                <div className="border-t border-white/5 pt-6 space-y-6">
                  {/* Plan Card */}
                  <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold uppercase tracking-wider text-white capitalize">{currentPlan} Plan</span>
                        {currentPlan !== "free" && <span className="bg-[#3affa3]/10 text-[#3affa3] text-xs font-bold px-2 py-0.5 rounded-full border border-[#3affa3]/20">Active</span>}
                      </div>
                      <p className="text-gray-400 text-sm mt-1">
                        {currentPlan === "free" && "Upgrade to unlock advanced analytics and unlimited AI assistant queries."}
                        {currentPlan === "pro" && "Your Pro tier covers up to 100 AI Assistant calls monthly."}
                        {currentPlan === "elite" && "Elite tier includes unlimited AI queries and priority real-time data."}
                      </p>
                    </div>
                    {currentPlan === "free" && (
                      <button
                        onClick={() => navigate("/pricing")}
                        className="bg-[#3affa3] hover:bg-[#2de88f] text-black font-semibold px-5 py-2.5 rounded-xl text-sm transition-all shrink-0 shadow-lg shadow-[#3affa3]/10"
                      >
                        Upgrade Plan
                      </button>
                    )}
                  </div>

                  {/* AI Prompt Usage */}
                  <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-white font-semibold">
                        <FaRobot className="text-[#3affa3]" />
                        Zelbi AI Assistant Usage
                      </div>
                      <span className="text-sm font-semibold text-[#3affa3]">
                        {promptCount} / {promptLimit === Infinity ? "∞" : promptLimit} Queries
                      </span>
                    </div>

                    <div className="w-full bg-black/50 h-3 rounded-full overflow-hidden border border-white/5">
                      <div
                        className="bg-[#3affa3] h-full rounded-full transition-all duration-500"
                        style={{ width: `${usagePercentage}%` }}
                      />
                    </div>

                    <p className="text-xs text-gray-500 mt-2">
                      {currentPlan === "free"
                        ? "Free plan users are limited to 5 AI prompts in total. Upgrade for higher limits."
                        : `Your usage resets at the end of the billing period.`
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 4. DELETE ACCOUNT TAB */}
            {activeTab === "danger" && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h3 className="text-lg font-semibold" style={{ color: "#ffffff" }}>Delete Account</h3>
                </div>

                <div>
                  <div style={{ background: "rgba(127,29,29,0.2)", border: "1px solid rgb(222, 231, 220)" }} className="rounded-2xl p-6">
                    <h4 className="text-base font-bold" style={{ color: "#f8f4f4" }}>Delete Account</h4>
                    <p className="text-gray-400 text-sm mt-2">
                      Once you delete your account, there is no going back. All of your personal details, saved stock portfolios, and AI prompts history will be permanently deleted.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowDeleteModal(true)}
                      style={{ background: "#9b0707", color: "#fff" }}
                      className="mt-5 font-semibold px-5 py-2.5 rounded-md text-sm transition-all duration-200 hover:opacity-90 active:scale-95"
                    >
                      Delete My Account
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[2000] p-4">
          <div className="bg-[#101010] border border-red-500/20 rounded-2xl p-6 max-w-md w-full relative animate-scaleUp">
            <h3 className="text-xl font-bold text-red-500 mb-2">Are you absolutely sure?</h3>
            <p className="text-gray-400 text-sm mb-4">
              This action cannot be undone. This will permanently delete your account.
            </p>
            <p className="text-sm text-gray-300 mb-4">
              Please type <span className="font-bold text-white">DELETE</span> below to confirm:
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE"
              className="w-full bg-[#1a1a1a] text-white rounded-md px-4 py-3 border border-white/10 focus:outline-none focus:border-red-500 transition-colors mb-6"
            />
            <div className="flex gap-4 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText("");
                }}
                className="bg-[#1a1a1a] hover:bg-[#222] text-gray-400 hover:text-white px-4 py-2.5 rounded-md text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                style={{ background: "#9b0707", color: "#fff" }}
                disabled={deleteConfirmText !== "DELETE"}
                className="bg-red-700 hover:bg-red-700 text-black px-4 py-2.5 rounded-md text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-600"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
