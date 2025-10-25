import { data, useLoaderData, Form, redirect } from "react-router";
import { db } from "~/db/drizzle";
import { tasks } from "~/db/schema";
import { eq } from "drizzle-orm";

export async function loader() {
  const allTasks = await db.select().from(tasks);
  return data({ tasks: allTasks });
}

export async function action({ request }: { request: Request }) {
  const formData = await request.formData();
  const intent = formData.get("_intent");
  const id = formData.get("id");

  if (intent === "add") {
    const title = formData.get("title")?.toString() || "";
    await db.insert(tasks).values({ title });
  } else if (intent === "done" && id) {
    await db
      .update(tasks)
      .set({ status: "done" })
      .where(eq(tasks.id, Number(id)));
  } else if (intent === "delete" && id) {
    await db.delete(tasks).where(eq(tasks.id, Number(id)));
  }

  return redirect("/tasks");
}

export default function Tasks() {
  const { tasks } = useLoaderData<typeof loader>();

  return (
    <main className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">Tasks</h1>
      <Form method="post" className="flex gap-2 mb-4">
        <input
          type="text"
          name="title"
          placeholder="New task..."
          className="flex-1 border rounded px-2 py-1"
        />
        <button
          name="_intent"
          value="add"
          className="bg-blue-600 text-white px-4 py-1 rounded"
        >
          Add
        </button>
      </Form>

      <ul className="space-y-2">
        {tasks.map((t) => (
          <li
            key={t.id}
            className="flex justify-between items-center border-b pb-1"
          >
            <span
              className={
                t.status === "done" ? "line-through text-gray-400" : ""
              }
            >
              {t.title}
            </span>
            <div className="space-x-2">
              {t.status !== "done" && (
                <Form method="post" className="inline">
                  <input type="hidden" name="id" value={t.id} />
                  <button
                    name="_intent"
                    value="done"
                    className="text-green-600"
                  >
                    Done
                  </button>
                </Form>
              )}
              <Form method="post" className="inline">
                <input type="hidden" name="id" value={t.id} />
                <button name="_intent" value="delete" className="text-red-600">
                  Delete
                </button>
              </Form>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
