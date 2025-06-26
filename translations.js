const enTranslations = {
  "Mon profil": "My Profile",
  "Notifications": "Notifications",
  "Messages": "Messages",
  "Activé": "Enabled",
  "Désactivé": "Disabled",
  "Gérer les messages": "Manage Messages",
  "Activer": "Enable",
  "Désactiver": "Disable",
  "Annuler": "Cancel",
  "Thème": "Theme",
  "Choisir le thème": "Choose Theme",
  "Clair": "Light",
  "Sombre": "Dark",
  "Langue": "Language",
  "Choisir la langue": "Choose Language",
  "Français": "French",
  "Anglais": "English",
  "Support & Information": "Support & Information",
  "Centre d'aide": "Help Center",
  "Mentions Légales": "Legal Notice",
  "Déconnexion": "Logout",
  "Erreur fetch profile": "Error fetching profile",
  "Erreur update profile": "Error updating profile",
  "Erreur lors de la déconnexion": "Error during logout",
  "Annonces": "Listings",
  "Suivi livraison": "Tracking Delivery",
  "Messages": "Messages",
  "Profil": "Profile"
};

export default enTranslations;

// translations.js (suite)
export function translate(text, lang) {
  if (lang === 'en') {
    return enTranslations[text] || text;  // si pas de traduction, affiche le texte original (français)
  }
  return text;  // si langue française, affiche le texte en dur
}
