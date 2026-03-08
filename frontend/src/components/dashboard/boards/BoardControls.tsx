import { useState } from "react";
import { createBoard, joinBoard } from "../../../api/board";
import type { ControlProps } from "../../../types/board";

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
   <div className="flex gap-3">

  <Dialog open={createOpen} onOpenChange={setCreateOpen}>
    <DialogTrigger asChild>
      <Button onClick={() => setCreateOpen(true)}>
        Create Board
      </Button>
    </DialogTrigger>

    <DialogContent
      className="
      bg-white dark:bg-neutral-800
      border border-blue-200 dark:border-gray-700
      "
    >
      <DialogHeader>
        <DialogTitle className="text-gray-900 dark:text-gray-100">
          Create Board
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-4">
        <div>
          <Label className="mb-2 text-gray-700 dark:text-gray-300">
            Board Name
          </Label>

          <Input
            value={newBoardName}
            onChange={(e) => setNewBoardName(e.target.value)}
            placeholder="Project Roadmap"
            className="
              bg-white dark:bg-neutral-700
              border-gray-200 dark:border-gray-600
              text-gray-900 dark:text-gray-100
              placeholder:text-gray-400
            "
          />
        </div>

        <Button onClick={handleCreateBoard} className="w-full">
          Create
        </Button>
      </div>
    </DialogContent>
  </Dialog>


  <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
    <DialogTrigger asChild>
      <Button variant="secondary" onClick={() => setJoinOpen(true)}>
        Join Board
      </Button>
    </DialogTrigger>

    <DialogContent
      className="
      bg-white dark:bg-neutral-800
      border border-purple-800 dark:border-gray-700
      "
    >
      <DialogHeader>
        <DialogTitle className="text-gray-900 dark:text-gray-100">
          Join Board
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-4">
        <div>
          <Label className="mb-2 text-gray-700 dark:text-gray-300">
            Invite Code
          </Label>

          <Input
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            placeholder="Enter invite code"
            className="
              bg-white dark:bg-neutral-700
              border-gray-200 dark:border-gray-600
              text-gray-900 dark:text-gray-100
              placeholder:text-gray-400
            "
          />
        </div>

        <Button onClick={handleJoinBoard} className="w-full">
          Join
        </Button>
      </div>
    </DialogContent>
  </Dialog>

</div>
  );
}
