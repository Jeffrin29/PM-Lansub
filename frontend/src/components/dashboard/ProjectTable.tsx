export default function ProjectTable() {

  const projects = [
    { name: "Website Revamp", owner: "John", progress: "72%", status: "Active" },
    { name: "Mobile App", owner: "Sara", progress: "48%", status: "Risk" },
    { name: "CRM Upgrade", owner: "Alex", progress: "90%", status: "Review" },
  ];

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">

      <h2 className="text-xl font-semibold mb-6">Active Projects</h2>

      <table className="w-full">

        <thead className="text-gray-500 text-sm">
          <tr>
            <th className="text-left pb-3">Project</th>
            <th className="text-left pb-3">Owner</th>
            <th className="text-left pb-3">Progress</th>
            <th className="text-left pb-3">Status</th>
          </tr>
        </thead>

        <tbody>

          {projects.map((p, i) => (

            <tr key={i} className="border-t hover:bg-gray-50">

              <td className="py-4 font-medium">{p.name}</td>

              <td>{p.owner}</td>

              <td>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: p.progress }}
                  ></div>
                </div>
              </td>

              <td>
                <span className={`px-3 py-1 rounded-full text-sm
                  ${p.status === "Active" && "bg-green-100 text-green-700"}
                  ${p.status === "Risk" && "bg-red-100 text-red-700"}
                  ${p.status === "Review" && "bg-yellow-100 text-yellow-700"}
                `}>
                  {p.status}
                </span>
              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>
  );
}