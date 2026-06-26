import "./App.css";
import {Route, Routes, Navigate } from "react-router-dom";
import Home from "./pages/Home.jsx"
import Navbar from "./components/common/Navbar.jsx"
import Login from "./pages/Login.jsx"
import Signup from "./pages/Signup.jsx"
import ForgotPassword from "./pages/ForgotPassword.jsx";
import UpdatePassword from "./pages/UpdatePassword.jsx";
import VerifyEmail from "./pages/VerifyEmail.jsx";
import Error from "./pages/Error.jsx"
import Blog from './pages/Blog.jsx';
import AiAssistant from './pages/AiAssistant.jsx';
import Dashboard from './pages/Dashboard.jsx';
import TaxCalculator from './pages/TaxCalculator.jsx';
import Pricing from './pages/Pricing.jsx';
import { useSelector } from "react-redux";

const ProtectedRoute = ({ children }) => {
  const { token } = useSelector((state) => state.auth);
  
  if (!token) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

function App() {
  return (
   <div className="w-screen min-h-screen bg-black flex flex-col font-inter">
    <Navbar/>

    <main className="flex-grow">
        <Routes>
            <Route path="/" element={<Home/>} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard/>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/tax-calculator" 
              element={
                <ProtectedRoute>
                  <TaxCalculator/>
                </ProtectedRoute>
              } 
            />
            <Route
                path="/signup"
                element={
                    <Signup />
                }
              />
            <Route
                path="/login"
                element={
                    <Login />
                }
              />
            <Route
                path="/forgot-password"
                element={
                    <ForgotPassword />
                }
              />  
            <Route
              path="/update-password/:id"
              element={
                  <UpdatePassword />
              }
            />  
            <Route
                path="/verify-email"
                element={
                    <VerifyEmail />
                }
              />  
            <Route
                path="/update-password/:id"
                element={
                    <UpdatePassword />
                }
              />
            <Route path="/blog" element={<Blog/>}/>
            <Route path="/pricing" element={<Pricing/>}/>
            <Route 
              path="/ai-assistant" 
              element={
                <ProtectedRoute>
                  <AiAssistant/>
                </ProtectedRoute>
              } 
            />
            {/* <Route 
              path="/project" 
              element={
                <ProtectedRoute>
                  <Project/>
                </ProtectedRoute>
              } 
            /> */}
            
            <Route path="*" element={<Error />} />
        </Routes>
    </main>
   </div>
  );
}

export default App;
