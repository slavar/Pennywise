"use client";
// FloatingFeedback.tsx
import React, { useState } from "react";

const FloatingFeedback = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState("");

  const handleFeedbackSubmit = async () => {
    if (feedback.trim() === "") return;
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feedback }),
    });
    setFeedback("");
    setIsOpen(false);
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      setIsOpen(false);
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    } else {
      window.removeEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div style={{ position: "fixed", right: "20px", bottom: "20px" }}>
      <button onClick={() => setIsOpen(!isOpen)}>Provide feedback</button>
      {isOpen && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: "10px",
          }}
        >
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Your feedback..."
            style={{ resize: "none", width: "200px", height: "100px" }}
          />
          <button onClick={handleFeedbackSubmit}>Submit</button>
        </div>
      )}
    </div>
  );
};

export default FloatingFeedback;
