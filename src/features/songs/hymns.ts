import type { Song, Verse } from '../../shared/lib/types'

/**
 * The public-domain hymn pack. Every text here is old enough, and its author
 * (or translator) long enough dead, to be public domain. Nothing modern goes
 * in: a hymn needs a verifiable author and a text first published before 1929.
 * Added to the library once, the first time a hymn is not already there (see
 * App); a hymn the user deletes is not put back.
 */
type Hymn = {
  title: string
  author: string
  /** Verses, one string each, lines separated by a newline. */
  verses: string[]
  /** Sung after every verse, when the hymn has one. */
  chorus?: string
}

const HYMNS: Hymn[] = [
  {
    title: 'A Mighty Fortress Is Our God',
    author: 'Martin Luther, tr. Frederick H. Hedge',
    verses: [
      'A mighty fortress is our God,\nA bulwark never failing;\nOur helper He, amid the flood\nOf mortal ills prevailing.\nFor still our ancient foe\nDoth seek to work us woe;\nHis craft and power are great,\nAnd, armed with cruel hate,\nOn earth is not his equal.',
      "Did we in our own strength confide,\nOur striving would be losing;\nWere not the right man on our side,\nThe man of God's own choosing.\nDost ask who that may be?\nChrist Jesus, it is He;\nLord Sabaoth His name,\nFrom age to age the same,\nAnd He must win the battle.",
      'And though this world, with devils filled,\nShould threaten to undo us,\nWe will not fear, for God hath willed\nHis truth to triumph through us.\nThe Prince of Darkness grim,\nWe tremble not for him;\nHis rage we can endure,\nFor lo! his doom is sure,\nOne little word shall fell him.',
      "That word above all earthly powers,\nNo thanks to them, abideth;\nThe Spirit and the gifts are ours\nThrough Him who with us sideth.\nLet goods and kindred go,\nThis mortal life also;\nThe body they may kill:\nGod's truth abideth still,\nHis kingdom is forever.",
    ],
  },
  {
    title: 'Abide with Me',
    author: 'Henry Francis Lyte',
    verses: [
      'Abide with me; fast falls the eventide;\nThe darkness deepens; Lord, with me abide.\nWhen other helpers fail and comforts flee,\nHelp of the helpless, O abide with me.',
      "Swift to its close ebbs out life's little day;\nEarth's joys grow dim, its glories pass away;\nChange and decay in all around I see;\nO Thou who changest not, abide with me.",
      'I need Thy presence every passing hour;\nWhat but Thy grace can foil the tempter\'s power?\nWho like Thyself my guide and stay can be?\nThrough cloud and sunshine, Lord, abide with me.',
      "Hold Thou Thy cross before my closing eyes;\nShine through the gloom and point me to the skies;\nHeaven's morning breaks, and earth's vain shadows flee;\nIn life, in death, O Lord, abide with me.",
    ],
  },
  {
    title: 'All Hail the Power of Jesus’ Name',
    author: 'Edward Perronet',
    verses: [
      "All hail the power of Jesus' name!\nLet angels prostrate fall;\nBring forth the royal diadem,\nAnd crown Him Lord of all.\nBring forth the royal diadem,\nAnd crown Him Lord of all.",
      "Ye chosen seed of Israel's race,\nYe ransomed from the fall,\nHail Him who saves you by His grace,\nAnd crown Him Lord of all.\nHail Him who saves you by His grace,\nAnd crown Him Lord of all.",
      'Let every kindred, every tribe,\nOn this terrestrial ball,\nTo Him all majesty ascribe,\nAnd crown Him Lord of all.\nTo Him all majesty ascribe,\nAnd crown Him Lord of all.',
    ],
  },
  {
    title: 'And Can It Be',
    author: 'Charles Wesley',
    verses: [
      'And can it be that I should gain\nAn interest in the Savior\'s blood?\nDied He for me, who caused His pain?\nFor me, who Him to death pursued?\nAmazing love! How can it be,\nThat Thou, my God, shouldst die for me?',
      "'Tis mystery all! The Immortal dies:\nWho can explore His strange design?\nIn vain the first-born seraph tries\nTo sound the depths of love divine.\n'Tis mercy all! Let earth adore,\nLet angel minds inquire no more.",
      'No condemnation now I dread;\nJesus, and all in Him, is mine;\nAlive in Him, my living Head,\nAnd clothed in righteousness divine,\nBold I approach the eternal throne,\nAnd claim the crown, through Christ my own.',
    ],
  },
  {
    title: 'Be Thou My Vision',
    author: 'Ancient Irish, tr. Eleanor Hull',
    verses: [
      'Be Thou my Vision, O Lord of my heart;\nNaught be all else to me, save that Thou art;\nThou my best Thought, by day or by night,\nWaking or sleeping, Thy presence my light.',
      'Be Thou my Wisdom, and Thou my true Word;\nI ever with Thee and Thou with me, Lord;\nThou my great Father, I Thy true son;\nThou in me dwelling, and I with Thee one.',
      "Riches I heed not, nor man's empty praise,\nThou mine Inheritance, now and always;\nThou and Thou only, first in my heart,\nHigh King of heaven, my Treasure Thou art.",
      "High King of heaven, my victory won,\nMay I reach heaven's joys, O bright heaven's Sun!\nHeart of my own heart, whatever befall,\nStill be my Vision, O Ruler of all.",
    ],
  },
  {
    title: 'Blessed Assurance',
    author: 'Fanny J. Crosby',
    verses: [
      'Blessed assurance, Jesus is mine!\nO what a foretaste of glory divine!\nHeir of salvation, purchase of God,\nBorn of His Spirit, washed in His blood.',
      'Perfect submission, perfect delight,\nVisions of rapture now burst on my sight;\nAngels descending bring from above\nEchoes of mercy, whispers of love.',
      'Perfect submission, all is at rest,\nI in my Savior am happy and blest,\nWatching and waiting, looking above,\nFilled with His goodness, lost in His love.',
    ],
    chorus: 'This is my story, this is my song,\nPraising my Savior all the day long;\nThis is my story, this is my song,\nPraising my Savior all the day long.',
  },
  {
    title: 'Christ the Lord Is Risen Today',
    author: 'Charles Wesley',
    verses: [
      'Christ the Lord is risen today, Alleluia!\nSons of men and angels say, Alleluia!\nRaise your joys and triumphs high, Alleluia!\nSing, ye heavens, and earth reply, Alleluia!',
      'Lives again our glorious King, Alleluia!\nWhere, O death, is now thy sting? Alleluia!\nDying once, He all doth save, Alleluia!\nWhere thy victory, O grave? Alleluia!',
      "Love's redeeming work is done, Alleluia!\nFought the fight, the battle won, Alleluia!\nDeath in vain forbids Him rise, Alleluia!\nChrist has opened paradise, Alleluia!",
      'Soar we now where Christ has led, Alleluia!\nFollowing our exalted Head, Alleluia!\nMade like Him, like Him we rise, Alleluia!\nOurs the cross, the grave, the skies, Alleluia!',
    ],
  },
  {
    title: 'Come Thou Fount of Every Blessing',
    author: 'Robert Robinson',
    verses: [
      "Come, Thou Fount of every blessing,\nTune my heart to sing Thy grace;\nStreams of mercy, never ceasing,\nCall for songs of loudest praise.\nTeach me some melodious sonnet,\nSung by flaming tongues above;\nPraise the mount! I'm fixed upon it,\nMount of Thy redeeming love.",
      "Here I raise mine Ebenezer;\nHither by Thy help I'm come;\nAnd I hope, by Thy good pleasure,\nSafely to arrive at home.\nJesus sought me when a stranger,\nWandering from the fold of God;\nHe, to rescue me from danger,\nInterposed His precious blood.",
      "O to grace how great a debtor\nDaily I'm constrained to be!\nLet Thy goodness, like a fetter,\nBind my wandering heart to Thee.\nProne to wander, Lord, I feel it,\nProne to leave the God I love;\nHere's my heart, O take and seal it,\nSeal it for Thy courts above.",
    ],
  },
  {
    title: 'For the Beauty of the Earth',
    author: 'Folliott S. Pierpoint',
    verses: [
      'For the beauty of the earth,\nFor the glory of the skies,\nFor the love which from our birth\nOver and around us lies;',
      'For the beauty of each hour\nOf the day and of the night,\nHill and vale, and tree and flower,\nSun and moon, and stars of light;',
      "For the joy of ear and eye,\nFor the heart and mind's delight,\nFor the mystic harmony\nLinking sense to sound and sight;",
    ],
    chorus: 'Lord of all, to Thee we raise\nThis our hymn of grateful praise.',
  },
  {
    title: 'Hallelujah! What a Savior',
    author: 'Philip P. Bliss',
    verses: [
      '"Man of Sorrows," what a name\nFor the Son of God, who came\nRuined sinners to reclaim!\nHallelujah! What a Savior!',
      'Bearing shame and scoffing rude,\nIn my place condemned He stood;\nSealed my pardon with His blood:\nHallelujah! What a Savior!',
      'Guilty, vile, and helpless we;\nSpotless Lamb of God was He;\n"Full atonement!" can it be?\nHallelujah! What a Savior!',
      'Lifted up was He to die;\n"It is finished!" was His cry;\nNow in heaven exalted high:\nHallelujah! What a Savior!',
      'When He comes, our glorious King,\nAll His ransomed home to bring,\nThen anew His song we\'ll sing:\nHallelujah! What a Savior!',
    ],
  },
  {
    title: 'Hark! The Herald Angels Sing',
    author: 'Charles Wesley',
    verses: [
      'Hark! the herald angels sing,\n"Glory to the newborn King;\nPeace on earth, and mercy mild,\nGod and sinners reconciled!"\nJoyful, all ye nations, rise,\nJoin the triumph of the skies;\nWith angelic host proclaim,\n"Christ is born in Bethlehem!"',
      'Christ, by highest heaven adored;\nChrist, the everlasting Lord;\nLate in time, behold Him come,\nOffspring of a virgin\'s womb.\nVeiled in flesh the Godhead see;\nHail the incarnate Deity,\nPleased as man with men to dwell,\nJesus, our Emmanuel.',
      'Hail the heaven-born Prince of Peace!\nHail the Sun of Righteousness!\nLight and life to all He brings,\nRisen with healing in His wings.\nMild He lays His glory by,\nBorn that man no more may die,\nBorn to raise the sons of earth,\nBorn to give them second birth.',
    ],
    chorus: 'Hark! the herald angels sing,\n"Glory to the newborn King!"',
  },
  {
    title: 'Holy, Holy, Holy',
    author: 'Reginald Heber',
    verses: [
      'Holy, holy, holy! Lord God Almighty!\nEarly in the morning our song shall rise to Thee;\nHoly, holy, holy! Merciful and mighty!\nGod in three Persons, blessed Trinity!',
      'Holy, holy, holy! All the saints adore Thee,\nCasting down their golden crowns around the glassy sea;\nCherubim and seraphim falling down before Thee,\nWhich wert, and art, and evermore shalt be.',
      'Holy, holy, holy! Though the darkness hide Thee,\nThough the eye of sinful man Thy glory may not see,\nOnly Thou art holy; there is none beside Thee,\nPerfect in power, in love, and purity.',
      'Holy, holy, holy! Lord God Almighty!\nAll Thy works shall praise Thy name, in earth and sky and sea;\nHoly, holy, holy! Merciful and mighty!\nGod in three Persons, blessed Trinity!',
    ],
  },
  {
    title: 'It Came Upon the Midnight Clear',
    author: 'Edmund H. Sears',
    verses: [
      'It came upon the midnight clear,\nThat glorious song of old,\nFrom angels bending near the earth\nTo touch their harps of gold:\n"Peace on the earth, good will to men,\nFrom heaven\'s all-gracious King."\nThe world in solemn stillness lay\nTo hear the angels sing.',
      'Still through the cloven skies they come,\nWith peaceful wings unfurled,\nAnd still their heavenly music floats\nO\'er all the weary world;\nAbove its sad and lowly plains\nThey bend on hovering wing,\nAnd ever o\'er its Babel sounds\nThe blessed angels sing.',
    ],
  },
  {
    title: 'It Is Well with My Soul',
    author: 'Horatio G. Spafford',
    verses: [
      'When peace like a river attendeth my way,\nWhen sorrows like sea billows roll;\nWhatever my lot, Thou hast taught me to say,\nIt is well, it is well with my soul.',
      'Though Satan should buffet, though trials should come,\nLet this blest assurance control,\nThat Christ hath regarded my helpless estate,\nAnd hath shed His own blood for my soul.',
      'My sin—oh, the bliss of this glorious thought!—\nMy sin, not in part but the whole,\nIs nailed to the cross, and I bear it no more,\nPraise the Lord, praise the Lord, O my soul!',
      'And Lord, haste the day when my faith shall be sight,\nThe clouds be rolled back as a scroll;\nThe trump shall resound, and the Lord shall descend,\nEven so, it is well with my soul.',
    ],
    chorus: 'It is well (it is well),\nWith my soul (with my soul),\nIt is well, it is well with my soul.',
  },
  {
    title: 'Jesus Loves Me',
    author: 'Anna B. Warner',
    verses: [
      'Jesus loves me! This I know,\nFor the Bible tells me so;\nLittle ones to Him belong;\nThey are weak, but He is strong.',
      "Jesus loves me! He who died\nHeaven's gate to open wide;\nHe will wash away my sin,\nLet His little child come in.",
      'Jesus loves me! He will stay\nClose beside me all the way;\nIf I love Him, when I die\nHe will take me home on high.',
    ],
    chorus: 'Yes, Jesus loves me! Yes, Jesus loves me!\nYes, Jesus loves me! The Bible tells me so.',
  },
  {
    title: 'Joy to the World',
    author: 'Isaac Watts',
    verses: [
      'Joy to the world! the Lord is come;\nLet earth receive her King;\nLet every heart prepare Him room,\nAnd heaven and nature sing,\nAnd heaven and nature sing,\nAnd heaven, and heaven and nature sing.',
      'Joy to the earth! the Saviour reigns;\nLet men their songs employ;\nWhile fields and floods, rocks, hills and plains\nRepeat the sounding joy,\nRepeat the sounding joy,\nRepeat, repeat the sounding joy.',
      'No more let sins and sorrows grow,\nNor thorns infest the ground;\nHe comes to make His blessings flow\nFar as the curse is found,\nFar as the curse is found,\nFar as, far as the curse is found.',
      'He rules the world with truth and grace,\nAnd makes the nations prove\nThe glories of His righteousness,\nAnd wonders of His love,\nAnd wonders of His love,\nAnd wonders, wonders of His love.',
    ],
  },
  {
    title: 'Just As I Am',
    author: 'Charlotte Elliott',
    verses: [
      'Just as I am, without one plea,\nBut that Thy blood was shed for me,\nAnd that Thou bidd\'st me come to Thee,\nO Lamb of God, I come, I come.',
      'Just as I am, and waiting not\nTo rid my soul of one dark blot,\nTo Thee whose blood can cleanse each spot,\nO Lamb of God, I come, I come.',
      'Just as I am, though tossed about\nWith many a conflict, many a doubt,\nFightings and fears within, without,\nO Lamb of God, I come, I come.',
      'Just as I am, poor, wretched, blind;\nSight, riches, healing of the mind,\nYea, all I need, in Thee to find,\nO Lamb of God, I come, I come.',
    ],
  },
  {
    title: 'Leaning on the Everlasting Arms',
    author: 'Elisha A. Hoffman',
    verses: [
      'What a fellowship, what a joy divine,\nLeaning on the everlasting arms;\nWhat a blessedness, what a peace is mine,\nLeaning on the everlasting arms.',
      'O how sweet to walk in this pilgrim way,\nLeaning on the everlasting arms;\nO how bright the path grows from day to day,\nLeaning on the everlasting arms.',
      'What have I to dread, what have I to fear,\nLeaning on the everlasting arms?\nI have blessed peace with my Lord so near,\nLeaning on the everlasting arms.',
    ],
    chorus: 'Leaning, leaning,\nSafe and secure from all alarms;\nLeaning, leaning,\nLeaning on the everlasting arms.',
  },
  {
    title: 'Love Divine, All Loves Excelling',
    author: 'Charles Wesley',
    verses: [
      'Love divine, all loves excelling,\nJoy of heaven, to earth come down;\nFix in us Thy humble dwelling,\nAll Thy faithful mercies crown!\nJesus, Thou art all compassion,\nPure, unbounded love Thou art;\nVisit us with Thy salvation,\nEnter every trembling heart.',
      'Breathe, O breathe Thy loving Spirit\nInto every troubled breast!\nLet us all in Thee inherit,\nLet us find that second rest.\nTake away our bent to sinning;\nAlpha and Omega be;\nEnd of faith, as its Beginning,\nSet our hearts at liberty.',
    ],
  },
  {
    title: 'My Hope Is Built on Nothing Less',
    author: 'Edward Mote',
    verses: [
      "My hope is built on nothing less\nThan Jesus' blood and righteousness;\nI dare not trust the sweetest frame,\nBut wholly lean on Jesus' name.",
      'When darkness veils His lovely face,\nI rest on His unchanging grace;\nIn every high and stormy gale,\nMy anchor holds within the veil.',
      'His oath, His covenant, His blood,\nSupport me in the whelming flood;\nWhen all around my soul gives way,\nHe then is all my hope and stay.',
      'When He shall come with trumpet sound,\nOh, may I then in Him be found;\nDressed in His righteousness alone,\nFaultless to stand before the throne.',
    ],
    chorus: 'On Christ, the solid rock, I stand;\nAll other ground is sinking sand,\nAll other ground is sinking sand.',
  },
  {
    title: 'Nearer, My God, to Thee',
    author: 'Sarah F. Adams',
    verses: [
      'Nearer, my God, to Thee,\nNearer to Thee!\nE\'en though it be a cross\nThat raiseth me;\nStill all my song shall be,\nNearer, my God, to Thee,\nNearer, my God, to Thee,\nNearer to Thee!',
      "Though like the wanderer,\nThe sun gone down,\nDarkness be over me,\nMy rest a stone;\nYet in my dreams I'd be\nNearer, my God, to Thee,\nNearer, my God, to Thee,\nNearer to Thee!",
    ],
  },
  {
    title: 'O Come, All Ye Faithful',
    author: 'John F. Wade, tr. Frederick Oakeley',
    verses: [
      'O come, all ye faithful, joyful and triumphant,\nO come ye, O come ye to Bethlehem;\nCome and behold Him, born the King of angels;',
      'God of God, Light of Light,\nLo, He abhors not the Virgin\'s womb;\nVery God, begotten, not created;',
      'Sing, choirs of angels, sing in exultation,\nSing, all ye citizens of heaven above;\nGlory to God, in the highest;',
      'Yea, Lord, we greet Thee, born this happy morning;\nJesu, to Thee be glory given;\nWord of the Father, now in flesh appearing;',
    ],
    chorus: 'O come, let us adore Him,\nO come, let us adore Him,\nO come, let us adore Him,\nChrist the Lord.',
  },
  {
    title: 'O for a Thousand Tongues to Sing',
    author: 'Charles Wesley',
    verses: [
      "O for a thousand tongues to sing\nMy great Redeemer's praise,\nThe glories of my God and King,\nThe triumphs of His grace!",
      'My gracious Master and my God,\nAssist me to proclaim,\nTo spread through all the earth abroad\nThe honors of Thy name.',
      "Jesus! the name that charms our fears,\nThat bids our sorrows cease;\n'Tis music in the sinner's ears,\n'Tis life, and health, and peace.",
      'He breaks the power of canceled sin,\nHe sets the prisoner free;\nHis blood can make the foulest clean;\nHis blood availed for me.',
    ],
  },
  {
    title: 'O God, Our Help in Ages Past',
    author: 'Isaac Watts',
    verses: [
      'O God, our help in ages past,\nOur hope for years to come,\nOur shelter from the stormy blast,\nAnd our eternal home.',
      'Under the shadow of Thy throne\nThy saints have dwelt secure;\nSufficient is Thine arm alone,\nAnd our defense is sure.',
      'Before the hills in order stood,\nOr earth received her frame,\nFrom everlasting Thou art God,\nTo endless years the same.',
      'Time, like an ever-rolling stream,\nBears all its sons away;\nThey fly forgotten, as a dream\nDies at the opening day.',
      'O God, our help in ages past,\nOur hope for years to come,\nBe Thou our guard while troubles last,\nAnd our eternal home.',
    ],
  },
  {
    title: 'Onward, Christian Soldiers',
    author: 'Sabine Baring-Gould',
    verses: [
      'Onward, Christian soldiers, marching as to war,\nWith the cross of Jesus going on before.\nChrist, the royal Master, leads against the foe;\nForward into battle, see His banners go!',
      'Like a mighty army moves the church of God;\nBrothers, we are treading where the saints have trod;\nWe are not divided, all one body we,\nOne in hope and doctrine, one in charity.',
    ],
    chorus: 'Onward, Christian soldiers, marching as to war,\nWith the cross of Jesus going on before.',
  },
  {
    title: 'Praise to the Lord, the Almighty',
    author: 'Joachim Neander, tr. Catherine Winkworth',
    verses: [
      'Praise to the Lord, the Almighty, the King of creation!\nO my soul, praise Him, for He is thy health and salvation!\nAll ye who hear,\nNow to His temple draw near;\nPraise Him in glad adoration.',
      'Praise to the Lord, who o\'er all things so wondrously reigneth,\nShelters thee under His wings, yea, so gently sustaineth!\nHast thou not seen\nHow thy desires e\'er have been\nGranted in what He ordaineth?',
      'Praise to the Lord, who doth prosper thy work and defend thee;\nSurely His goodness and mercy here daily attend thee.\nPonder anew\nWhat the Almighty can do,\nIf with His love He befriend thee.',
      'Praise to the Lord! O let all that is in me adore Him!\nAll that hath life and breath, come now with praises before Him!\nLet the Amen\nSound from His people again;\nGladly forever adore Him.',
    ],
  },
  {
    title: 'Rock of Ages',
    author: 'Augustus M. Toplady',
    verses: [
      'Rock of Ages, cleft for me,\nLet me hide myself in Thee;\nLet the water and the blood,\nFrom Thy wounded side which flowed,\nBe of sin the double cure;\nSave from wrath and make me pure.',
      "Not the labor of my hands\nCan fulfill Thy law's demands;\nCould my zeal no respite know,\nCould my tears forever flow,\nAll for sin could not atone;\nThou must save, and Thou alone.",
      'Nothing in my hand I bring,\nSimply to Thy cross I cling;\nNaked, come to Thee for dress;\nHelpless, look to Thee for grace;\nFoul, I to the fountain fly;\nWash me, Savior, or I die.',
    ],
  },
  {
    title: 'Silent Night',
    author: 'Joseph Mohr, tr. John F. Young',
    verses: [
      'Silent night, holy night!\nAll is calm, all is bright\nRound yon virgin mother and Child.\nHoly Infant, so tender and mild,\nSleep in heavenly peace,\nSleep in heavenly peace.',
      'Silent night, holy night!\nShepherds quake at the sight;\nGlories stream from heaven afar,\nHeavenly hosts sing Alleluia;\nChrist the Saviour is born!\nChrist the Saviour is born!',
      "Silent night, holy night!\nSon of God, love's pure light\nRadiant beams from Thy holy face\nWith the dawn of redeeming grace,\nJesus, Lord, at Thy birth,\nJesus, Lord, at Thy birth.",
    ],
  },
  {
    title: 'Softly and Tenderly',
    author: 'Will L. Thompson',
    verses: [
      "Softly and tenderly Jesus is calling,\nCalling for you and for me;\nSee, on the portals He's waiting and watching,\nWatching for you and for me.",
      "Why should we tarry when Jesus is pleading,\nPleading for you and for me?\nWhy should we linger and heed not His mercies,\nMercies for you and for me?",
      'Time is now fleeting, the moments are passing,\nPassing from you and from me;\nShadows are gathering, deathbeds are coming,\nComing for you and for me.',
    ],
    chorus: 'Come home, come home,\nYe who are weary, come home;\nEarnestly, tenderly, Jesus is calling,\nCalling, O sinner, come home!',
  },
  {
    title: 'Standing on the Promises',
    author: 'R. Kelso Carter',
    verses: [
      'Standing on the promises of Christ my King,\nThrough eternal ages let His praises ring;\nGlory in the highest, I will shout and sing,\nStanding on the promises of God.',
      'Standing on the promises that cannot fail,\nWhen the howling storms of doubt and fear assail,\nBy the living Word of God I shall prevail,\nStanding on the promises of God.',
      'Standing on the promises I now can see\nPerfect, present cleansing in the blood for me;\nStanding in the liberty where Christ makes free,\nStanding on the promises of God.',
    ],
    chorus: 'Standing, standing,\nStanding on the promises of God my Savior;\nStanding, standing,\nI\'m standing on the promises of God.',
  },
  {
    title: 'There Is a Fountain',
    author: 'William Cowper',
    verses: [
      "There is a fountain filled with blood\nDrawn from Immanuel's veins;\nAnd sinners plunged beneath that flood\nLose all their guilty stains.",
      'The dying thief rejoiced to see\nThat fountain in his day;\nAnd there may I, though vile as he,\nWash all my sins away.',
      'Dear dying Lamb, Thy precious blood\nShall never lose its power,\nTill all the ransomed church of God\nBe saved to sin no more.',
    ],
  },
  {
    title: 'To God Be the Glory',
    author: 'Fanny J. Crosby',
    verses: [
      'To God be the glory, great things He hath done;\nSo loved He the world that He gave us His Son,\nWho yielded His life an atonement for sin,\nAnd opened the life-gate that all may go in.',
      'O perfect redemption, the purchase of blood,\nTo every believer the promise of God;\nThe vilest offender who truly believes,\nThat moment from Jesus a pardon receives.',
      'Great things He hath taught us, great things He hath done,\nAnd great our rejoicing through Jesus the Son;\nBut purer, and higher, and greater will be\nOur wonder, our transport, when Jesus we see.',
    ],
    chorus: 'Praise the Lord, praise the Lord,\nLet the earth hear His voice!\nPraise the Lord, praise the Lord,\nLet the people rejoice!\nO come to the Father, through Jesus the Son,\nAnd give Him the glory, great things He hath done.',
  },
  {
    title: 'What a Friend We Have in Jesus',
    author: 'Joseph M. Scriven',
    verses: [
      'What a friend we have in Jesus,\nAll our sins and griefs to bear!\nWhat a privilege to carry\nEverything to God in prayer!\nO what peace we often forfeit,\nO what needless pain we bear,\nAll because we do not carry\nEverything to God in prayer!',
      'Have we trials and temptations?\nIs there trouble anywhere?\nWe should never be discouraged;\nTake it to the Lord in prayer.\nCan we find a friend so faithful\nWho will all our sorrows share?\nJesus knows our every weakness;\nTake it to the Lord in prayer.',
      'Are we weak and heavy-laden,\nCumbered with a load of care?\nPrecious Saviour, still our refuge;\nTake it to the Lord in prayer.\nDo thy friends despise, forsake thee?\nTake it to the Lord in prayer;\nIn His arms He\'ll take and shield thee;\nThou wilt find a solace there.',
    ],
  },
  {
    title: 'When I Survey the Wondrous Cross',
    author: 'Isaac Watts',
    verses: [
      'When I survey the wondrous cross\nOn which the Prince of glory died,\nMy richest gain I count but loss,\nAnd pour contempt on all my pride.',
      'Forbid it, Lord, that I should boast,\nSave in the death of Christ my God;\nAll the vain things that charm me most,\nI sacrifice them to His blood.',
      'See, from His head, His hands, His feet,\nSorrow and love flow mingled down;\nDid e\'er such love and sorrow meet,\nOr thorns compose so rich a crown?',
      'Were the whole realm of nature mine,\nThat were a present far too small;\nLove so amazing, so divine,\nDemands my soul, my life, my all.',
    ],
  },
]

/** Splits a long verse into even slides of at most four lines. */
function slidesOf(label: string, text: string): Verse[] {
  const lines = text.split('\n')
  const parts = Math.ceil(lines.length / 4)
  const size = Math.ceil(lines.length / parts)
  return Array.from({ length: parts }, (_, part) => ({
    label: parts === 1 ? label : `${label}${String.fromCharCode(97 + part)}`,
    lines: lines.slice(part * size, (part + 1) * size),
  }))
}

const slug = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

export const hymnPack: Song[] = HYMNS.map((hymn) => ({
  id: `hymn-${slug(hymn.title)}`,
  title: hymn.title,
  author: hymn.author,
  copyright: 'Public Domain',
  source: 'public-domain',
  verses: hymn.verses.flatMap((text, index) => [
    ...slidesOf(`Verse ${index + 1}`, text),
    ...(hymn.chorus ? slidesOf('Chorus', hymn.chorus) : []),
  ]),
}))
