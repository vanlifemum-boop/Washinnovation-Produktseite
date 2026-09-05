/**
 * Pflichtseiten eines Verkaufsangebots an Verbraucher in Deutschland:
 * Impressum, Datenschutz, AGB, Widerruf, Versand und Zahlung.
 *
 * Der Anbieter sitzt in Polen, die Kundschaft in Deutschland. Das ist keine
 * Randnotiz, sondern bestimmt an mehreren Stellen den Text: welche Kennnummern
 * ins Impressum gehören (NIP und REGON statt USt-IdNr.), welches Register zu
 * nennen ist (CEIDG), welche Datenschutz-Aufsichtsbehörde zuständig ist (UODO
 * in Warschau) und welches Recht gilt — polnisches, aber ohne den deutschen
 * Verbrauchern ihren zwingenden Schutz zu nehmen (Art. 6 Rom-I-Verordnung).
 * Umgeschaltet wird das über FIRMA.sitzland in src/inhalte/firma.ts.
 *
 * WICHTIG — bitte lesen, bevor die Seite live geht:
 * Das hier ist ein Gerüst, keine Rechtsberatung. Die AGB und die
 * Widerrufsbelehrung gehören vor der Veröffentlichung einmal durch jemanden mit
 * Fachkenntnis. Falsche oder fehlende Pflichtangaben sind abmahnfähig — das ist
 * bei einem Shop mit Spendenwerbung kein theoretisches Risiko.
 *
 * Besonders zu prüfen:
 *   - Spendenwerbung: Empfänger und Höhe müssen konkret benannt sein.
 *   - Zuwendungsbestätigungen darf nur ausstellen, wer gemeinnützig ist.
 *   - Warenspenden sind umsatzsteuerlich nicht neutral (Steuerberatung).
 *
 * Umgang mit fehlenden Angaben
 * -----------------------------------------------------------------------------
 * Früher stand an jeder offenen Stelle „[PLATZHALTER]“ — sichtbar für jeden
 * Besucher. Statt dessen bauen die Texte ihre Absätze jetzt aus
 * src/inhalte/firma.ts zusammen: Ein Absatz, dem eine Angabe fehlt, wird zu
 * `null` und verschwindet. Abschnitte ohne verbleibende Absätze fallen ganz weg.
 *
 * Damit fehlende Pflichtangaben nicht unbemerkt bleiben, wacht
 * fehlendePflichtangaben() in firma.ts darüber: Der Schalter
 * SUCHMASCHINEN_SPERREN in src/seite.config.ts lässt sich nicht abschalten,
 * solange dort etwas offen ist. Der Wächter ersetzt den gelben Hinweisstreifen,
 * der früher auf der Seite selbst stand.
 */
import {
  FIRMA, HOSTER, anschriftZeilen, registerAngabe, steuerKennungen,
} from "./firma";
import { RUFNUMMER_LESBAR } from "./kontakt";

export interface Abschnitt {
  titel: string;
  absaetze: string[];
}

export interface Rechtsseite {
  titel: string;
  einleitung: string;
  abschnitte: Abschnitt[];
}

/** Beim Schreiben darf ein Absatz `null` sein — dann fehlt die nötige Angabe. */
type AbschnittRoh = { titel: string; absaetze: (string | null)[] };
type RechtsseiteRoh = { titel: string; einleitung: string; abschnitte: AbschnittRoh[] };

export type RechtSchluessel =
  | "impressum"
  | "datenschutz"
  | "agb"
  | "widerruf"
  | "versand-zahlung";

/** Kontaktzeilen fürs Impressum — das Telefon steht fest, die E-Mail vielleicht noch nicht. */
function kontaktZeilen(email: string, telefon: string): (string | null)[] {
  return [
    `${telefon}: ${RUFNUMMER_LESBAR}`,
    FIRMA.email ? `${email}: ${FIRMA.email}` : null,
  ];
}

/**
 * Satz zur Umsatzsteuerbefreiung — nur, wenn sie tatsächlich gilt.
 * Die Kennnummern selbst liefert steuerKennungen() aus firma.ts.
 */
function umsatzsteuerbefreit(satz: string): string | null {
  return FIRMA.kleinunternehmer === true ? satz : null;
}

const LAND_NAMEN: Record<string, Record<"PL" | "DE", string>> = {
  de: { PL: "Polen", DE: "Deutschland" },
  en: { PL: "Poland", DE: "Germany" },
  pl: { PL: "Polska", DE: "Niemcy" },
  fr: { PL: "Pologne", DE: "Allemagne" },
  es: { PL: "Polonia", DE: "Alemania" },
  it: { PL: "Polonia", DE: "Germania" },
};

/** Postanschrift mit lokalisiertem Ländernamen. */
function anschriftZeilenFuer(sprache: string): string[] {
  const land = LAND_NAMEN[sprache]?.[FIRMA.sitzland] ?? FIRMA.land;
  return anschriftZeilen().map((zeile) => zeile === FIRMA.land ? land : zeile);
}

function anschriftEinzeiligFuer(sprache: string): string {
  const { strasse, plz, ort } = FIRMA;
  if (!strasse || !plz || !ort) return "";
  const land = LAND_NAMEN[sprache]?.[FIRMA.sitzland] ?? FIRMA.land;
  return [strasse, `${plz} ${ort}`, land].filter(Boolean).join(", ");
}

/** Absender für Widerruf und Muster-Formular: Firmierung, Anschrift, E-Mail. */
function absender(sprache = "de"): string {
  return [FIRMA.name, anschriftEinzeiligFuer(sprache), FIRMA.email].filter(Boolean).join(", ");
}

/**
 * Verantwortliche Person, als Block wie im Impressum üblich: Name, dann die
 * Anschrift zeilenweise darunter.
 */
function verantwortlich(sprache = "de"): (string | null)[] {
  if (!FIRMA.vertreten) return [null];
  const zeilen = anschriftZeilenFuer(sprache);
  // anschriftZeilen() beginnt mit der Firmierung; hier steht die Person davor.
  return [FIRMA.vertreten, ...zeilen.slice(1)];
}

/*
 * Der Abschnitt nach § 18 Abs. 2 MStV steht auf ausdrücklichen Wunsch fest im
 * Impressum, unabhängig vom Sitzland.
 *
 * Hintergrund: § 18 Abs. 2 MStV verlangt bei journalistisch-redaktionellen
 * Angeboten die Benennung einer verantwortlichen Person mit Namen und
 * Anschrift — das Journal dieser Seite ist ein solches Angebot. Die Vorschrift
 * ist deutsches Landesmedienrecht; bei einem Unternehmenssitz in Polen hinge
 * die Zuständigkeit am Herkunftslandprinzip. Die Angabe zu machen schadet
 * dabei nicht: Sie ist entweder Pflicht oder eine freiwillige, zutreffende
 * Auskunft. Sie wegzulassen wäre im ersten Fall ein Verstoß.
 *
 * Achtung: Der Name allein genügt der Vorschrift nicht, sie verlangt auch die
 * Anschrift. Solange FIRMA.strasse leer ist, steht dort nur der Name.
 */

