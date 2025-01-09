"use client";
import { useEffect, useState } from "react";

const CaptchaSequence = () => {
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [sequence, setSequence] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [captchaResolved, setCaptchaResolved] = useState(false);

  useEffect(() => {
    const loadScript = () => {
      const script = document.createElement("script");
      script.src =
        "https://09bd26e5e726.eu-west-3.captcha-sdk.awswaf.com/09bd26e5e726/jsapi.js";
      script.type = "text/javascript";
      script.defer = true;
      script.onload = () => setScriptLoaded(true);
      document.head.appendChild(script);
    };

    if (typeof window !== "undefined" && !scriptLoaded) {
      loadScript();
    }
  }, [scriptLoaded]);

  useEffect(() => {
    if (
      scriptLoaded &&
      typeof window !== "undefined" &&
      window.AwsWafCaptcha
    ) {
      window.showMyCaptcha = function () {
        const container = document.querySelector("#my-captcha-container");

        window.AwsWafCaptcha.renderCaptcha(container, {
          apiKey: process.env.NEXT_PUBLIC_WAF_API_KEY,
          onSuccess: (wafToken) => {
            setCaptchaResolved(true);
          },
          onError: (error) => {
            console.error("Captcha Error:", error);
          },
        });
      };
    }
  }, [scriptLoaded]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const N = parseInt(inputValue, 10);
    if (isNaN(N) || N < 1 || N > 1000) {
      alert("Please enter a valid number between 1 and 1000.");
      return;
    }
    setSequence([]);
    setIsLoading(true);

    for (let i = 1; i <= N; i++) {
      if (!captchaResolved) {
        window.showMyCaptcha && window.showMyCaptcha();
        break;
      }
      try {
        await fetch("https://api.prod.jcloudify.com/whoami");
        setSequence((prev) => [...prev, `${i}. Forbidden`]);
      } catch (error) {
        console.error(`Error on request ${i}:`, error);
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    setIsLoading(false);
  };

  return (
    <div>
      <h1>Captcha-Enabled Sequence App</h1>
      {sequence.length === 0 && !isLoading && (
        <form onSubmit={handleSubmit}>
          <label>
            Enter a number (1-1000):
            <input
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
          </label>
          <button type="submit">Submit</button>
        </form>
      )}
      {sequence.length > 0 && (
        <div>
          {sequence.map((line, index) => (
            <p key={index}>{line}</p>
          ))}
        </div>
      )}
      <div id="my-captcha-container" />
    </div>
  );
};

export default CaptchaSequence;