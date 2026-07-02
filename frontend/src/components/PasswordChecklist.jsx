// import { FaCheckCircle, FaCircle } from "react-icons/fa";

// export default function PasswordChecklist({ password, checklist, isStrong }) {
//   if (!password) return null;

//   if (isStrong) {
//     return (
//       <div className="flex items-center gap-2 text-xs text-[#3affa3] -mt-2">
//         <FaCheckCircle className="shrink-0" />
//         <span>Strong password</span>
//       </div>
//     );
//   }

//   return (
//     <ul className="space-y-1.5 -mt-2">
//       {checklist.map((req) => (
//         <li key={req.key} className="flex items-center gap-2 text-xs">
//           {req.met ? (
//             <FaCheckCircle className="text-[#3affa3] shrink-0" />
//           ) : (
//             <FaCircle className="text-gray-600 shrink-0 text-[6px]" />
//           )}
//           <span className={req.met ? "text-gray-300" : "text-gray-500"}>
//             {req.label}
//           </span>
//         </li>
//       ))}
//     </ul>
//   );
// }

import { FaCheckCircle, FaCircle } from "react-icons/fa";

export default function PasswordChecklist({ password, checklist, isStrong }) {
  return (
    <div
      className={`overflow-hidden transition-all duration-300 ease-in-out ${
        password ? "max-h-40 opacity-100 mt-1" : "max-h-0 opacity-0"
      }`}
    >
      {isStrong ? (
        <div className="flex items-center gap-2 text-xs text-[#3affa3] py-1">
          <FaCheckCircle className="shrink-0" />
          <span>Strong password</span>
        </div>
      ) : (
        <ul className="space-y-1.5 py-1">
          {checklist.map((req) => (
            <li key={req.key} className="flex items-center gap-2 text-xs">
              {req.met ? (
                <FaCheckCircle className="text-[#3affa3] shrink-0" />
              ) : (
                <FaCircle className="text-gray-600 shrink-0 text-[6px]" />
              )}
              <span className={req.met ? "text-gray-300" : "text-gray-500"}>
                {req.label}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}