const de: Record<RechtSchluessel, RechtsseiteRoh> = {
  impressum: {
    titel: "Impressum",
    /* § 5 DDG gilt für in Deutschland niedergelassene Anbieter. Sitzt das
       Unternehmen in Polen, wäre die Angabe falsch — dann steht hier die
       neutrale Überschrift. */
    einleitung: FIRMA.sitzland === "DE" ? "Angaben gemäß § 5 DDG." : "Angaben zum Anbieter.",
    abschnitte: [
      { titel: "Anbieter", absaetze: anschriftZeilenFuer("de") },
      {
        titel: "Kontakt",
        absaetze: [
          ...kontaktZeilen("E-Mail", "Telefon und WhatsApp"),
          `Ansprechpartnerin: ${FIRMA.vertreten}`,
        ],
      },
      {
        titel: "Register",
        absaetze: [
          registerAngabe({
            ceidg: "Eingetragen in der Centralna Ewidencja i Informacja o Działalności Gospodarczej (CEIDG), dem polnischen Register für Einzelunternehmen.",
            krs: (nr) => `Eingetragen im Krajowy Rejestr Sądowy (KRS) unter der Nummer ${nr}.`,
          }),
        ],
      },
      {
        titel: "Steuerliche Angaben",
        absaetze: [
          ...steuerKennungen({
            nip: "Steuernummer (NIP)",
            regon: "Statistiknummer (REGON)",
            ustId: "Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG",
          }),
          FIRMA.sitzland === "PL" && FIRMA.ustId
            ? `Umsatzsteuer-Identifikationsnummer für den EU-Warenverkehr: ${FIRMA.ustId}`
            : null,
          umsatzsteuerbefreit(
              FIRMA.sitzland === "PL"
                ? "Es wird keine Umsatzsteuer berechnet und daher auch nicht ausgewiesen (Umsatzsteuerbefreiung nach Art. 113 des polnischen Umsatzsteuergesetzes)."
                : "Als Kleinunternehmen im Sinne des § 19 UStG wird keine Umsatzsteuer berechnet und daher auch nicht ausgewiesen.",
            ),
        ],
      },
      {
        titel: "Verantwortlich für journalistisch-redaktionelle Inhalte gemäß § 18 Abs. 2 MStV",
        absaetze: [...verantwortlich("de"), "Darüber hinaus sind in sozialen Netzwerken automatisiert erzeugte Beiträge als solche zu kennzeichnen (§ 18 Absatz 3 MStV)."],
      },
      {
        titel: "Verhältnis zum Hersteller",
        absaetze: [
          "Die angebotenen Produkte stammen von WaSH Innovation. Diese Seite wird von einem unabhängigen Vertriebspartner betrieben.",
        ],
      },
      {
        /* Die OS-Plattform der EU-Kommission ist am 20. Juli 2025 abgeschaltet
           worden (Verordnung (EU) 2024/3228 hebt die ODR-Verordnung auf). Der
           Hinweis darauf ist nicht nur entbehrlich geworden, er darf seither
           nicht mehr im Impressum stehen — der Link ging ins Leere. Geblieben
           ist die Erklärung nach § 36 VSBG. */
        // Weiches Trennzeichen nach „Verbraucher“: bei 320 px bricht das Wort
        // sonst ohne Trennstrich als „Verbraucherstreitbeile | gung“ um.
        titel: "Verbraucher\u00ADstreitbeilegung",
        absaetze: [
          "Wir sind weder verpflichtet noch bereit, an einem Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.",
        ],
      },
    ],
  },

  datenschutz: {
    titel: "Datenschutzerklärung",
    einleitung:
      "Diese Seite verarbeitet so wenige personenbezogene Daten wie möglich. Es gibt keine Analysewerkzeuge, keine Werbenetzwerke und keine Einbindungen fremder Server.",
    abschnitte: [
      {
        titel: "Verantwortliche Stelle",
        absaetze: [
          anschriftZeilenFuer("de").join(", ") || null,
          FIRMA.email ? `E-Mail: ${FIRMA.email}` : null,
          `Telefon: ${RUFNUMMER_LESBAR}`,
        ],
      },
      {
        titel: "Aufruf der Website",
        absaetze: [
          `Die Seite wird über ${HOSTER.dienst} von ${HOSTER.name}, ${HOSTER.anschrift}, ausgeliefert. Beim Aufruf werden technisch notwendige Zugriffsdaten verarbeitet, etwa IP-Adresse, Zeitpunkt, aufgerufene Adresse und Browserkennung. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (Interesse am sicheren Betrieb).`,
          "Die Seite besteht ausschließlich aus vorab erzeugten Dateien; es gibt keine Datenbank und keine Benutzerkonten. Mit dem Hosting ist eine Übermittlung in die USA verbunden.",
        ],
      },
      {
        titel: "Schriften und externe Inhalte",
        absaetze: [
          "Es werden ausschließlich Schriften des Betriebssystems verwendet. Es findet keine Verbindung zu Google Fonts oder einem anderen fremden Server statt.",
        ],
      },
      {
        titel: "Cookies",
        absaetze: [
          "Die Seite setzt keine Cookies und verwendet keine vergleichbaren Speichertechniken zu Analyse- oder Werbezwecken.",
        ],
      },
      {
        titel: "Kontakt über WhatsApp",
        absaetze: [
          "Auf mehreren Seiten steht ein Knopf, der einen WhatsApp-Chat öffnet. Es handelt sich um einen gewöhnlichen Link auf wa.me. Solange er nicht angeklickt wird, lädt diese Seite nichts von WhatsApp oder Meta und übermittelt auch nichts dorthin — es gibt kein eingebundenes Widget und kein Zählpixel.",
          "Wer den Knopf anklickt, verlässt diese Seite. Ab dann gilt die Datenschutzerklärung von WhatsApp Ireland Ltd. Übermittelt werden dabei die eigene Rufnummer, der Nachrichtentext und die üblichen Verbindungsdaten. Anbieter ist ein Unternehmen der Meta-Gruppe; eine Verarbeitung außerhalb der EU ist nicht ausgeschlossen.",
          "Wer das nicht möchte, erreicht uns genauso per Telefon. Über WhatsApp geführte Anfragen werden nur zur Bearbeitung genutzt und gelöscht, sobald sie erledigt sind und keine gesetzliche Aufbewahrungspflicht entgegensteht. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b bzw. lit. f DSGVO.",
        ],
      },
      {
        titel: "Bestellanfragen",
        absaetze: [
          "Das Formular für Bestellanfragen überträgt nichts an diese Website. Es stellt die Angaben auf dem eigenen Gerät zusammen und übergibt sie dem E-Mail-Programm oder WhatsApp — abgeschickt wird erst dort und von Hand.",
          "Zweck ist die Bearbeitung der Anfrage, Rechtsgrundlage Art. 6 Abs. 1 lit. b DSGVO.",
        ],
      },
      {
        titel: "Rechte der betroffenen Personen",
        absaetze: [
          "Es besteht ein Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch.",
          "Außerdem besteht ein Beschwerderecht bei einer Datenschutz-Aufsichtsbehörde — wahlweise bei der des eigenen Wohnorts oder bei der für uns zuständigen.",
          FIRMA.sitzland === "PL"
            ? "Für uns zuständig ist der Präsident des Amts für den Schutz personenbezogener Daten (Prezes Urzędu Ochrony Danych Osobowych), ul. Stawki 2, 00-193 Warschau, Polen."
            : null,
        ],
      },
    ],
  },

  agb: {
    titel: "Allgemeine Geschäftsbedingungen",
    einleitung:
      "Diese Bedingungen gelten für Bestellungen über diese Website.",
    abschnitte: [
      {
        titel: "Geltungsbereich",
        absaetze: [
          FIRMA.name
            ? `Für alle Verträge zwischen ${FIRMA.name} (nachfolgend „Anbieter“) und den Bestellenden gelten diese Bedingungen in der zum Zeitpunkt der Bestellung gültigen Fassung.`
            : null,
        ],
      },
      {
        titel: "Zustandekommen des Vertrags",
        absaetze: [
          "Es gibt zurzeit keinen Warenkorb mit Bestellabschluss. Eine über das Formular, per WhatsApp oder telefonisch gesendete Anfrage ist deshalb kein Angebot und keine Bestellung. Der Vertrag kommt erst zustande, wenn der Anbieter die Bestellung ausdrücklich bestätigt.",
        ],
      },
      {
        titel: "Preise",
        absaetze: [
          FIRMA.kleinunternehmer === true
            ? (FIRMA.sitzland === "PL"
                ? "Es wird keine Umsatzsteuer berechnet (Umsatzsteuerbefreiung nach Art. 113 des polnischen Umsatzsteuergesetzes)."
                : "Es wird keine Umsatzsteuer berechnet (Kleinunternehmerregelung nach § 19 UStG).")
            : FIRMA.kleinunternehmer === false
              ? "Alle Preise verstehen sich inklusive der gesetzlichen Umsatzsteuer."
              : null,
          "Preis und Versandkosten werden vor Vertragsschluss genannt und in der Bestätigung ausgewiesen.",
        ],
      },
      {
        titel: "Lieferung",
        absaetze: [
          "Liefergebiet und Lieferzeit werden vor Vertragsschluss mitgeteilt und in der Bestätigung genannt.",
        ],
      },
      {
        titel: "Zahlung",
        absaetze: ["Der Zahlungsweg wird in der Bestätigung der Bestellung mitgeteilt."],
      },
      { titel: "Gewährleistung", absaetze: ["Es gilt das gesetzliche Mängelhaftungsrecht."] },
      {
        /* Rom-I-Verordnung Art. 6: Bei Verbraucherverträgen darf eine Rechtswahl
           dem Verbraucher nicht den Schutz nehmen, den die zwingenden
           Vorschriften seines Aufenthaltsstaates gewähren. Eine Klausel, die nur
           „es gilt polnisches Recht“ sagt, wäre gegenüber deutschen Kundinnen
           und Kunden unwirksam und obendrein abmahnfähig. */
        titel: "Anwendbares Recht",
        absaetze: [
          FIRMA.sitzland === "PL"
            ? "Es gilt polnisches Recht. Verbraucherinnen und Verbrauchern bleibt dabei der Schutz erhalten, den die zwingenden Vorschriften ihres Aufenthaltsstaates gewähren — bei Bestellungen aus Deutschland also das deutsche Verbraucherschutzrecht (Art. 6 Rom-I-Verordnung)."
            : null,
        ],
      },
      {
        titel: "Das 1+1-Versprechen",
        absaetze: [
          "Das Spendenmodell ist noch nicht aktiv. Es wird erst beworben, wenn eine Partnerorganisation feststeht und die zugesagte Menge je verkaufter Einheit sowie der Lieferzeitraum konkret benannt werden können.",
          "Unbestimmte Formulierungen wie „ein Teil des Erlöses geht an Bedürftige“ sind wettbewerbsrechtlich angreifbar und werden deshalb nicht verwendet.",
        ],
      },
    ],
  },

  widerruf: {
    titel: "Widerrufsbelehrung",
    einleitung:
      "Verbraucherinnen und Verbraucher haben ein vierzehntägiges Widerrufsrecht. Der folgende Text folgt dem gesetzlichen Muster.",
    abschnitte: [
      {
        titel: "Widerrufsrecht",
        absaetze: [
          "Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen.",
          "Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag, an dem Sie oder ein von Ihnen benannter Dritter, der nicht der Beförderer ist, die Waren in Besitz genommen haben bzw. hat.",
          anschriftEinzeiligFuer("de")
            ? `Um Ihr Widerrufsrecht auszuüben, müssen Sie uns (${absender("de")}) mittels einer eindeutigen Erklärung über Ihren Entschluss informieren.`
            : null,
        ],
      },
      {
        titel: "Folgen des Widerrufs",
        absaetze: [
          "Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen erhalten haben, einschließlich der Lieferkosten, unverzüglich und spätestens binnen vierzehn Tagen zurückzuzahlen.",
          "Die unmittelbaren Kosten der Rücksendung tragen Sie.",
        ],
      },
      {
        titel: "Muster-Widerrufsformular",
        absaetze: [
          FIRMA.name
            ? `An ${absender("de")}: Hiermit widerrufe(n) ich/wir den von mir/uns abgeschlossenen Vertrag über den Kauf der folgenden Waren.`
            : null,
          FIRMA.name
            ? "Bestellt am / erhalten am, Name, Anschrift, Datum, Unterschrift bei Mitteilung auf Papier."
            : null,
        ],
      },
      {
        titel: "Hinweis zur Hygiene",
        absaetze: [
          "Bei versiegelten Waren, die aus Gründen des Gesundheitsschutzes oder der Hygiene nicht zur Rückgabe geeignet sind, erlischt das Widerrufsrecht, wenn die Versiegelung nach der Lieferung entfernt wurde.",
        ],
      },
    ],
  },

  "versand-zahlung": {
    titel: "Versand und Zahlung",
    einleitung: "Wie die Ware zu dir kommt und wie bezahlt wird.",
    abschnitte: [
      {
        titel: "Versand",
        absaetze: [
          "Versandkosten und Lieferzeit nennen wir in der Antwort auf die Bestellanfrage, bevor eine Bestellung verbindlich wird.",
        ],
      },
      {
        titel: "Zahlung",
        absaetze: [
          "Bestellungen werden zurzeit als Anfrage entgegengenommen; die Zahlungsweise wird in der Bestätigung mitgeteilt.",
          "Mit Eröffnung des Shops werden hier die tatsächlich verfügbaren Zahlungswege aufgeführt.",
        ],
      },
    ],
  },
};

