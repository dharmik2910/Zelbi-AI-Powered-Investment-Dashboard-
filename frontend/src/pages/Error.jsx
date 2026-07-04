import React from "react";
import { Link } from "react-router-dom";

const Error = () => {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-black text-white">
      <h1 className="text-6xl font-bold">404</h1>
      <p className="mt-4 text-xl">Page Not Found</p>

      <Link
        to="/"
          className="mt-6 rounded bg-[#3affa3] px-6 py-3 text-black hover:bg-[#3affb4] focus:outline-none focus:ring-2 focus:ring-[#3affa3] focus:ring-offset-2"
      >
        Go Back
      </Link>
    </div>
  );
};

export default Error;