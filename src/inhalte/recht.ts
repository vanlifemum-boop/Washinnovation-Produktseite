/**
 * Gerüst für die Pflichtseiten eines Verkaufsangebots an Verbraucher in
 * Deutschland: Impressum, Datenschutz, AGB, Widerruf, Versand und Zahlung.
 *
 * WICHTIG — bitte lesen, bevor die Seite live geht:
 * Das hier ist ein Gerüst, keine Rechtsberatung. Jeder Abschnitt mit
 * "[PLATZHALTER]" muss durch echte Angaben ersetzt werden, und die AGB sowie die
 * Widerrufsbelehrung gehören vor der Veröffentlichung einmal durch jemanden mit
 * Fachkenntnis. Falsche oder fehlende Pflichtangaben sind abmahnfähig — das ist
 * bei einem Shop mit Spendenwerbung kein theoretisches Risiko.
 *
 * Besonders zu prüfen:
 *   - Spendenwerbung: Empfänger und Höhe müssen konkret benannt sein.
 *   - Zuwendungsbestätigungen darf nur ausstellen, wer gemeinnützig ist.
 *   - Warenspenden sind umsatzsteuerlich nicht neutral (Steuerberatung).
 */

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

export type RechtSchluessel =
  | "impressum"
  | "datenschutz"
  | "agb"
  | "widerruf"
  | "versand-zahlung";

const P = "[PLATZHALTER]";