const en: Record<RechtSchluessel, RechtsseiteRoh> = {
  impressum: {
    titel: "Legal notice",
    einleitung: FIRMA.sitzland === "DE"
      ? "Information according to § 5 DDG (German Digital Services Act)."
      : "Provider information.",
    abschnitte: [
      { titel: "Provider", absaetze: anschriftZeilenFuer("en") },
      {
        titel: "Contact",
        absaetze: [
          ...kontaktZeilen("Email", "Phone and WhatsApp"),
          `Contact person: ${FIRMA.vertreten}`,
        ],
      },
      {
        titel: "Register",
        absaetze: [
          registerAngabe({
            ceidg: "Registered in the Centralna Ewidencja i Informacja o Działalności Gospodarczej (CEIDG), the Polish register of sole proprietorships.",
            krs: (nr) => `Registered in the Krajowy Rejestr Sądowy (KRS) under number ${nr}.`,
          }),
        ],
      },
      {
        titel: "Tax details",
        absaetze: [
          ...steuerKennungen({
            nip: "Tax number (NIP)",
            regon: "Statistical number (REGON)",
            ustId: "VAT identification number under § 27a UStG",
          }),
          FIRMA.sitzland === "PL" && FIRMA.ustId
            ? `EU VAT identification number: ${FIRMA.ustId}`
            : null,
          umsatzsteuerbefreit(
              FIRMA.sitzland === "PL"
                ? "No VAT is charged and none is shown (VAT exemption under Art. 113 of the Polish VAT Act)."
                : "As a small business within the meaning of § 19 UStG, no VAT is charged and none is shown.",
            ),
        ],
      },
      {
        titel: "Responsible for journalistic and editorial content under § 18(2) MStV",
        absaetze: [...verantwortlich("en"), "In addition, automatically generated posts in social networks must be labelled as such (§ 18(3) MStV)."],
      },
      {
        titel: "Relationship with the manufacturer",
        absaetze: [
          "The products are made by WaSH Innovation. This site is operated by an independent distribution partner.",
        ],
      },
      {
        titel: "Consumer dispute resolution",
        absaetze: [
          "We are neither willing nor obliged to take part in dispute resolution proceedings before a consumer arbitration board.",
        ],
      },
    ],
  },
  datenschutz: {
    titel: "Privacy policy",
    einleitung:
      "This site processes as little personal data as possible. There are no analytics tools, no ad networks and no third-party embeds.",
    abschnitte: [
      {
        titel: "Controller",
        absaetze: [
          anschriftZeilenFuer("en").join(", ") || null,
          FIRMA.email ? `Email: ${FIRMA.email}` : null,
          `Phone: ${RUFNUMMER_LESBAR}`,
        ],
      },
      {
        titel: "Visiting the website",
        absaetze: [
          `The site is served through ${HOSTER.dienst} by ${HOSTER.name}, ${HOSTER.anschrift}. Technically necessary access data is processed on each visit, such as IP address, time, requested address and browser identification. The legal basis is Art. 6(1)(f) GDPR.`,
          "The site consists solely of pre-built files; there is no database and there are no user accounts. Hosting involves a transfer to the USA.",
        ],
      },
      {
        titel: "Fonts and external content",
        absaetze: ["Only system fonts are used. No connection is made to Google Fonts or any other third-party server."],
      },
      {
        titel: "Cookies",
        absaetze: ["The site sets no cookies and uses no comparable storage for analytics or advertising."],
      },
      {
        titel: "Contact via WhatsApp",
        absaetze: [
          "Several pages carry a button that opens a WhatsApp chat. It is an ordinary link to wa.me. Until it is clicked, this site loads nothing from WhatsApp or Meta and transmits nothing there — there is no embedded widget and no tracking pixel.",
          "Clicking the button takes you off this site. From that point WhatsApp Ireland Ltd.'s privacy policy applies. Your phone number, the message text and the usual connection data are transmitted. The provider is a Meta company; processing outside the EU cannot be ruled out.",
          "If you would rather not use it, the phone reaches us just as well. Enquiries received via WhatsApp are used solely to handle the enquiry and are deleted once it is settled, unless a statutory retention duty applies. The legal basis is Art. 6(1)(b) or (f) GDPR.",
        ],
      },
      {
        titel: "Order enquiries",
        absaetze: [
          "The enquiry form transmits nothing to this website. It assembles your details on your own device and hands them to your email program or to WhatsApp — sending happens there, by hand.",
          "The purpose is processing your enquiry; the legal basis is Art. 6(1)(b) GDPR.",
        ],
      },
      {
        titel: "Your rights",
        absaetze: [
          "You have the right to information, rectification, erasure, restriction of processing, data portability and objection.",
          "You also have the right to lodge a complaint with a data protection supervisory authority — either the one for your place of residence or the one responsible for us.",
          FIRMA.sitzland === "PL"
            ? "The authority responsible for us is the President of the Personal Data Protection Office (Prezes Urzędu Ochrony Danych Osobowych), ul. Stawki 2, 00-193 Warsaw, Poland."
            : null,
        ],
      },
    ],
  },
  agb: {
    titel: "Terms and conditions",
    einleitung:
      "These terms apply to orders placed through this website.",
    abschnitte: [
      {
        titel: "Scope",
        absaetze: [
          FIRMA.name ? `These terms apply to all contracts between ${FIRMA.name} and the customer.` : null,
        ],
      },
      {
        titel: "Formation of contract",
        absaetze: [
          "There is currently no checkout. An enquiry sent through the form, via WhatsApp or by phone is therefore neither an offer nor an order. A contract is formed only once the provider expressly confirms the order.",
        ],
      },
      {
        titel: "Prices",
        absaetze: [
          FIRMA.kleinunternehmer === true
            ? (FIRMA.sitzland === "PL"
                ? "No VAT is charged (VAT exemption under Art. 113 of the Polish VAT Act)."
                : "No VAT is charged (small business rule under § 19 UStG).")
            : FIRMA.kleinunternehmer === false
              ? "All prices include statutory VAT."
              : null,
          "Price and shipping costs are stated before the contract is concluded and shown in the confirmation.",
        ],
      },
      {
        titel: "Delivery",
        absaetze: [
          "Delivery area and delivery time are communicated before the contract is concluded and stated in the confirmation.",
        ],
      },
      { titel: "Payment", absaetze: ["The payment method is communicated in the order confirmation."] },
      { titel: "Warranty", absaetze: ["Statutory warranty rights apply."] },
      {
        titel: "Applicable law",
        absaetze: [
          FIRMA.sitzland === "PL"
            ? "Polish law applies. Consumers nevertheless keep the protection afforded by the mandatory provisions of their country of residence — for orders from Germany, that means German consumer protection law (Art. 6 Rome I Regulation)."
            : null,
        ],
      },
      {
        titel: "The 1+1 promise",
        absaetze: [
          "The donation model is not active yet. It will only be advertised once a partner organisation is confirmed and the quantity per unit sold and the delivery period can be stated specifically.",
        ],
      },
    ],
  },
  widerruf: {
    titel: "Right of withdrawal",
    einleitung:
      "Consumers have a fourteen-day right of withdrawal. The following follows the statutory model text.",
    abschnitte: [
      {
        titel: "Right of withdrawal",
        absaetze: [
          "You have the right to withdraw from this contract within fourteen days without giving any reason.",
          "The withdrawal period expires fourteen days from the day on which you, or a third party other than the carrier indicated by you, acquires physical possession of the goods.",
          anschriftEinzeiligFuer("en")
            ? `To exercise this right you must inform us (${absender("en")}) by an unequivocal statement.`
            : null,
        ],
      },
      {
        titel: "Effects of withdrawal",
        absaetze: [
          "If you withdraw from this contract, we shall reimburse all payments received from you, including the costs of delivery, without undue delay and no later than fourteen days.",
          "You bear the direct cost of returning the goods.",
        ],
      },
      {
        titel: "Hygiene note",
        absaetze: [
          "For sealed goods which are not suitable for return for reasons of health protection or hygiene, the right of withdrawal lapses once the seal has been removed after delivery.",
        ],
      },
    ],
  },
  "versand-zahlung": {
    titel: "Shipping and payment",
    einleitung: "How the goods reach you and how payment works.",
    abschnitte: [
      {
        titel: "Shipping",
        absaetze: [
          "Shipping costs and delivery time are stated in our reply to your enquiry, before an order becomes binding.",
        ],
      },
      {
        titel: "Payment",
        absaetze: [
          "Orders are currently taken as enquiries; the payment method is communicated in the confirmation.",
        ],
      },
    ],
  },
};

