import { EllipsisVertical } from "lucide-react";
import { useEffect } from "react";
import { useFetcher } from "react-router";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

export default function TaskAction({
  taskId,
  status,
}: {
  taskId: number;
  status: string | null;
}) {
  const fetcher = useFetcher();

  useEffect(() => {
    if (!fetcher.data) return;
    if (fetcher?.data?.status !== false) {
      toast.success("Success", { description: fetcher?.data?.message });
    }
  }, [fetcher?.data]);

  function handleDone() {
    fetcher.submit({ taskId, intent: "complete-task" }, { method: "post" });
  }

  function handleDelete() {
    fetcher.submit({ taskId, intent: "delete-task" }, { method: "post" });
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <EllipsisVertical />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={handleDone} disabled={status === "done"}>
          Complete
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDelete}>Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
