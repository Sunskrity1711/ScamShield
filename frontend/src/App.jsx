import React, { useState } from "react";
import axios from "axios";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Loader2,
  Copy,
  Check,
  ShieldHalf,
} from "lucide-react";

const API_URL = "http://localhost:8000/api/analyze";

const SAMPLES = [
  {
    label: "Bank KYC",
    text: "URGENT: Your bank account is locked! Verify identity now at http://sbi-security-update.top to prevent suspension.",
  },
  {
    label: "Prize SMS",
    text: "Congratulations! You won Rs 25,00,000 in the KBC lucky draw. Send your Aadhaar and bank details on WhatsApp to claim.",
  },
  {
    label: "Normal message",
    text: "Hi, your order #48213 has been delivered. Thanks for shopping with us.",
  },
];

// Verdict copy + colours for each risk level
const getVerdict = (level, score) => {
  const l = level?.toUpperCase();
  if (l === "HIGH" || score >= 70) {
    return {
      title: "This is very likely a scam",
      Icon: ShieldAlert,
      band: "bg-[#FDECEA] border-[#C62828]",
      text: "text-[#B71C1C]",
      bar: "bg-[#C62828]",
      advice:
        "Do not click any link or share an OTP, PIN or card number. Delete the message. If you already shared details, call 1930 or report at cybercrime.gov.in.",
    };
  }
  if (l === "MEDIUM" || score >= 40) {
    return {
      title: "This looks suspicious",
      Icon: AlertTriangle,
      band: "bg-[#FFF4DE] border-[#B7791F]",
      text: "text-[#8A5A0B]",
      bar: "bg-[#D69E2E]",
      advice:
        "Do not use the link or number in the message. Check with the company through its official app, website or the number printed on your card.",
    };
  }
  return {
    title: "No clear signs of a scam",
    Icon: ShieldCheck,
    band: "bg-[#E8F4EC] border-[#2E7D32]",
    text: "text-[#1B5E20]",
    bar: "bg-[#2E7D32]",
    advice:
      "Nothing alarming was found, but stay careful with any message that asks for money, OTPs or personal details.",
  };
};

