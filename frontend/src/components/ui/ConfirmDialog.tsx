import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "./alert-dialog"

import { DropdownMenuItem } from "./dropdown-menu"

type Props = {
  title: string
  description: string
  actionLabel: string
  triggerLabel: string
  onConfirm: () => void
  destructive?: boolean
}

export default function ConfirmDialog({
  title,
  description,
  actionLabel,
  triggerLabel,
  onConfirm,
  destructive = false
}: Props) {

  return (
    <AlertDialog>

      <AlertDialogTrigger asChild>

        <DropdownMenuItem
          className={destructive ? "text-red-500" : ""}
          onSelect={(e) => e.preventDefault()}
        >
          {triggerLabel}
        </DropdownMenuItem>

      </AlertDialogTrigger>

      <AlertDialogContent>

        <AlertDialogHeader>

          <AlertDialogTitle>
            {title}
          </AlertDialogTitle>

          <AlertDialogDescription>
            {description}
          </AlertDialogDescription>

        </AlertDialogHeader>

        <AlertDialogFooter>

          <AlertDialogCancel variant="outline" size="default">
            Cancel
          </AlertDialogCancel>

          <AlertDialogAction
            variant="default" size="default"
            onClick={onConfirm}
            className="bg-red-500 hover:bg-red-600 text-white" 
          >
            {actionLabel}
          </AlertDialogAction>

        </AlertDialogFooter>

      </AlertDialogContent>

    </AlertDialog>
  )
}