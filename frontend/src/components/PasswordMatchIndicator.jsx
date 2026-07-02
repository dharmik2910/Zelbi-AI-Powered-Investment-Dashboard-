import { FaCheckCircle, FaCircle } from "react-icons/fa";

export default function PasswordMatchIndicator({ password, confirmPassword }) {
  if (!confirmPassword) return null;

  const matches = password === confirmPassword;

  return (
    <div className={`flex items-center gap-2 text-xs -mt-2 ${matches ? "text-[#3affa3]" : "text-red-400"}`}>
      {matches ? (
        <FaCheckCircle className="shrink-0" />
      ) : (
        <FaCircle className="shrink-0 text-[6px]" />
      )}
      <span>{matches ? "Passwords match" : "Passwords do not match"}</span>
    </div>
  );
}