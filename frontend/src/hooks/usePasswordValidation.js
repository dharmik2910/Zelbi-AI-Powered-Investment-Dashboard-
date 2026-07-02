import { useMemo } from "react";

export const PASSWORD_REQUIREMENTS = [
  { key: "length", label: "At least 8 characters", test: (pwd) => pwd.length >= 8 },
  { key: "lowercase", label: "At least one lowercase character", test: (pwd) => /[a-z]/.test(pwd) },
  { key: "uppercase", label: "At least one uppercase character", test: (pwd) => /[A-Z]/.test(pwd) },
  { key: "number", label: "At least one number", test: (pwd) => /[0-9]/.test(pwd) },
  {
    key: "special",
    label: "At least one special character, e.g., ! @ # ?",
    test: (pwd) => /[!@#$%^&*(),.?":{}|<>_\-+=~`[\]\\/;']/.test(pwd),
  },
];

export default function usePasswordValidation(password) {
  const checklist = useMemo(
    () =>
      PASSWORD_REQUIREMENTS.map((req) => ({
        ...req,
        met: req.test(password),
      })),
    [password]
  );

  const isStrong = checklist.every((req) => req.met);

  return { checklist, isStrong };
}