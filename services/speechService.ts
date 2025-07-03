let voices: SpeechSynthesisVoice[] = [];

// ฟังก์ชันสำหรับดึงรายการเสียงพูดที่มีในบราวเซอร์
const populateVoiceList = () => {
  if (typeof speechSynthesis === 'undefined') {
    return;
  }
  voices = speechSynthesis.getVoices();
};

populateVoiceList();
if (typeof speechSynthesis !== 'undefined' && speechSynthesis.onvoiceschanged !== undefined) {
  speechSynthesis.onvoiceschanged = populateVoiceList;
}

const detectLanguage = (text: string): 'th-TH' | 'en-US' => {
  const thaiRegex = /[\u0E00-\u0E7F]/;
  if (thaiRegex.test(text)) {
    return 'th-TH';
  } else {
    return 'en-US';
  }
};

export const speak = (text: string) => {
  if ('speechSynthesis' in window) {
    const lang = detectLanguage(text);

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    // พยายามค้นหาเสียงคุณภาพดี
    const thaiVoice = voices.find(voice => voice.lang === 'th-TH' && voice.name.includes('Google'));
    const englishVoice = voices.find(voice => voice.lang === 'en-US' && voice.name.includes('Google'));

    if (lang === 'th-TH' && thaiVoice) {
      utterance.voice = thaiVoice;
    } else if (lang === 'en-US' && englishVoice) {
      utterance.voice = englishVoice;
    }
    
    utterance.lang = lang;
    utterance.rate = 1;

    speechSynthesis.speak(utterance);
  } else {
    console.error('ขออภัย, เว็บบราวเซอร์ของคุณไม่รองรับฟังก์ชันแปลงข้อความเป็นเสียงพูด');
    alert('ขออภัย, เว็บบราวเซอร์ของคุณไม่รองรับฟังก์ชันแปลงข้อความเป็นเสียงพูด');
  }
};