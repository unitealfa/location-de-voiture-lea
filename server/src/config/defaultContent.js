const defaultContent = {
  brand: {
    name: "Mon Location Lea",
    logoText: "LEA",
    logoImagePath: "/home/rentzo-logo.jpg"
  },
  header: {
    accountLabel: "Mon compte",
    loginLabel: "Se connecter",
    connectedLabel: "Connecte",
    closeButtonLabel: "Fermer la fenetre",
    profileLabel: "Profile",
    logoutLabel: "Se deconnecter",
    dashboardLabel: "Dashboard",
    clientsLabel: "Clients",
    navigationItems: [
      {
        label: "ACCUEIL",
        path: "/"
      },
      {
        label: "LOCATION DE VOITURES",
        path: "/location-de-voitures"
      },
      {
        label: "Foire aux questions",
        path: "/foire-aux-questions"
      },
      {
        label: "CONTACT",
        path: "/contact"
      }
    ]
  },
  aceulle: {
    eyebrow: "EXCLUSIVITÉ RENTZO",
    title: "LOCATION DE VOITURES DE LUXE À ALGER",
    description:
      "Une page d'accueil premium inspiree du rendu Rentzo, avec vos vraies voitures, une navigation legere et un chargement optimise.",
    primaryActionLabel: "Voir les vehicules",
    secondaryActionLabel: "Nous contacter",
    introEyebrow: "ACCUEIL",
    introTitle:
      "Des vehicules reels, visibles rapidement, avec une presentation haut de gamme.",
    introDescription:
      "Retrouvez vos voitures disponibles avec un rendu premium, des informations claires et une navigation adaptee meme aux connexions lentes.",
    highlights: [
      "Catalogue rapide a charger",
      "Reservation simple depuis chaque vehicule",
      "Remise bureau ou aeroport"
    ],
    fleetEyebrow: "LOCATION DE VOITURES",
    fleetTitle: "Notre flotte de voitures de luxe à Alger",
    fleetDescription:
      "Decouvrez les vehicules actuellement visibles sur le site avec leur image principale, leur nom et leur prix journalier.",
    fleetLoadingLabel: "Chargement des vehicules...",
    fleetEmptyTitle: "Aucun vehicule disponible",
    fleetEmptyDescription:
      "Le catalogue public est vide pour le moment. Revenez plus tard pour voir les prochaines disponibilites.",
    fleetActionLabel: "Voir tout le catalogue",
    convertiblesTitle: "Découvrez nos cabriolets à louer !",
    convertiblesEmptyTitle: "Aucun cabriolet disponible",
    convertiblesEmptyDescription:
      "Aucun véhicule cabriolet n'est visible pour le moment. Revenez plus tard pour découvrir les prochaines disponibilités.",
    carHotelTitle: "HÔTEL DE VOITURES",
    carHotelDescription:
      "Chez RENTZO EXCLUSIVE, nous proposons un hébergement et des soins spécialisés pour votre véhicule, notamment pour les véhicules de luxe ou haut de gamme.",
    carHotelServicesTitle: "NOS SERVICES",
    carHotelServices: [
      "Sécurité et surveillance 24h/24",
      "Votre véhicule de luxe sera propre",
      "Nous maintenons le niveau de pression des pneus correct.",
      "État optimal de la batterie de la voiture en permanence"
    ],
    testimonialsTitle: "L'avis de nos clients",
    testimonialsHighlight: "La satisfaction",
    testimonialsTextLine1: "de nos clients",
    testimonialsTextLine2: "nous aide à nous améliorer constamment.",
    testimonialsItems: [
      {
        text:
          "Une expérience de luxe du début à la fin. J'ai loué une voiture sportive avec eux et tout a dépassé mes attentes. L'accueil a été excellent et très professionnel.",
        name: "Ana Costas Viñarás",
        title: "Client"
      },
      {
        text:
          "Service spectaculaire. Nous avons loué une Mercedes pendant une semaine et je n'ai que de bons mots pour l'équipe. Nous reviendrons.",
        name: "Javier Sánchez - Brunete",
        title: "Client"
      },
      {
        text: "Service excellent, traitement imbattable",
        name: "Estefanía Jimenez López",
        title: "Client"
      },
      {
        text: "Les meilleures voitures exclusives à louer en ville.",
        name: "Adelina Elena",
        title: "Client"
      },
      {
        text:
          "Service irréprochable, 100 %. Je ne peux pas mettre plus, mais pour moi c'est la meilleure adresse pour les voitures exclusives.",
        name: "Sonia Valero",
        title: "Client"
      }
    ]
  },
  adminLogin: {
    eyebrow: "Espace admin",
    title: "Connectez-vous à votre compte",
    description: "Bienvenue ! Connectez-vous à votre compte.",
    loginLabel: "Adresse e-mail ou nom d'utilisateur",
    loginPlaceholder: "Adresse e-mail ou nom d'utilisateur",
    passwordLabel: "Mot de passe",
    passwordPlaceholder: "Mot de passe",
    rememberLabel: "Souviens-toi",
    forgotPasswordLabel: "Mot de passe oublié ?",
    forgotPasswordUrl:
      "mailto:lea@gmail.com?subject=Mot%20de%20passe%20oubli%C3%A9",
    supportEmail: "lea@gmail.com",
    submitLabel: "Accéder",
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
  faqPage: {
    heroTitleStart: "Questions",
    heroTitleAccent: "fréquentes",
    heroSubtitle: "Nous répondrons à toutes vos questions",
    pageTitle: "Questions fréquentes",
    contactButtonLabel: "Contact",
    leftItems: [
      {
        question: "Quels documents dois-je fournir pour louer un véhicule haut de gamme ?",
        answer: "Une carte d'identité ou un passeport, un permis de conduire en cours de validité, ainsi qu'une carte de crédit pour la caution."
      },
      {
        question: "Quels types de véhicules proposez-vous ?",
        answer: "Citadines, compactes, SUV, sportives et véhicules haut de gamme."
      },
      {
        question: "Quel est l'âge minimum pour louer une voiture exclusive ?",
        answer: "25 ans minimum et au moins 4 ans d'expérience de conduite."
      },
      {
        question: "L'assurance est-elle incluse dans la location ?",
        answer: "Oui, tous les véhicules incluent une assurance tous risques avec franchise."
      },
      {
        question: "Puis-je demander la livraison et la récupération du véhicule ?",
        answer: "Oui, nous proposons la livraison et la reprise du véhicule dans toute la province."
      },
      {
        question: "Les conducteurs supplémentaires sont-ils autorisés ?",
        answer: "Oui, avec un coût supplémentaire. Consultez les conditions."
      }
    ],
    rightItems: [
      {
        question: "Comment réserver une voiture exclusive ?",
        answer: "Via le formulaire web, WhatsApp ou par e-mail."
      },
      {
        question: "Que se passe-t-il si je dois annuler ou modifier ma réservation ?",
        answer: "Cela entraîne un coût supplémentaire."
      },
      {
        question: "Puis-je louer une voiture pour seulement quelques heures ?",
        answer: "La durée minimale de location est d'une journée."
      },
      {
        question: "Avez-vous une assistance client 24h/24 et 7j/7 ?",
        answer: "Oui, via WhatsApp."
      },
      {
        question: "Puis-je restituer la voiture en dehors des horaires de bureau ?",
        answer: "Oui, avec un coût supplémentaire de 15 €."
      },
      {
        question: "Proposez-vous des extras comme chauffeur, champagne ou services spéciaux ?",
        answer: "Oui, nous disposons de notre propre flotte VTC pour proposer un service entièrement personnalisé."
      }
    ]
  },
  contactPage: {
    heroTitleStart: "Contactez",
    heroTitleAccent: "nous",
    heroSubtitle: "Nous serons ravis de vous repondre",
    pageTitle: "Contact",
    shortInfo: "✔︎ MON LOCATION LEA.\nLocation de voitures de luxe à ALGER.",
    socialTitle: "Suivez-nous",
    mapQuery: "Alger Centre, Alger, Algeria",
    formNamePlaceholder: "Nom",
    formEmailPlaceholder: "Adresse e-mail*",
    formPhonePlaceholder: "Telephone",
    formMessagePlaceholder: "Message*",
    formPrivacyLabel: "J'accepte la politique de confidentialite",
    formSubmitLabel: "Envoyer",
    formNotice:
      "Le formulaire de contact sera raccorde au back ensuite. Utilisez le telephone ou l'email pour une reponse immediate.",
    hoursTitle: "Horaires",
    hoursSubtitle: "Contactez-nous et nous vous reserverons un rendez-vous",
    hoursItems: [
      { day: "Lundi", value: "10:00 - 18:00" },
      { day: "Mardi", value: "10:00 - 18:00" },
      { day: "Mercredi", value: "10:00 - 18:00" },
      { day: "Jeudi", value: "10:00 - 18:00" },
      { day: "Vendredi", value: "10:00 - 18:00" },
      { day: "Samedi", value: "Ferme" },
      { day: "Dimanche", value: "Ferme" }
    ]
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
    reserveFormLabel: "Reserver via le formulaire",
    reserveWhatsappLabel: "Discutez via WhatsApp",
    whatsappNumber: "0779107446",
    whatsappInternationalNumber: "213779107446",
    reservationSectionEyebrow: "Reservation",
    reservationSectionTitle: "Envoyer une demande de reservation",
    reservationSectionDescription:
      "Completez ce formulaire pour envoyer votre demande. Notre equipe vous recontactera rapidement.",
    reservationAvailabilityTitle: "Disponibilites du vehicule",
    reservationAvailabilityDescription:
      "Les dates et heures grisees sont deja reservees et ne peuvent pas etre selectionnees.",
    reservationAvailabilityLoadingLabel:
      "Chargement des disponibilites en cours...",
    reservationPickupDateLabel: "Date de recuperation",
    reservationPickupTimeLabel: "Heure de recuperation",
    reservationReturnDateLabel: "Date de retour",
    reservationReturnTimeLabel: "Heure de retour",
    reservationSelectPickupFirstLabel:
      "Selectionnez d'abord une date et une heure de recuperation.",
    reservationNoAvailabilityLabel:
      "Aucun creneau disponible sur cette periode.",
    reservationMonthPreviousLabel: "Mois precedent",
    reservationMonthNextLabel: "Mois suivant",
    reservationAvailableLegendLabel: "Disponible",
    reservationUnavailableLegendLabel: "Indisponible",
    reservationSelectedLegendLabel: "Selectionne",
    reservationSuccessMessage:
      "Votre demande de reservation a bien ete envoyee.",
    reservationErrorMessage: "La reservation n'a pas pu etre envoyee.",
    reservationFirstNameLabel: "Prenom",
    reservationLastNameLabel: "Nom",
    reservationDrivingLicenseLabel: "Photo du permis de conduire",
    reservationEmailLabel: "Email (facultatif)",
    reservationPhoneLabel: "Numero de telephone",
    reservationCommentLabel: "Commentaire",
    reservationPickupLocationLabel: "A recuperer a",
    reservationReturnLocationLabel: "Retourner a",
    reservationPickupDatetimeLabel: "Date et heure de collecte",
    reservationReturnDatetimeLabel: "Date et heure de retour",
    reservationSubmitLabel: "Envoyer",
    reservationPrivacyLabel:
      "J'accepte la politique de confidentialite.",
    reservationPickupLocationOptions: [
      { value: "bureau", label: "Bureau" },
      { value: "aeroport", label: "Aeroport" },
      {
        value: "commentaire",
        label: "Preciser dans les commentaires"
      }
    ],
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
    availabilityReservedLabel: "Reserve",
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
  reservations: {
    eyebrow: "Reservations",
    title: "Demandes de reservation",
    description:
      "Retrouvez ici toutes les demandes envoyees depuis le formulaire public.",
    emptyTitle: "Aucune reservation",
    emptyDescription:
      "Aucune demande n'a encore ete envoyee depuis le site.",
    detailTitle: "Detail de la reservation",
    detailDescription:
      "Cette page regroupe toutes les informations utiles pour traiter la demande.",
    durationLabel: "Duree",
    vehicleLabel: "Vehicule",
    customerLabel: "Client",
    pickupLabel: "Recuperation",
    returnLabel: "Retour",
    phoneLabel: "Telephone",
    emailLabel: "Email",
    commentLabel: "Commentaire",
    statusLabel: "Statut",
    statusPendingLabel: "En attente",
    statusAcceptedLabel: "Acceptee",
    licenseLabel: "Permis de conduire",
    createdAtLabel: "Envoyee le",
    acceptLabel: "Accepter",
    rejectLabel: "Refuser",
    acceptErrorMessage: "Impossible d'accepter cette reservation.",
    rejectErrorMessage: "Impossible de refuser cette reservation.",
    rejectConfirmMessage:
      "Voulez-vous refuser et supprimer cette demande de reservation ?",
    acceptedRedirectLabel: "Voir les clients",
    createLabel: "+ Ajouter une reservation",
    editLabel: "Modifier la reservation",
    deleteLabel: "Supprimer la reservation",
    deleteConfirmMessage:
      "Voulez-vous supprimer cette reservation ?",
    createTitle: "Creer une reservation",
    createDescription:
      "Depuis cette page, l'admin peut enregistrer directement une reservation acceptee.",
    editTitle: "Modifier la reservation",
    editDescription:
      "Mettez a jour le vehicule, les dates et toutes les informations client de cette reservation.",
    saveCreateLabel: "Creer et accepter la reservation",
    saveEditLabel: "Enregistrer la reservation",
    formVehicleLabel: "Vehicule",
    formVehiclePlaceholder: "Selectionner un vehicule",
    formVehicleUnavailableSuffix: "indisponible sur cette periode",
    formVehicleConflictMessage:
      "Le vehicule selectionne est deja reserve sur cette periode.",
    formDurationLiveLabel: "Duree selectionnee",
    formDrivingLicenseReplaceLabel: "Remplacer le permis de conduire",
    formCurrentLicenseLabel: "Permis actuel",
    formSaveErrorMessage: "Impossible d'enregistrer cette reservation.",
    formDeleteErrorMessage: "Impossible de supprimer cette reservation.",
    formLoadErrorMessage: "Impossible de charger le formulaire de reservation.",
    backLabel: "Retour aux reservations",
    clientsTitle: "Clients",
    clientsDescription:
      "Retrouvez ici les reservations acceptees dans un calendrier.",
    clientsEmptyTitle: "Aucune reservation acceptee",
    clientsEmptyDescription:
      "Aucune reservation acceptee n'est en cours pour le moment.",
    clientsMonthPreviousLabel: "Mois precedent",
    clientsMonthNextLabel: "Mois suivant",
    calendarPickupLabel: "Depart",
    calendarReturnLabel: "Retour",
    detailErrorMessage: "Impossible de charger cette reservation."
  },
  footer: {
    caption:
      "Location de voitures premium en Algerie avec un catalogue optimise pour un affichage rapide.",
    navigationTitle: "Navigation",
    contactTitle: "Contact",
    phoneCtaLabel: "Appelez-nous",
    phoneLabel: "Numero de tel",
    phoneValue: "0779 10 74 46",
    emailValue: "lea@gmail.com",
    locationLabel: "Localisation",
    locationValue: "Alger",
    addressValue: "Alger\nMon Location Lea",
    mapUrl: "https://maps.google.com/?q=Alger%2C+Algerie",
    brandLabel: "Nom",
    brandValue: "Mon Location Lea",
    shortInfo: "✔︎ MON LOCATION LEA. Location de voitures de luxe à ALGER.",
    facebookUrl: "#",
    instagramUrl: "#",
    youtubeUrl: "#",
    copyrightText: "Copyright ©. Tous les droits reserves.",
    legalText: "Lea Location"
  }
};

module.exports = defaultContent;
