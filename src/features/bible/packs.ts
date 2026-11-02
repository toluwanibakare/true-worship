/**
 * Feature: bible — downloadable Bibles ("packs").
 *
 * A pack is a whole translation, stored on this computer once the user
 * adds it, so every verse is listed and searchable offline. Only the
 * versions the user picks are downloaded, one at a time.
 *
 * Source: the scrollmapper/bible_databases project on GitHub, which
 * publishes each translation as one JSON file for exactly this use
 * (https://github.com/scrollmapper/bible_databases, MIT-licensed
 * project). Its catalogue mixes licences, so this list is an allowlist
 * of translations that are public domain or freely licensed for this
 * use: the user is never offered a copyrighted translation here. The
 * licence shown for each pack comes from the CrossWire SWORD module
 * record for the same text, or from its publication age where
 * CrossWire has no record. Copyrighted translations still only arrive
 * through a licensed route (see docs/content-api.md).
 *
 * Coverage is honest, not assumed. Many source files carry a full
 * book template with empty text for books the translation does not
 * cover, so every file was downloaded and checked verse by verse:
 * a pack only claims the books that actually have text, partial
 * editions are labelled as partial (a New Testament, the Old
 * Testament, the New Testament and Psalms), and a book with no text
 * is left out of the stored pack. The American King James Version
 * was in an earlier list and is removed: its licence record is
 * copyrighted, free for non-commercial distribution only.
 *
 * Packs live in IndexedDB (a whole Bible is several megabytes, too much
 * for localStorage), under the "tw-bibles" database.
 */

const BASE =
  'https://raw.githubusercontent.com/scrollmapper/bible_databases/master/formats/json/'

export type PackInfo = {
  id: string
  name: string
  language: string
  /** The id bible-api.com uses for the same text, when it differs, so it is not offered twice. */
  onlineId?: string
  /** Short name shown with a verse, e.g. KJV. */
  abbr: string
  /** Licence the text is offered under, shown in the list. */
  license: string
  /** What the edition actually contains, e.g. Full Bible, New Testament and Psalms. */
  coverage: string
  /** File name on the source, without .json. */
  file: string
}