const it: Record<RechtSchluessel, RechtsseiteRoh> = {
  impressum: {
    titel: "Note legali",
    einleitung: FIRMA.sitzland === "DE"
      ? "Informazioni ai sensi del § 5 della legge tedesca sui servizi digitali (DDG)."
      : "Informazioni sul fornitore.",
    abschnitte: [
      { titel: "Fornitore", absaetze: anschriftZeilenFuer("it") },
      {
        titel: "Contatti",
        absaetze: [
          ...kontaktZeilen("E-mail", "Telefono e WhatsApp"),
          `Referente: ${FIRMA.vertreten}`,
        ],
      },
      {
        titel: "Registro",
        absaetze: [
          registerAngabe({
            ceidg: "Iscritta alla Centralna Ewidencja i Informacja o Działalności Gospodarczej (CEIDG), il registro polacco delle imprese individuali.",
            krs: (nr) => `Iscritta al Krajowy Rejestr Sądowy (KRS) con il numero ${nr}.`,
          }),
        ],
      },
      {
        titel: "Dati fiscali",
        absaetze: [
          ...steuerKennungen({
            nip: "Codice fiscale (NIP)",
            regon: "Numero statistico (REGON)",
            ustId: "Partita IVA ai sensi del § 27a UStG",
          }),
          FIRMA.sitzland === "PL" && FIRMA.ustId
            ? `Partita IVA per gli scambi intracomunitari: ${FIRMA.ustId}`
            : null,
          umsatzsteuerbefreit(
            FIRMA.sitzland === "PL"
              ? "L’IVA non viene addebitata né indicata (esenzione ai sensi dell’art. 113 della legge polacca sull’IVA)."
              : "In quanto piccola impresa ai sensi del § 19 UStG, l’IVA non viene addebitata né indicata.",
          ),
        ],
      },
      {
        titel: "Responsabile dei contenuti giornalistici ed editoriali ai sensi del § 18, comma 2 MStV",
        absaetze: [
          ...verantwortlich("it"),
          "Inoltre, i post generati automaticamente sui social network devono essere contrassegnati come tali (§ 18, comma 3 MStV).",
        ],
      },
      {
        titel: "Rapporto con il produttore",
        absaetze: [
          "I prodotti offerti sono realizzati da WaSH Innovation. Questo sito è gestito da un distributore indipendente.",
        ],
      },
      {
        titel: "Risoluzione delle controversie dei consumatori",
        absaetze: [
          "Non siamo obbligati né disponibili a partecipare a una procedura di risoluzione delle controversie dinanzi a un organismo di conciliazione dei consumatori.",
        ],
      },
    ],
  },
  datenschutz: {
    titel: "Informativa sulla privacy",
    einleitung:
      "Questo sito tratta il minor numero possibile di dati personali. Non utilizza strumenti di analisi, reti pubblicitarie o contenuti incorporati da server di terzi.",
    abschnitte: [
      {
        titel: "Titolare del trattamento",
        absaetze: [
          anschriftZeilenFuer("it").join(", ") || null,
          FIRMA.email ? `E-mail: ${FIRMA.email}` : null,
          `Telefono: ${RUFNUMMER_LESBAR}`,
        ],
      },
      {
        titel: "Accesso al sito",
        absaetze: [
          `Il sito viene fornito tramite ${HOSTER.dienst} da ${HOSTER.name}, ${HOSTER.anschrift}. A ogni accesso vengono trattati dati tecnicamente necessari, come indirizzo IP, ora, indirizzo richiesto e identificativo del browser. La base giuridica è l’art. 6, par. 1, lett. f GDPR (interesse al funzionamento sicuro).`,
          "Il sito è costituito esclusivamente da file generati in anticipo; non sono presenti database né account utente. L’hosting comporta un trasferimento di dati negli Stati Uniti.",
        ],
      },
      {
        titel: "Font e contenuti esterni",
        absaetze: [
          "Vengono utilizzati esclusivamente i font del sistema operativo. Non viene stabilita alcuna connessione con Google Fonts o altri server di terzi.",
        ],
      },
      {
        titel: "Cookie",
        absaetze: [
          "Il sito non imposta cookie e non utilizza tecnologie di memorizzazione analoghe per finalità di analisi o pubblicità.",
        ],
      },
      {
        titel: "Contatto tramite WhatsApp",
        absaetze: [
          "Diverse pagine contengono un pulsante che apre una chat WhatsApp. Si tratta di un normale link a wa.me. Finché non viene selezionato, questo sito non carica nulla da WhatsApp o Meta e non trasmette loro alcun dato: non sono presenti widget incorporati né pixel di tracciamento.",
          "Toccando il pulsante si lascia questo sito. Da quel momento si applica l’informativa sulla privacy di WhatsApp Ireland Ltd. Vengono trasmessi il proprio numero di telefono, il testo del messaggio e i normali dati di connessione. Il fornitore fa parte del gruppo Meta; non si può escludere un trattamento al di fuori dell’Unione europea.",
          "Se non vuoi utilizzare WhatsApp, puoi contattarci anche per telefono. Le richieste ricevute tramite WhatsApp vengono utilizzate solo per gestire la richiesta e cancellate una volta conclusa, salvo obblighi legali di conservazione. La base giuridica è l’art. 6, par. 1, lett. b o f GDPR.",
        ],
      },
      {
        titel: "Richieste d’ordine",
        absaetze: [
          "Il modulo per le richieste d’ordine non trasmette nulla a questo sito. Compone i dati sul tuo dispositivo e li passa al programma di posta elettronica o a WhatsApp; l’invio avviene lì, manualmente.",
          "La finalità è la gestione della richiesta; la base giuridica è l’art. 6, par. 1, lett. b GDPR.",
        ],
      },
      {
        titel: "I tuoi diritti",
        absaetze: [
          "Hai diritto di accesso, rettifica, cancellazione, limitazione del trattamento, portabilità dei dati e opposizione.",
          "Hai inoltre il diritto di presentare reclamo a un’autorità di controllo per la protezione dei dati, scegliendo quella del tuo luogo di residenza oppure quella competente per noi.",
          FIRMA.sitzland === "PL"
            ? "L’autorità competente per noi è il Presidente dell’Ufficio per la protezione dei dati personali (Prezes Urzędu Ochrony Danych Osobowych), ul. Stawki 2, 00-193 Varsavia, Polonia."
            : null,
        ],
      },
    ],
  },
  agb: {
    titel: "Condizioni generali",
    einleitung: "Le presenti condizioni si applicano agli ordini effettuati tramite questo sito.",
    abschnitte: [
      {
        titel: "Ambito di applicazione",
        absaetze: [
          FIRMA.name
            ? `Le presenti condizioni, nella versione valida al momento dell’ordine, si applicano a tutti i contratti tra ${FIRMA.name} (di seguito «fornitore») e chi effettua l’ordine.`
            : null,
        ],
      },
      {
        titel: "Conclusione del contratto",
        absaetze: [
          "Al momento non esiste un carrello con conclusione dell’ordine. Una richiesta inviata tramite il modulo, WhatsApp o telefono non costituisce quindi né un’offerta né un ordine. Il contratto si conclude solo quando il fornitore conferma espressamente l’ordine.",
        ],
      },
      {
        titel: "Prezzi",
        absaetze: [
          FIRMA.kleinunternehmer === true
            ? (FIRMA.sitzland === "PL"
                ? "L’IVA non viene addebitata (esenzione ai sensi dell’art. 113 della legge polacca sull’IVA)."
                : "L’IVA non viene addebitata (regime delle piccole imprese ai sensi del § 19 UStG).")
            : FIRMA.kleinunternehmer === false
              ? "Tutti i prezzi includono l’IVA prevista dalla legge."
              : null,
          "Il prezzo e le spese di spedizione vengono comunicati prima della conclusione del contratto e indicati nella conferma.",
        ],
      },
      {
        titel: "Consegna",
        absaetze: [
          "L’area e i tempi di consegna vengono comunicati prima della conclusione del contratto e indicati nella conferma.",
        ],
      },
      {
        titel: "Pagamento",
        absaetze: ["Il metodo di pagamento viene comunicato nella conferma dell’ordine."],
      },
      {
        titel: "Garanzia legale",
        absaetze: ["Si applicano le disposizioni di legge sulla responsabilità per difetti."],
      },
      {
        titel: "Diritto applicabile",
        absaetze: [
          FIRMA.sitzland === "PL"
            ? "Si applica il diritto polacco. I consumatori conservano comunque la tutela garantita dalle disposizioni inderogabili del proprio Paese di residenza — per gli ordini dalla Germania, ciò significa il diritto tedesco a tutela dei consumatori (art. 6 del regolamento Roma I)."
            : null,
        ],
      },
      {
        titel: "La promessa 1+1",
        absaetze: [
          "Il modello di donazione non è ancora attivo. Verrà pubblicizzato solo quando sarà confermata un’organizzazione partner e sarà possibile indicare con precisione la quantità promessa per ogni unità venduta e il periodo di consegna.",
          "Non utilizziamo formulazioni vaghe come «una parte dei ricavi va alle persone bisognose», perché possono essere contestate ai sensi del diritto della concorrenza.",
        ],
      },
    ],
  },
  widerruf: {
    titel: "Diritto di recesso",
    einleitung:
      "I consumatori dispongono di un diritto di recesso di quattordici giorni. Il testo seguente riprende il modello previsto dalla legge.",
    abschnitte: [
      {
        titel: "Diritto di recesso",
        absaetze: [
          "Hai il diritto di recedere dal presente contratto entro quattordici giorni senza indicarne il motivo.",
          "Il periodo di recesso è di quattordici giorni dal giorno in cui tu o un terzo da te designato, diverso dal vettore, acquisite il possesso fisico dei beni.",
          anschriftEinzeiligFuer("it")
            ? `Per esercitare il diritto di recesso, devi informarci (${absender("it")}) della tua decisione mediante una dichiarazione inequivocabile.`
            : null,
        ],
      },
      {
        titel: "Effetti del recesso",
        absaetze: [
          "Se recedi dal presente contratto, ti rimborseremo tutti i pagamenti ricevuti, comprese le spese di consegna, senza indebito ritardo e comunque entro quattordici giorni.",
          "I costi diretti della restituzione dei beni sono a tuo carico.",
        ],
      },
      {
        titel: "Modulo tipo di recesso",
        absaetze: [
          FIRMA.name
            ? `A ${absender("it")}: con la presente io/noi comunico/comunichiamo il recesso dal contratto concluso per l’acquisto dei seguenti beni.`
            : null,
          FIRMA.name
            ? "Ordinato il / ricevuto il, nome, indirizzo, data e firma in caso di comunicazione su carta."
            : null,
        ],
      },
      {
        titel: "Nota sull’igiene",
        absaetze: [
          "Per i beni sigillati che non si prestano alla restituzione per motivi di tutela della salute o di igiene, il diritto di recesso decade se il sigillo viene rimosso dopo la consegna.",
        ],
      },
    ],
  },
  "versand-zahlung": {
    titel: "Spedizione e pagamento",
    einleitung: "Come ricevi la merce e come avviene il pagamento.",
    abschnitte: [
      {
        titel: "Spedizione",
        absaetze: [
          "Comunichiamo costi e tempi di spedizione nella risposta alla richiesta, prima che l’ordine diventi vincolante.",
        ],
      },
      {
        titel: "Pagamento",
        absaetze: [
          "Al momento gli ordini vengono ricevuti come richieste; il metodo di pagamento viene comunicato nella conferma.",
          "Quando il negozio aprirà, qui verranno indicati i metodi di pagamento effettivamente disponibili.",
        ],
      },
    ],
  },
};

