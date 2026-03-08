import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card"

type AuthCardProps = {
  title: string
  children: React.ReactNode
}

const AuthCard = ({ title, children }: AuthCardProps) => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-sm shadow-lg border">
        <CardHeader className="text-center space-y-1">
          <CardTitle className="text-2xl font-semibold tracking-tight">
            {title}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {children}
        </CardContent>
      </Card>
    </div>
  )
}

export default AuthCard