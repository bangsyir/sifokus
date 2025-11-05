import React, { useState } from "react";
import { Plus, CheckCircle2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { useFetcher } from "react-router";
import { toast } from "sonner";

export const AddTaskForm = () => {
  const fetcher = useFetcher();
  const [open, setOpen] = useState(false);

  React.useEffect(() => {
    if (fetcher.data?.code === "CREATED") {
      setOpen(false);
      toast.success(fetcher?.data?.message);
    }
  }, [fetcher.data?.code]);

  return (
    <div className="">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <CheckCircle2 className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Tasks</h2>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent
            aria-describedby="create task"
            aria-description="create task"
          >
            <DialogHeader>
              <DialogTitle>Add New Task</DialogTitle>
            </DialogHeader>
            <fetcher.Form method="post" className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium">
                  Title
                </label>
                <Input
                  id="title"
                  name="title"
                  placeholder="What are you working on?"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Description
                </label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Add more details about this task..."
                  rows={4}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" name="intent" value="create-task">
                  Add Task
                </Button>
              </div>
            </fetcher.Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
