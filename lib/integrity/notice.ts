// The notice a candidate agrees to before a proctored interview (AIIN-176, ADR 2026-11-01-integrity-checks-and-candidate-data).
// Versioned in code: change what it says, or what is checked, and bump NOTICE_VERSION so everyone not yet started is asked again.
// Pure: no database, no "@/" imports.

export const NOTICE_VERSION = "2026-11-01";

/** What an interview checks today. Camera presence runs on the device; nothing records video, audio or photos. */
export const CHECKS = ["focus", "fullscreen", "copyPaste", "screens", "camera"] as const;
export type Check = (typeof CHECKS)[number];

/** Which check each proctoring event belongs to. An event is stored only when the candidate agreed to its check. */
export const EVENT_CHECK: Record<string, Check> = {
    TAB_SWITCH: "focus",
    WINDOW_BLUR: "focus",
    TAB_RETURN: "focus",
    WINDOW_FOCUS: "focus",
    FULLSCREEN_EXIT: "fullscreen",
    FULLSCREEN_ENTER: "fullscreen",
    PASTE: "copyPaste",
    COPY_PASTE: "copyPaste",
    KEYBOARD_SHORTCUT: "copyPaste",
    DEV_TOOLS: "copyPaste",
    MULTI_SCREEN: "screens",
    FACE_MISSING: "camera",
    GAZE_DETECTED: "camera",
};

/** Proctoring events are kept this long with the report, then deleted (api/cron/retention). */
export const EVENTS_KEPT_DAYS = 365;

export const NOTICE_LANGUAGES = ["en", "hi", "mr"] as const;
export type NoticeLanguage = (typeof NOTICE_LANGUAGES)[number];

export const noticeLanguage = (language: string | null | undefined): NoticeLanguage =>
    (NOTICE_LANGUAGES as readonly string[]).includes(language ?? "") ? (language as NoticeLanguage) : "en";

/**
 * Asked when there's no agreement to this version, unless the interview already started under an earlier one:
 * a notice change never stops an interview halfway.
 */
export function consentNeeded(versions: string[], started: boolean): boolean {
    if (versions.includes(NOTICE_VERSION)) return false;
    return !(started && versions.length > 0);
}

/** A sentence that starts with the employer's name still starts with a capital. */
export const sentence = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

export interface NoticeCopy {
    label: string;
    title: string;
    lead: string;
    checkH: string;
    checks: Record<Check, string>;
    whyH: string;
    why: (company: string) => string;
    keepH: string;
    keep: string[];
    whoH: string;
    who: string;
    agree: string;
    disagree: string;
    means: (company: string) => string;
    declinedTitle: string;
    declined: (company: string, until: string | null) => string;
    again: string;
    dashboard: string;
    language: string;
    failed: string;
    /** Used when the employer has no name on their account. */
    theEmployer: string;
}

