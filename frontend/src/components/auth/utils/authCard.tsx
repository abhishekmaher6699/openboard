type AuthCardProps = {
  title: string
  children: React.ReactNode
}

const AuthCard = ({ title, children }: AuthCardProps) => {
  return (
    <div
      className="min-h-screen bg-[#f5f0e8] flex items-center justify-center px-4 relative overflow-hidden"
      style={{
        backgroundImage:
          "linear-gradient(rgba(10,10,10,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(10,10,10,0.04) 1px,transparent 1px)",
        backgroundSize: "40px 40px",
      }}
    >
      {/* Decorative geometry */}
      <div className="fixed -top-40 -right-40 w-[500px] h-[500px] rounded-full border-[28px] border-[#1a3a6b] opacity-10 pointer-events-none" />
      <div className="fixed bottom-20 left-0 w-[35%] h-2 bg-[#d62828] pointer-events-none" />
      <div className="fixed bottom-0 left-28 w-2 h-[40%] bg-[#f7b731] pointer-events-none" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm border-[3px] border-[#0a0a0a] bg-[#f5f0e8] shadow-[8px_8px_0px_#0a0a0a] dark:bg-[#1e1e1e] dark:border-[#f5f0e8] dark:shadow-[8px_8px_0px_#f7b731]">

        {/* Tricolour stripe */}
        <div
          className="h-2.5 w-full"
          style={{
            background:
              "repeating-linear-gradient(90deg,#d62828 0,#d62828 60px,#f7b731 60px,#f7b731 120px,#1a3a6b 120px,#1a3a6b 180px,#0a0a0a 180px,#0a0a0a 240px)",
          }}
        />

        {/* Header */}
        <div className="px-8 pt-7">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-4 h-4 bg-[#f7b731] border-2 border-[#0a0a0a] rotate-45 shrink-0" />
            <h1
              className="font-black text-[1.9rem] tracking-widest uppercase leading-none text-[#0a0a0a] dark:text-[#f5f0e8]"
              style={{ fontFamily: "'Barlow Condensed','Arial Narrow',sans-serif" }}
            >
              {title}
            </h1>
          </div>
          <div className="h-[3px] bg-[#1a3a6b] dark:bg-[#f7b731]" />
        </div>

        {/* Body */}
        <div className="px-8 py-7">{children}</div>
      </div>
    </div>
  )
}

export default AuthCard