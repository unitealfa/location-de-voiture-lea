const defaultContent = {
  brand: {
    name: "Mon Location Lea",
    logoText: "LEA"
  },
  header: {
    accountLabel: "Mon compte",
    loginLabel: "Se connecter",
    connectedLabel: "Connecte",
    closeButtonLabel: "Fermer la fenetre",
    profileLabel: "Profile",
    logoutLabel: "Se deconnecter",
    navigationItems: [
      {
        label: "Commencer",
        path: "/commencer"
      },
      {
        label: "LOCATION DE VOITURES",
        path: "/location-de-voitures"
      },
      {
        label: "CONTACT",
        path: "/contact"
      },
      {
        label: "Foire aux questions",
        path: "/foire-aux-questions"
      }
    ]
  },
  aceulle: {
    eyebrow: "Page d'accueil",
    title: "Liste des voitures et tout",
    description:
      "Cette zone centrale est deja separee pour recevoir plus tard un contenu gere par l'administration."
  },
  adminLogin: {
    eyebrow: "Espace admin",
    title: "Connexion administrateur",
    description:
      "Cette page prepare le futur acces admin. Le formulaire est deja en place pour la suite.",
    loginLabel: "Email ou nom d'utilisateur",
    loginPlaceholder: "exemple@gmail.com",
    passwordLabel: "Mot de passe",
    passwordPlaceholder: "Entrez votre mot de passe",
    submitLabel: "Se connecter",
    backLabel: "Retour a l'accueil",
    successMessage: "Connexion admin reussie.",
    errorMessage: "Identifiants invalides."
  },
  adminAceulle: {
    eyebrow: "Tableau de bord",
    titlePrefix: "Bienvenue",
    description:
      "Cet accueil admin est pret pour recevoir les futures fonctions de gestion du site."
  },
  adminProfile: {
    eyebrow: "Profile admin",
    title: "Modifier le profile",
    description:
      "Vous pouvez modifier le nom d'utilisateur, l'email et le mot de passe depuis cette page securisee.",
    profileSectionTitle: "Modifier les informations",
    profileUsernameLabel: "Nom d'utilisateur",
    profileEmailLabel: "Email",
    profileSubmitLabel: "Enregistrer le profile",
    passwordSectionTitle: "Modifier le mot de passe",
    passwordSectionDescription:
      "Selectionnez seulement le mot de passe actuelle et le nouveau mot de passe pour recevoir un code de verification.",
    currentPasswordLabel: "Mot de passe actuelle",
    currentPasswordPlaceholder: "Entrez le mot de passe actuelle",
    newPasswordLabel: "Nouveau mot de passe",
    newPasswordPlaceholder: "Entrez le nouveau mot de passe",
    passwordSubmitLabel: "Modifier le mot de passe",
    verificationTitle: "Modifier le mot de passe",
    verificationDescriptionPrefix: "Entrez le code envoye a",
    verificationCodeLabel: "Code de verification",
    verificationCodePlaceholder: "000000",
    verificationConfirmLabel: "Confirmer",
    verificationResendLabel: "Renvoyer",
    verificationCancelLabel: "Annuler",
    verificationExpiredLabel: "Le code a expire. Vous pouvez le renvoyer.",
    backLabel: "Retour au tableau de bord"
  },
  publicPages: {
    commencer: {
      title: "Commencer"
    },
    locationDeVoitures: {
      title: "LOCATION DE VOITURES"
    },
    contact: {
      title: "CONTACT"
    },
    foireAuxQuestions: {
      title: "Foire aux questions"
    }
  },
  vehicles: {
    eyebrow: "Catalogue",
    title: "LOCATION DE VOITURES",
    emptyTitle: "Aucun vehicule disponible",
    listDescription:
      "Retrouvez les vehicules disponibles avec leurs informations essentielles et leurs tarifs.",
    emptyDescription:
      "Aucun vehicule n'est visible pour le moment. Revenez plus tard pour voir les prochaines disponibilites.",
    adminDescription:
      "Depuis cette page, l'admin peut creer, modifier, masquer et supprimer les vehicules.",
    createLabel: "+ Ajouter un vehicule",
    createTitle: "Creer un vehicule",
    editTitle: "Modifier le vehicule",
    createDescription:
      "Ajoutez un vehicule avec toutes les informations necessaires pour l'afficher dans le catalogue.",
    editDescription:
      "Mettez a jour les informations du vehicule et sa disponibilite.",
    globalPricingTitle: "Description du prix",
    globalPricingDescription:
      "Les prix affiches sont indicatifs et peuvent varier selon la periode de l'annee. Notre equipe vous confirmera le prix final par e-mail, telephone ou WhatsApp lors de votre demande de reservation.",
    globalConditionsTitle: "Conditions de location",
    globalConditionsDescription:
      "Les conditions de location s'appliquent a l'ensemble du catalogue et vous seront confirmees lors de votre demande de reservation.",
    createSubmitLabel: "Creer le vehicule",
    editSubmitLabel: "Enregistrer les modifications",
    backToListLabel: "Retour a la liste",
    backToVehicleLabel: "Retour au vehicule",
    loadErrorMessage: "Impossible de charger les vehicules.",
    detailErrorMessage: "Impossible de charger ce vehicule.",
    createErrorMessage: "Creation du vehicule impossible.",
    updateErrorMessage: "Modification du vehicule impossible.",
    deleteErrorMessage: "Suppression du vehicule impossible.",
    maintenanceErrorMessage: "Passage en maintenance impossible.",
    availableErrorMessage: "Remise du vehicule en disponibilite impossible.",
    notFoundMessage: "Ce vehicule est introuvable.",
    deleteConfirmMessage: "Voulez-vous supprimer ce vehicule ?",
    maintenanceConfirmMessage:
      "Voulez-vous masquer ce vehicule pour les visiteurs et le passer en maintenance ?",
    detailActionLabel: "Voir les details",
    pricePerDaySuffix: "/ jour",
    seatsSuffix: "places",
    maintenanceBadge: "Maintenance",
    maintenanceDescription:
      "Ce vehicule est actuellement masque pour les visiteurs et visible uniquement par l'administration.",
    adminEditLabel: "Modifier",
    adminDeleteLabel: "Supprimer",
    adminMaintenanceLabel: "Mettre en maintenance",
    adminMaintenanceDoneLabel: "Retirer de maintenance",
    adminAvailabilityLabel: "Disponibilite",
    availabilityAvailableLabel: "Disponible",
    availabilityMaintenanceLabel: "Maintenance",
    pricingSectionTitle: "Tarifs",
    informationSectionTitle: "Informations",
    photosSectionTitle: "Photos du vehicule",
    videoSectionTitle: "Video du vehicule",
    noVideoLabel: "Aucune video ajoutee.",
    brandLabel: "Marque",
    modelLabel: "Modele",
    versionLabel: "Version",
    fuelTypeLabel: "Carburant",
    transmissionLabel: "Boite de vitesse",
    fuelTypeOptions: ["Essence", "Diesel", "GPL"],
    transmissionOptions: ["Automatique", "Manuelle"],
    seatsLabel: "Nombre de places",
    convertibleLabel: "Cabriolet",
    horsepowerLabel: "Puissance (HP)",
    dailyPriceLabel: "Prix journalier",
    weeklyPriceLabel: "Prix hebdomadaire",
    monthlyPriceLabel: "Prix mensuel",
    securityDepositLabel: "Depot de garantie",
    includedKmPerDayLabel: "Kilometrage autorise par jour",
    extraKmPriceLabel: "Prix des kilometres supplementaires",
    videoUrlLabel: "Video du vehicule (facultative)",
    photoUrlsLabel: "Photos du vehicule",
    yesLabel: "Oui",
    noLabel: "Non"
  },
  footer: {
    phoneLabel: "Numero de tel",
    phoneValue: "+213 555 00 00 00",
    locationLabel: "Localisation",
    locationValue: "Algerie",
    brandLabel: "Nom",
    brandValue: "Mon Location Lea"
  }
};

module.exports = defaultContent;
