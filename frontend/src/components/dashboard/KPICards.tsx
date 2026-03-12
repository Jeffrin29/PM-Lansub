"use client";

import { motion } from "framer-motion";
import { FaProjectDiagram, FaTasks, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";

export default function KPICards() {

  const cards = [
    {
      title: "Total Projects",
      value: "24",
      icon: <FaProjectDiagram />,
      color: "from-blue-500 to-indigo-600"
    },
    {
      title: "Active Tasks",
      value: "132",
      icon: <FaTasks />,
      color: "from-purple-500 to-indigo-600"
    },
    {
      title: "Completed Tasks",
      value: "89",
      icon: <FaCheckCircle />,
      color: "from-green-500 to-emerald-600"
    },
    {
      title: "Risk Alerts",
      value: "3",
      icon: <FaExclamationTriangle />,
      color: "from-red-500 to-orange-600"
    }
  ];

  return (
    <div className="grid grid-cols-4 gap-6">

      {cards.map((card, i) => (
        <motion.div
          key={i}
          whileHover={{ scale: 1.05 }}
          className={`p-6 rounded-xl text-white shadow-lg bg-gradient-to-r ${card.color}`}
        >
          <div className="flex justify-between items-center">

            <div>
              <p className="text-sm opacity-80">{card.title}</p>
              <h2 className="text-3xl font-bold">{card.value}</h2>
            </div>

            <div className="text-2xl opacity-80">
              {card.icon}
            </div>

          </div>

        </motion.div>
      ))}

    </div>
  );
}