// Liste exhaustive de mots inappropriés en français et anglais
class BadWordsFilter {
  constructor() {
    // Insultes françaises (mots entiers uniquement)
    this.frenchWords = [
      // Insultes classiques
      'connard', 'connards', 'connarde', 'connardes', 'connasse', 'connasses',
      'salope', 'salopes', 'salopard', 'salopards', 'saloperie', 'saloperies',
      'pute', 'putes', 'putain', 'putains',
      'enculé', 'enculée', 'enculés', 'enculées', 'encule', 'enculer',
      'pd', 'pédé', 'pédés', 'pede', 'pedes', 'tapette', 'tapettes', 'tafiole', 'tafioles',
      'enfoiré', 'enfoirés', 'enfoirée', 'enfoirées', 'enfoirer',
      'batard', 'batards', 'batarde', 'batardes', 'bâtard', 'bâtards',
      'fdp', 'ntm', 'tg', 'ftg', 'ntr',
      'fils de pute', 'nique ta mère', 'nique ta race', 'ferme ta gueule', 'ta gueule',
      'nique', 'niquer', 'niker',
      'salaud', 'salauds', 'salop', 'salops',
      'merde', 'merdes', 'chier', 'chieur', 'chieuse',
      'bite', 'bites', 'couille', 'couilles', 'cul', 'culs', 'chatte', 'chattes',
      
      // Insultes racistes
      'negro', 'négro', 'nègre', 'bamboula', 'bounty', 'bicot', 'bougnoule', 'crouille',
      'sale noir', 'sale blanc', 'sale arabe', 'raton', 'youpin', 'feuj',
      'boche', 'schleu', 'chintok', 'niakoué', 'bridé',
      
      // Insultes homophobes
      'fiotte', 'fiottes', 'gouine', 'gouines', 'tantouze', 'tantouzes', 'tarlouze', 'tarlouzes',
      
      // Vulgarités
      'pisse', 'pisser', 'chiottes', 'merdique', 'merdeux', 'merdeuse',
      'débile', 'débiles', 'abruti', 'abrutis', 'abrutie', 'idiot', 'idiots', 'idiote',
      'imbécile', 'imbéciles', 'crétin', 'crétins', 'crétine',
      
      // Expressions
      'va te faire', 'vas te faire', 'va chier', 'vas chier',
      'va te faire foutre', 'vas te faire foutre',
      'face de merde',
      
      // Variations leet speak
      'c0nnard', 'c0nn4rd', 'p0ute', 'put3', 'b4tard',
      'c0nnasse', 's4lope', '3ncule', 'p3de'
    ];
    
    // Insultes anglaises (mots entiers uniquement)
    this.englishWords = [
      // Insultes classiques
      'fuck', 'fucking', 'fucker', 'fuckers', 'fucked', 'fck', 'fuk', 'fking',
      'shit', 'shits', 'bullshit', 'bitch', 'bitches', 'bastard', 'bastards',
      'asshole', 'assholes', 'ass', 'arse', 'dick', 'dicks', 'cock', 'cocks', 'pussy', 'cunt', 'cunts',
      'whore', 'whores', 'slut', 'sluts', 'motherfucker', 'motherfuckers', 'mofo', 'damn', 'dammit',
      
      // Insultes racistes
      'nigger', 'niggers', 'nigga', 'niggas', 'negro', 'negroes', 'coon', 'coons',
      'chink', 'chinks', 'gook', 'gooks', 'wetback', 'wetbacks', 'spic', 'spics',
      'kike', 'kikes', 'jap', 'japs', 'raghead', 'ragheads', 'towelhead', 'towelheads',
      'sand nigger', 'paki', 'pakis', 'beaner', 'beaners',
      
      // Insultes homophobes
      'faggot', 'faggots', 'fag', 'fags', 'dyke', 'dykes', 'queer', 'queers', 'tranny',
      
      // Vulgarités
      'piss', 'pissed', 'crap', 'crappy', 'retard', 'retarded', 'retards',
      
      // Expressions
      'fuck you', 'fuck off', 'shut up', 'stfu', 'gtfo',
      'go to hell', 'kys', 'kill yourself', 'kill your self',
      'suck my', 'suck a', 'son of a bitch',
      
      // Variations orthographiques
      'fuk', 'f*ck', 'f**k', 'sh1t', 'b1tch',
      'a$$', '@ss', 'a$$hole', 'd1ck', 'c0ck', 'pu$$y'
    ];
    
    // Patterns regex pour détecter les variations (plus strictes)
    this.patterns = [
      /\bn+[i1!]+[gq]+[e3]+r+s?\b/gi,  // nigger et variations (mot entier)
      /\bf+[u*@]+[c*]+k+[si]*(ng|er|ed)?\b/gi, // fuck et variations (mot entier)
      /\bb+[i1!]+t+[c*]+h+[es]*\b/gi,  // bitch et variations (mot entier)
      /\b[s5]+[h]+[i1!]+t+[sy]?\b/gi,  // shit et variations (mot entier)
      /\bp+[u*]+t+[e3a@4]+s?\b/gi      // pute et variations (mot entier)
    ];
    
    // Mots à ignorer (faux positifs) - TRÈS IMPORTANT
    this.whitelist = [
      // Mots français avec "con"
      'acon', 'acon', 'acon', 'balcon', 'balcons', 'bacon', 'bacons',
      'acon', 'acon', 'contenu', 'contenus', 'container', 'containers',
      'contrat', 'contrats', 'contracter', 'contractuel',
      'contre', 'contrer', 'controler', 'controle', 'contrôle', 'contrôler',
      'contour', 'contours', 'contourner',
      'contribuer', 'contribution', 'contributions', 'contributeur',
      'controverse', 'controversé', 'controversée',
      'contravention', 'contraventions',
      'contact', 'contacts', 'contacter',
      'contexte', 'contextes', 'contextuel',
      'continent', 'continents', 'continental',
      'continuer', 'continuation', 'continu', 'continue',
      'concours', 'concourir',
      'conclusion', 'conclusions', 'conclure',
      'concret', 'concrète', 'concrétiser',
      'condition', 'conditions', 'conditionner',
      'conduire', 'conduite', 'conducteur',
      'confiance', 'confiant', 'confiante',
      'confirmer', 'confirmation',
      'conflit', 'conflits',
      'confort', 'confortable',
      'confusion', 'confus', 'confuse',
      'congé', 'congés',
      'connaître', 'connaissance', 'connaissances', 'connaissant',
      'connexion', 'connexions', 'connecter', 'connecté',
      'conquête', 'conquérir',
      'conscience', 'conscient', 'consciente',
      'conseil', 'conseils', 'conseiller',
      'consensus',
      'conséquence', 'conséquences', 'conséquent',
      'conservation', 'conserver', 'conservateur',
      'considérer', 'considération', 'considérable',
      'consigne', 'consignes',
      'consistant', 'consister', 'consistence',
      'consolider', 'consolidation', 'console',
      'consommateur', 'consommation', 'consommer',
      'conspiration', 'conspirer',
      'constater', 'constat', 'constatation',
      'constellation', 'constellations',
      'constitution', 'constituer', 'constitutionnel',
      'construction', 'construire', 'constructeur',
      'consulter', 'consultation', 'consultant', 'consulat',
      'consumer', 'consommé',
      'contact', 'contacter',
      'contagieux', 'contagion',
      'contaminer', 'contamination',
      'contempler', 'contemplation',
      'contemporain', 'contemporaine',
      'content', 'contente', 'contenter',
      'contest', 'contester', 'contestation',
      
      // Mots anglais
      'assassin', 'assassinate', 'assembly', 'bass', 'bassist',
      'class', 'classes', 'classic', 'classical', 'classroom',
      'pass', 'passed', 'passing', 'passenger', 'passport',
      'glass', 'glasses', 'glassware',
      'grass', 'grassland',
      'mass', 'massive', 'masses',
      'assignment', 'assign', 'assigned',
      'passion', 'passionate',
      'compassion', 'compassionate',
      'discussion', 'discuss',
      'concussion',
      'assessment', 'assess',
      'assistance', 'assistant', 'assist',
      'dick tracy', 'moby dick', 'dickens',
      'scunthorpe', 'penistone',
      'update', 'updates', 'updated', 'updating',
      'contain', 'contains', 'container', 'content',
      'contract', 'contracts', 'contractor',
      'control', 'controls', 'controller', 'controlling',
      'contribute', 'contribution', 'contributor',
      'continue', 'continues', 'continued', 'continuous',
      'contact', 'contacts', 'contacted',
      'context', 'contextual',
      'contest', 'contests', 'contestant',
      'connect', 'connection', 'connected', 'connecting'
    ];
  }
  
