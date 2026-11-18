# Ordnungen Rollkunstlauf NRW

Prüfungsordnung und Wettkampfordnung (Meisterschaftsordnung) als Website mit Startseite,
druckfertigen PDFs und einem Editor für berechtigte Personen.

| Bereich | Wer | Adresse |
|---|---|---|
| Startseite (Auswahl Prüfungs-/Wettkampfordnung) | alle | `/` |
| Web-Ansicht, nur lesen | alle | `/pruefungsordnung/`, `/wettkampfordnung/` |
| PDF mit klickbarer Registerleiste, Inhaltsverzeichnis, Querverweisen, Lesezeichen | alle | `/…/pruefungsordnung.pdf`, `/…/wettkampfordnung.pdf` |
| Editor | nur Personen mit Schreibrecht im Repository | `/admin/` |

## Bearbeiten

1. `https://melinajacob.github.io/rollsport-ordnungen-nrw/admin/` öffnen und mit GitHub anmelden.
2. Dokument → Kapitel → Block wählen, ändern, **Speichern**.
3. Nach ca. 2–3 Minuten sind Website und PDFs neu gebaut (GitHub Action „Veröffentlichen“).

Jede Änderung steht mit Name und Datum in der Versionsgeschichte und kann rückgängig gemacht werden.

### Textformatierung
- `**fett**`, neue Zeile = Zeilenumbruch
- Verweis im Dokument: `[Analog zum Einzellauf A1](#anfaenger-1)` – Anker = Titel in Kleinbuchstaben, Umlaute → ae/oe/ue, Leerzeichen → `-`
- Tabellen: `| Spalte | Spalte |` (Markdown). Eine leere Kopfzeile `| | |` wird ausgeblendet.

### Blocktypen
`pruefung` (Prüfung mit Wertung), `hinweis`, `freitext`, `boegen` (Pflichtbogen-Zeichnungen),
`abschnitt` (Text/Tabelle, optional grauer oder rosa Kasten, zweite Spalte), `vorgabe` (Kürvorgabe mit Regeln und Prüfung/Musik),
`startbedingungen`, `bogenklasse` (Meisterschaftsbögen), `pirouette` (Text + Foto), `bild`, `kontakte`.

PDF-Steuerung je Block: `neue_seite: true` (beginnt auf neuer Seite), `kopfzeile: …` (Seitenkopf ab hier).

## Einrichtung (einmalig)

1. Repository `rollsport-ordnungen-nrw` auf GitHub anlegen und diesen Ordner hochladen.
2. Settings → Pages → Source: **GitHub Actions**.
3. Editor:innen unter Settings → Collaborators mit Rolle *Write* einladen.
4. Anmeldung im Editor: Sveltia CMS bietet „Sign In with Token“ (persönlicher GitHub-Token mit Repo-Rechten).
   Für Login per Klick kann später ein OAuth-Dienst (z. B. Sveltia CMS Authenticator auf Cloudflare) ergänzt werden.

## Lokal bauen

```bash
npm install
npx playwright install chromium
npm run build      # erzeugt dist/
```

## Aufbau

- `content/*.yml` – Inhalte; `content/boegen`, `content/wko` – Zeichnungen und Fotos
- `build/render.mjs` – Bausteine · `build/paginate.js` – automatische A4-Seitenaufteilung, Kopfzeile, Seitenzahl, Registerleiste
- `build/styles.css`, `print.css`, `web.css` – Gestaltung · Schrift: Outfit (SIL OFL)
- `admin/` – Editor-Konfiguration · `.github/workflows/publish.yml` – Bauen & Veröffentlichen