const es: Record<RechtSchluessel, RechtsseiteRoh> = {
  impressum: {
    titel: "Aviso legal",
    einleitung: FIRMA.sitzland === "DE"
      ? "Información conforme al § 5 de la Ley alemana de Servicios Digitales (DDG)."
      : "Información sobre el proveedor.",
    abschnitte: [
      { titel: "Proveedor", absaetze: anschriftZeilenFuer("es") },
      {
        titel: "Contacto",
        absaetze: [
          ...kontaktZeilen("Correo electrónico", "Teléfono y WhatsApp"),
          `Persona de contacto: ${FIRMA.vertreten}`,
        ],
      },
      {
        titel: "Registro",
        absaetze: [
          registerAngabe({
            ceidg: "Inscrita en la Centralna Ewidencja i Informacja o Działalności Gospodarczej (CEIDG), el registro polaco de empresarios individuales.",
            krs: (nr) => `Inscrita en el Krajowy Rejestr Sądowy (KRS) con el número ${nr}.`,
          }),
        ],
      },
      {
        titel: "Datos fiscales",
        absaetze: [
          ...steuerKennungen({
            nip: "Número fiscal (NIP)",
            regon: "Número estadístico (REGON)",
            ustId: "Número de identificación a efectos del IVA conforme al § 27a UStG",
          }),
          FIRMA.sitzland === "PL" && FIRMA.ustId
            ? `Número de identificación a efectos del IVA intracomunitario: ${FIRMA.ustId}`
            : null,
          umsatzsteuerbefreit(
            FIRMA.sitzland === "PL"
              ? "No se cobra ni se indica IVA (exención conforme al art. 113 de la Ley polaca del IVA)."
              : "Como pequeña empresa en el sentido del § 19 UStG, no se cobra ni se indica IVA.",
          ),
        ],
      },
      {
        titel: "Responsable del contenido periodístico y editorial conforme al § 18, apdo. 2 MStV",
        absaetze: [
          ...verantwortlich("es"),
          "Además, las publicaciones generadas automáticamente en redes sociales deben identificarse como tales (§ 18, apdo. 3 MStV).",
        ],
      },
      {
        titel: "Relación con el fabricante",
        absaetze: [
          "Los productos ofrecidos proceden de WaSH Innovation. Esta web está gestionada por un distribuidor independiente.",
        ],
      },
      {
        titel: "Resolución de litigios de consumo",
        absaetze: [
          "No estamos obligados ni dispuestos a participar en un procedimiento de resolución de litigios ante una junta arbitral de consumo.",
        ],
      },
    ],
  },
  datenschutz: {
    titel: "Política de privacidad",
    einleitung:
      "Esta web trata la menor cantidad posible de datos personales. No utiliza herramientas de análisis, redes publicitarias ni contenidos integrados desde servidores de terceros.",
    abschnitte: [
      {
        titel: "Responsable del tratamiento",
        absaetze: [
          anschriftZeilenFuer("es").join(", ") || null,
          FIRMA.email ? `Correo electrónico: ${FIRMA.email}` : null,
          `Teléfono: ${RUFNUMMER_LESBAR}`,
        ],
      },
      {
        titel: "Acceso a la web",
        absaetze: [
          `La web se sirve a través de ${HOSTER.dienst}, un servicio de ${HOSTER.name}, ${HOSTER.anschrift}. Al acceder se tratan datos técnicamente necesarios, como la dirección IP, la hora, la dirección solicitada y la identificación del navegador. La base jurídica es el art. 6.1.f del RGPD (interés en un funcionamiento seguro).`,
          "La web se compone exclusivamente de archivos generados previamente; no existe una base de datos ni cuentas de usuario. El alojamiento implica una transferencia de datos a Estados Unidos.",
        ],
      },
      {
        titel: "Fuentes y contenidos externos",
        absaetze: [
          "Solo se utilizan las fuentes del sistema operativo. No se establece ninguna conexión con Google Fonts ni con otros servidores de terceros.",
        ],
      },
      {
        titel: "Cookies",
        absaetze: [
          "La web no instala cookies ni utiliza tecnologías de almacenamiento comparables con fines de análisis o publicidad.",
        ],
      },
      {
        titel: "Contacto por WhatsApp",
        absaetze: [
          "Varias páginas incluyen un botón que abre un chat de WhatsApp. Se trata de un enlace normal a wa.me. Mientras no se pulse, esta web no carga nada de WhatsApp o Meta ni les transmite información: no hay ningún widget integrado ni píxel de seguimiento.",
          "Al pulsar el botón abandonas esta web. A partir de ese momento se aplica la política de privacidad de WhatsApp Ireland Ltd. Se transmiten tu número de teléfono, el texto del mensaje y los datos de conexión habituales. El proveedor pertenece al grupo Meta y no puede descartarse el tratamiento fuera de la Unión Europea.",
          "Si prefieres no utilizar WhatsApp, también puedes llamarnos por teléfono. Las consultas recibidas por WhatsApp se utilizan únicamente para tramitarlas y se eliminan una vez resueltas, salvo que exista una obligación legal de conservación. La base jurídica es el art. 6.1.b o f del RGPD.",
        ],
      },
      {
        titel: "Solicitudes de pedido",
        absaetze: [
          "El formulario de solicitud no transmite nada a esta web. Reúne los datos en tu propio dispositivo y los entrega a tu programa de correo o a WhatsApp; el envío se realiza allí de forma manual.",
          "La finalidad es tramitar la consulta; la base jurídica es el art. 6.1.b del RGPD.",
        ],
      },
      {
        titel: "Tus derechos",
        absaetze: [
          "Tienes derecho de acceso, rectificación, supresión, limitación del tratamiento, portabilidad de los datos y oposición.",
          "También puedes presentar una reclamación ante una autoridad de protección de datos, ya sea la de tu lugar de residencia o la que sea competente respecto de nosotros.",
          FIRMA.sitzland === "PL"
            ? "La autoridad competente respecto de nosotros es el Presidente de la Oficina de Protección de Datos Personales (Prezes Urzędu Ochrony Danych Osobowych), ul. Stawki 2, 00-193 Varsovia, Polonia."
            : null,
        ],
      },
    ],
  },
  agb: {
    titel: "Condiciones generales",
    einleitung: "Estas condiciones se aplican a los pedidos realizados a través de esta web.",
    abschnitte: [
      {
        titel: "Ámbito de aplicación",
        absaetze: [
          FIRMA.name
            ? `Estas condiciones, en la versión vigente en el momento del pedido, se aplican a todos los contratos entre ${FIRMA.name} (en adelante, el «proveedor») y quien realiza el pedido.`
            : null,
        ],
      },
      {
        titel: "Celebración del contrato",
        absaetze: [
          "Actualmente no existe un carrito con finalización de compra. Por tanto, una consulta enviada mediante el formulario, por WhatsApp o por teléfono no constituye una oferta ni un pedido. El contrato solo se celebra cuando el proveedor confirma expresamente el pedido.",
        ],
      },
      {
        titel: "Precios",
        absaetze: [
          FIRMA.kleinunternehmer === true
            ? (FIRMA.sitzland === "PL"
                ? "No se cobra IVA (exención conforme al art. 113 de la Ley polaca del IVA)."
                : "No se cobra IVA (régimen de pequeña empresa conforme al § 19 UStG).")
            : FIRMA.kleinunternehmer === false
              ? "Todos los precios incluyen el IVA legal."
              : null,
          "El precio y los gastos de envío se comunican antes de celebrar el contrato y figuran en la confirmación.",
        ],
      },
      {
        titel: "Entrega",
        absaetze: [
          "La zona y el plazo de entrega se comunican antes de celebrar el contrato y figuran en la confirmación.",
        ],
      },
      {
        titel: "Pago",
        absaetze: ["La forma de pago se comunica en la confirmación del pedido."],
      },
      {
        titel: "Garantía legal",
        absaetze: ["Se aplica el régimen legal de responsabilidad por defectos."],
      },
      {
        titel: "Derecho aplicable",
        absaetze: [
          FIRMA.sitzland === "PL"
            ? "Se aplica el derecho polaco. No obstante, los consumidores conservan la protección que les conceden las normas imperativas de su país de residencia; para pedidos desde Alemania, se trata de la legislación alemana de protección de los consumidores (art. 6 del Reglamento Roma I)."
            : null,
        ],
      },
      {
        titel: "La promesa 1+1",
        absaetze: [
          "El modelo de donación aún no está activo. Solo se anunciará cuando se haya confirmado una entidad colaboradora y puedan indicarse de forma concreta la cantidad prometida por unidad vendida y el plazo de entrega.",
          "No utilizamos expresiones vagas como «una parte de los ingresos se destina a personas necesitadas», porque pueden ser impugnadas conforme al derecho de la competencia.",
        ],
      },
    ],
  },
  widerruf: {
    titel: "Derecho de desistimiento",
    einleitung:
      "Los consumidores disponen de un derecho de desistimiento de catorce días. El texto siguiente se ajusta al modelo legal.",
    abschnitte: [
      {
        titel: "Derecho de desistimiento",
        absaetze: [
          "Tienes derecho a desistir de este contrato en un plazo de catorce días sin necesidad de indicar el motivo.",
          "El plazo de desistimiento es de catorce días desde el día en que tú o un tercero que hayas indicado, distinto del transportista, adquiera la posesión material de los bienes.",
          anschriftEinzeiligFuer("es")
            ? `Para ejercer el derecho de desistimiento, debes informarnos (${absender("es")}) mediante una declaración inequívoca de tu decisión.`
            : null,
        ],
      },
      {
        titel: "Consecuencias del desistimiento",
        absaetze: [
          "Si desistes de este contrato, te reembolsaremos todos los pagos recibidos, incluidos los gastos de entrega, sin demora indebida y, a más tardar, en catorce días.",
          "Los costes directos de devolución de los bienes corren por tu cuenta.",
        ],
      },
      {
        titel: "Modelo de formulario de desistimiento",
        absaetze: [
          FIRMA.name
            ? `A ${absender("es")}: por la presente comunico/comunicamos que desisto/desistimos del contrato de compra de los siguientes bienes.`
            : null,
          FIRMA.name
            ? "Pedido el / recibido el, nombre, dirección, fecha y firma si la comunicación se presenta en papel."
            : null,
        ],
      },
      {
        titel: "Nota sobre higiene",
        absaetze: [
          "En el caso de bienes precintados que no sean aptos para su devolución por razones de protección de la salud o de higiene, el derecho de desistimiento se extingue si el precinto se retira después de la entrega.",
        ],
      },
    ],
  },
  "versand-zahlung": {
    titel: "Envío y pago",
    einleitung: "Cómo recibes los productos y cómo se realiza el pago.",
    abschnitte: [
      {
        titel: "Envío",
        absaetze: [
          "Te indicaremos los gastos y el plazo de envío en la respuesta a tu consulta, antes de que el pedido sea vinculante.",
        ],
      },
      {
        titel: "Pago",
        absaetze: [
          "Actualmente los pedidos se reciben como solicitudes; la forma de pago se comunica en la confirmación.",
          "Cuando abra la tienda, aquí se indicarán las formas de pago que estén realmente disponibles.",
        ],
      },
    ],
  },
};

