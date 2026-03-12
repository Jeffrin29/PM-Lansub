"use client";

import { useState } from "react";
import Avatar from "../../../components/dashboard/Avatar";

export default function OverviewPage() {

  const [currentDate, setCurrentDate] = useState(new Date());

  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();

  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  function changeMonth(e:any){
    setCurrentDate(new Date(year, e.target.value, 1));
  }

  function changeYear(e:any){
    setCurrentDate(new Date(e.target.value, month, 1));
  }

  return (

    <div className="space-y-6 w-full max-w-7xl">

      {/* Cards Grid */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

        {/* Calendar */}

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-gray-200 dark:border-zinc-800">

          <h3 className="font-semibold mb-4">
            Calendar
          </h3>

          {/* Month + Year */}

          <div className="flex gap-3 mb-4">

            <select
              value={month}
              onChange={changeMonth}
              className="px-3 py-1 rounded border dark:bg-zinc-800"
            >
              {months.map((m,i)=>(
                <option key={i} value={i}>
                  {m}
                </option>
              ))}
            </select>

            <select
              value={year}
              onChange={changeYear}
              className="px-3 py-1 rounded border dark:bg-zinc-800"
            >
              {Array.from({length:10}).map((_,i)=>{

                const y = 2022 + i;

                return(
                  <option key={y} value={y}>
                    {y}
                  </option>
                );

              })}
            </select>

          </div>


          {/* Week Days */}

          <div className="grid grid-cols-7 text-center text-xs text-gray-400 mb-2">

            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d,i)=>(
              <div key={i}>{d}</div>
            ))}

          </div>


          {/* Calendar Days */}

          <div className="grid grid-cols-7 gap-2 text-center text-sm">

            {Array.from({length:firstDay}).map((_,i)=>(
              <div key={"empty"+i}></div>
            ))}

            {Array.from({length:daysInMonth}).map((_,i)=>{

              const day = i + 1;

              const today = new Date();

              const isToday =
              day === today.getDate() &&
              month === today.getMonth() &&
              year === today.getFullYear();

              return(

                <div
                  key={day}
                  className={`p-2 rounded cursor-pointer transition
                  ${isToday
                    ? "bg-blue-500 text-white"
                    : "hover:bg-gray-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  {day}
                </div>

              );

            })}

          </div>

        </div>


        {/* Urgent Tasks */}

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-gray-200 dark:border-zinc-800">

          <h3 className="font-semibold mb-4">
            Urgent Tasks
          </h3>

          <div className="space-y-4 text-sm">

            <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-zinc-800 rounded">

              <div>
                <p className="font-medium">
                  Finish monthly reporting
                </p>
                <p className="text-xs text-gray-400">
                  Finance team
                </p>
              </div>

              <span className="text-red-500 text-xs">
                Today
              </span>

            </div>


            <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-zinc-800 rounded">

              <div>
                <p className="font-medium">
                  Report signing
                </p>
                <p className="text-xs text-gray-400">
                  Management
                </p>
              </div>

              <span className="text-red-500 text-xs">
                Today
              </span>

            </div>


            <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-zinc-800 rounded">

              <div>
                <p className="font-medium">
                  Market overview keynote
                </p>
                <p className="text-xs text-gray-400">
                  Marketing
                </p>
              </div>

              <span className="text-red-500 text-xs">
                Today
              </span>

            </div>

          </div>

        </div>


        {/* Team Directory */}

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-gray-200 dark:border-zinc-800">

          <h3 className="font-semibold mb-4">
            Team Directory
          </h3>

          <div className="grid grid-cols-2 gap-6 text-center">

            <div className="flex flex-col items-center">

              <Avatar name="Dana"/>
              <p className="text-sm mt-2 font-medium">
                Dana R.
              </p>
              <p className="text-xs text-gray-400">
                Project Manager
              </p>

            </div>


            <div className="flex flex-col items-center">

              <Avatar name="Elon"/>
              <p className="text-sm mt-2 font-medium">
                Elon S.
              </p>
              <p className="text-xs text-gray-400">
                Developer
              </p>

            </div>


            <div className="flex flex-col items-center">

              <Avatar name="Nancy"/>
              <p className="text-sm mt-2 font-medium">
                Nancy W.
              </p>
              <p className="text-xs text-gray-400">
                Designer
              </p>

            </div>


            <div className="flex flex-col items-center">

              <Avatar name="James"/>
              <p className="text-sm mt-2 font-medium">
                James M.
              </p>
              <p className="text-xs text-gray-400">
                QA Engineer
              </p>

            </div>

          </div>

        </div>

      </div>

    </div>

  );

}