"use client";

import { useEffect, useState } from "react";

const CaptchaSequence = () => {
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [wafToken, setWafToken] = useState(null);
  const [isCaptchaVisible, setIsCaptchaVisible] = useState(false);
  const [output, setOutput] = useState([]);
  const [isSequenceRunning, setIsSequenceRunning] = useState(false);

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
    if (scriptLoaded && typeof window !== "undefined" && window.AwsWafCaptcha) {
      window.showMyCaptcha = () => {
        const container = document.querySelector("#my-captcha-container");
        window.AwsWafCaptcha.renderCaptcha(container, {
          apiKey: process.env.NEXT_PUBLIC_WAF_API_KEY,
          onSuccess: (token) => {
            setWafToken(token);
            setIsCaptchaVisible(false);
            setIsSequenceRunning(true);
          },
          onError: (error) => {
            console.error("Captcha Error:", error);
          },
        });
      };
    }
  }, [scriptLoaded]);

  const startSequence = async (N) => {
    setOutput([]);
    setIsSequenceRunning(true);

    for (let i = 1; i <= N; i++) {
      try {
        const response = await fetch("https://api.prod.jcloudify.com/whoami", {
          headers: wafToken ? { Authorization: `Bearer ${wafToken}` } : {},
        });

        if (response.ok) {
          setOutput((prev) => [...prev, `${i}. Forbidden`]);
        } else if (response.status === 403) {
          console.warn("403 Forbidden: Showing CAPTCHA");
          setIsCaptchaVisible(true);
          setIsSequenceRunning(false);
          break;
        } else if (response.status === 405) {
          console.warn("405 Method Not Allowed: Showing CAPTCHA");
          setIsCaptchaVisible(true);
          window.showMyCaptcha && window.showMyCaptcha();
          setIsSequenceRunning(false);
          break;
        } else {
          throw new Error(`Unexpected response status: ${response.status}`);
        }
      } catch (error) {
        console.error(`Error at step ${i}:`, error);
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    setIsSequenceRunning(false);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const N = parseInt(e.target.elements.number.value, 10);
    startSequence(N);
  };

  return (
    <div>
      {/* Formulaire d'entrée */}
      {!isCaptchaVisible && !isSequenceRunning && (
        <form onSubmit={handleFormSubmit}>
          <label>
            Enter a number (1-1000):
            <input type="number" name="number" min="1" max="1000" required />
          </label>
          <button type="submit">Start</button>
        </form>
      )}

      {/* CAPTCHA */}
      {isCaptchaVisible && (
        <div id="my-captcha-container">
          <button onClick={() => window.showMyCaptcha()}>
            Solve CAPTCHA
          </button>
        </div>
      )}

      {/* Résultats */}
      <div>
        <h2>Output:</h2>
        <pre>{output.join("\n")}</pre>
      </div>
    </div>
  );
};

export default CaptchaSequence;