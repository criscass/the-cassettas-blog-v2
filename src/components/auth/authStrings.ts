// UI strings for the auth forms, keyed by locale. Kept separate so both the
// React islands and the Astro pages (titles/links) can share them.
export type AuthLang = "it" | "en";

export const AUTH_STRINGS = {
  it: {
    signInTitle: "Accedi",
    signUpTitle: "Registrati",
    name: "Nome",
    email: "Email",
    password: "Password",
    signInButton: "Accedi",
    signUpButton: "Crea account",
    googleButton: "Continua con Google",
    or: "oppure",
    noAccount: "Non hai un account?",
    haveAccount: "Hai già un account?",
    signUpLink: "Registrati",
    signInLink: "Accedi",
    signOutButton: "Esci",
    adminSectionLabel: "Admin",
    adminUsersLink: "Approva utenti",
    adminCmsLink: "Scrivi post (CMS)",
    pendingHeading: "Account creato",
    pendingBody:
      "Il tuo account è in attesa di approvazione da parte di un amministratore. Riceverai accesso una volta approvato.",
    genericError: "Qualcosa è andato storto. Riprova.",
    submitting: "Attendere…",
  },
  en: {
    signInTitle: "Sign in",
    signUpTitle: "Sign up",
    name: "Name",
    email: "Email",
    password: "Password",
    signInButton: "Sign in",
    signUpButton: "Create account",
    googleButton: "Continue with Google",
    or: "or",
    noAccount: "Don't have an account?",
    haveAccount: "Already have an account?",
    signUpLink: "Sign up",
    signInLink: "Sign in",
    signOutButton: "Sign out",
    adminSectionLabel: "Admin",
    adminUsersLink: "Approve users",
    adminCmsLink: "Write posts (CMS)",
    pendingHeading: "Account created",
    pendingBody:
      "Your account is awaiting admin approval. You'll be able to sign in once it's approved.",
    genericError: "Something went wrong. Please try again.",
    submitting: "Please wait…",
  },
} as const;
