/**
 * Pflichtseiten eines Verkaufsangebots an Verbraucher in Deutschland:
 * Impressum, Datenschutz, AGB, Widerruf, Versand und Zahlung.
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
import { FIRMA, HOSTER, anschriftEinzeilig, anschriftZeilen } from "./firma";
import { RUFNUMMER_LESBAR, ANSPRECHPERSON } from "./kontakt";

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

/** Umsatzsteuer-Absatz je nach Besteuerungsart; ohne Entscheidung kein Absatz. */
function umsatzsteuer(mitId: (id: string) => string, klein: string): string | null {
  if (FIRMA.ustId) return mitId(FIRMA.ustId);
  if (FIRMA.kleinunternehmer === true) return klein;
  return null;
}

/** Absender für Widerruf und Muster-Formular: Firmierung, Anschrift, E-Mail. */
function absender(): string {
  return [FIRMA.name, anschriftEinzeilig(), FIRMA.email].filter(Boolean).join(", ");
}

/**
 * Verantwortliche Person, als Block wie im Impressum üblich: Name, dann die
 * Anschrift zeilenweise darunter.
 */
function verantwortlich(): (string | null)[] {
  if (!FIRMA.vertreten) return [null];
  const zeilen = anschriftZeilen();
  // anschriftZeilen() beginnt mit der Firmierung; hier steht die Person davor.
  return [FIRMA.vertreten, ...zeilen.slice(1)];
}

/**
 * Überschrift für den Verantwortlichen.
 *
 * § 18 Abs. 2 MStV verlangt bei journalistisch-redaktionellen Angeboten die
 * Benennung einer verantwortlichen Person — das Journal dieser Seite fällt
 * darunter. Die Vorschrift ist deutsches Landesmedienrecht; bei einem Sitz in
 * Polen wird sie hier nicht zitiert, weil die Zuständigkeit dann am
 * Herkunftslandprinzip hängt und nicht ohne Prüfung zu behaupten ist.
 */
function verantwortlichTitel(mstv: string, allgemein: string): string {
  return FIRMA.sitzland === "DE" ? mstv : allgemein;
}

const de: Record<RechtSchluessel, RechtsseiteRoh> = {
  impressum: {
    titel: "Impressum",
    /* § 5 DDG gilt für in Deutschland niedergelassene Anbieter. Sitzt das
       Unternehmen in Polen, wäre die Angabe falsch — dann steht hier die
       neutrale Überschrift. */
    einleitung: FIRMA.sitzland === "DE" ? "Angaben gemäß § 5 DDG." : "Angaben zum Anbieter.",
    abschnitte: [
      { titel: "Anbieter", absaetze: anschriftZeilen() },
      {
        titel: "Kontakt",
        absaetze: [
          ...kontaktZeilen("E-Mail", "Telefon und WhatsApp"),
          `Ansprechpartnerin: ${ANSPRECHPERSON}`,
        ],
      },
      {
        titel: "Umsatzsteuer",
        absaetze: [
          umsatzsteuer(
            (id) => `Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG: ${id}`,
            "Als Kleinunternehmen im Sinne des § 19 UStG wird keine Umsatzsteuer berechnet und daher auch nicht ausgewiesen.",
          ),
        ],
      },
      {
        titel: verantwortlichTitel(
          "Verantwortlich für journalistisch-redaktionelle Inhalte gemäß § 18 Abs. 2 MStV",
          "Verantwortlich für den Inhalt",
        ),
        absaetze: verantwortlich(),
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
        titel: "Verbraucherstreitbeilegung",
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
          anschriftZeilen().join(", ") || null,
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
          "Außerdem besteht ein Beschwerderecht bei einer Datenschutz-Aufsichtsbehörde, in der Regel bei der des eigenen Wohnorts oder der des Unternehmenssitzes.",
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
            ? "Es wird keine Umsatzsteuer berechnet (Kleinunternehmerregelung nach § 19 UStG)."
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
          anschriftEinzeilig()
            ? `Um Ihr Widerrufsrecht auszuüben, müssen Sie uns (${absender()}) mittels einer eindeutigen Erklärung über Ihren Entschluss informieren.`
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
            ? `An ${absender()}: Hiermit widerrufe(n) ich/wir den von mir/uns abgeschlossenen Vertrag über den Kauf der folgenden Waren.`
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
      { titel: "Provider", absaetze: anschriftZeilen() },
      {
        titel: "Contact",
        absaetze: [
          ...kontaktZeilen("Email", "Phone and WhatsApp"),
          `Contact person: ${ANSPRECHPERSON}`,
        ],
      },
      {
        titel: "VAT",
        absaetze: [
          umsatzsteuer(
            (id) => `VAT identification number under § 27a UStG: ${id}`,
            "As a small business within the meaning of § 19 UStG, no VAT is charged and none is shown.",
          ),
        ],
      },
      {
        titel: verantwortlichTitel(
          "Responsible for journalistic and editorial content under § 18(2) MStV",
          "Responsible for the content",
        ),
        absaetze: verantwortlich(),
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
          anschriftZeilen().join(", ") || null,
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
          "You also have the right to lodge a complaint with a data protection supervisory authority, usually the one for your place of residence or for the company's registered office.",
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
            ? "No VAT is charged (small business rule under § 19 UStG)."
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
          anschriftEinzeilig()
            ? `To exercise this right you must inform us (${absender()}) by an unequivocal statement.`
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

const pl: Record<RechtSchluessel, RechtsseiteRoh> = {
  impressum: {
    titel: "Nota prawna",
    einleitung: FIRMA.sitzland === "DE"
      ? "Informacje zgodnie z § 5 niemieckiej ustawy DDG."
      : "Dane sprzedawcy.",
    abschnitte: [
      { titel: "Sprzedawca", absaetze: anschriftZeilen() },
      {
        titel: "Kontakt",
        absaetze: [
          ...kontaktZeilen("E-mail", "Telefon i WhatsApp"),
          `Osoba kontaktowa: ${ANSPRECHPERSON}`,
        ],
      },
      {
        titel: "Podatek VAT",
        absaetze: [
          umsatzsteuer(
            (id) => `Numer identyfikacyjny VAT zgodnie z § 27a UStG: ${id}`,
            "Jako małe przedsiębiorstwo w rozumieniu § 19 UStG nie naliczamy podatku VAT i go nie wykazujemy.",
          ),
        ],
      },
      {
        titel: verantwortlichTitel(
          "Odpowiedzialny za treści dziennikarsko-redakcyjne zgodnie z § 18 ust. 2 MStV",
          "Odpowiedzialność za treść",
        ),
        absaetze: verantwortlich(),
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
          anschriftZeilen().join(", ") || null,
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
          "Przysługuje również prawo wniesienia skargi do organu nadzorczego ds. ochrony danych, zwykle właściwego dla miejsca zamieszkania lub siedziby firmy.",
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
            ? "Nie naliczamy podatku VAT (zwolnienie dla małych przedsiębiorców, § 19 UStG)."
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
          anschriftEinzeilig()
            ? `Aby skorzystać z prawa odstąpienia, muszą Państwo poinformować nas (${absender()}) w drodze jednoznacznego oświadczenia.`
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

const ROH: Record<string, Record<RechtSchluessel, RechtsseiteRoh>> = { de, en, pl };

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