export const PACKS: PackInfo[] = [
  { id: 'acv', abbr: 'ACV', name: "A Conservative Version", language: "English", license: "Public Domain", coverage: "Full Bible", file: 'ACV' },
  { id: 'asv', abbr: 'ASV', name: "American Standard Version (1901)", language: "English", license: "Public Domain", coverage: "Full Bible", file: 'ASV' },
  { id: 'bsb', abbr: 'BSB', name: "Berean Standard Bible", language: "English", license: "Public Domain (CC0)", coverage: "Full Bible", file: 'BSB' },
  { id: 'cpdv', abbr: 'CPDV', name: "Catholic Public Domain Version", language: "English", license: "Public Domain", coverage: "Full Bible with Deuterocanon", file: 'CPDV' },
  { id: 'drc', onlineId: 'dra', abbr: 'DRC', name: "Douay-Rheims (Challoner)", language: "English", license: "Public Domain", coverage: "Full Bible with Deuterocanon", file: 'DRC' },
  { id: 'darby', abbr: 'Darby', name: "Darby Bible (1889)", language: "English", license: "Public Domain", coverage: "Full Bible", file: 'Darby' },
  { id: 'geneva1599', abbr: 'Geneva', name: "Geneva Bible (1599)", language: "English", license: "Public Domain", coverage: "Full Bible", file: 'Geneva1599' },
  { id: 'jps', abbr: 'JPS', name: "Jewish Publication Society (1917)", language: "English", license: "Public Domain", coverage: "Old Testament", file: 'JPS' },
  { id: 'kjv', abbr: 'KJV', name: "King James Version", language: "English", license: "Public Domain", coverage: "Full Bible", file: 'KJV' },
  { id: 'kjva', abbr: 'KJVA', name: "King James Version with Apocrypha", language: "English", license: "Public Domain", coverage: "Full Bible with Apocrypha", file: 'KJVA' },
  { id: 'kjvpce', abbr: 'KJV PCE', name: "King James Version, Pure Cambridge Edition", language: "English", license: "Public Domain", coverage: "Full Bible", file: 'KJVPCE' },
  { id: 'nheb', abbr: 'NHEB', name: "New Heart English Bible", language: "English", license: "Public Domain", coverage: "Full Bible", file: 'NHEB' },
  { id: 'nhebje', abbr: 'NHEB JE', name: "New Heart English Bible, Jehovah Edition", language: "English", license: "Public Domain", coverage: "Full Bible", file: 'NHEBJE' },
  { id: 'nhebme', abbr: 'NHEB ME', name: "New Heart English Bible, Messianic Edition", language: "English", license: "Public Domain", coverage: "Full Bible", file: 'NHEBME' },
  { id: 'oeb', onlineId: 'oeb-us', abbr: 'OEB', name: "Open English Bible", language: "English", license: "Public Domain (CC0)", coverage: "New Testament and Psalms", file: 'OEB' },
  { id: 'oeb-cw', abbr: 'OEB-CW', name: "Open English Bible, Commonwealth Edition", language: "English (UK)", license: "Public Domain (CC0)", coverage: "New Testament and Psalms", file: 'OEBcth' },
  { id: 'rlt', abbr: 'RLT', name: "Revised Literal Translation", language: "English", license: "Free (GPL)", coverage: "Full Bible", file: 'RLT' },
  { id: 'rnkjv', abbr: 'RNKJV', name: "Restored Name King James Version", language: "English", license: "Public Domain", coverage: "Full Bible", file: 'RNKJV' },
  { id: 'rwebster', abbr: 'RWebster', name: "Revised Webster Version (1833)", language: "English", license: "Public Domain", coverage: "Full Bible", file: 'RWebster' },
  { id: 'rotherham', abbr: 'Rotherham', name: "Rotherham Emphasised Bible", language: "English", license: "Public Domain", coverage: "Full Bible", file: 'Rotherham' },
  { id: 'ukjv', abbr: 'UKJV', name: "Updated King James Version", language: "English", license: "Public Domain", coverage: "Full Bible", file: 'UKJV' },
  { id: 'webster', abbr: 'Webster', name: "Webster's Bible", language: "English", license: "Public Domain", coverage: "Full Bible", file: 'Webster' },
  { id: 'ylt', abbr: 'YLT', name: "Young's Literal Translation (1898)", language: "English", license: "Public Domain", coverage: "Full Bible", file: 'YLT' },
  { id: 'anderson', abbr: 'Anderson', name: "Anderson New Testament (1864)", language: "English", license: "Public Domain", coverage: "New Testament", file: 'Anderson' },
  { id: 'haweis', abbr: 'Haweis', name: "Haweis New Testament (1795)", language: "English", license: "Public Domain", coverage: "New Testament", file: 'Haweis' },
  { id: 'noyes', abbr: 'Noyes', name: "Noyes Translation (1869)", language: "English", license: "Public Domain", coverage: "Job to Malachi and the New Testament", file: 'Noyes' },
  { id: 'twenty', abbr: 'TCNT', name: "Twentieth Century New Testament", language: "English", license: "Public Domain", coverage: "New Testament", file: 'Twenty' },
  { id: 'tyndale', abbr: 'Tyndale', name: "Tyndale Bible (1525/1530)", language: "English", license: "Public Domain", coverage: "Genesis and parts of the New Testament", file: 'Tyndale' },
  { id: 'wycliffe', abbr: 'Wycliffe', name: "Wycliffe Bible (c. 1395)", language: "English", license: "Public Domain", coverage: "Full Bible with Apocrypha", file: 'Wycliffe' },
  { id: 'alb', abbr: 'Alb', name: "Albanian Bible", language: "Albanian", license: "Public Domain", coverage: "Full Bible", file: 'Alb' },
  { id: 'armeastern', abbr: 'ArmE', name: "Eastern Armenian Bible", language: "Armenian", license: "Public Domain", coverage: "Genesis, Exodus and the Gospels", file: 'ArmEastern' },
  { id: 'burjudson', abbr: 'Judson', name: "Judson Burmese Bible (1835)", language: "Burmese", license: "Public Domain", coverage: "Full Bible", file: 'BurJudson' },
  { id: 'cebpinadayag', abbr: 'Ceb', name: "Cebuano Pinadayag", language: "Cebuano", license: "Public Domain", coverage: "Full Bible", file: 'CebPinadayag' },
  { id: 'cherokee', abbr: 'Cherokee', name: "Cherokee New Testament (1860)", language: "Cherokee", license: "Public Domain", coverage: "New Testament", file: 'Che1860' },
  { id: 'cuv', abbr: 'CUV', name: "Chinese Union Version (Traditional)", language: "Chinese", license: "Public Domain", coverage: "Full Bible", file: 'ChiUn' },
  { id: 'chiunl', abbr: 'CUVL', name: "Chinese Union Version (Literary)", language: "Chinese", license: "Public Domain", coverage: "Full Bible", file: 'ChiUnL' },
  { id: 'cslelizabeth', abbr: 'CSl', name: "Church Slavonic Elizabeth Bible (1757)", language: "Church Slavonic", license: "Public Domain", coverage: "Full Bible with Deuterocanon", file: 'CSlElizabeth' },
  { id: 'copsah', abbr: 'CopSah', name: "Sahidic Coptic Bible", language: "Coptic (Sahidic)", license: "CC BY-SA", coverage: "68 books, partial text", file: 'CopSahBible2' },
  { id: 'crosaric', abbr: 'Saric', name: "Croatian Bible, Ivan Saric", language: "Croatian", license: "Public Domain", coverage: "Full Bible with Deuterocanon", file: 'CroSaric' },
  { id: 'bkr', abbr: 'BKR', name: "Bible kralicka", language: "Czech", license: "Public Domain", coverage: "Full Bible", file: 'CzeBKR' },
  { id: 'da1871', abbr: 'Da1871', name: "Danish Bible (OT 1871, NT 1907)", language: "Danish", license: "Public Domain", coverage: "Full Bible", file: 'DaOT1871NT1907' },
  { id: 'beamrk', abbr: 'BeaMRK', name: "Gospel of Mark in Danezaa (Beaver)", language: "Danezaa", license: "Public Domain", coverage: "Mark", file: 'BeaMRK' },
  { id: 'dutsvv', abbr: 'SVV', name: "Dutch Statenvertaling", language: "Dutch", license: "Public Domain", coverage: "Full Bible with Deuterocanon", file: 'DutSVV' },
  { id: 'dutsvva', abbr: 'SVVA', name: "Dutch Statenvertaling with Apocrypha", language: "Dutch", license: "Public Domain", coverage: "Full Bible with Deuterocanon", file: 'DutSVVA' },
  { id: 'canisius', abbr: 'Canisius', name: "Petrus Canisius Translation (1939)", language: "Dutch", license: "Public Domain", coverage: "Full Bible with Deuterocanon", file: 'NlCanisius1939' },
  { id: 'vlsjo', abbr: 'VlsJo', name: "New Testament, Nicolaas De Jonge", language: "West Flemish", license: "Public Domain", coverage: "New Testament", file: 'vlsJoNT' },
  { id: 'esperanto', abbr: 'Esp', name: "Esperanto Londona Biblio", language: "Esperanto", license: "Public Domain", coverage: "Full Bible", file: 'Esperanto' },
  { id: 'est', abbr: 'Est', name: "Estonian Bible (1739)", language: "Estonian", license: "Public Domain", coverage: "Genesis and the New Testament", file: 'Est' },
  { id: 'finbiblia', abbr: 'Fin1776', name: "Finnish Biblia (1776)", language: "Finnish", license: "Public Domain", coverage: "Full Bible with Deuterocanon", file: 'FinBiblia' },
  { id: 'finpr', abbr: 'FinPR', name: "Finnish Pyha Raamattu (1933/1938)", language: "Finnish", license: "Public Domain", coverage: "Full Bible with Deuterocanon", file: 'FinPR' },
  { id: 'frebbb', abbr: 'BBB', name: "French Bible Bovet Bonnet (1900)", language: "French", license: "Public Domain", coverage: "Full Bible", file: 'FreBBB' },
  { id: 'frebdm', abbr: 'Martin', name: "Bible David Martin (1744)", language: "French", license: "Public Domain", coverage: "Full Bible", file: 'FreBDM1744' },
  { id: 'frecrampon', abbr: 'Crampon', name: "La Bible Augustin Crampon (1923)", language: "French", license: "Public Domain", coverage: "Full Bible with Deuterocanon", file: 'FreCrampon' },
  { id: 'fregeneve', abbr: 'Geneve', name: "Geneva New Testament (1669)", language: "French", license: "Public Domain", coverage: "New Testament", file: 'FreGeneve1669' },
  { id: 'frejnd', abbr: 'JND', name: "Bible J.N. Darby (French)", language: "French", license: "Public Domain", coverage: "Full Bible", file: 'FreJND' },
  { id: 'frelxx', abbr: 'LXXFr', name: "French Septuagint, Giguet (1872)", language: "French", license: "Public Domain", coverage: "Old Testament (Septuagint)", file: 'FreLXX' },
  { id: 'frelxxgiguet', abbr: 'LXXG', name: "French Septuagint, Giguet (1872), alternate edition", language: "French", license: "Public Domain", coverage: "Old Testament (Septuagint)", file: 'FreLXXGiguet' },
  { id: 'freoltramare', abbr: 'Oltramare', name: "New Testament, Oltramare (1874)", language: "French", license: "Public Domain", coverage: "New Testament", file: 'FreOltramare1874' },
  { id: 'frepgr', abbr: 'PGR', name: "Bible Perret-Gentil et Rilliet", language: "French", license: "Public Domain", coverage: "Full Bible", file: 'FrePGR' },
  { id: 'frestapfer', abbr: 'Stapfer', name: "New Testament, Stapfer (1889)", language: "French", license: "Public Domain", coverage: "New Testament", file: 'FreStapfer1889' },
  { id: 'fresynodale', abbr: 'Synodale', name: "New Testament, Version Synodale (1921), with Psalms", language: "French", license: "Public Domain", coverage: "New Testament and Psalms", file: 'FreSynodale1921' },
  { id: 'geralbrecht', abbr: 'Albrecht', name: "Albrecht New Testament and Psalms", language: "German", license: "Public Domain", coverage: "New Testament and Psalms", file: 'GerAlbrecht' },
  { id: 'gerbolut', abbr: 'Luther', name: "Luther Bible (1545), modern spelling", language: "German", license: "Public Domain", coverage: "Full Bible", file: 'GerBoLut' },
  { id: 'gerelb1871', abbr: 'Elb1871', name: "Elberfelder Bible (1871)", language: "German", license: "Public Domain", coverage: "Full Bible", file: 'GerElb1871' },
  { id: 'gerelb1905', abbr: 'Elb1905', name: "Elberfelder Bible (1905)", language: "German", license: "Public Domain", coverage: "Full Bible", file: 'GerElb1905' },
  { id: 'gergruenewald', abbr: 'Grunewald', name: "Grunewald Bible (1924)", language: "German", license: "Public Domain", coverage: "Full Bible", file: 'GerGruenewald' },
  { id: 'germenge', abbr: 'Menge', name: "Menge Bible (1939)", language: "German", license: "Public Domain", coverage: "Full Bible with Deuterocanon", file: 'GerMenge' },
  { id: 'geroffbist', abbr: 'OffBiSt', name: "Offene Bibel, Study Edition", language: "German", license: "CC BY-SA 4.0", coverage: "55 books, partial text", file: 'GerOffBiSt' },
  { id: 'gertafel', abbr: 'Tafel', name: "Tafel Bible (1911)", language: "German", license: "Public Domain", coverage: "56 books", file: 'GerTafel' },
  { id: 'gertextbibel', abbr: 'Textbibel', name: "Textbibel (1906)", language: "German", license: "Public Domain", coverage: "Full Bible", file: 'GerTextbibel' },
  { id: 'gerzurcher', abbr: 'Zurcher', name: "Zurich Bible (1931)", language: "German", license: "Public Domain", coverage: "Full Bible", file: 'GerZurcher' },
  { id: 'wulfila', abbr: 'Wulfila', name: "Wulfila Gothic Bible", language: "Gothic", license: "Public Domain", coverage: "18 books, surviving fragments", file: 'Wulfila' },
  { id: 'grevamvas', abbr: 'Vamvas', name: "Vamvas Greek Bible (1850)", language: "Greek", license: "Public Domain", coverage: "Full Bible", file: 'GreVamvas' },
  { id: 'statresgnt', abbr: 'SRGNT', name: "Statistical Restoration Greek New Testament", language: "Greek (Ancient)", license: "CC BY 4.0", coverage: "New Testament", file: 'StatResGNT' },
  { id: 'haitian', abbr: 'Haitian', name: "Haitian Creole Bible", language: "Haitian Creole", license: "Public Domain", coverage: "Full Bible", file: 'Haitian' },
  { id: 'mapm', abbr: 'MapM', name: "Miqra al pi ha-Mesorah", language: "Hebrew (Ancient)", license: "CC BY-SA 4.0", coverage: "Old Testament", file: 'MapM' },
  { id: 'wlc', abbr: 'WLC', name: "Westminster Leningrad Codex", language: "Hebrew (Ancient)", license: "Public Domain", coverage: "Old Testament", file: 'WLC' },
  { id: 'hunkar', abbr: 'Karoli', name: "Karoli Bible (1908)", language: "Hungarian", license: "Public Domain", coverage: "Full Bible", file: 'HunKar' },
  { id: 'japbungo', abbr: 'Bungo', name: "Japanese Bungo Bible", language: "Japanese", license: "Public Domain", coverage: "Full Bible", file: 'JapBungo' },
  { id: 'japdenmo', abbr: 'Denmo', name: "Japanese Denmo Bible", language: "Japanese", license: "Public Domain", coverage: "13 books of the New Testament", file: 'JapDenmo' },
  { id: 'japkougo', abbr: 'Kougo', name: "Japanese Kougo Bible (1954/1955)", language: "Japanese", license: "Public Domain", coverage: "Full Bible", file: 'JapKougo' },
  { id: 'klv', abbr: 'KLV', name: "Klingon Language Version (from the World English Bible)", language: "Klingon", license: "Public Domain", coverage: "Full Bible", file: 'KLV' },
  { id: 'korrv', abbr: 'KorRV', name: "Korean Revised Version", language: "Korean", license: "Public Domain", coverage: "Full Bible", file: 'KorRV' },
  { id: 'clementine', abbr: 'Clementine', name: "Clementine Latin Vulgate", language: "Latin", license: "Public Domain", coverage: "Full Bible with Deuterocanon", file: 'VulgClementine' },
  { id: 'vulgconte', abbr: 'VulgConte', name: "Clementine Vulgate, Conte edition", language: "Latin", license: "Public Domain", coverage: "Full Bible with Deuterocanon", file: 'VulgConte' },
  { id: 'vulghetz', abbr: 'VulgHetz', name: "Clementine Vulgate, Hetzenauer edition", language: "Latin", license: "Public Domain", coverage: "Full Bible with Deuterocanon", file: 'VulgHetzenauer' },
  { id: 'vulgsistine', abbr: 'VulgSist', name: "Sistine Vulgate", language: "Latin", license: "Public Domain", coverage: "Full Bible with Deuterocanon", file: 'VulgSistine' },
  { id: 'vulgate', abbr: 'Vulgate', name: "Latin Vulgate", language: "Latin", license: "Public Domain", coverage: "Full Bible with Deuterocanon", file: 'Vulgate' },
  { id: 'lvgluck', abbr: 'Gluck', name: "Latvian Gluck Bible, 8th edition", language: "Latvian", license: "Public Domain", coverage: "Full Bible", file: 'LvGluck8' },
  { id: 'mg1865', abbr: 'Mg1865', name: "Malagasy Bible (1865)", language: "Malagasy", license: "Public Domain", coverage: "Full Bible", file: 'Mg1865' },
  { id: 'mal1910', abbr: 'Mal1910', name: "Sathyavedapusthakam (Malayalam, 1910)", language: "Malayalam", license: "Public Domain", coverage: "Full Bible", file: 'Mal1910' },
  { id: 'manx', abbr: 'Manx', name: "Manx Gaelic Scripture Portions", language: "Manx", license: "Public Domain", coverage: "Esther, Jonah, Matthew, Luke and John", file: 'ManxGaelic' },
  { id: 'norsmb', abbr: 'NorSMB', name: "Studentmallagsbibelen (1921)", language: "Norwegian (Nynorsk)", license: "Public Domain", coverage: "Full Bible", file: 'NorSMB' },
  { id: 'norsk', abbr: 'Norsk', name: "Bibelen pa Norsk (1930)", language: "Norwegian (Bokmal)", license: "Public Domain", coverage: "Full Bible", file: 'Norsk' },
  { id: 'pohnold', abbr: 'Pohn', name: "Old Pohnpeian Bible", language: "Pohnpeian", license: "Public Domain", coverage: "New Testament and Psalms", file: 'PohnOld' },
  { id: 'polgdanska', abbr: 'Gdanska', name: "Polish Gdansk Bible (1881)", language: "Polish", license: "Public Domain", coverage: "Full Bible", file: 'PolGdanska' },
  { id: 'porblivre', abbr: 'BLivre', name: "Biblia Livre", language: "Portuguese", license: "CC BY 3.0", coverage: "Full Bible", file: 'PorBLivre' },
  { id: 'porblivretr', abbr: 'BLivreTR', name: "Biblia Livre, Textus Receptus", language: "Portuguese", license: "CC BY 3.0", coverage: "Full Bible", file: 'PorBLivreTR' },
  { id: 'pornva', abbr: 'PorNVA', name: "Biblia Nova Versao de Acesso Livre", language: "Portuguese", license: "CC BY-SA 4.0", coverage: "Full Bible", file: 'PorNVA' },
  { id: 'rusmakarij', abbr: 'Makarij', name: "Makarij Pentateuch (Russian)", language: "Russian", license: "Public Domain", coverage: "Pentateuch", file: 'RusMakarij' },
  { id: 'synodal', abbr: 'Synodal', name: "Russian Synodal Translation", language: "Russian", license: "Public Domain", coverage: "Full Bible with Deuterocanon", file: 'RusSynodal' },
  { id: 'srkdekavski', abbr: 'SrKD', name: "Serbian Bible, Danicic-Karadzic (Ekavian)", language: "Serbian", license: "Public Domain", coverage: "Full Bible", file: 'SrKDEkavski' },
  { id: 'srkdijekav', abbr: 'SrKDI', name: "Serbian Bible, Danicic-Karadzic (Ijekavian)", language: "Serbian", license: "Public Domain", coverage: "Full Bible", file: 'SrKDIjekav' },
  { id: 'slostritar', abbr: 'Stritar', name: "Stritar New Testament and Psalms (1882)", language: "Slovenian", license: "Public Domain", coverage: "New Testament and Psalms", file: 'SloStritar' },
  { id: 'spaplatense', abbr: 'Platense', name: "Biblia Platense (Straubinger)", language: "Spanish", license: "Public Domain", coverage: "Full Bible with Deuterocanon", file: 'SpaPlatense' },
  { id: 'sparv', abbr: 'RV1909', name: "Reina-Valera (1909)", language: "Spanish", license: "Public Domain", coverage: "Full Bible", file: 'SpaRV' },
  { id: 'sparv1865', abbr: 'RV1865', name: "Reina-Valera (1865)", language: "Spanish", license: "Public Domain", coverage: "Full Bible", file: 'SpaRV1865' },
  { id: 'swe1917', abbr: 'Swe1917', name: "Swedish Bible (1917)", language: "Swedish", license: "Public Domain", coverage: "Full Bible with Deuterocanon", file: 'Swe1917' },
  { id: 'swekarlxii', abbr: 'KarlXII', name: "Swedish Karl XII Bible (1703)", language: "Swedish", license: "Public Domain", coverage: "44 books", file: 'SweKarlXII' },
  { id: 'swekarlxii1873', abbr: 'KarlXII1873', name: "Swedish Karl XII Bible (1873)", language: "Swedish", license: "Public Domain", coverage: "Full Bible", file: 'SweKarlXII1873' },
  { id: 'peshitta', abbr: 'Peshitta', name: "Syriac Peshitta", language: "Syriac", license: "Public Domain", coverage: "New Testament", file: 'Peshitta' },
  { id: 'tagangbiblia', abbr: 'Tag', name: "Philippine Bible (1905)", language: "Tagalog", license: "Public Domain", coverage: "Full Bible", file: 'TagAngBiblia' },
  { id: 'ukrogienko', abbr: 'Ogienko', name: "Ukrainian Bible, Ohienko", language: "Ukrainian", license: "Public Domain", coverage: "Full Bible", file: 'UkrOgienko' },
  { id: 'viet', abbr: 'Viet', name: "Vietnamese Bible (1934)", language: "Vietnamese", license: "Public Domain", coverage: "Full Bible", file: 'Viet' },
]

