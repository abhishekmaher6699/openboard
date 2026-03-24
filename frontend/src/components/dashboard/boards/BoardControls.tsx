import { useState } from "react";
import { createBoard, joinBoard } from "../../../api/board";
import type { ControlProps } from "../../../types/dashboard";

import { Button } from "../../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../components/ui/dialog";

import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { toast } from "sonner";
import {
  actionClass,
  bauhausFont,
  inputClass,
  secondaryActionClass,
} from "../dashboardTheme";

export default function BoardControls({ onBoardAdded }: ControlProps) {
  const [newBoardName, setNewBoardName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  const handleCreateBoard = async () => {
    if (!newBoardName.trim()) return;
    try {
      const board = await createBoard(newBoardName);
      onBoardAdded(board);
      setNewBoardName("");
      setCreateOpen(false);
      toast.success("Board created successfully!");
    } catch (err) {
      console.log("Create board failed", err);
      toast.error("Failed to create board.");
    }
  };

  const handleJoinBoard = async () => {
    if (!inviteCode.trim()) return;

    try {
      const board = await joinBoard(inviteCode);
      onBoardAdded(board);
      setInviteCode("");
      setJoinOpen(false);
      toast.success("Joined board successfully!");
    } catch (err) {
      console.error("Join board failed", err);
      toast.error("Failed to join board. Check your invite code.");
    }
  };

  return (
    <div className="flex flex-wrap gap-2.5">
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogTrigger asChild>
          <Button
            onClick={() => setCreateOpen(true)}
            className={`${secondaryActionClass} bg:[#ff0000] dark:bg-[#3c00ff] dark:border-[#3c00ff]`}
            style={bauhausFont}
          >
            Create Board
          </Button>
        </DialogTrigger>

        <DialogContent className="border-0 rounded-xl border-[#0a0a0a] bg-[#f5f0e8] p-0 shadow-[4px_4px_0px_#0a0a0a] dark:border-[#f5f0e8] dark:bg-[#1e1e1e] dark:shadow-[4px_4px_0px]">
          <div
            className="h-2 w-full rounded-t-xl"
            style={{
              background:
                "repeating-linear-gradient(90deg,#d62828 0,#d62828 60px,#f7b731 60px,#f7b731 120px,#1a3a6b 120px,#1a3a6b 180px,#0a0a0a 180px,#0a0a0a 240px)",
            }}
          />
          <div className="px-4 pb-4 pt-4 sm:px-5">
            <DialogHeader className="border-b-2 border-[#1a3a6b] pb-3">
              <DialogTitle
                className="text-[1.2rem] font-black uppercase tracking-widest text-[#0a0a0a] dark:text-[#f5f0e8]"
                style={bauhausFont}
              >
                Create Board
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 pt-4">
              <div>
                <Label
                  className="mb-2 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#0a0a0a] dark:text-[#f5f0e8]"
                  style={bauhausFont}
                >
                  Board Name
                </Label>

                <Input
                  value={newBoardName}
                  onChange={(e) => setNewBoardName(e.target.value)}
                  placeholder="Project Roadmap"
                  className={inputClass}
                />
              </div>

              <Button
                onClick={handleCreateBoard}
                className={`w-full ${actionClass}`}
                style={bauhausFont}
              >
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
        <DialogTrigger asChild>
          <Button
            variant="secondary"
            onClick={() => setJoinOpen(true)}
            className={secondaryActionClass}
            style={bauhausFont}
          >
            Join Board
          </Button>
        </DialogTrigger>

        <DialogContent className="border-0 border-[#0a0a0a] bg-[#f5f0e8] p-0 shadow-[4px_4px_0px_#0a0a0a] dark:border-[#f5f0e8] dark:bg-[#1e1e1e] dark:shadow-[4px_4px_0px_white]">
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
                Join Board
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 pt-4">
              <div>
                <Label
                  className="mb-2 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#0a0a0a] dark:text-[#f5f0e8]"
                  style={bauhausFont}
                >
                  Invite Code
                </Label>

                <Input
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="Enter invite code"
                  className={inputClass}
                />
              </div>

              <Button
                onClick={handleJoinBoard}
                className={`w-full ${secondaryActionClass}`}
                style={bauhausFont}
              >
                Join
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
