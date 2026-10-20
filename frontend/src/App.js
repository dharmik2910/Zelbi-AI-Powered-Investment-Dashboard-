import "./App.css";
import {Route, Routes, Navigate, useLocation } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import Home from "./pages/Home.jsx"
import Navbar from "./components/common/Navbar.jsx"
import Login from "./pages/Login.jsx"
import Signup from "./pages/Signup.jsx"
import ForgotPassword from "./pages/ForgotPassword.jsx";
import UpdatePassword from "./pages/UpdatePassword.jsx";
import VerifyEmail from "./pages/VerifyEmail.jsx";
import Error from "./pages/Error.jsx"
import Blog from './pages/Blog.jsx';
import ZelbiAssistant from './pages/ZelbiAssistant.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Portfolio from './pages/Portfolio.jsx';
import Alerts from './pages/Alerts.jsx';
import Compare from './pages/Compare.jsx';
import Admin from './pages/Admin.jsx';
import TaxCalculator from './pages/TaxCalculator.jsx';
import Pricing from './pages/Pricing.jsx';
import Profile from './pages/Profile.jsx';
import TermsAndConditions from './pages/TermsAndConditions.jsx';
import PrivacyPolicy from './pages/PrivacyPolicy.jsx';
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUserDetails } from "./services/operations/SettingsAPI";
import axios from "axios";
import { toast } from "react-hot-toast";
import { axiosInstance } from "./services/apiconnector";
import { setToken } from "./slices/authSlice";
import { setUser } from "./slices/profileSlice";
import { trackPageView } from "./utils/analytics";
import { loadGtm, pushPageView } from "./utils/gtm";
import CookiePolicy from "./pages/CookiePolicy.jsx";

const ProtectedRoute = ({ children }) => {
  const { token } = useSelector((state) => state.auth);
  
  if (!token) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

// The server checks the admin role on every request; this only hides the page from others
const AdminRoute = ({ children }) => {
  const { token } = useSelector((state) => state.auth);
  const { user } = useSelector((state) => state.profile);

  if (!token) return <Navigate to="/login" />;
  if (!user) return null; // profile still loading
  if (user.role !== "admin") return <Navigate to="/" />;

  return children;
};

function App() {
  const { token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  // The admin area has its own header instead of the site navbar
  const { pathname } = useLocation();
  const isAdminArea = pathname.startsWith("/admin");

  // Record page views for the admin analytics and Google Tag Manager; admin pages are left out
  useEffect(() => {
    if (isAdminArea) return;
    trackPageView(pathname, token);
    loadGtm(pathname);
    pushPageView(pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);
  const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID";

  useEffect(() => {
    if (token) {
      dispatch(getUserDetails(token, navigate));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Sign out straight away if an admin blocks this account while it's in use
  useEffect(() => {
    const onError = (error) => {
      if (error.response?.status === 403 && error.response.data?.blocked) {
        dispatch(setToken(null));
        dispatch(setUser(null));
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        toast.error(error.response.data.message);
        navigate("/login");
      }
      return Promise.reject(error);
    };
    const ids = [axios, axiosInstance].map((client) => [client, client.interceptors.response.use((r) => r, onError)]);
    return () => ids.forEach(([client, id]) => client.interceptors.response.eject(id));
  }, [dispatch, navigate]);

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <div className="w-screen min-h-screen bg-black flex flex-col font-inter">
     {!isAdminArea && <Navbar/>}

     <main className="flex-grow">
         <Routes>
             <Route path="/" element={<Home/>} />
             <Route path="/dashboard" element={<ProtectedRoute><Dashboard/></ProtectedRoute>} />
            <Route path="/portfolio" element={<ProtectedRoute><Portfolio/></ProtectedRoute>} />
            <Route path="/alerts" element={<ProtectedRoute><Alerts/></ProtectedRoute>} />
            <Route path="/compare" element={<ProtectedRoute><Compare/></ProtectedRoute>} />
            <Route path="/admin" element={<AdminRoute><Admin/></AdminRoute>} />
             <Route path="/tax-calculator" element={<ProtectedRoute><TaxCalculator/></ProtectedRoute>} />
             <Route path="/signup" element={<Signup />} />
             <Route path="/login" element={<Login />} />
             <Route path="/forgot-password" element={<ForgotPassword />} />
             <Route path="/update-password/:id" element={<UpdatePassword />} />
             <Route path="/verify-email" element={<VerifyEmail />} />
             <Route path="/blog" element={<Blog/>}/>
             <Route path="/pricing" element={<Pricing/>}/>
             <Route path="/zelbi-assistant" element={<ProtectedRoute><ZelbiAssistant/></ProtectedRoute>} />
             <Route path="/profile" element={<ProtectedRoute><Profile/></ProtectedRoute>} />
             <Route path="/terms-and-conditions" element={<TermsAndConditions/>} />
             <Route path="/privacy-policy" element={<PrivacyPolicy/>} />
             <Route path="*" element={<Error />} />
             <Route path="/cookie-policy" element={<CookiePolicy />} />
         </Routes>
     </main>
    </div>
    </GoogleOAuthProvider>
  );
}

export default App;