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
      {loading ? (
        <div className="grid min-h-[calc(100vh-3.5rem)] place-items-center">
          <div className="spinner"></div>
        </div>
      ) : (
        <div className="flex flex-col items-center w-full min-h-[calc(100vh-3.5rem)] py-12">
          <div className="w-full max-w-[450px] mx-auto">
            {formType === "signup" ? <SignupForm onSwitchToLogin={onSwitchToLogin} /> : <LoginForm />}
          </div>
        </div>
      )}
    </div>
  )
}

export default Template