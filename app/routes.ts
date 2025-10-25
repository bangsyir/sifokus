import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  // route("/tasks", "routes/tasks.tsx"),
  route("/dashboard", "routes/dashboard.tsx"),
  route("pomodoro/complete", "routes/pomodoro.complete.tsx"),
] satisfies RouteConfig;
