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
  onTriggerSelect?: () => void
}

export default function ConfirmDialog({
  title,
  description,
  actionLabel,
  triggerLabel,
  onConfirm,
  destructive = false,
  onTriggerSelect,
}: Props) {
  const triggerClass = `rounded-lg border border-transparent px-3 py-2 font-bold uppercase tracking-[0.12em] focus:bg-[#1a3a6b] focus:text-[#f5f0e8] dark:focus:bg-white dark:focus:text-[#0a0a0a] ${destructive ? "text-[#d62828] focus:border-[#d62828] dark:focus:border-white" : "text-[#0a0a0a] focus:border-[#1a3a6b] dark:text-[#f5f0e8] dark:focus:border-white"}`;

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <DropdownMenuItem
          className={triggerClass}
          onSelect={(e) => e.preventDefault()}
          onClick={onTriggerSelect}
          style={bauhausFont}
        >
          {triggerLabel}
        </DropdownMenuItem>
      </AlertDialogTrigger>

      <AlertDialogContent className="border-0 rounded-xl border-[#0a0a0a] bg-[#f5f0e8] p-0 shadow-[4px_4px_0px_#0a0a0a] dark:border-[#f5f0e8] dark:bg-[#1e1e1e] dark:shadow-[4px_4px_0px_white]">
        <div
          className="h-2 w-full rounded-t-xl"
          style={{
            background:
              "repeating-linear-gradient(90deg,#d62828 0,#d62828 60px,#f7b731 60px,#f7b731 120px,#1a3a6b 120px,#1a3a6b 180px,#0a0a0a 180px,#0a0a0a 240px)",
          }}
        />
        <div className="px-4 pb-4 pt-4 sm:px-5">
          <AlertDialogHeader className="border-b-2 border-[#d62828] pb-3">
            <AlertDialogTitle className="text-[1.2rem] font-black uppercase tracking-[0.1em] text-[#0a0a0a] dark:text-[#f5f0e8]" style={bauhausFont}>
              {title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-[#4f4a42] dark:text-[#c8c0b0]">
              {description}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="pt-4">
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
