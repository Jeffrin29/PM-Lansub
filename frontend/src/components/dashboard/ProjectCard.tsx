import HealthIndicator from "./HealthIndicator";

export default function ProjectCard({ project }: any) {

  return (
    <div className="bg-gray-100 dark:bg-black border border-gray-200 dark:border-zinc-800 p-4 rounded-lg">

      {/* Title */}

      <div className="flex justify-between items-center">

        <p className="font-medium">
          {project.title}
        </p>

        <HealthIndicator progress={project.progress} />

      </div>

      {/* Priority */}

      <span className={`text-xs px-2 py-1 rounded mt-2 inline-block
      ${project.priority === "High" ? "bg-red-500 text-white" :
        project.priority === "Medium" ? "bg-yellow-500 text-black" :
        "bg-green-500 text-white"}`}>

        {project.priority}

      </span>

      {/* Progress */}

      <div className="mt-3">

        <div className="h-2 bg-gray-300 dark:bg-zinc-800 rounded">

          <div
            className="h-2 bg-blue-500 rounded"
            style={{ width: `${project.progress}%` }}
          />

        </div>

        <p className="text-xs text-gray-500 mt-1">
          {project.progress}% complete
        </p>

      </div>

      {/* Footer */}

      <div className="flex justify-between items-center mt-4 text-xs text-gray-500">

        <span>👤 {project.owner}</span>

        <span>📅 {project.deadline}</span>

      </div>

    </div>
  );
}