  /**
   * Normalise le texte pour la détection
   */
  normalizeText(text) {
    return text
      .toLowerCase()
      .replace(/[^a-zàâäéèêëïîôùûüÿæœç0-9\s]/g, '') // Garde accents français
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  /**
   * Vérifie si le message contient des mots inappropriés
   */
  containsBadWords(message) {
    const normalized = this.normalizeText(message);
    
    // Vérifier whitelist d'abord (PRIORITAIRE)
    for (const whitelisted of this.whitelist) {
      if (normalized.includes(whitelisted.toLowerCase())) {
        return { detected: false };
      }
    }
    
    // Séparer en mots individuels
    const words = normalized.split(' ');
    
    // Vérifier mots français (correspondance EXACTE)
    for (const badWord of this.frenchWords) {
      // Vérifier mot exact dans la liste de mots
      if (words.includes(badWord)) {
        return {
          detected: true,
          word: badWord,
          language: 'fr',
          severity: this.getSeverity(badWord)
        };
      }
      
      // Vérifier expressions (plusieurs mots)
      if (badWord.includes(' ') && normalized.includes(badWord)) {
        return {
          detected: true,
          word: badWord,
          language: 'fr',
          severity: this.getSeverity(badWord)
        };
      }
    }
    
    // Vérifier mots anglais (correspondance EXACTE)
    for (const badWord of this.englishWords) {
      // Vérifier mot exact
      if (words.includes(badWord)) {
        return {
          detected: true,
          word: badWord,
          language: 'en',
          severity: this.getSeverity(badWord)
        };
      }
      
      // Vérifier expressions
      if (badWord.includes(' ') && normalized.includes(badWord)) {
        return {
          detected: true,
          word: badWord,
          language: 'en',
          severity: this.getSeverity(badWord)
        };
      }
    }
    
    // Vérifier patterns regex (dernier recours)
    for (const pattern of this.patterns) {
      const match = message.match(pattern);
      if (match) {
        // Double-check contre whitelist
        const matchedWord = match[0].toLowerCase();
        let isWhitelisted = false;
        
        for (const whitelisted of this.whitelist) {
          if (matchedWord.includes(whitelisted.toLowerCase()) || whitelisted.toLowerCase().includes(matchedWord)) {
            isWhitelisted = true;
            break;
          }
        }
        
        if (!isWhitelisted) {
          return {
            detected: true,
            word: match[0],
            language: 'pattern',
            severity: 'high'
          };
        }
      }
    }
    
    return { detected: false };
  }
  
  /**
   * Détermine la sévérité du mot
   */
  getSeverity(word) {
    const highSeverity = [
      'nigger', 'faggot', 'cunt', 'motherfucker',
      'négro', 'bamboula', 'youpin', 'bougnoule',
      'nique ta mère', 'fils de pute', 'kill yourself'
    ];
    
    const mediumSeverity = [
      'fuck', 'shit', 'bitch', 'asshole',
      'connard', 'salope', 'enculé', 'pute'
    ];
    
    if (highSeverity.some(w => word.includes(w))) return 'high';
    if (mediumSeverity.some(w => word.includes(w))) return 'medium';
    return 'low';
  }
}

export default new BadWordsFilter();