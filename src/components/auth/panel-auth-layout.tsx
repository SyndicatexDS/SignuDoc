"use client";

import { useRef, useState, type ReactNode } from "react";
import { Volume2, VolumeX, X } from "lucide-react";

type PanelAuthLayoutProps = {
  children: ReactNode;
};

export function PanelAuthLayout({ children }: PanelAuthLayoutProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const toggleSound = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {});
    }
  };

  return (
    <div className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-2 bg-black text-white antialiased">
      {/* Hidden audio element for ambient sound */}
      <audio
        ref={audioRef}
        src="https://panel.rustlabs.io/audio/ambient.mp3"
        loop
        preload="none"
      />

      {/* Left Column: Wallpaper & Overlays (visible on lg+) */}
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden min-h-screen select-none p-12 bg-black">
        <img
          src="/blueprint-wallpaper.jpg"
          alt="Blueprint Wallpaper"
          className="absolute inset-0 h-full w-full object-cover z-0 pointer-events-none select-none"
        />

        {/* Gradient overlays matching panel.rustlabs.io */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-transparent z-1 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent z-1 pointer-events-none" />

        {/* Top brand header */}
        <div className="relative z-10 flex items-center gap-3">
          <img
            src="https://panel.rustlabs.io/images/rustlabs-logo.png"
            alt="RustLabs"
            className="h-8 w-auto object-contain brightness-110 drop-shadow"
          />
          <span className="text-xs font-semibold uppercase tracking-widest text-gray-300">
            RustLabs.io
          </span>
        </div>

        {/* Bottom text banner */}
        <div className="relative z-10 space-y-2 max-w-md">
          <h1 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-md">
            Blueprint
          </h1>
          <p className="text-sm text-gray-300 leading-relaxed drop-shadow">
            Secure electronic signatures, document workflows, and audit-grade verification by RustLabs.io.
          </p>
        </div>
      </div>

      {/* Right Column: Form Container */}
      <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-[#111111] p-6 sm:p-12 overflow-y-auto">
        {/* Top Controls: Sound & Close */}
        <div className="absolute top-6 right-6 z-20 flex items-center gap-3">
          <button
            type="button"
            onClick={toggleSound}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1a1a1a] border border-[#2e2e2e] text-gray-400 hover:text-white hover:border-gray-500 transition-all cursor-pointer"
            aria-label={isPlaying ? "Mute audio" : "Play ambient sound"}
            title={isPlaying ? "Mute audio" : "Play ambient sound"}
          >
            {isPlaying ? (
              <Volume2 className="h-4 w-4 text-blue-400" />
            ) : (
              <VolumeX className="h-4 w-4" />
            )}
          </button>

          <a
            href="https://rustlabs.io"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1a1a1a] border border-[#2e2e2e] text-gray-400 hover:text-white hover:border-gray-500 transition-all cursor-pointer"
            aria-label="Close"
            title="Go to RustLabs"
          >
            <X className="h-4 w-4" />
          </a>
        </div>

        {/* Content Card */}
        <div className="w-full max-w-[420px] py-10">
          {children}
        </div>
      </div>
    </div>
  );
}
