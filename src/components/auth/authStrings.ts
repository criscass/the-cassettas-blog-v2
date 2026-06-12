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
    introGoogleRequired:
      "Anche per registrarti con Google devi prima raccontarci come ci conosciamo, nel campo qui sopra.",
    googleModeHelp:
      "Ti stai registrando con Google: l'email e la password non servono. Dicci solo come ti chiami e come ci conosciamo.",
    useEmailInstead: "Preferisci registrarti con email e password?",
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
      "Ti abbiamo inviato un'email con un link per verificare il tuo indirizzo. Dopo la verifica, il tuo account resta in attesa di approvazione da parte di un amministratore.",
    verifiedNotice:
      "Email verificata! Potrai accedere non appena il tuo account sarà approvato da un amministratore.",
    errAccountPending:
      "Il tuo account è in attesa di approvazione da parte di un amministratore.",
    errAccountRejected: "Il tuo account non è stato approvato.",
    errEmailNotVerified:
      "Devi prima verificare la tua email. Ti abbiamo appena inviato un nuovo link — controlla la posta.",
    errVerifyLink:
      "Il link di verifica non è valido o è scaduto. Prova ad accedere per riceverne uno nuovo.",
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
    introGoogleRequired:
      "Signing up with Google also requires telling us how we know each other — fill in the field above first.",
    googleModeHelp:
      "You're signing up with Google: no email or password needed. Just tell us your name and how we know each other.",
    useEmailInstead: "Prefer signing up with email and password?",
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
      "We've emailed you a link to verify your address. After verifying, your account still awaits admin approval.",
    verifiedNotice:
      "Email verified! You'll be able to sign in as soon as an admin approves your account.",
    errAccountPending:
      "Your account is awaiting admin approval.",
    errAccountRejected: "Your account was not approved.",
    errEmailNotVerified:
      "Please verify your email first. We've just sent you a fresh link — check your inbox.",
    errVerifyLink:
      "That verification link is invalid or has expired. Try signing in to receive a new one.",
    genericError: "Something went wrong. Please try again.",
    submitting: "Please wait…",
    errRequired: "This field is required.",
    errEmail: "Please enter a valid email address.",
    errPasswordMin: "Password must be at least 8 characters.",
  },
} as const;