/** What is kept for one downloaded Bible: book names, and a row per verse. */
export type StoredPack = {
  id: string
  name: string
  books: string[]
  /** [book index, chapter, verse, text] */
  rows: [number, number, number, string][]
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('tw-bibles', 1)
    request.onupgradeneeded = () => request.result.createObjectStore('packs')
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Could not open storage.'))
  })
}

async function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('packs', mode)
    const request = run(transaction.objectStore('packs'))
    // Resolve once the transaction has committed (so a write is durable),
    // then release the connection; leaving connections open blocks later
    // upgrades and deletes.
    transaction.oncomplete = () => {
      db.close()
      resolve(request.result)
    }
    transaction.onerror = () => {
      db.close()
      reject(transaction.error ?? request.error ?? new Error('Storage failed.'))
    }
    transaction.onabort = transaction.onerror
  })
}

export const savePack = (pack: StoredPack) => withStore('readwrite', (store) => store.put(pack, pack.id))
export const readPack = (id: string) =>
  withStore<StoredPack | undefined>('readonly', (store) => store.get(id))
export const removePack = (id: string) => withStore('readwrite', (store) => store.delete(id))
export const listPackIds = () => withStore<IDBValidKey[]>('readonly', (store) => store.getAllKeys())

/**
 * Download one translation and turn it into a StoredPack. `onProgress`
 * gets 0 to 1 when the server says how big the file is. Throws a plain
 * message when the download or the shape of the file is not what was
 * expected.
 */
