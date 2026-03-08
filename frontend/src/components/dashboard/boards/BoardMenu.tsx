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
import type {BoardMenuProps } from "../../../types/board";
import { toast } from "sonner";

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
        <Button size="icon" variant="ghost">
          <MoreVertical size={16} />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        {isOwner && (
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            Rename
          </DropdownMenuItem>
        )}

        <DropdownMenuItem onSelect={copyInviteCode}>
          Copy Invite Code
        </DropdownMenuItem>

        <DropdownMenuSeparator />

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
