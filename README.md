# Workshop 2 — Sécurité du code source : SonarQube et Semgrep

**Projet :** CryptoWatch (Next.js / TypeScript)  
**Groupe :** GR 5 — Azzeddine Salmoun, Toufik Kharkhor et Wail Chairi Mahjor  
**Thème :** Analyse statique de sécurité (SAST) avec GitHub Actions

## 1. Objectif

L’objectif de ce workshop est d’intégrer l’analyse statique de sécurité (SAST) dans CryptoWatch, d’exécuter SonarQube et Semgrep dans un pipeline GitHub Actions, puis de comparer les résultats obtenus avant et après l’introduction d’un exemple de code volontairement vulnérable.

## 2. Environnement utilisé

- Projet : CryptoWatch (Next.js / TypeScript).
- Outils : SonarQube Community, Semgrep, Docker et Git.
- Intégration continue : GitHub Actions avec un runner self-hosted Windows.
- Le workflow installe les dépendances, exécute ESLint et la compilation Next.js, puis lance l’analyse SonarQube et le scan Semgrep.
- Le rapport Semgrep est enregistré au format JSON et publié comme artefact GitHub Actions.

## 3. Résultats SonarQube

Lors de l’analyse initiale, la Quality Gate était passée. Le tableau de bord indiquait 0 problème de sécurité déclaré, 4 problèmes de fiabilité, 22 problèmes de maintenabilité, 2,2 % de duplication et 0 % de couverture.

<img width="610" height="315" alt="01-sonarqube-dashboard-initial" src="https://github.com/user-attachments/assets/edba94ce-94a4-4499-91d5-111d705cf748" />


Après l’ajout du composant de test `SastVulnerabilityLab.tsx`, SonarQube a signalé une issue de maintenabilité (règle TypeScript S6759 : rendre les propriétés du composant en lecture seule). La capture disponible ne montre pas de détection XSS par SonarQube. La Quality Gate du nouveau code a échoué avec une nouvelle issue et une couverture de 0 % sur les nouvelles lignes.

<img width="658" height="364" alt="02-sonarqube-maintainability-issue" src="https://github.com/user-attachments/assets/20317838-fa2d-4c5f-a5fa-c5431cad860b" />


<img width="1456" height="757" alt="03-sonarqube-quality-gate-new-code" src="https://github.com/user-attachments/assets/91c3347a-fadc-429f-8db8-2da64a124a62" />


## 4. Test de vulnérabilité et résultats Semgrep

Un composant isolé, `SastVulnerabilityLab.tsx`, a été ajouté sur la branche de test `test/sast-vulnerabilities`. La version vulnérable utilisait `dangerouslySetInnerHTML` avec une valeur `userInput`. Si cette valeur contient du HTML non fiable, ce modèle peut entraîner une vulnérabilité Cross-Site Scripting (XSS).

Semgrep a détecté ce motif et signalé un risque potentiel de XSS associé à **CWE-79**. Le scan affiché a terminé avec succès et a analysé 69 fichiers. L’artefact JSON contient également des avertissements concernant les références d’actions GitHub mutables et des recommandations de sécurité pour Docker Compose.

<img width="614" height="426" alt="04-semgrep-scan-summary" src="https://github.com/user-attachments/assets/ab12a462-8254-4751-a91d-105f6ef100cc" />


<img width="1360" height="597" alt="05-semgrep-xss-cwe79-detail" src="https://github.com/user-attachments/assets/31d3e3ad-5c2a-4a32-89c0-3af310031515" />


## 5. Comparaison des outils

| Élément observé | SonarQube | Semgrep |
|---|---|---|
| Exécution dans le pipeline | Analyse réussie | Scan réussi |
| Exemple XSS | Aucune détection XSS visible dans les captures fournies | Détection d’un motif XSS potentiel (CWE-79) |
| Autres résultats | Issue de maintenabilité S6759 | Références d’actions mutables et recommandations Docker |

Les résultats ne signifient pas qu’un outil est toujours meilleur que l’autre. Ils dépendent des règles actives, des versions des analyseurs et du contexte du code.

## 6. Correction et validation

Pour corriger le test XSS, il faut éviter d’injecter directement une chaîne non fiable avec `dangerouslySetInnerHTML`. Pour afficher une valeur comme du texte, le composant utilise un rendu React standard :

```tsx
<div>{userInput}</div>
```

Le composant utilise également `Readonly<Props>` pour rendre ses propriétés en lecture seule. React affiche ainsi la valeur comme du texte plutôt que de l’interpréter comme du HTML. Si l’application doit réellement afficher du HTML, celui-ci doit être nettoyé avec une bibliothèque de sanitisation adaptée.

Après la correction, une nouvelle analyse SonarQube a montré une Quality Gate **Passed**, zéro nouvelle issue et zéro duplication sur les nouvelles lignes. La couverture restait à 0 % avec une exigence affichée de 80 %.

<img width="1224" height="633" alt="06-sonarqube-quality-gate-passed" src="https://github.com/user-attachments/assets/20eef1e2-ac3c-4d34-8114-4f4ae30cc125" />


## 7. Conclusion

Ce workshop a permis d’intégrer SonarQube et Semgrep dans GitHub Actions, de comparer leurs résultats sur un exemple XSS et de corriger le composant de test en supprimant l’utilisation de `dangerouslySetInnerHTML`. Les captures montrent la détection du risque par Semgrep et le résultat SonarQube après correction. La couverture de tests demeure un point à améliorer.