export async function downloadPack(
  info: PackInfo,
  onProgress?: (fraction: number) => void,
): Promise<StoredPack> {
  const response = await fetch(`${BASE}${info.file}.json`)
  if (!response.ok) {
    throw new Error(`Could not download ${info.name} (the server said ${response.status}).`)
  }
  const total = Number(response.headers.get('content-length')) || 0
  const reader = response.body?.getReader()
  let text: string
  if (reader) {
    const chunks: Uint8Array[] = []
    let received = 0
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
      received += value.length
      if (total > 0) onProgress?.(Math.min(received / total, 1))
    }
    const joined = new Uint8Array(received)
    let at = 0
    for (const chunk of chunks) {
      joined.set(chunk, at)
      at += chunk.length
    }
    text = new TextDecoder().decode(joined)
  } else {
    text = await response.text()
  }

  const data = JSON.parse(text) as {
    books?: { name?: string; chapters?: { chapter?: number; verses?: { verse?: number; text?: string }[] }[] }[]
  }
  if (!Array.isArray(data.books)) throw new Error(`${info.name} arrived in a shape I do not recognise.`)
  const books: string[] = []
  const rows: StoredPack['rows'] = []
  data.books.forEach((book) => {
    // A book only joins the stored pack when it has real text: source
    // files pad uncovered books with empty verses, and an empty book
    // listed in the panel would promise scripture that is not there.
    const bookRows: StoredPack['rows'] = []
    const bookIndex = books.length
    for (const chapter of book.chapters ?? []) {
      for (const verse of chapter.verses ?? []) {
        const clean = String(verse.text ?? '')
          .replace(/<[^>]*>/g, '')
          .replace(/\s+/g, ' ')
          .trim()
        if (clean) bookRows.push([bookIndex, Number(chapter.chapter), Number(verse.verse), clean])
      }
    }
    if (bookRows.length === 0) return
    books.push(String(book.name ?? `Book ${bookIndex + 1}`))
    rows.push(...bookRows)
  })
  if (rows.length < 1000) throw new Error(`${info.name} arrived incomplete (${rows.length} verses).`)
  return { id: info.id, name: info.name, books, rows }
}

