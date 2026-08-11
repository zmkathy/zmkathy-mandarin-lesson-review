function getVoices() {
  return new Promise((resolve) => {
    const voices = window.speechSynthesis.getVoices();

    if (voices.length > 0) {
      resolve(voices);
      return;
    }

    window.speechSynthesis.onvoiceschanged = () => {
      resolve(window.speechSynthesis.getVoices());
    };
  });
}

function pickMandarinVoice(voices) {
  const mandarinVoices = voices.filter((voice) => {
    const lang = voice.lang.toLowerCase();
    const name = voice.name.toLowerCase();

    return (
      lang.startsWith("zh-cn") ||
      name.includes("mandarin") ||
      name.includes("普通话") ||
      name.includes("putonghua")
    );
  });

  const preferredNames = [
    "xiaoxiao",
    "yunxi",
    "yunjian",
    "tingting",
    "mei-jia",
    "meijia",
    "google 普通话",
    "google mandarin",
    "mandarin"
  ];

  return (
    mandarinVoices.find((voice) =>
      preferredNames.some((name) => voice.name.toLowerCase().includes(name))
    ) ||
    mandarinVoices.find((voice) => voice.lang.toLowerCase().startsWith("zh-cn")) ||
    mandarinVoices[0]
  );
}

export async function speakMandarin(text) {
  if (!("speechSynthesis" in window)) {
    window.alert("Sorry, this browser does not support speech playback.");
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "zh-CN";
  utterance.rate = 0.72;
  utterance.pitch = 1;

  const voices = await getVoices();
  const mandarinVoice = pickMandarinVoice(voices);

  if (mandarinVoice) {
    utterance.voice = mandarinVoice;
  }

  window.speechSynthesis.speak(utterance);
}
