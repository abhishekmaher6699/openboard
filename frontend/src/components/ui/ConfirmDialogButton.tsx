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
import { actionClass, bauhausFont, secondaryActionClass } from "../dashboard/dashboardTheme"

type Props = {
  title: string
  description: string
  actionLabel: string
  trigger: React.ReactNode
  onConfirm: () => void
}

export default function ConfirmDialogButton({
  title,
  description,
  actionLabel,
  trigger,
  onConfirm,
}: Props) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {trigger}
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
