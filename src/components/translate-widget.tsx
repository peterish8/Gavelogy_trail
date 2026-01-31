'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';

interface TranslateWidgetProps {
  resetKey?: string | null; // When this changes, reset translation to English
}

declare global {
  interface Window {
    googleTranslateElementInit: () => void;
    google: {
      translate: {
        TranslateElement: {
          new (options: unknown, elementId: string): unknown;
          InlineLayout: {
            SIMPLE: unknown;
          };
        };
      };
    };
  }
}

export function TranslateWidget({ resetKey }: TranslateWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  // Function to reset Google Translate to English
  const resetToEnglish = () => {
    // Method 1: Clear Google Translate cookie
    document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.' + window.location.hostname;
    
    // Method 2: Try to use Google Translate API to reset
    const selectElement = document.querySelector('.goog-te-combo') as HTMLSelectElement;
    if (selectElement) {
      selectElement.value = 'en';
      selectElement.dispatchEvent(new Event('change'));
    }
    
    // Method 3: Reload if translation was active
    if (document.documentElement.classList.contains('translated-ltr') || 
        document.documentElement.classList.contains('translated-rtl')) {
      // Remove translation classes
      document.documentElement.classList.remove('translated-ltr', 'translated-rtl');
    }
    
    setIsOpen(false);
  };

  // Reset translation when resetKey changes (different note selected)
  useEffect(() => {
    if (resetKey !== undefined) {
      resetToEnglish();
    }
  }, [resetKey]);

  // Reset translation when navigating to different page
  useEffect(() => {
    resetToEnglish();
  }, [pathname]);

  // Initialize Google Translate Script
  useEffect(() => {
    if (document.getElementById('google-translate-script')) return;

    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement(
        { 
            pageLanguage: 'en', 
            includedLanguages: 'en,hi,ta,te,kn,ml,bn,mr,gu,pa,ur,fr,es,de,it,ja,ko,zh-CN,ru,ar', 
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false
        },
        'google_translate_element'
      );
    };

    const script = document.createElement('script');
    script.id = 'google-translate-script';
    script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    document.body.appendChild(script);

    // Inject styles
    const style = document.createElement('style');
    style.innerHTML = `
        /* NUCLEAR OPTION: Hide the Google Top Bar */
        .goog-te-banner-frame { display: none !important; visibility: hidden !important; height: 0 !important; }
        .goog-te-banner-frame.skiptranslate { display: none !important; }
        iframe.goog-te-banner-frame { display: none !important; visibility: hidden !important; height: 0 !important; }
        
        /* Catch-all for dynamic IDs like :1.container, :2.container */
        iframe[id*=".container"] { display: none !important; visibility: hidden !important; height: 0 !important; }
        
        /* Obfuscated Google Classes seen in screenshots */
        .VIpgJd-ZVi9od-ORHb { display: none !important; visibility: hidden !important; height: 0 !important; }
        .VIpgJd-ZVi9od-ORHb-OEVmcd { display: none !important; visibility: hidden !important; height: 0 !important; }
        .VIpgJd-ZVi9od-aZ2wEe-wOHMyf { display: none !important; visibility: hidden !important; height: 0 !important; }
        
        /* Fix Body Shift */
        body { top: 0px !important; position: static !important; margin-top: 0 !important; }
        
        /* Hide tooltips */
        .goog-tooltip { display: none !important; }
        .goog-te-balloon-frame { display: none !important; }
        
        /* Styled Widget Trigger */
        .goog-te-gadget-simple {
            background-color: transparent !important;
            border: none !important;
            padding: 0 !important;
            font-size: 14px !important;
            font-family: inherit !important;
            color: #374151 !important;
            cursor: pointer !important;
        }
        
        .goog-te-gadget-simple .goog-te-menu-value {
            color: #374151 !important;
            margin: 0 !important;
            display: flex !important;
            align-items: center !important;
        }
        
        .goog-te-gadget-simple .goog-te-menu-value span {
            color: #374151 !important;
            border: none !important;
            font-weight: 500 !important;
            text-decoration: none !important;
        }
        
        /* Hide Google Branding */
        .goog-te-gadget-icon { display: none !important; }
        .goog-te-gadget-simple img { display: none !important; }
        
        /* Dropdown Frame */
        iframe.goog-te-menu-frame {
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
            border: 1px solid #e5e7eb !important;
            border-radius: 12px !important;
            background: white !important;
            z-index: 99999999 !important;
        }
    `;
    document.head.appendChild(style);



    // NUCLEAR OBSERVER: Watch for the banner and kill it immediately
    const observer = new MutationObserver(() => {
        const bannerFrame = document.querySelector('.goog-te-banner-frame');
        const containerFrame = document.querySelector('iframe[id*=".container"]');
        const obfuscatedFrame = document.querySelector('.VIpgJd-ZVi9od-ORHb');
        
        const banner = bannerFrame || containerFrame || obfuscatedFrame;
        
        if (banner) {
            // Check if wrapped in skiptranslate (common for top banner) and remove the wrapper
            const wrapper = banner.closest('.skiptranslate');
            if (wrapper) {
                wrapper.remove();
            } else {
                banner.remove();
            }
        }

        // Force reset body/html styles
        const body = document.body;
        const html = document.documentElement;
        
        if (body.style.top !== '0px' || html.style.top !== '0px') {
             body.style.setProperty('top', '0px', 'important');
             body.style.setProperty('position', 'static', 'important');
             body.style.setProperty('margin-top', '0px', 'important');
             
             html.style.setProperty('top', '0px', 'important');
             html.style.setProperty('position', 'static', 'important');
             html.style.setProperty('margin-top', '0px', 'important');
        }
    });
    
    observer.observe(document.body, { attributes: true, childList: true, subtree: true });   

    return () => {
        observer.disconnect();
    };

  }, []);

  // Update position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        const screenHeight = window.innerHeight;
        const isBottom = rect.top > screenHeight / 2;
        
        // If button is in bottom half, open UP. Else open DOWN.
        if (isBottom) {
            setMenuStyle({
                position: 'fixed',
                bottom: screenHeight - rect.top + 10,
                left: rect.left - 100, // Center-ish aligning
                zIndex: 99999,
                minWidth: '200px'
            });
        } else {
            setMenuStyle({
                position: 'fixed',
                top: rect.bottom + 10,
                left: rect.left - 100,
                zIndex: 99999,
                minWidth: '200px'
            });
        }
    }
  }, [isOpen]);

  const toggle = () => setIsOpen(!isOpen);

  return (
    <div className="relative notranslate">
        <button 
           ref={buttonRef}
           onClick={toggle}
           className={cn(
               "p-2 rounded-full transition-colors flex items-center gap-2",
               isOpen ? "bg-blue-50 text-blue-600" : "hover:bg-gray-100 text-gray-500"
           )}
           title="Translate Notes"
        >
            <Globe className="w-5 h-5" />
        </button>

        {/* Portal to Body for "Above Toolbar" behavior */}
        {typeof document !== 'undefined' && createPortal(
            <div 
                className={cn(
                    "bg-white rounded-xl shadow-2xl border border-gray-100 p-3 transition-opacity duration-200 notranslate",
                    isOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
                )}
                style={menuStyle}
            >
                <div className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-2 px-1">
                    Select Language
                </div>
                {/* 
                   Google Translate Widget Mount Point. 
                   We keep it mounted here.
                */}
                <div id="google_translate_element" className="relative w-full" />
                
                {isOpen && (
                    <div 
                        className="fixed inset-0 z-[-1]" 
                        onClick={() => setIsOpen(false)} 
                    />
                )}
            </div>,
            document.body
        )}
    </div>
  );
}