export default function App() {
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleAnalyze = async (e) => {
    e?.preventDefault();
    if (!inputText.trim() || loading) return;

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("text", inputText);

    try {
      const response = await axios.post(API_URL, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 30000,
      });
      setResult(response.data);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Could not reach the ScamShield server. Make sure the backend is running on port 8000 and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!result) return;
    const text = `ScamShield result: ${result.risk_level} risk (${result.risk_score}/100)\n${result.why_flagged_summary}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    setInputText("");
    setResult(null);
    setError(null);
  };

  const verdict = result
    ? getVerdict(result.risk_level, result.risk_score)
    : null;

  return (
    <div
      className="min-h-screen bg-[#F2F5F7] text-[#1B2430] antialiased"
      style={{ fontFamily: "'Hanken Grotesk', system-ui, sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700;800&display=swap');
        textarea:focus-visible, button:focus-visible { outline: 2px solid #0F4C5C; outline-offset: 2px; }
      `}</style>

      {/* Header */}
      <header className="bg-white border-b border-[#DDE3E8]">
        <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldHalf className="w-7 h-7 text-[#0F4C5C]" strokeWidth={2.2} />
            <span className="text-xl font-extrabold tracking-tight text-[#0F4C5C]">
              ScamShield
            </span>
          </div>
          <span className="hidden sm:block text-sm text-[#5B6773]">
            Free message checker
          </span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 pt-12 pb-20">
        {/* Intro */}
        <div className="max-w-2xl mb-9">
          <h1 className="text-[2.1rem] sm:text-[2.6rem] leading-[1.1] font-extrabold tracking-tight text-[#10202B]">
            Got a message that feels off? Check it before you reply.
          </h1>
          <p className="mt-4 text-[1.05rem] leading-relaxed text-[#4A5763]">
            Paste an SMS, WhatsApp message, email or link. We tell you if it
            looks like a scam and point out exactly what gave it away.
          </p>
        </div>

        <div className="bg-white border border-[#DDE3E8] rounded-lg shadow-[0_1px_2px_rgba(16,32,43,0.06)] grid grid-cols-1 lg:grid-cols-[1.1fr_1fr]">
          {/* Input pane */}
          <form
            onSubmit={handleAnalyze}
            className="p-6 sm:p-7 lg:border-r border-b lg:border-b-0 border-[#DDE3E8]"
          >
            <label
              htmlFor="msg"
              className="block font-bold text-[#10202B] mb-2"
            >
              Message to check
            </label>
            <textarea
              id="msg"
              rows={9}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste the message or link here"
              className="w-full border border-[#C5CED6] rounded-md p-3.5 text-[0.95rem] leading-relaxed text-[#1B2430] placeholder-[#8A95A0] focus:border-[#0F4C5C] resize-y"
            />

            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <span className="text-[#5B6773]">Try an example:</span>
              {SAMPLES.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => setInputText(s.text)}
                  className="px-2.5 py-1 rounded border border-[#C5CED6] text-[#33414E] hover:bg-[#EEF2F5] transition-colors"
                >
                  {s.label}
                </button>
              ))}
            </div>

            <div className="mt-6 flex items-center gap-4">
              <button
                type="submit"
                disabled={loading || !inputText.trim()}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-[#0F4C5C] hover:bg-[#0B3B48] text-white font-semibold disabled:bg-[#9DB3BA] disabled:cursor-not-allowed transition-colors"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? "Checking…" : "Check message"}
              </button>
              {(inputText || result) && (
                <button
                  type="button"
                  onClick={reset}
                  className="text-sm font-medium text-[#5B6773] hover:text-[#1B2430] underline underline-offset-4"
                >
                  Clear
                </button>
              )}
            </div>

            {error && (
              <div
                role="alert"
                className="mt-5 flex items-start gap-2.5 p-3.5 rounded-md bg-[#FDECEA] border border-[#F2B8B5] text-[#8E1B1B] text-sm"
              >
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </form>

          {/* Result pane */}
          <section aria-live="polite" className="min-h-[360px]">
            {loading && (
              <div className="h-full flex flex-col items-center justify-center gap-3 p-8 text-[#5B6773]">
                <Loader2 className="w-7 h-7 animate-spin text-[#0F4C5C]" />
                <p className="text-sm">
                  Reading the message and checking the link…
                </p>
              </div>
            )}

            {!loading && !result && (
              <div className="h-full flex flex-col justify-center p-8 sm:p-10">
                <h2 className="font-bold text-[#10202B] mb-3">
                  What we look for
                </h2>
                <ul className="space-y-2.5 text-[0.95rem] text-[#4A5763] leading-relaxed list-disc pl-5 marker:text-[#9AA6B1]">
                  <li>Fake urgency like “account will be blocked today”</li>
                  <li>Links that copy a bank or government site name</li>
                  <li>Requests for OTP, PIN, Aadhaar or card details</li>
                  <li>
                    Prize, lottery or job offers that ask you to pay first
                  </li>
                </ul>
              </div>
            )}

            {!loading && result && (
              <div>
                {/* Verdict band */}
                <div
                  className={`flex items-start justify-between gap-4 p-6 border-l-4 lg:rounded-tr-lg ${verdict.band}`}
                >
                  <div className="flex items-start gap-3">
                    <verdict.Icon
                      className={`w-7 h-7 mt-0.5 shrink-0 ${verdict.text}`}
                    />
                    <div>
                      <h2
                        className={`text-xl font-extrabold leading-tight ${verdict.text}`}
                      >
                        {verdict.title}
                      </h2>
                      <p className="mt-1 text-sm text-[#33414E]">
                        Risk score {result.risk_score} out of 100
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={copyToClipboard}
                    className="shrink-0 inline-flex items-center gap-1.5 text-sm font-medium text-[#33414E] bg-white/70 hover:bg-white border border-black/10 rounded px-2.5 py-1.5 transition-colors"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-[#2E7D32]" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {/* Score bar */}
                  <div>
                    <div className="relative h-2 rounded-full bg-[#E4E9ED]">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${verdict.bar}`}
                        style={{
                          width: `${Math.min(result.risk_score, 100)}%`,
                        }}
                      />
                      <span
                        className="absolute top-[-3px] h-3.5 w-px bg-[#8A95A0]"
                        style={{ left: "40%" }}
                      />
                      <span
                        className="absolute top-[-3px] h-3.5 w-px bg-[#8A95A0]"
                        style={{ left: "70%" }}
                      />
                    </div>
                    <div className="relative mt-1.5 h-4 text-xs text-[#6B7783]">
                      <span className="absolute left-0">Safe</span>
                      <span
                        className="absolute -translate-x-1/2"
                        style={{ left: "40%" }}
                      >
                        Suspicious
                      </span>
                      <span
                        className="absolute -translate-x-1/2"
                        style={{ left: "70%" }}
                      >
                        Scam
                      </span>
                    </div>
                  </div>

                  {/* Summary */}
                  <div>
                    <h3 className="font-bold text-[#10202B] mb-1.5">
                      Why we flagged it
                    </h3>
                    <p className="text-[0.95rem] leading-relaxed text-[#33414E]">
                      {result.why_flagged_summary}
                    </p>
                  </div>

                  {/* Indicators */}
                  <div>
                    <h3 className="font-bold text-[#10202B] mb-2">
                      What we found
                    </h3>
                    {result.detected_indicators?.length > 0 ? (
                      <ul className="divide-y divide-[#E4E9ED] border-y border-[#E4E9ED]">
                        {result.detected_indicators.map((ind, idx) => {
                          const high = ind.severity?.toUpperCase() === "HIGH";
                          return (
                            <li key={idx} className="py-3 flex gap-3">
                              <span
                                className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${high ? "bg-[#C62828]" : "bg-[#D69E2E]"}`}
                                aria-hidden="true"
                              />
                              <div className="text-sm leading-relaxed">
                                <p className="font-semibold text-[#1B2430]">
                                  {ind.category}
                                  <span
                                    className={`ml-2 font-medium ${high ? "text-[#B71C1C]" : "text-[#8A5A0B]"}`}
                                  >
                                    {high ? "High risk" : "Medium risk"}
                                  </span>
                                </p>
                                <p className="text-[#4A5763]">{ind.detail}</p>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="text-sm text-[#4A5763]">
                        No warning signs were triggered.
                      </p>
                    )}
                  </div>

                  {/* What to do */}
                  <div className="bg-[#F2F5F7] rounded-md p-4">
                    <h3 className="font-bold text-[#10202B] mb-1">
                      What you should do
                    </h3>
                    <p className="text-sm leading-relaxed text-[#33414E]">
                      {verdict.advice}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

        <p className="mt-6 text-sm text-[#6B7783] max-w-2xl">
          Results are automated and may not be perfect. When in doubt, contact
          your bank or the company directly using the number on their official
          website.
        </p>
      </main>
    </div>
  );
}
