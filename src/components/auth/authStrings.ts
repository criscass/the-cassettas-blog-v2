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
    introLabel: "Come ci conosciamo?",
    introHelp:
      "Per tenere lontano lo spam, questo blog è riservato ad amici e conoscenti. Scrivi due righe su chi sei e come ci conosciamo (o chi abbiamo in comune) — ci aiuta ad approvare il tuo account.",
    introPlaceholder: "Es. «Sono Maria, la cugina di Luca — ci siamo visti al matrimonio!»",
    introError:
      "Scrivi qualche parola in più su chi sei e come ci conosciamo.",
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
    errRequired: "Questo campo è obbligatorio.",
    errEmail: "Inserisci un indirizzo email valido.",
    errPasswordMin: "La password deve avere almeno 8 caratteri.",
  },
  en: {
    signInTitle: "Sign in",
    signUpTitle: "Sign up",
    name: "Name",
    email: "Email",
    password: "Password",
    introLabel: "How do we know each other?",
    introHelp:
      "To keep spam out, this blog is for friends and acquaintances only. Write a couple of lines about who you are and how we know each other (or who we know in common) — it helps us approve your account.",
    introPlaceholder: "E.g. “I'm Maria, Luca's cousin — we met at the wedding!”",
    introError:
      "Please write a few more words about who you are and how we know each other.",
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
    errRequired: "This field is required.",
    errEmail: "Please enter a valid email address.",
    errPasswordMin: "Password must be at least 8 characters.",
  },
} as const;
