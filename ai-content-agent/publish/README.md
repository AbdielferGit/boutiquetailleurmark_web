# Publication automatique -- feuille de route

Ce module genere le CONTENU (texte). La publication reelle sur Facebook et TikTok peut se faire par deux chemins :

## Option A -- Recommandee : outil de programmation (Buffer / Metricool)
- Coller le texte genere dans Buffer ou Metricool, programme a la frequence choisie.
- Aucune integration technique requise, fonctionne des aujourd'hui.
- `buffer-stub.js` montre la structure d'appel si on veut automatiser l'envoi vers Buffer plus tard (necessite un token API Buffer).

## Option B -- Integration directe (plus lourde)
- Facebook : API Graph de Meta (gratuite, necessite un compte developpeur + revue d'application pour un usage en production).
- TikTok : Content Posting API (gratuite par appel, mais revue d'application obligatoire -- 1 a 2 semaines, avec politique de confidentialite et video de demonstration).
- A envisager seulement si le volume de publications augmente significativement (plusieurs fois par semaine).
