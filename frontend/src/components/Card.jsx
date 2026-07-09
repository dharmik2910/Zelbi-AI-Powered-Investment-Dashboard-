// import React, { useEffect, useRef } from "react";
// import VanillaTilt from "vanilla-tilt";

// const Card = ({ title, count, Icon }) => {
//   const cardRef = useRef(null);

//   useEffect(() => {
//     VanillaTilt.init(cardRef.current, {
//       max: 25,
//       speed: 400,
//       glare: true,
//       "max-glare": 0.2,
//     });
//   }, []);

//   return (
//     <div
//       ref={cardRef}
//       className="bg-black text-white w-[330px] h-[410px] rounded-lg shadow-lg flex flex-col  justify-between transform transition-all duration-300 hover:scale-105 relative p-5"
//     >
//       {/* Top Icons (Left & Right) */}
//       <div className="flex justify-between items-start">
//         <p className="text-gray-400 text-sm font-semibold ">{title}</p> 
//         <div className="absolute top-5 right-5 text-gray-400 text-xl">
//             <Icon />
//         </div>
//       </div>

//       {/* Card Content */}
//       <h2 className="text-5xl font-bold text-center">{count}+</h2>
      

//       {/* Join Button */}
//       <button className="mt-6 border border-pure-greys-400 text-xs px-6 py-4 rounded-lg text-green-400 hover:bg-green-400 hover:text-black transition-all duration-300 active:bg-green-400">
//         JOIN US
//       </button>
//     </div>
//   );
// };

// export default Card;