/** Canonical order of the 66 books, for sorting verses that did not come from a pack. */
export const BOOK_ORDER = [
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth',
  '1 Samuel', '2 Samuel', '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra',
  'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs', 'Ecclesiastes', 'Song of Solomon',
  'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos',
  'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah',
  'Malachi', 'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', '1 Corinthians',
  '2 Corinthians', 'Galatians', 'Ephesians', 'Philippians', 'Colossians', '1 Thessalonians',
  '2 Thessalonians', '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James',
  '1 Peter', '2 Peter', '1 John', '2 John', '3 John', 'Jude', 'Revelation',
]

const ROMAN: Record<string, string> = { i: '1', ii: '2', iii: '3' }

/** "I Corinthians" as "1 Corinthians": some sources number books with roman numerals. */
export const displayBook = (name: string) =>
  name.replace(/^(iii|ii|i)\s+/i, (match) => `${ROMAN[match.trim().toLowerCase()]} `)

/** A book name as typed ("1 Cor", "jn.", "I Corinthians") reduced to letters and digits, for matching. */
export const bookKey = (name: string) => displayBook(name.trim()).toLowerCase().replace(/[^a-z0-9]/g, '')

/** Common short forms that are not the start of the book's name. */
const ALIASES: Record<string, string> = {
  gn: 'genesis', ex: 'exodus', lv: 'leviticus', nm: 'numbers', dt: 'deuteronomy',
  jos: 'joshua', jdg: 'judges', jg: 'judges', rt: 'ruth', ps: 'psalms', pss: 'psalms',
  prv: 'proverbs', pr: 'proverbs', ec: 'ecclesiastes', sos: 'songofsolomon',
  song: 'songofsolomon', is: 'isaiah', jer: 'jeremiah', eze: 'ezekiel', dn: 'daniel',
  mt: 'matthew', mk: 'mark', mr: 'mark', lk: 'luke', jn: 'john', jhn: 'john',
  act: 'acts', rm: 'romans', ro: 'romans', gal: 'galatians', eph: 'ephesians',
  php: 'philippians', phil: 'philippians', col: 'colossians', tit: 'titus',
  phm: 'philemon', heb: 'hebrews', jas: 'james', jm: 'james', jud: 'jude', rev: 'revelation',
  '1jn': '1john', '2jn': '2john', '3jn': '3john', '1pt': '1peter', '2pt': '2peter',
  '1sm': '1samuel', '2sm': '2samuel', '1kgs': '1kings', '2kgs': '2kings',
  '1chr': '1chronicles', '2chr': '2chronicles', '1th': '1thessalonians', '2th': '2thessalonians',
  '1tm': '1timothy', '2tm': '2timothy', '1co': '1corinthians', '2co': '2corinthians',
}

/** True when a book (as a bookKey) is the one the typed text names: a prefix or a short form. */
export const matchesBook = (book: string, typed: string) =>
  typed.length > 0 && (book.startsWith(typed) || (ALIASES[typed] !== undefined && book.startsWith(ALIASES[typed])))
