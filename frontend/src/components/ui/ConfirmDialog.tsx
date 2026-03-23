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
import { actionClass, bauhausFont, secondaryActionClass } from "../dashboard/dashboardTheme"

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
          className={`border-2 border-transparent px-3 py-2 font-bold uppercase tracking-[0.12em] focus:bg-[#1a3a6b] focus:text-[#f5f0e8] dark:focus:bg-[#f7b731] dark:focus:text-[#0a0a0a] ${destructive ? "text-[#d62828] focus:border-[#d62828]" : "text-[#0a0a0a] focus:border-[#1a3a6b] dark:text-[#f5f0e8] dark:focus:border-[#f7b731]"}`}
          onSelect={(e) => e.preventDefault()}
          style={bauhausFont}
        >
          {triggerLabel}
        </DropdownMenuItem>
      </AlertDialogTrigger>

      <AlertDialogContent className="border-[3px] border-[#0a0a0a] bg-[#f5f0e8] p-0 shadow-[8px_8px_0px_#0a0a0a] dark:border-[#f5f0e8] dark:bg-[#1e1e1e] dark:shadow-[8px_8px_0px_#f7b731]">
        <div className="h-2.5 w-full bg-[#d62828]" />
        <div className="px-6 pb-6 pt-5">
          <AlertDialogHeader className="border-b-[3px] border-[#0a0a0a] pb-4 dark:border-[#f5f0e8]">
            <AlertDialogTitle className="text-[1.65rem] font-black uppercase tracking-[0.12em] text-[#0a0a0a] dark:text-[#f5f0e8]" style={bauhausFont}>
              {title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[0.95rem] text-[#4f4a42] dark:text-[#c8c0b0]">
              {description}
            </AlertDialogDescription>
        </AlertDialogHeader>

          <AlertDialogFooter className="pt-5">
            <AlertDialogCancel variant="outline" size="default" className={secondaryActionClass} style={bauhausFont}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="default"
              size="default"
              onClick={onConfirm}
              className={actionClass}
              style={bauhausFont}
            >
              {actionLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
