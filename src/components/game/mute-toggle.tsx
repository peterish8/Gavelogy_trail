'use client';

import { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { gameAudio } from '@/lib/game/audio';
import { cn } from '@/lib/utils';

export function MuteToggle({ className }: { className?: string }) {
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    if (gameAudio) {
      setMuted(gameAudio.isMuted());
    }
  }, []);

  const toggle = () => {
    if (gameAudio) {
      const newMuted = gameAudio.toggleMute();
      setMuted(newMuted);
    }
  };

  return (
    <button
      onClick={toggle}
      className={cn(
        "p-2 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm",
        "hover:bg-white/10 hover:border-white/20 transition-all",
        "text-muted-foreground hover:text-foreground",
        className
      )}
      title={muted ? "Unmute" : "Mute"}
    >
      {muted ? (
        <VolumeX className="h-4 w-4" />
      ) : (
        <Volume2 className="h-4 w-4" />
      )}
    </button>
  );
}