export const NOTICE: Record<NoticeLanguage, NoticeCopy> = {
    en: {
        label: "English",
        title: "Before you start",
        lead: "This interview checks that the answers are your own. Here is exactly what that means.",
        checkH: "What we check",
        checks: {
            focus: "Whether you leave the interview tab or window, and for how long",
            fullscreen: "Whether you leave full screen",
            copyPaste: "Whether you try to copy or paste text, right-click, use shortcuts like Ctrl+V, or open developer tools. These are blocked.",
            screens: "Whether a second screen is connected",
            camera: "Whether a face is in front of the camera, and whether you look away. This is checked on your device, and no video, audio or photo is recorded.",
        },
        whyH: "Why",
        why: (company) =>
            `So ${company} can trust your answers, and everyone is judged the same way. Nothing here decides the result on its own: the hiring team sees it next to your answers, and a person decides.`,
        keepH: "What we keep, and for how long",
        keep: [
            "A list of these moments, with the time and the question. Kept with your report for 1 year, then deleted.",
            "That you agreed to this notice, with the time, your IP address and your browser, as a record of your agreement.",
        ],
        whoH: "Who sees it",
        who: "Only the hiring team for this job, never other employers.",
        agree: "I agree and start",
        disagree: "I don’t agree",
        means: (company) =>
            `If you don’t agree, the interview won’t start. ${company} will see that you didn’t agree to the checks, so they can offer you another way to be assessed.`,
        declinedTitle: "You didn’t start the interview",
        declined: (company, until) =>
            `${company} can see that you didn’t agree to the checks. They’ll be in touch if they can assess you another way. ${until ? `You can still change your mind until the link expires on ${until}.` : "You can still change your mind."}`,
        again: "Read the notice again",
        dashboard: "Go to your dashboard",
        language: "Language",
        failed: "Couldn’t save your answer. Try again.",
        theEmployer: "the employer",
    },
    hi: {
        label: "हिन्दी",
        title: "शुरू करने से पहले",
        lead: "यह इंटरव्यू जाँचता है कि जवाब आपके अपने हैं। इसका ठीक-ठीक मतलब यह है।",
        checkH: "हम क्या जाँचते हैं",
        checks: {
            focus: "क्या आप इंटरव्यू वाला टैब या विंडो छोड़ते हैं, और कितनी देर के लिए",
            fullscreen: "क्या आप फ़ुल स्क्रीन से बाहर जाते हैं",
            copyPaste: "क्या आप टेक्स्ट कॉपी या पेस्ट करने, राइट-क्लिक करने, Ctrl+V जैसे शॉर्टकट इस्तेमाल करने या डेवलपर टूल खोलने की कोशिश करते हैं। ये सब बंद हैं।",
            screens: "क्या कोई दूसरी स्क्रीन जुड़ी है",
            camera: "क्या कैमरे के सामने कोई चेहरा है, और क्या आप नज़र हटाते हैं। यह आपके डिवाइस पर ही जाँचा जाता है, और कोई वीडियो, ऑडियो या फ़ोटो रिकॉर्ड नहीं होता।",
        },
        whyH: "क्यों",
        why: (company) =>
            `ताकि ${company} आपके जवाबों पर भरोसा कर सके, और सबको एक ही तरीक़े से परखा जाए। इनमें से कुछ भी अपने आप नतीजा तय नहीं करता: हायरिंग टीम इसे आपके जवाबों के साथ देखती है, और फ़ैसला कोई व्यक्ति करता है।`,
        keepH: "हम क्या रखते हैं, और कितने समय तक",
        keep: [
            "इन पलों की सूची, समय और सवाल के साथ। आपकी रिपोर्ट के साथ 1 साल तक रखी जाती है, फिर मिटा दी जाती है।",
            "यह कि आप इस सूचना से सहमत हुए, समय, आपके IP पते और आपके ब्राउज़र के साथ, आपकी सहमति के रिकॉर्ड के तौर पर।",
        ],
        whoH: "इसे कौन देखता है",
        who: "सिर्फ़ इस नौकरी की हायरिंग टीम, कभी कोई दूसरी कंपनी नहीं।",
        agree: "मैं सहमत हूँ, शुरू करें",
        disagree: "मैं सहमत नहीं हूँ",
        means: (company) =>
            `अगर आप सहमत नहीं हैं, तो इंटरव्यू शुरू नहीं होगा। ${company} देख पाएगी कि आप जाँचों के लिए सहमत नहीं हुए, ताकि वे आपको परखने का कोई और तरीक़ा दे सकें।`,
        declinedTitle: "आपने इंटरव्यू शुरू नहीं किया",
        declined: (company, until) =>
            `${company} देख सकती है कि आप जाँचों के लिए सहमत नहीं हुए। अगर वे आपको किसी और तरीक़े से परख सकते हैं, तो वे आपसे संपर्क करेंगे। ${until ? `लिंक ${until} को समाप्त होने तक आप अपना फ़ैसला बदल सकते हैं।` : "आप अब भी अपना फ़ैसला बदल सकते हैं।"}`,
        again: "सूचना फिर से पढ़ें",
        dashboard: "अपने डैशबोर्ड पर जाएँ",
        language: "भाषा",
        failed: "आपका जवाब सहेजा नहीं जा सका। फिर से कोशिश करें।",
        theEmployer: "कंपनी",
    },
    mr: {
        label: "मराठी",
        title: "सुरू करण्यापूर्वी",
        lead: "ही मुलाखत उत्तरे तुमचीच आहेत याची खात्री करते. याचा नेमका अर्थ असा आहे.",
        checkH: "आम्ही काय तपासतो",
        checks: {
            focus: "तुम्ही मुलाखतीचा टॅब किंवा विंडो सोडता का, आणि किती वेळासाठी",
            fullscreen: "तुम्ही फुल स्क्रीनमधून बाहेर जाता का",
            copyPaste: "तुम्ही मजकूर कॉपी किंवा पेस्ट करण्याचा, राइट-क्लिक करण्याचा, Ctrl+V सारखे शॉर्टकट वापरण्याचा किंवा डेव्हलपर टूल्स उघडण्याचा प्रयत्न करता का. हे सर्व बंद आहे.",
            screens: "दुसरी स्क्रीन जोडलेली आहे का",
            camera: "कॅमेऱ्यासमोर चेहरा आहे का, आणि तुम्ही नजर दुसरीकडे वळवता का. हे तुमच्या डिव्हाइसवरच तपासले जाते, आणि कोणताही व्हिडिओ, ऑडिओ किंवा फोटो रेकॉर्ड होत नाही.",
        },
        whyH: "का",
        why: (company) =>
            `जेणेकरून ${company} तुमच्या उत्तरांवर विश्वास ठेवू शकेल, आणि सर्वांचे मूल्यमापन एकाच पद्धतीने होईल. यापैकी काहीही आपोआप निकाल ठरवत नाही: भरती टीम हे तुमच्या उत्तरांसोबत पाहते, आणि निर्णय एखादी व्यक्ती घेते.`,
        keepH: "आम्ही काय ठेवतो, आणि किती काळ",
        keep: [
            "या क्षणांची यादी, वेळ आणि प्रश्नासह. तुमच्या अहवालासोबत 1 वर्ष ठेवली जाते, नंतर हटवली जाते.",
            "तुम्ही या सूचनेला सहमती दिली हे, वेळ, तुमचा IP पत्ता आणि तुमचा ब्राउझर यांसह, तुमच्या सहमतीची नोंद म्हणून.",
        ],
        whoH: "हे कोण पाहते",
        who: "फक्त या नोकरीसाठीची भरती टीम, इतर कोणतीही कंपनी कधीच नाही.",
        agree: "मी सहमत आहे, सुरू करा",
        disagree: "मी सहमत नाही",
        means: (company) =>
            `तुम्ही सहमत नसल्यास मुलाखत सुरू होणार नाही. तुम्ही तपासण्यांना सहमती दिली नाही हे ${company} ला दिसेल, जेणेकरून ते तुमचे मूल्यमापन करण्याचा दुसरा मार्ग देऊ शकतील.`,
        declinedTitle: "तुम्ही मुलाखत सुरू केली नाही",
        declined: (company, until) =>
            `तुम्ही तपासण्यांना सहमती दिली नाही हे ${company} ला दिसू शकते. ते तुमचे दुसऱ्या पद्धतीने मूल्यमापन करू शकत असल्यास तुमच्याशी संपर्क साधतील. ${until ? `लिंक ${until} ला संपेपर्यंत तुम्ही तुमचा निर्णय बदलू शकता.` : "तुम्ही अजूनही तुमचा निर्णय बदलू शकता."}`,
        again: "सूचना पुन्हा वाचा",
        dashboard: "तुमच्या डॅशबोर्डवर जा",
        language: "भाषा",
        failed: "तुमचे उत्तर जतन करता आले नाही. पुन्हा प्रयत्न करा.",
        theEmployer: "कंपनी",
    },
};
