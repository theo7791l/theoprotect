// Liste exhaustive de mots inappropriés en français et anglais
class BadWordsFilter {
  constructor() {
    // Insultes françaises
    this.frenchWords = [
      // Insultes classiques
      'connard', 'connasse', 'salope', 'pute', 'putain', 'enculé', 'encule', 'enculer',
      'putain', 'pd', 'pédé', 'pede', 'tapette', 'tafiole', 'enfoiré', 'enfoirer',
      'batard', 'bâtard', 'conne', 'con', 'connes', 'cons', 'fdp', 'ntm', 'tg',
      'ferme ta gueule', 'ta gueule', 'gueule', 'nique', 'niquer', 'niker',
      'fils de pute', 'salaud', 'salop', 'salopard', 'saloperie', 'merde', 'chier',
      'bite', 'couille', 'couilles', 'cul', 'chatte', 'con', 'conne',
      
      // Insultes racistes
      'negro', 'négro', 'bamboula', 'bounty', 'bicot', 'bougnoule', 'crouille',
      'sale noir', 'sale blanc', 'sale arabe', 'raton', 'youpin', 'feuj',
      'boche', 'schleu', 'chintok', 'niakoué', 'bridé',
      
      // Insultes homophobes
      'fiotte', 'gouine', 'tantouze', 'tarlouze', 'tafiole',
      
      // Vulgarités
      'pisse', 'pisser', 'chiottes', 'merdique', 'merdeux',
      'débile', 'abruti', 'idiot', 'imbécile', 'crétin',
      
      // Variations et dérivés
      'connard', 'connards', 'connarde', 'connardes',
      'salope', 'salopes', 'salopard', 'salopards',
      'batard', 'batarde', 'batards', 'bâtards',
      'enculé', 'enculée', 'enculés', 'enculées',
      
      // Expressions
      'va te faire', 'vas te faire', 'va chier', 'vas chier',
      'nique ta mère', 'ntm', 'nique ta race', 'ntr',
      'ferme ta gueule', 'ftg', 'ta gueule', 'tg',
      'fils de pute', 'fdp', 'face de merde',
      
      // Variations orthographiques (leet speak, variations)
      'c0n', 'c0nn4rd', 'p0ut3', 'put3', 'b4t4rd',
      'c0nn4ss3', 's4l0p3', '3ncul3', 'p3d3'
    ];
    
    // Insultes anglaises
    this.englishWords = [
      // Insultes classiques
      'fuck', 'fucking', 'fucker', 'fucked', 'fck', 'fuk', 'fking',
      'shit', 'shit', 'bullshit', 'bitch', 'bitches', 'bastard',
      'asshole', 'ass', 'arse', 'dick', 'cock', 'pussy', 'cunt',
      'whore', 'slut', 'motherfucker', 'mofo', 'damn', 'dammit',
      
      // Insultes racistes
      'nigger', 'nigga', 'negro', 'coon', 'chink', 'gook',
      'wetback', 'spic', 'kike', 'jap', 'raghead', 'towelhead',
      'sand nigger', 'paki', 'beaner',
      
      // Insultes homophobes
      'faggot', 'fag', 'fags', 'dyke', 'queer', 'tranny',
      
      // Vulgarités
      'piss', 'pissed', 'crap', 'retard', 'retarded',
      'idiot', 'stupid', 'dumb', 'moron', 'imbecile',
      
      // Variations et dérivés
      'fucker', 'fuckers', 'fuckin', 'fucked up',
      'shitty', 'shithead', 'dipshit', 'bullshitter',
      'bitch ass', 'son of a bitch', 'sob',
      
      // Expressions
      'fuck you', 'fuck off', 'shut up', 'stfu', 'gtfo',
      'go to hell', 'kys', 'kill yourself', 'kill your self',
      'suck my', 'suck a',
      
      // Variations orthographiques
      'fuk', 'fck', 'f*ck', 'f**k', 'sh1t', 'b1tch',
      'a$$', '@ss', 'a$$hole', 'd1ck', 'c0ck', 'pu$$y'
    ];
    
    // Patterns regex pour détecter les variations
    this.patterns = [
      /n+[i1!]+[gq]+[e3]+r+/gi,  // nigger et variations
      /f+[u*@]+[c*]+k+/gi,        // fuck et variations
      /b+[i1!]+t+[c*]+h+/gi,      // bitch et variations
      /[s5]+[h]+[i1!]+t+/gi,      // shit et variations
      /c+[o0]+n+[n]+[a@4]+r+d+/gi, // connard et variations
      /[s5]+[a@4]+l+[o0]+p+[e3]+/gi, // salope et variations
      /p+[u*]+t+[e3a@4]+/gi,      // pute et variations
      /[e3]+n+c+[u*]+l+[e3]+/gi   // enculé et variations
    ];
    
    // Mots à ignorer (faux positifs)
    this.whitelist = [
      'assassin', 'assembly', 'bass', 'class', 'pass', 'glass',
      'grass', 'mass', 'assignment', 'classic', 'passion',
      'dick tracy', 'moby dick', // noms propres
      'scunthorpe', 'penistone' // villes
    ];
  }
  
  /**
   * Normalise le texte pour la détection
   */
  normalizeText(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Retire ponctuation
      .replace(/\s+/g, ' ')        // Normalise espaces
      .trim();
  }
  
  /**
   * Vérifie si le message contient des mots inappropriés
   */
  containsBadWords(message) {
    const normalized = this.normalizeText(message);
    const words = normalized.split(' ');
    
    // Vérifier whitelist
    for (const whitelisted of this.whitelist) {
      if (normalized.includes(whitelisted)) {
        return { detected: false };
      }
    }
    
    // Vérifier mots français
    for (const badWord of this.frenchWords) {
      if (normalized.includes(badWord) || words.includes(badWord)) {
        return {
          detected: true,
          word: badWord,
          language: 'fr',
          severity: this.getSeverity(badWord)
        };
      }
    }
    
    // Vérifier mots anglais
    for (const badWord of this.englishWords) {
      if (normalized.includes(badWord) || words.includes(badWord)) {
        return {
          detected: true,
          word: badWord,
          language: 'en',
          severity: this.getSeverity(badWord)
        };
      }
    }
    
    // Vérifier patterns regex
    for (const pattern of this.patterns) {
      const match = message.match(pattern);
      if (match) {
        return {
          detected: true,
          word: match[0],
          language: 'pattern',
          severity: 'high'
        };
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