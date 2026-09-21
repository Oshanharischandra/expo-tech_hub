import React from 'react';
import { Sparkles, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-[#ac834e]/30 bg-[#0e0e0e] py-12 px-6 lg:px-16 text-xs text-white/70">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#ac834e]/15 border border-[#ac834e]/30 flex items-center justify-center text-[#ac834e]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="font-extrabold text-white uppercase tracking-wider text-sm">
              Tech <span className="text-[#ac834e]">HUB</span>
            </span>
            <p className="text-[11px] text-white/50">
              Gold-standard executive symposiums & technical governance.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 text-[11px] font-mono">
          <span className="text-[#ac834e] flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#ac834e]" />
            TLS 1.3 End-to-End Cryptographic Attestation
          </span>
          <span className="text-white/30">|</span>
          <span className="text-white/60">© 2026 Tech HUB</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