const de: Record<RechtSchluessel, Rechtsseite> = {
  impressum: {
    titel: "Impressum",
    einleitung: "Angaben gemäß § 5 DDG.",
    abschnitte: [
      {
        titel: "Anbieter",
        absaetze: [
          `${P} Name bzw. Firmierung`,
          `${P} Straße und Hausnummer`,
          `${P} PLZ und Ort`,
          `${P} Land`,
        ],
      },
      {
        titel: "Kontakt",
        absaetze: [
          `E-Mail: ${P}`,
          `Telefon und WhatsApp: ${RUFNUMMER_LESBAR}`,
          `Ansprechpartnerin: ${ANSPRECHPERSON}`,
        ],
      },
      {
        titel: "Umsatzsteuer",
        absaetze: [
          `Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG: ${P}`,
          `Falls die Kleinunternehmerregelung nach § 19 UStG angewendet wird, gehört stattdessen ein entsprechender Hinweis hierher. ${P}`,
        ],
      },
      {
        titel: "Verantwortlich für den Inhalt",
        absaetze: [`${P} Name und Anschrift der verantwortlichen Person`],
      },
      {
        titel: "Verhältnis zum Hersteller",
        absaetze: [
          "Die angebotenen Produkte stammen von WaSH Innovation. Diese Seite wird von einem unabhängigen Vertriebspartner betrieben.",
          `Vor der Veröffentlichung ist die schriftliche Zustimmung des Herstellers zur Verwendung von Marke und Produktnamen sowie zur Spendenkommunikation einzuholen. ${P}`,
        ],
      },
      {
        titel: "Streitbeilegung",
        absaetze: [
          "Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung bereit: https://ec.europa.eu/consumers/odr",
          "Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.",
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
        absaetze: [`${P} Name, Anschrift und E-Mail-Adresse der verantwortlichen Stelle`],
      },
      {
        titel: "Aufruf der Website",
        absaetze: [
          `Die Seite wird bei ${P} (Hosting-Anbieter) bereitgestellt. Beim Aufruf werden technisch notwendige Zugriffsdaten verarbeitet, etwa IP-Adresse, Zeitpunkt, aufgerufene Adresse und Browserkennung. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (Interesse am sicheren Betrieb).`,
          `Speicherdauer und Auftragsverarbeitungsvertrag: ${P}`,
        ],
      },
      {
        titel: "Schriften und externe Inhalte",
        absaetze: [
          "Es werden ausschließlich Schriften des Betriebssystems verwendet. Es findet keine Verbindung zu Google Fonts oder einem anderen fremden Server statt.",
        ],
      },
      {
        titel: "Kontakt über WhatsApp",
        absaetze: [
          "Auf mehreren Seiten steht ein Knopf, der einen WhatsApp-Chat öffnet. Es handelt sich um einen gewöhnlichen Link auf wa.me. Solange er nicht angeklickt wird, lädt diese Seite nichts von WhatsApp oder Meta und übermittelt auch nichts dorthin — es gibt kein eingebundenes Widget und kein Zählpixel.",
          "Wer den Knopf anklickt, verlässt diese Seite. Ab dann gilt die Datenschutzerklärung von WhatsApp Ireland Ltd. Übermittelt werden dabei die eigene Rufnummer, der Nachrichtentext und die üblichen Verbindungsdaten. Anbieter ist ein Unternehmen der Meta-Gruppe; eine Verarbeitung außerhalb der EU ist nicht ausgeschlossen.",
          "Wer das nicht möchte, erreicht uns genauso per Telefon oder E-Mail. Über WhatsApp geführte Anfragen werden nur zur Bearbeitung genutzt, Rechtsgrundlage ist Art. 6 Abs. 1 lit. b bzw. lit. f DSGVO.",
          `Aufbewahrungsdauer der Chatverläufe: ${P}`,
        ],
      },
      {
        titel: "Cookies",
        absaetze: [
          "Die Seite setzt keine Cookies und verwendet keine vergleichbaren Speichertechniken zu Analyse- oder Werbezwecken.",
        ],
      },
      {
        titel: "Bestellanfragen",
        absaetze: [
          "Das Formular für Bestellanfragen versendet die Angaben über das E-Mail-Programm des eigenen Geräts. Die Daten werden dabei nicht an diese Website übertragen.",
          `Wird zusätzlich ein Formulardienst eingesetzt, gehören dessen Name, Sitz und die Grundlage der Übermittlung hierher. ${P}`,
          "Zweck ist die Bearbeitung der Anfrage, Rechtsgrundlage Art. 6 Abs. 1 lit. b DSGVO.",
        ],
      },
      {
        titel: "Rechte der betroffenen Personen",
        absaetze: [
          "Es besteht ein Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch sowie ein Beschwerderecht bei einer Aufsichtsbehörde.",
          `Zuständige Aufsichtsbehörde: ${P}`,
        ],
      },
    ],
  },

  agb: {
    titel: "Allgemeine Geschäftsbedingungen",
    einleitung:
      "Diese Bedingungen gelten für Bestellungen über diese Website. Sie sind ein Entwurf und vor der Veröffentlichung fachlich zu prüfen.",
    abschnitte: [
      {
        titel: "Geltungsbereich",
        absaetze: [
          `Für alle Verträge zwischen ${P} (nachfolgend „Anbieter“) und den Bestellenden gelten diese Bedingungen in der zum Zeitpunkt der Bestellung gültigen Fassung.`,
        ],
      },
      {
        titel: "Zustandekommen des Vertrags",
        absaetze: [
          "Solange kein Warenkorb mit Bestellabschluss vorhanden ist, stellt eine über das Formular gesendete Anfrage kein Angebot dar. Der Vertrag kommt erst zustande, wenn der Anbieter die Bestellung ausdrücklich bestätigt.",
          "Mit Eröffnung des Shops ist dieser Abschnitt an den dann tatsächlichen Bestellablauf anzupassen.",
        ],
      },
      {
        titel: "Preise",
        absaetze: [
          `Alle Preise verstehen sich inklusive der gesetzlichen Umsatzsteuer, sofern nicht die Kleinunternehmerregelung angewendet wird. ${P}`,
          "Versandkosten werden vor Vertragsschluss gesondert ausgewiesen.",
        ],
      },
      {
        titel: "Lieferung",
        absaetze: [`Lieferzeiten und Liefergebiete: ${P}`],
      },
      {
        titel: "Zahlung",
        absaetze: [`Zulässige Zahlungswege: ${P}`],
      },
      {
        titel: "Gewährleistung",
        absaetze: ["Es gilt das gesetzliche Mängelhaftungsrecht."],
      },
      {
        titel: "Das 1+1-Versprechen",
        absaetze: [
          "Sobald das Spendenmodell aktiv ist, gehört hierher, welche Organisation je verkaufter Einheit welche Menge erhält und in welchem Zeitraum geliefert wird.",
          "Unbestimmte Formulierungen wie „ein Teil des Erlöses geht an Bedürftige“ sind wettbewerbsrechtlich angreifbar und daher zu vermeiden.",
          `Konkrete Zusage: ${P}`,
        ],
      },
    ],
  },

  widerruf: {
    titel: "Widerrufsbelehrung",
    einleitung:
      "Verbraucherinnen und Verbraucher haben ein vierzehntägiges Widerrufsrecht. Der folgende Text folgt dem gesetzlichen Muster und ist vor der Veröffentlichung zu vervollständigen.",
    abschnitte: [
      {
        titel: "Widerrufsrecht",
        absaetze: [
          "Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen.",
          "Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag, an dem Sie oder ein von Ihnen benannter Dritter, der nicht der Beförderer ist, die Waren in Besitz genommen haben bzw. hat.",
          `Um Ihr Widerrufsrecht auszuüben, müssen Sie uns (${P} Name, Anschrift, E-Mail-Adresse) mittels einer eindeutigen Erklärung über Ihren Entschluss informieren.`,
        ],
      },
      {
        titel: "Folgen des Widerrufs",
        absaetze: [
          "Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen erhalten haben, einschließlich der Lieferkosten, unverzüglich und spätestens binnen vierzehn Tagen zurückzuzahlen.",
          `Die unmittelbaren Kosten der Rücksendung tragen Sie. ${P} — sofern abweichend geregelt, hier anpassen.`,
        ],
      },
      {
        titel: "Muster-Widerrufsformular",
        absaetze: [
          `An ${P}: Hiermit widerrufe(n) ich/wir den von mir/uns abgeschlossenen Vertrag über den Kauf der folgenden Waren.`,
          "Bestellt am / erhalten am, Name, Anschrift, Datum, Unterschrift bei Mitteilung auf Papier.",
        ],
      },
      {
        titel: "Hinweis zur Hygiene",
        absaetze: [
          `Bei versiegelten Waren, die aus Gründen des Gesundheitsschutzes oder der Hygiene nicht zur Rückgabe geeignet sind, kann das Widerrufsrecht erlöschen, wenn die Versiegelung entfernt wurde. Ob und für welche Produkte das gilt, ist zu prüfen. ${P}`,
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
          `Versanddienstleister: ${P}`,
          `Versandkosten Inland: ${P}`,
          `Versandkosten EU: ${P}`,
          `Lieferzeit: ${P}`,
        ],
      },
      {
        titel: "Zahlung",
        absaetze: [
          `Zurzeit werden Bestellungen als Anfrage entgegengenommen; die Zahlungsweise wird in der Bestätigung mitgeteilt. ${P}`,
          "Mit Eröffnung des Shops sind hier die tatsächlich verfügbaren Zahlungswege aufzuführen.",
        ],
      },
    ],
  },
};

const en: Record<RechtSchluessel, Rechtsseite> = {
  impressum: {
    titel: "Legal notice",
    einleitung: "Information according to § 5 DDG (German Digital Services Act).",
    abschnitte: [
      { titel: "Provider", absaetze: [`${P} Name or company`, `${P} Street`, `${P} Postcode and town`, `${P} Country`] },
      { titel: "Contact", absaetze: [`Email: ${P}`, `Phone and WhatsApp: ${RUFNUMMER_LESBAR}`, `Contact person: ${ANSPRECHPERSON}`] },
      { titel: "VAT", absaetze: [`VAT identification number: ${P}`] },
      { titel: "Responsible for the content", absaetze: [`${P}`] },
      {
        titel: "Relationship with the manufacturer",
        absaetze: [
          "The products are made by WaSH Innovation. This site is operated by an independent distribution partner.",
          `Written consent from the manufacturer for the use of the brand and for donation-related communication must be obtained before publication. ${P}`,
        ],
      },
      {
        titel: "Dispute resolution",
        absaetze: [
          "The European Commission provides a platform for online dispute resolution: https://ec.europa.eu/consumers/odr",
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
      { titel: "Controller", absaetze: [`${P} Name, address and email of the controller`] },
      {
        titel: "Visiting the website",
        absaetze: [
          `The site is hosted by ${P}. Technically necessary access data is processed on each visit, such as IP address, time, requested address and browser identification. The legal basis is Art. 6(1)(f) GDPR.`,
          `Retention period and data processing agreement: ${P}`,
        ],
      },
      {
        titel: "Fonts and external content",
        absaetze: ["Only system fonts are used. No connection is made to Google Fonts or any other third-party server."],
      },
      {
        titel: "Contact via WhatsApp",
        absaetze: [
          "Several pages carry a button that opens a WhatsApp chat. It is an ordinary link to wa.me. Until it is clicked, this site loads nothing from WhatsApp or Meta and transmits nothing there — there is no embedded widget and no tracking pixel.",
          "Clicking the button takes you off this site. From that point WhatsApp Ireland Ltd.'s privacy policy applies. Your phone number, the message text and the usual connection data are transmitted. The provider is a Meta company; processing outside the EU cannot be ruled out.",
          "If you would rather not use it, phone and email reach us just as well. Enquiries received via WhatsApp are used solely to handle the enquiry; the legal basis is Art. 6(1)(b) or (f) GDPR.",
          `Retention period for chat histories: ${P}`,
        ],
      },
      { titel: "Cookies", absaetze: ["The site sets no cookies and uses no comparable storage for analytics or advertising."] },
      {
        titel: "Order enquiries",
        absaetze: [
          "The enquiry form sends your details through your own device's email program. The data is not transmitted to this website.",
          `If a form service is used in addition, its name, location and the basis for the transfer belong here. ${P}`,
          "The purpose is processing your enquiry; the legal basis is Art. 6(1)(b) GDPR.",
        ],
      },
      {
        titel: "Your rights",
        absaetze: [
          "You have the right to information, rectification, erasure, restriction of processing, data portability and objection, as well as the right to lodge a complaint with a supervisory authority.",
          `Competent supervisory authority: ${P}`,
        ],
      },
    ],
  },
  agb: {
    titel: "Terms and conditions",
    einleitung: "These terms apply to orders placed through this website. They are a draft and must be reviewed before publication.",
    abschnitte: [
      { titel: "Scope", absaetze: [`These terms apply to all contracts between ${P} and the customer.`] },
      {
        titel: "Formation of contract",
        absaetze: [
          "As long as there is no checkout, an enquiry sent through the form does not constitute an offer. A contract is formed only once the provider expressly confirms the order.",
        ],
      },
      { titel: "Prices", absaetze: [`All prices include statutory VAT unless the small business rule applies. ${P}`, "Shipping costs are shown separately before the contract is concluded."] },
      { titel: "Delivery", absaetze: [`Delivery times and areas: ${P}`] },
      { titel: "Payment", absaetze: [`Accepted payment methods: ${P}`] },
      { titel: "Warranty", absaetze: ["Statutory warranty rights apply."] },
      {
        titel: "The 1+1 promise",
        absaetze: [
          "Once the donation model is active, this section must state which organisation receives what quantity per unit sold, and within what period.",
          `Specific commitment: ${P}`,
        ],
      },
    ],
  },
  widerruf: {
    titel: "Right of withdrawal",
    einleitung: "Consumers have a fourteen-day right of withdrawal. The following follows the statutory model text and must be completed before publication.",
    abschnitte: [
      {
        titel: "Right of withdrawal",
        absaetze: [
          "You have the right to withdraw from this contract within fourteen days without giving any reason.",
          "The withdrawal period expires fourteen days from the day on which you, or a third party other than the carrier indicated by you, acquires physical possession of the goods.",
          `To exercise this right you must inform us (${P} name, address, email) by an unequivocal statement.`,
        ],
      },
      {
        titel: "Effects of withdrawal",
        absaetze: [
          "If you withdraw from this contract, we shall reimburse all payments received from you, including the costs of delivery, without undue delay and no later than fourteen days.",
          `You bear the direct cost of returning the goods. ${P}`,
        ],
      },
      {
        titel: "Hygiene note",
        absaetze: [
          `For sealed goods which are not suitable for return for reasons of health protection or hygiene, the right of withdrawal may lapse once the seal has been removed. Whether and for which products this applies must be checked. ${P}`,
        ],
      },
    ],
  },
  "versand-zahlung": {
    titel: "Shipping and payment",
    einleitung: "How the goods reach you and how payment works.",
    abschnitte: [
      { titel: "Shipping", absaetze: [`Carrier: ${P}`, `Domestic shipping cost: ${P}`, `EU shipping cost: ${P}`, `Delivery time: ${P}`] },
      { titel: "Payment", absaetze: [`Orders are currently taken as enquiries; the payment method is communicated in the confirmation. ${P}`] },
    ],
  },
};

const pl: Record<RechtSchluessel, Rechtsseite> = {
  impressum: {
    titel: "Nota prawna",
    einleitung: "Informacje zgodnie z § 5 niemieckiej ustawy DDG.",
    abschnitte: [
      { titel: "Sprzedawca", absaetze: [`${P} Nazwa lub firma`, `${P} Ulica i numer`, `${P} Kod pocztowy i miejscowość`, `${P} Kraj`] },
      { titel: "Kontakt", absaetze: [`E-mail: ${P}`, `Telefon i WhatsApp: ${RUFNUMMER_LESBAR}`, `Osoba kontaktowa: ${ANSPRECHPERSON}`] },
      { titel: "Podatek VAT", absaetze: [`Numer identyfikacyjny VAT: ${P}`] },
      { titel: "Odpowiedzialność za treść", absaetze: [`${P}`] },
      {
        titel: "Relacja z producentem",
        absaetze: [
          "Produkty pochodzą od WaSH Innovation. Tę stronę prowadzi niezależny partner handlowy.",
          `Przed publikacją należy uzyskać pisemną zgodę producenta na używanie marki oraz na komunikację dotyczącą darowizn. ${P}`,
        ],
      },
      {
        titel: "Rozstrzyganie sporów",
        absaetze: [
          "Komisja Europejska udostępnia platformę internetowego rozstrzygania sporów: https://ec.europa.eu/consumers/odr",
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
      { titel: "Administrator danych", absaetze: [`${P} Nazwa, adres i e-mail administratora`] },
      {
        titel: "Korzystanie ze strony",
        absaetze: [
          `Stronę hostuje ${P}. Przy każdej wizycie przetwarzane są technicznie niezbędne dane dostępowe: adres IP, czas, wywołany adres i identyfikacja przeglądarki. Podstawą prawną jest art. 6 ust. 1 lit. f RODO.`,
          `Okres przechowywania i umowa powierzenia: ${P}`,
        ],
      },
      { titel: "Czcionki i treści zewnętrzne", absaetze: ["Używane są wyłącznie czcionki systemowe. Nie następuje połączenie z Google Fonts ani innym zewnętrznym serwerem."] },
      {
        titel: "Kontakt przez WhatsApp",
        absaetze: [
          "Na kilku stronach znajduje się przycisk otwierający czat WhatsApp. To zwykły link do wa.me. Dopóki nie zostanie kliknięty, strona nie pobiera niczego z WhatsAppa ani Meta i niczego tam nie przekazuje — nie ma osadzonego widżetu ani piksela śledzącego.",
          "Kliknięcie przycisku oznacza opuszczenie tej strony. Od tego momentu obowiązuje polityka prywatności WhatsApp Ireland Ltd. Przekazywane są: własny numer telefonu, treść wiadomości i zwykłe dane połączenia. Dostawcą jest spółka z grupy Meta; nie można wykluczyć przetwarzania poza UE.",
          "Kto sobie tego nie życzy, może skorzystać z telefonu lub e-maila. Zapytania z WhatsAppa wykorzystujemy wyłącznie do ich obsługi, podstawa prawna: art. 6 ust. 1 lit. b lub f RODO.",
          `Okres przechowywania historii czatu: ${P}`,
        ],
      },
      { titel: "Pliki cookie", absaetze: ["Strona nie zapisuje plików cookie ani podobnych technologii do celów analitycznych czy reklamowych."] },
      {
        titel: "Zapytania o zamówienie",
        absaetze: [
          "Formularz zapytania wysyła dane przez program pocztowy na Twoim urządzeniu. Dane nie są przekazywane do tej strony.",
          `Jeśli dodatkowo zostanie użyta usługa formularzy, należy tu podać jej nazwę, siedzibę i podstawę przekazania. ${P}`,
          "Celem jest obsługa zapytania, podstawą prawną art. 6 ust. 1 lit. b RODO.",
        ],
      },
      {
        titel: "Prawa osób, których dane dotyczą",
        absaetze: [
          "Przysługuje prawo dostępu, sprostowania, usunięcia, ograniczenia przetwarzania, przenoszenia danych i sprzeciwu, a także prawo wniesienia skargi do organu nadzorczego.",
          `Właściwy organ nadzorczy: ${P}`,
        ],
      },
    ],
  },
  agb: {
    titel: "Regulamin",
    einleitung: "Regulamin dotyczy zamówień składanych przez tę stronę. To projekt, który przed publikacją wymaga weryfikacji prawnej.",
    abschnitte: [
      { titel: "Zakres", absaetze: [`Regulamin obowiązuje dla wszystkich umów między ${P} a kupującym.`] },
      {
        titel: "Zawarcie umowy",
        absaetze: [
          "Dopóki nie ma koszyka z finalizacją zamówienia, zapytanie wysłane formularzem nie stanowi oferty. Umowa zostaje zawarta dopiero po wyraźnym potwierdzeniu zamówienia przez sprzedawcę.",
        ],
      },
      { titel: "Ceny", absaetze: [`Wszystkie ceny zawierają ustawowy podatek VAT, o ile nie stosuje się zwolnienia dla małych przedsiębiorców. ${P}`, "Koszty wysyłki podawane są osobno przed zawarciem umowy."] },
      { titel: "Dostawa", absaetze: [`Czas i obszar dostawy: ${P}`] },
      { titel: "Płatność", absaetze: [`Dostępne sposoby płatności: ${P}`] },
      { titel: "Rękojmia", absaetze: ["Obowiązują ustawowe przepisy o rękojmi."] },
      {
        titel: "Obietnica 1+1",
        absaetze: [
          "Gdy model darowizn będzie aktywny, w tym miejscu należy podać, która organizacja otrzymuje jaką ilość na każdą sprzedaną sztukę i w jakim terminie.",
          `Konkretne zobowiązanie: ${P}`,
        ],
      },
    ],
  },
  widerruf: {
    titel: "Prawo odstąpienia od umowy",
    einleitung: "Konsumentom przysługuje czternastodniowe prawo odstąpienia. Poniższy tekst opiera się na wzorze ustawowym i wymaga uzupełnienia przed publikacją.",
    abschnitte: [
      {
        titel: "Prawo odstąpienia",
        absaetze: [
          "Mają Państwo prawo odstąpić od umowy w terminie czternastu dni bez podania przyczyny.",
          "Termin do odstąpienia wygasa po upływie czternastu dni od dnia, w którym weszli Państwo w posiadanie rzeczy lub w którym osoba trzecia inna niż przewoźnik weszła w jej posiadanie.",
          `Aby skorzystać z prawa odstąpienia, muszą Państwo poinformować nas (${P} nazwa, adres, e-mail) w drodze jednoznacznego oświadczenia.`,
        ],
      },
      {
        titel: "Skutki odstąpienia",
        absaetze: [
          "W przypadku odstąpienia zwracamy wszystkie otrzymane płatności, w tym koszty dostarczenia, niezwłocznie i nie później niż w terminie czternastu dni.",
          `Bezpośrednie koszty zwrotu rzeczy ponoszą Państwo. ${P}`,
        ],
      },
      {
        titel: "Uwaga dotycząca higieny",
        absaetze: [
          `W przypadku towarów zapieczętowanych, których po otwarciu opakowania nie można zwrócić ze względu na ochronę zdrowia lub higienę, prawo odstąpienia może wygasnąć po usunięciu zabezpieczenia. Należy sprawdzić, czy i których produktów to dotyczy. ${P}`,
        ],
      },
    ],
  },
  "versand-zahlung": {
    titel: "Wysyłka i płatność",
    einleitung: "Jak towar do Ciebie trafia i jak przebiega płatność.",
    abschnitte: [
      { titel: "Wysyłka", absaetze: [`Przewoźnik: ${P}`, `Koszt wysyłki krajowej: ${P}`, `Koszt wysyłki w UE: ${P}`, `Czas dostawy: ${P}`] },
      { titel: "Płatność", absaetze: [`Obecnie zamówienia przyjmujemy jako zapytania; sposób płatności podajemy w potwierdzeniu. ${P}`] },
    ],
  },
};

export const RECHT = { de, en, pl } as const;

/** Rechtsseite in der gewünschten Sprache, sonst Englisch, sonst Deutsch. */
export function rechtsseite(sprache: string, schluessel: RechtSchluessel): Rechtsseite {
  const satz = (RECHT as Record<string, Record<RechtSchluessel, Rechtsseite>>)[sprache];
  return (satz ?? RECHT.en ?? RECHT.de)[schluessel] ?? RECHT.de[schluessel];
}
