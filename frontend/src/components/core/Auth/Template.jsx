import { useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"

import LoginForm from "./LoginForm"
import SignupForm from "./SignupForm"

function Template({ formType }) {
  const { loading } = useSelector((state) => state.auth)
  const navigate = useNavigate()

  const onSwitchToLogin = () => {
    navigate("/login")
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-black overflow-y-auto">
      <div className="flex flex-col items-center w-full min-h-[calc(100vh-3.5rem)] py-12">
        <div className="w-full max-w-[450px] mx-auto relative">
          {loading && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-20 flex items-center justify-center rounded-md">
              <div className="spinner"></div>
            </div>
          )}
          {formType === "signup" ? <SignupForm onSwitchToLogin={onSwitchToLogin} /> : <LoginForm />}
        </div>
      </div>
    </div>
  )
}

export default Template