const fr: Record<RechtSchluessel, RechtsseiteRoh> = {
  impressum: {
    titel: "Mentions légales",
    einleitung: FIRMA.sitzland === "DE"
      ? "Informations conformément au § 5 de la loi allemande sur les services numériques (DDG)."
      : "Informations sur le fournisseur.",
    abschnitte: [
      { titel: "Fournisseur", absaetze: anschriftZeilenFuer("fr") },
      {
        titel: "Contact",
        absaetze: [
          ...kontaktZeilen("E-mail", "Téléphone et WhatsApp"),
          `Interlocutrice : ${FIRMA.vertreten}`,
        ],
      },
      {
        titel: "Registre",
        absaetze: [
          registerAngabe({
            ceidg: "Inscrite à la Centralna Ewidencja i Informacja o Działalności Gospodarczej (CEIDG), le registre polonais des entreprises individuelles.",
            krs: (nr) => `Inscrite au Krajowy Rejestr Sądowy (KRS) sous le numéro ${nr}.`,
          }),
        ],
      },
      {
        titel: "Informations fiscales",
        absaetze: [
          ...steuerKennungen({
            nip: "Numéro fiscal (NIP)",
            regon: "Numéro statistique (REGON)",
            ustId: "Numéro d’identification TVA selon le § 27a UStG",
          }),
          FIRMA.sitzland === "PL" && FIRMA.ustId
            ? `Numéro d’identification TVA intracommunautaire : ${FIRMA.ustId}`
            : null,
          umsatzsteuerbefreit(
            FIRMA.sitzland === "PL"
              ? "Aucune TVA n’est facturée ni indiquée (exonération conformément à l’art. 113 de la loi polonaise sur la TVA)."
              : "En tant que petite entreprise au sens du § 19 UStG, aucune TVA n’est facturée ni indiquée.",
          ),
        ],
      },
      {
        titel: "Responsable des contenus journalistiques et éditoriaux conformément au § 18, al. 2 MStV",
        absaetze: [
          ...verantwortlich("fr"),
          "En outre, les publications générées automatiquement sur les réseaux sociaux doivent être signalées comme telles (§ 18, al. 3 MStV).",
        ],
      },
      {
        titel: "Relation avec le fabricant",
        absaetze: [
          "Les produits proposés sont fabriqués par WaSH Innovation. Ce site est exploité par un partenaire de distribution indépendant.",
        ],
      },
      {
        titel: "Règlement des litiges de consommation",
        absaetze: [
          "Nous ne sommes ni tenus ni disposés à participer à une procédure de règlement des litiges devant un organisme de médiation de la consommation.",
        ],
      },
    ],
  },
  datenschutz: {
    titel: "Politique de confidentialité",
    einleitung:
      "Ce site traite aussi peu de données à caractère personnel que possible. Il ne comporte aucun outil d’analyse, aucun réseau publicitaire et aucune intégration provenant de serveurs tiers.",
    abschnitte: [
      {
        titel: "Responsable du traitement",
        absaetze: [
          anschriftZeilenFuer("fr").join(", ") || null,
          FIRMA.email ? `E-mail : ${FIRMA.email}` : null,
          `Téléphone : ${RUFNUMMER_LESBAR}`,
        ],
      },
      {
        titel: "Consultation du site",
        absaetze: [
          `Le site est fourni par ${HOSTER.name}, ${HOSTER.anschrift}, via le service ${HOSTER.dienst}. Lors de chaque consultation, des données d’accès techniquement nécessaires sont traitées, notamment l’adresse IP, l’heure, l’adresse demandée et l’identifiant du navigateur. La base juridique est l’art. 6, al. 1, point f du RGPD (intérêt au fonctionnement sécurisé du site).`,
          "Le site se compose exclusivement de fichiers générés à l’avance ; il ne contient ni base de données ni compte utilisateur. L’hébergement implique un transfert de données vers les États-Unis.",
        ],
      },
      {
        titel: "Polices et contenus externes",
        absaetze: [
          "Seules les polices du système d’exploitation sont utilisées. Aucune connexion n’est établie avec Google Fonts ou un autre serveur tiers.",
        ],
      },
      {
        titel: "Cookies",
        absaetze: [
          "Le site ne dépose aucun cookie et n’utilise aucune technologie de stockage comparable à des fins d’analyse ou de publicité.",
        ],
      },
      {
        titel: "Contact via WhatsApp",
        absaetze: [
          "Plusieurs pages comportent un bouton qui ouvre une discussion WhatsApp. Il s’agit d’un simple lien vers wa.me. Tant que vous ne cliquez pas dessus, ce site ne charge aucun contenu de WhatsApp ou Meta et ne leur transmet aucune donnée : il n’y a ni widget intégré ni pixel de suivi.",
          "En cliquant sur le bouton, vous quittez ce site. La politique de confidentialité de WhatsApp Ireland Ltd. s’applique dès lors. Votre numéro de téléphone, le texte du message et les données de connexion habituelles sont transmis. Le fournisseur appartient au groupe Meta ; un traitement en dehors de l’Union européenne ne peut être exclu.",
          "Si vous ne souhaitez pas utiliser WhatsApp, vous pouvez également nous joindre par téléphone. Les demandes reçues via WhatsApp servent uniquement à leur traitement et sont supprimées une fois celui-ci terminé, sauf obligation légale de conservation. La base juridique est l’art. 6, al. 1, point b ou f du RGPD.",
        ],
      },
      {
        titel: "Demandes de commande",
        absaetze: [
          "Le formulaire de demande de commande ne transmet rien à ce site. Il assemble vos informations sur votre propre appareil, puis les transfère à votre logiciel de messagerie ou à WhatsApp ; l’envoi s’effectue ensuite manuellement dans ce service.",
          "La finalité est le traitement de votre demande ; la base juridique est l’art. 6, al. 1, point b du RGPD.",
        ],
      },
      {
        titel: "Vos droits",
        absaetze: [
          "Vous disposez de droits d’accès, de rectification, d’effacement, de limitation du traitement, de portabilité des données et d’opposition.",
          "Vous pouvez également introduire une réclamation auprès d’une autorité de contrôle de la protection des données, soit celle de votre lieu de résidence, soit celle dont nous relevons.",
          FIRMA.sitzland === "PL"
            ? "L’autorité compétente à notre égard est le président de l’Office de protection des données à caractère personnel (Prezes Urzędu Ochrony Danych Osobowych), ul. Stawki 2, 00-193 Varsovie, Pologne."
            : null,
        ],
      },
    ],
  },
  agb: {
    titel: "Conditions générales",
    einleitung: "Les présentes conditions s’appliquent aux commandes passées par l’intermédiaire de ce site.",
    abschnitte: [
      {
        titel: "Champ d’application",
        absaetze: [
          FIRMA.name
            ? `Les présentes conditions, dans leur version en vigueur au moment de la commande, s’appliquent à tous les contrats conclus entre ${FIRMA.name} (ci-après le « fournisseur ») et la personne qui commande.`
            : null,
        ],
      },
      {
        titel: "Conclusion du contrat",
        absaetze: [
          "Il n’existe actuellement aucun panier permettant de finaliser une commande. Une demande envoyée au moyen du formulaire, par WhatsApp ou par téléphone ne constitue donc ni une offre ni une commande. Le contrat n’est conclu que lorsque le fournisseur confirme expressément la commande.",
        ],
      },
      {
        titel: "Prix",
        absaetze: [
          FIRMA.kleinunternehmer === true
            ? (FIRMA.sitzland === "PL"
                ? "Aucune TVA n’est facturée (exonération conformément à l’art. 113 de la loi polonaise sur la TVA)."
                : "Aucune TVA n’est facturée (régime des petites entreprises selon le § 19 UStG).")
            : FIRMA.kleinunternehmer === false
              ? "Tous les prix comprennent la TVA légale."
              : null,
          "Le prix et les frais de livraison sont communiqués avant la conclusion du contrat et indiqués dans la confirmation.",
        ],
      },
      {
        titel: "Livraison",
        absaetze: [
          "La zone et le délai de livraison sont communiqués avant la conclusion du contrat et indiqués dans la confirmation.",
        ],
      },
      {
        titel: "Paiement",
        absaetze: ["Le mode de paiement est communiqué dans la confirmation de commande."],
      },
      {
        titel: "Garantie légale",
        absaetze: ["Les dispositions légales relatives à la responsabilité pour défauts s’appliquent."],
      },
      {
        titel: "Droit applicable",
        absaetze: [
          FIRMA.sitzland === "PL"
            ? "Le droit polonais s’applique. Les consommateurs conservent néanmoins la protection que leur accordent les dispositions impératives de leur pays de résidence — pour les commandes depuis l’Allemagne, il s’agit du droit allemand de la protection des consommateurs (art. 6 du règlement Rome I)."
            : null,
        ],
      },
      {
        titel: "La promesse 1+1",
        absaetze: [
          "Le modèle de don n’est pas encore actif. Il ne sera annoncé qu’après la confirmation d’une organisation partenaire et lorsque la quantité promise par unité vendue ainsi que le délai de livraison pourront être indiqués précisément.",
          "Nous n’utilisons pas de formulations vagues telles que « une partie des recettes est reversée aux personnes dans le besoin », car elles peuvent être contestées au regard du droit de la concurrence.",
        ],
      },
    ],
  },
  widerruf: {
    titel: "Droit de rétractation",
    einleitung:
      "Les consommateurs disposent d’un droit de rétractation de quatorze jours. Le texte suivant reprend le modèle prévu par la loi.",
    abschnitte: [
      {
        titel: "Droit de rétractation",
        absaetze: [
          "Vous avez le droit de vous rétracter du présent contrat dans un délai de quatorze jours sans avoir à indiquer de motif.",
          "Le délai de rétractation est de quatorze jours à compter du jour où vous-même, ou un tiers désigné par vous autre que le transporteur, prenez physiquement possession des marchandises.",
          anschriftEinzeiligFuer("fr")
            ? `Pour exercer votre droit de rétractation, vous devez nous informer (${absender("fr")}) de votre décision au moyen d’une déclaration dénuée d’ambiguïté.`
            : null,
        ],
      },
      {
        titel: "Effets de la rétractation",
        absaetze: [
          "Si vous vous rétractez du présent contrat, nous vous rembourserons tous les paiements reçus, y compris les frais de livraison, sans retard injustifié et au plus tard dans les quatorze jours.",
          "Les frais directs de renvoi des marchandises sont à votre charge.",
        ],
      },
      {
        titel: "Formulaire type de rétractation",
        absaetze: [
          FIRMA.name
            ? `À ${absender("fr")} : je/nous vous notifie/notifions par la présente ma/notre rétractation du contrat portant sur l’achat des marchandises suivantes.`
            : null,
          FIRMA.name
            ? "Commandé le / reçu le, nom, adresse, date et signature en cas de notification sur papier."
            : null,
        ],
      },
      {
        titel: "Remarque concernant l’hygiène",
        absaetze: [
          "Pour les marchandises scellées ne pouvant être renvoyées pour des raisons de protection de la santé ou d’hygiène, le droit de rétractation s’éteint lorsque le sceau a été retiré après la livraison.",
        ],
      },
    ],
  },
  "versand-zahlung": {
    titel: "Livraison et paiement",
    einleitung: "Comment les marchandises vous parviennent et comment le paiement s’effectue.",
    abschnitte: [
      {
        titel: "Livraison",
        absaetze: [
          "Nous indiquons les frais et le délai de livraison dans notre réponse à votre demande, avant que la commande ne devienne ferme.",
        ],
      },
      {
        titel: "Paiement",
        absaetze: [
          "Les commandes sont actuellement reçues sous forme de demandes ; le mode de paiement est communiqué dans la confirmation.",
          "À l’ouverture de la boutique, les moyens de paiement effectivement disponibles seront indiqués ici.",
        ],
      },
    ],
  },
};

