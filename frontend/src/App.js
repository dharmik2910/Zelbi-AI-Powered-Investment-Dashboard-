import "./App.css";
import {Route, Routes, Navigate } from "react-router-dom";
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
import TaxCalculator from './pages/TaxCalculator.jsx';
import Pricing from './pages/Pricing.jsx';
import Profile from './pages/Profile.jsx';
import TermsAndConditions from './pages/TermsAndConditions.jsx';
import PrivacyPolicy from './pages/PrivacyPolicy.jsx';
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUserDetails } from "./services/operations/SettingsAPI";
import CookiePolicy from "./pages/CookiePolicy.jsx";

const ProtectedRoute = ({ children }) => {
  const { token } = useSelector((state) => state.auth);
  
  if (!token) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

function App() {
  const { token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID";

  useEffect(() => {
    if (token) {
      dispatch(getUserDetails(token, navigate));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <div className="w-screen min-h-screen bg-black flex flex-col font-inter">
     <Navbar/>

     <main className="flex-grow">
         <Routes>
             <Route path="/" element={<Home/>} />
             <Route path="/dashboard" element={<ProtectedRoute><Dashboard/></ProtectedRoute>} />
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