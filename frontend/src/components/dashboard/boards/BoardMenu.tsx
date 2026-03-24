import { MoreVertical } from "lucide-react";
import { Button } from "../../ui/button";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "../../ui/dropdown-menu";

import ConfirmDialog from "../../ui/ConfirmDialog";
import type {BoardMenuProps } from "../../../types/dashboard";
import { toast } from "sonner";
import { bauhausFont } from "../dashboardTheme";

export default function BoardMenu({
  board,
  currentUserId,
  onDelete,
  onLeave,
}: BoardMenuProps) {
  
  const isOwner =
    currentUserId !== null && board.owner && board.owner.id === currentUserId;

  const copyInviteCode = () => {
    navigator.clipboard.writeText(board.invite_code);
    toast.info("Invite code copied to clipboard!");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="border-2 border-[#0a0a0a] bg-transparent text-[#0a0a0a] shadow-[3px_3px_0px_#] hover:bg-[#f7b731] hover:text-[#0a0a0a] dark:border-[#f5f0e8] dark:text-[#f5f0e8] dark:shadow-[3px_3px_0px_#] dark:hover:bg-[#1a3a6b] dark:hover:text-[#f5f0e8]"
        >
          <MoreVertical size={16} />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="border-[3px] border-[#0a0a0a] bg-[#f5f0e8] p-1 shadow-[6px_6px_0px_#0a0a0a] dark:border-[#f5f0e8] dark:bg-[#1e1e1e] dark:shadow-[6px_6px_0px_#f7b731]"
      >
        {isOwner && (
          <DropdownMenuItem
            onSelect={(e) => e.preventDefault()}
            className="border-2 border-transparent px-3 py-2 font-bold uppercase tracking-[0.12em] text-[#0a0a0a] focus:border-[#1a3a6b] focus:bg-[#1a3a6b] focus:text-[#f5f0e8] dark:text-[#f5f0e8] dark:focus:border-[#f7b731] dark:focus:bg-[#f7b731] dark:focus:text-[#0a0a0a]"
            style={bauhausFont}
          >
            Rename
          </DropdownMenuItem>
        )}

        <DropdownMenuItem
          onSelect={copyInviteCode}
          className="border-2 border-transparent px-3 py-2 font-bold uppercase tracking-[0.12em] text-[#0a0a0a] focus:border-[#1a3a6b] focus:bg-[#1a3a6b] focus:text-[#f5f0e8] dark:text-[#f5f0e8] dark:focus:border-[#f7b731] dark:focus:bg-[#f7b731] dark:focus:text-[#0a0a0a]"
          style={bauhausFont}
        >
          Copy Invite Code
        </DropdownMenuItem>

        <DropdownMenuSeparator className="mx-0 my-1 h-[3px] bg-[#0a0a0a] dark:bg-[#f5f0e8]" />

        {isOwner ? (
          <ConfirmDialog
            title="Delete Board"
            description="This action cannot be undone. The board will be permanently deleted."
            triggerLabel="Delete Board"
            actionLabel="Delete"
            destructive
            onConfirm={() => onDelete(board.public_id)}
          />
        ) : (
          <ConfirmDialog
            title="Leave Board"
            description="You will lose access to this board."
            triggerLabel="Leave Board"
            actionLabel="Leave"
            destructive
            onConfirm={() => onLeave(board.public_id)}
          />
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