const pl: Record<RechtSchluessel, RechtsseiteRoh> = {
  impressum: {
    titel: "Nota prawna",
    einleitung: FIRMA.sitzland === "DE"
      ? "Informacje zgodnie z § 5 niemieckiej ustawy DDG."
      : "Dane sprzedawcy.",
    abschnitte: [
      { titel: "Sprzedawca", absaetze: anschriftZeilenFuer("pl") },
      {
        titel: "Kontakt",
        absaetze: [
          ...kontaktZeilen("E-mail", "Telefon i WhatsApp"),
          `Osoba kontaktowa: ${FIRMA.vertreten}`,
        ],
      },
      {
        titel: "Rejestr",
        absaetze: [
          registerAngabe({
            ceidg: "Wpis w Centralnej Ewidencji i Informacji o Działalności Gospodarczej (CEIDG).",
            krs: (nr) => `Wpis w Krajowym Rejestrze Sądowym (KRS) pod numerem ${nr}.`,
          }),
        ],
      },
      {
        titel: "Dane podatkowe",
        absaetze: [
          ...steuerKennungen({
            nip: "NIP",
            regon: "REGON",
            ustId: "Numer identyfikacyjny VAT zgodnie z § 27a UStG",
          }),
          FIRMA.sitzland === "PL" && FIRMA.ustId
            ? `Numer VAT-UE: ${FIRMA.ustId}`
            : null,
          umsatzsteuerbefreit(
              FIRMA.sitzland === "PL"
                ? "Nie naliczamy podatku VAT i go nie wykazujemy (zwolnienie podmiotowe na podstawie art. 113 ustawy o VAT)."
                : "Jako małe przedsiębiorstwo w rozumieniu § 19 UStG nie naliczamy podatku VAT i go nie wykazujemy.",
            ),
        ],
      },
      {
        titel: "Odpowiedzialny za treści dziennikarsko-redakcyjne zgodnie z § 18 ust. 2 MStV",
        absaetze: [...verantwortlich("pl"), "Ponadto automatycznie generowane posty w sieciach społecznościowych muszą być oznaczone jako takie (§ 18 ust. 3 MStV)."],
      },
      {
        titel: "Relacja z producentem",
        absaetze: [
          "Produkty pochodzą od WaSH Innovation. Tę stronę prowadzi niezależny partner handlowy.",
        ],
      },
      {
        titel: "Pozasądowe rozstrzyganie sporów konsumenckich",
        absaetze: [
          "Nie jesteśmy zobowiązani ani gotowi do udziału w postępowaniu przed konsumenckim organem polubownym.",
        ],
      },
    ],
  },
  datenschutz: {
    titel: "Polityka prywatności",
    einleitung:
      "Ta strona przetwarza możliwie najmniej danych osobowych. Nie korzysta z narzędzi analitycznych, sieci reklamowych ani osadzonych treści zewnętrznych.",
    abschnitte: [
      {
        titel: "Administrator danych",
        absaetze: [
          anschriftZeilenFuer("pl").join(", ") || null,
          FIRMA.email ? `E-mail: ${FIRMA.email}` : null,
          `Telefon: ${RUFNUMMER_LESBAR}`,
        ],
      },
      {
        titel: "Korzystanie ze strony",
        absaetze: [
          `Strona jest udostępniana przez ${HOSTER.dienst} firmy ${HOSTER.name}, ${HOSTER.anschrift}. Przy każdej wizycie przetwarzane są technicznie niezbędne dane dostępowe: adres IP, czas, wywołany adres i identyfikacja przeglądarki. Podstawą prawną jest art. 6 ust. 1 lit. f RODO.`,
          "Strona składa się wyłącznie z wcześniej wygenerowanych plików; nie ma bazy danych ani kont użytkowników. Z hostingiem wiąże się przekazanie danych do USA.",
        ],
      },
      {
        titel: "Czcionki i treści zewnętrzne",
        absaetze: [
          "Używane są wyłącznie czcionki systemowe. Nie następuje połączenie z Google Fonts ani innym zewnętrznym serwerem.",
        ],
      },
      {
        titel: "Pliki cookie",
        absaetze: [
          "Strona nie zapisuje plików cookie ani podobnych technologii do celów analitycznych czy reklamowych.",
        ],
      },
      {
        titel: "Kontakt przez WhatsApp",
        absaetze: [
          "Na kilku stronach znajduje się przycisk otwierający czat WhatsApp. To zwykły link do wa.me. Dopóki nie zostanie kliknięty, strona nie pobiera niczego z WhatsAppa ani Meta i niczego tam nie przekazuje — nie ma osadzonego widżetu ani piksela śledzącego.",
          "Kliknięcie przycisku oznacza opuszczenie tej strony. Od tego momentu obowiązuje polityka prywatności WhatsApp Ireland Ltd. Przekazywane są: własny numer telefonu, treść wiadomości i zwykłe dane połączenia. Dostawcą jest spółka z grupy Meta; nie można wykluczyć przetwarzania poza UE.",
          "Kto sobie tego nie życzy, może skorzystać z telefonu. Zapytania z WhatsAppa wykorzystujemy wyłącznie do ich obsługi i usuwamy po załatwieniu sprawy, o ile nie obowiązuje ustawowy obowiązek przechowywania. Podstawa prawna: art. 6 ust. 1 lit. b lub f RODO.",
        ],
      },
      {
        titel: "Zapytania o zamówienie",
        absaetze: [
          "Formularz zapytania niczego nie przesyła do tej strony. Zestawia dane na Twoim urządzeniu i przekazuje je programowi pocztowemu lub WhatsAppowi — wysyłka następuje dopiero tam i ręcznie.",
          "Celem jest obsługa zapytania, podstawą prawną art. 6 ust. 1 lit. b RODO.",
        ],
      },
      {
        titel: "Prawa osób, których dane dotyczą",
        absaetze: [
          "Przysługuje prawo dostępu, sprostowania, usunięcia, ograniczenia przetwarzania, przenoszenia danych i sprzeciwu.",
          "Przysługuje również prawo wniesienia skargi do organu nadzorczego ds. ochrony danych — właściwego dla miejsca zamieszkania albo właściwego dla nas.",
          FIRMA.sitzland === "PL"
            ? "Organem właściwym dla nas jest Prezes Urzędu Ochrony Danych Osobowych, ul. Stawki 2, 00-193 Warszawa."
            : null,
        ],
      },
    ],
  },
  agb: {
    titel: "Regulamin",
    einleitung:
      "Regulamin dotyczy zamówień składanych przez tę stronę.",
    abschnitte: [
      {
        titel: "Zakres",
        absaetze: [
          FIRMA.name ? `Regulamin obowiązuje dla wszystkich umów między ${FIRMA.name} a kupującym.` : null,
        ],
      },
      {
        titel: "Zawarcie umowy",
        absaetze: [
          "Obecnie nie ma koszyka z finalizacją zamówienia. Zapytanie wysłane formularzem, przez WhatsApp lub telefonicznie nie jest więc ofertą ani zamówieniem. Umowa zostaje zawarta dopiero po wyraźnym potwierdzeniu zamówienia przez sprzedawcę.",
        ],
      },
      {
        titel: "Ceny",
        absaetze: [
          FIRMA.kleinunternehmer === true
            ? (FIRMA.sitzland === "PL"
                ? "Nie naliczamy podatku VAT (zwolnienie podmiotowe na podstawie art. 113 ustawy o VAT)."
                : "Nie naliczamy podatku VAT (zwolnienie dla małych przedsiębiorców, § 19 UStG).")
            : FIRMA.kleinunternehmer === false
              ? "Wszystkie ceny zawierają ustawowy podatek VAT."
              : null,
          "Cenę i koszty wysyłki podajemy przed zawarciem umowy i wykazujemy w potwierdzeniu.",
        ],
      },
      {
        titel: "Dostawa",
        absaetze: ["Obszar i czas dostawy podajemy przed zawarciem umowy oraz w potwierdzeniu."],
      },
      { titel: "Płatność", absaetze: ["Sposób płatności podajemy w potwierdzeniu zamówienia."] },
      { titel: "Rękojmia", absaetze: ["Obowiązują ustawowe przepisy o rękojmi."] },
      {
        titel: "Prawo właściwe",
        absaetze: [
          FIRMA.sitzland === "PL"
            ? "Obowiązuje prawo polskie. Konsumenci zachowują przy tym ochronę wynikającą z bezwzględnie obowiązujących przepisów państwa swojego miejsca zwykłego pobytu — w przypadku zamówień z Niemiec jest to niemieckie prawo konsumenckie (art. 6 rozporządzenia Rzym I)."
            : null,
        ],
      },
      {
        titel: "Obietnica 1+1",
        absaetze: [
          "Model darowizn nie jest jeszcze aktywny. Będzie promowany dopiero wtedy, gdy będzie znana organizacja partnerska oraz konkretna ilość na każdą sprzedaną sztukę i termin dostawy.",
        ],
      },
    ],
  },
  widerruf: {
    titel: "Prawo odstąpienia od umowy",
    einleitung:
      "Konsumentom przysługuje czternastodniowe prawo odstąpienia. Poniższy tekst opiera się na wzorze ustawowym.",
    abschnitte: [
      {
        titel: "Prawo odstąpienia",
        absaetze: [
          "Mają Państwo prawo odstąpić od umowy w terminie czternastu dni bez podania przyczyny.",
          "Termin do odstąpienia wygasa po upływie czternastu dni od dnia, w którym weszli Państwo w posiadanie rzeczy lub w którym osoba trzecia inna niż przewoźnik weszła w jej posiadanie.",
          anschriftEinzeiligFuer("pl")
            ? `Aby skorzystać z prawa odstąpienia, muszą Państwo poinformować nas (${absender("pl")}) w drodze jednoznacznego oświadczenia.`
            : null,
        ],
      },
      {
        titel: "Skutki odstąpienia",
        absaetze: [
          "W przypadku odstąpienia zwracamy wszystkie otrzymane płatności, w tym koszty dostarczenia, niezwłocznie i nie później niż w terminie czternastu dni.",
          "Bezpośrednie koszty zwrotu rzeczy ponoszą Państwo.",
        ],
      },
      {
        titel: "Uwaga dotycząca higieny",
        absaetze: [
          "W przypadku towarów zapieczętowanych, których po otwarciu opakowania nie można zwrócić ze względu na ochronę zdrowia lub higienę, prawo odstąpienia wygasa po usunięciu zabezpieczenia po dostawie.",
        ],
      },
    ],
  },
  "versand-zahlung": {
    titel: "Wysyłka i płatność",
    einleitung: "Jak towar do Ciebie trafia i jak przebiega płatność.",
    abschnitte: [
      {
        titel: "Wysyłka",
        absaetze: [
          "Koszty wysyłki i czas dostawy podajemy w odpowiedzi na zapytanie, zanim zamówienie stanie się wiążące.",
        ],
      },
      {
        titel: "Płatność",
        absaetze: [
          "Obecnie zamówienia przyjmujemy jako zapytania; sposób płatności podajemy w potwierdzeniu.",
        ],
      },
    ],
  },
};

const ROH: Record<string, Record<RechtSchluessel, RechtsseiteRoh>> = {
  de,
  en,
  pl,
  fr,
  es,
  it,
};

/**
 * Absätze ohne Inhalt fallen weg, danach die Abschnitte, von denen nichts übrig
 * bleibt. So steht auf der Seite nie eine leere Überschrift und nie ein halber
 * Satz mit fehlender Angabe.
 */
function aufbereiten(roh: RechtsseiteRoh): Rechtsseite {
  const abschnitte = roh.abschnitte
    .map((a) => ({
      titel: a.titel,
      absaetze: a.absaetze.filter((s): s is string => typeof s === "string" && s.trim() !== ""),
    }))
    .filter((a) => a.absaetze.length > 0);
  return { titel: roh.titel, einleitung: roh.einleitung, abschnitte };
}

/** Rechtsseite in der gewünschten Sprache, sonst Englisch, sonst Deutsch. */
export function rechtsseite(sprache: string, schluessel: RechtSchluessel): Rechtsseite {
  const satz = ROH[sprache] ?? ROH.en ?? ROH.de;
  return aufbereiten(satz[schluessel] ?? ROH.de[schluessel]);
}
