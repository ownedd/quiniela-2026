import { SignIn } from "@clerk/nextjs";

export default function Login() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] animate-slide-up gap-4 px-4">
      <p className="text-center text-sm text-gray-400">Inicia sesión para continuar</p>

      <SignIn
        routing="hash"
        fallbackRedirectUrl="/"
        appearance={{
          variables: {
            colorPrimary: "#d4a843",
            colorBackground: "transparent",
            colorText: "#e8e6e1",
            colorTextSecondary: "#9ca3af",
            colorInputBackground: "rgba(255, 255, 255, 0.04)",
            colorInputText: "#e8e6e1",
            colorNeutral: "#e8e6e1",
            colorDanger: "#ef4444",
            borderRadius: "0.75rem",
            fontFamily: "var(--font-body), system-ui, sans-serif",
          },
          elements: {
            rootBox: "w-full max-w-sm",
            cardBox: "shadow-none",
            card:
              "bg-[rgba(255,255,255,0.04)] backdrop-blur-md border border-[rgba(212,168,67,0.12)] border-t-2 border-t-[#d4a843] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4),0_-4px_20px_rgba(212,168,67,0.06)]",
            headerTitle: "hidden",
            headerSubtitle: "hidden",
            logoBox: "hidden",
            socialButtonsBlockButton:
              "bg-white/[0.04] border border-white/10 hover:bg-white/[0.07] hover:border-[rgba(212,168,67,0.4)] text-white transition-colors",
            socialButtonsBlockButtonText: "text-white font-medium",
            socialButtonsProviderIcon:
              "size-4 shrink-0 bg-center bg-contain bg-no-repeat text-transparent",
            socialButtonsProviderIcon__google: {
              backgroundImage: "url('/google.svg')",
              content: "url('/google.svg')",
            },
            dividerLine: "bg-white/10",
            dividerText: "text-gray-500 uppercase text-xs tracking-wider",
            formFieldLabel: "text-gray-300 font-medium text-sm",
            formFieldInput:
              "bg-white/[0.04] border border-white/10 text-white placeholder:text-gray-500 focus:border-[#d4a843] focus:ring-1 focus:ring-[#d4a843]/40",
            formFieldInputShowPasswordButton: "text-gray-400 hover:text-[#d4a843]",
            formButtonPrimary:
              "bg-gradient-to-br from-[#d4a843] to-[#a07c2e] hover:brightness-110 text-[#0a0a0a] font-bold shadow-lg shadow-[#d4a843]/20 normal-case tracking-normal",
            footer:
              "bg-transparent border-t border-white/5 [&>div]:bg-transparent",
            footerAction: "bg-transparent",
            footerActionText: "text-gray-400",
            footerActionLink: "text-[#d4a843] hover:text-[#f0d078] font-semibold",
            identityPreviewEditButton: "text-[#d4a843] hover:text-[#f0d078]",
            identityPreviewText: "text-gray-300",
            badge: "bg-[#d4a843]/15 text-[#d4a843] border border-[#d4a843]/30",
            formFieldAction: "text-[#d4a843] hover:text-[#f0d078]",
            alert: "bg-red-500/10 border border-red-500/30 text-red-300",
          },
        }}
      />

      <p className="text-center text-xs text-gray-500 max-w-sm">
        Al ingresar, aceptas los términos y condiciones de la quiniela.
      </p>
    </div>
  );
}
