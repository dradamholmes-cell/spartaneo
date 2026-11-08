import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Spartaneo Music Studio",
  description: "Private recording studio for practice and vocal takes.",
};

export default function MusicStudioPage() {
  return (
    <iframe
      title="Spartaneo Music Studio"
      src="/studio/index.html"
      allow="microphone"
      style={{ display: "block", width: "100%", height: "100dvh", border: 0 }}
    />
  );
}
