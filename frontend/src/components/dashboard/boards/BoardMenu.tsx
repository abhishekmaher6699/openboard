import { MoreVertical } from "lucide-react";
import { useState } from "react";
import { Button } from "../../ui/button";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "../../ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";

import ConfirmDialog from "../../ui/ConfirmDialog";
import type {BoardMenuProps } from "../../../types/dashboard";
import { toast } from "sonner";
import { bauhausFont } from "../dashboardTheme";
import { approveJoinRequest, rejectJoinRequest } from "../../../api/board";

export default function BoardMenu({
  board,
  currentUserId,
  onDelete,
  onLeave,
  onBoardUpdated,
}: BoardMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [requestsOpen, setRequestsOpen] = useState(false);
  const [busyUserId, setBusyUserId] = useState<number | null>(null);

  const isOwner =
    currentUserId !== null && board.owner && board.owner.id === currentUserId;

  const menuItemClass =
    "rounded-lg border border-transparent px-3 py-2 font-bold uppercase tracking-[0.12em] text-[#0a0a0a] focus:border-[#1a3a6b] focus:bg-[#1a3a6b] focus:text-[#f5f0e8] dark:text-[#f5f0e8] dark:focus:border-white dark:focus:bg-white dark:focus:text-[#0a0a0a]";

  const copyInviteCode = () => {
    navigator.clipboard.writeText(board.invite_code);
    toast.info("Invite code copied to clipboard!");
  };

  const handleApprove = async (userId: number) => {
    try {
      setBusyUserId(userId);
      const updatedBoard = await approveJoinRequest(board.public_id, userId);
      onBoardUpdated(updatedBoard);
      toast.success("Join request approved.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to approve join request.",
      );
    } finally {
      setBusyUserId(null);
    }
  };

  const handleReject = async (userId: number) => {
    try {
      setBusyUserId(userId);
      const updatedBoard = await rejectJoinRequest(board.public_id, userId);
      onBoardUpdated(updatedBoard);
      toast.success("Join request rejected.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to reject join request.",
      );
    } finally {
      setBusyUserId(null);
    }
  };

  const openRequestsDialog = () => {
    setMenuOpen(false);
    setRequestsOpen(true);
  };

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="rounded-xl border border-[#0a0a0a] bg-transparent text-[#0a0a0a] shadow-[2px_2px_0px_#0a0a0a] hover:bg-[#f7b731] hover:text-[#0a0a0a] dark:border-[#f5f0e8] dark:text-[#f5f0e8] dark:shadow-[2px_2px_0px_white] dark:hover:bg-white dark:hover:text-[#0a0a0a]"
          >
            <MoreVertical size={16} />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="rounded-xl border-2 border-[#0a0a0a] bg-[#f5f0e8] p-1.5 shadow-[4px_4px_0px_#0a0a0a] dark:border-[#f5f0e8] dark:bg-[#1e1e1e] dark:shadow-[4px_4px_0px_white]"
        >
          {isOwner && (
            <DropdownMenuItem
              onSelect={(e) => e.preventDefault()}
              className={menuItemClass}
              style={bauhausFont}
            >
              Rename
            </DropdownMenuItem>
          )}

          {isOwner && (
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                openRequestsDialog();
              }}
              className={menuItemClass}
              style={bauhausFont}
            >
              Join Requests ({board.pending_request_count})
            </DropdownMenuItem>
          )}

          <DropdownMenuItem
            onSelect={copyInviteCode}
            className={menuItemClass}
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

      <Dialog open={requestsOpen} onOpenChange={setRequestsOpen}>
        <DialogContent
          className="border-0 rounded-xl border-[#0a0a0a] bg-[#f5f0e8] p-0 shadow-[4px_4px_0px_#0a0a0a] dark:border-[#f5f0e8] dark:bg-[#1e1e1e] dark:shadow-[4px_4px_0px_white]"
          onInteractOutside={() => setRequestsOpen(false)}
        >
          <div
            className="h-2 w-full rounded-t-xl"
            style={{
              background:
                "repeating-linear-gradient(90deg,#d62828 0,#d62828 60px,#f7b731 60px,#f7b731 120px,#1a3a6b 120px,#1a3a6b 180px,#0a0a0a 180px,#0a0a0a 240px)",
            }}
          />
          <div className="px-4 pb-4 pt-4 sm:px-5">
            <DialogHeader className="border-b-2 border-[#d62828] pb-3">
              <DialogTitle
                className="text-[1.2rem] font-black uppercase tracking-[0.1em] text-[#0a0a0a] dark:text-[#f5f0e8]"
                style={bauhausFont}
              >
                Join Requests
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 pt-4">
              {board.pending_requests.length ? (
                board.pending_requests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-[#0a0a0a] px-3 py-3 dark:border-[#f5f0e8]"
                  >
                    <div>
                      <p
                        className="text-sm font-bold uppercase tracking-[0.08em] text-[#0a0a0a] dark:text-[#f5f0e8]"
                        style={bauhausFont}
                      >
                        {request.user.username}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        disabled={busyUserId === request.user.id}
                        onClick={() => handleApprove(request.user.id)}
                        className="border-2 border-[#0a0a0a] bg-[#1a3a6b] px-3 py-2 text-xs font-bold uppercase tracking-[0.1em] text-[#f5f0e8] hover:bg-[#15315a]"
                        style={bauhausFont}
                      >
                        Approve
                      </Button>
                      <Button
                        type="button"
                        disabled={busyUserId === request.user.id}
                        onClick={() => handleReject(request.user.id)}
                        className="border-2 border-[#0a0a0a] bg-[#d62828] px-3 py-2 text-xs font-bold uppercase tracking-[0.1em] text-[#f5f0e8] hover:bg-[#b61f1f]"
                        style={bauhausFont}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[#4f4a42] dark:text-[#c8c0b0]">
                  No pending join requests.
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
