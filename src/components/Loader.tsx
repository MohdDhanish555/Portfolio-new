import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { SkipForward } from "lucide-react";

/**
 * Loader Overlay with Multi-Step Animation
 *
 * STEP 1: Letter reveal animation - "DHANISH" appears letter by letter
 * STEP 2: Drop H, S, H letters and regroup D, A, N, I to form "DANI"
 * STEP 3: Blend loader "DANI" with hero "DANI" and remove overlay
 */
interface LoaderProps {
  onComplete?: () => void;
}

export function Loader({ onComplete }: LoaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const lettersRef = useRef<HTMLSpanElement[]>([]);
  const animationTimelinesRef = useRef<
    (gsap.core.Timeline | gsap.core.Tween)[]
  >([]);
  const [fontReady, setFontReady] = useState(false);

  useEffect(() => {
    // Wait for the font to load before showing text to prevent FOUT (Flash of Unstyled Text)
    const checkFont = async () => {
      try {
        // Use Font Loading API to wait for the font to be ready
        if ("fonts" in document) {
          await document.fonts.load("normal 1px 'Calcio Ultra Condensed'");
          // Small delay to ensure font is fully rendered
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
        setFontReady(true);
      } catch (error) {
        // Fallback: if Font Loading API fails, proceed after a short delay
        console.warn("Font loading check failed, proceeding anyway:", error);
        setTimeout(() => setFontReady(true), 100);
      }
    };

    checkFont();
  }, []);

  // Function to skip all animations and jump to final state
  const skipAnimation = () => {
    // Kill all GSAP animations
    gsap.killTweensOf("*");
    animationTimelinesRef.current.forEach((tl) => tl.kill());

    // Get hero "DANI" element
    const heroDani = document.querySelector(
      '[data-hero-dani="true"]',
    ) as HTMLElement;

    if (heroDani) {
      // Show hero immediately
      gsap.set(heroDani, { opacity: 1 });
    }

    // Hide loader container immediately
    if (containerRef.current) {
      gsap.set(containerRef.current, { opacity: 0 });
      containerRef.current.style.display = "none";
      containerRef.current.style.pointerEvents = "none";
    }

    // Hide all letters
    lettersRef.current.forEach((letter) => {
      if (letter) {
        gsap.set(letter, { opacity: 0 });
      }
    });

    // Call onComplete immediately
    onComplete?.();
  };

  useEffect(() => {
    // Only start animation after font is ready
    if (!fontReady || !containerRef.current || lettersRef.current.length === 0)
      return;

    // ============================================
    // STEP 1: Letter Reveal Animation
    // ============================================
    // Set initial state for all letters (hidden, slightly below)
    gsap.set(lettersRef.current, {
      opacity: 0,
      y: 20,
      scale: 0.9,
    });

    // Animate letters appearing one by one
    // Using premium easing (power3.out) for smooth, editorial feel
    const step1Timeline = gsap.to(lettersRef.current, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 1.2, // Slower duration for more subtle animation
      ease: "power3.out",
      stagger: 0.15, // Slightly longer delay between letters for more deliberate pacing
    });
    animationTimelinesRef.current.push(step1Timeline);

    // ============================================
    // STEP 2: Drop H S H and Regroup D A N I
    // ============================================
    // Calculate when STEP 1 completes
    // Duration: 1.2s + (stagger: 0.15s * 6 letters) = ~2.1s total
    const step1Duration = 1.2 + 0.15 * 6;

    // Define letter indices
    // "DHANISH" = [D(0), H(1), A(2), N(3), I(4), S(5), H(6)]
    const lettersToDrop = [1, 5, 6]; // H, S, H
    const lettersToKeep = [0, 2, 3, 4]; // D, A, N, I

    // Schedule STEP 2 to start after STEP 1 completes
    setTimeout(
      () => {
        // Get letters after STEP 1 is complete
        const dropLetters = lettersToDrop.map(
          (index) => lettersRef.current[index],
        );

        const keepLetters = lettersToKeep.map(
          (index) => lettersRef.current[index],
        );

        // Create timeline for STEP 2
        const step2Timeline = gsap.timeline();
        animationTimelinesRef.current.push(step2Timeline);

        // Drop H, S, H letters with falling effect
        // Letters fall straight down and fade out
        dropLetters.forEach((letter, index) => {
          // Create individual timeline for each letter
          const letterTimeline = gsap.timeline();

          // Falling effect: move straight down with gravity-like acceleration
          // Animate position with strong gravity easing
          letterTimeline.to(letter, {
            y: window.innerHeight * 1.2, // Fall further down (off screen)
            duration: 1.0,
            ease: "power4.in", // Strong gravity acceleration
          });

          // Fade and scale happen more gradually
          letterTimeline.to(
            letter,
            {
              duration: 0.5,
              ease: "power2.in",
            },
            0.4, // Start fading/scaling partway through the fall
          );

          // Stagger the start of each letter's fall animation
          // H(1) → S(5) → H(6) sequence
          step2Timeline.add(letterTimeline, index * 0.12); // 120ms stagger
        });

        // Regroup D, A, N, I to form "DANI" with tighter spacing
        // Get actual positions and widths of letters
        const letterData = keepLetters
          .map((letter) => {
            if (!letter) return null;
            const rect = letter.getBoundingClientRect();
            const containerRect = containerRef.current?.getBoundingClientRect();
            if (!containerRect) return null;
            return {
              element: letter,
              left: rect.left - containerRect.left,
              width: rect.width,
            };
          })
          .filter(Boolean) as Array<{
          element: HTMLSpanElement;
          left: number;
          width: number;
        }>;

        if (letterData.length === 4) {
          // Calculate target positions for "DANI" with tighter spacing
          // Target letter spacing: -1rem (tighter than current -0.5rem)
          const targetLetterSpacing = -1; // rem
          const spacingInPx = targetLetterSpacing * 16; // Convert rem to px (assuming 16px base)

          // Calculate the center point of the container
          const containerWidth =
            containerRef.current?.getBoundingClientRect().width || 0;
          const centerX = containerWidth / 2;

          // Calculate total width of "DANI" with target spacing
          const letterWidths = letterData.map((data) => data.width);
          const totalDaniWidth =
            letterWidths.reduce((sum, w) => sum + w, 0) +
            spacingInPx * (letterWidths.length - 1);

          // Calculate starting position (left edge of "DANI")
          const startX = centerX - totalDaniWidth / 2;

          // Calculate target positions for each letter
          let currentX = startX;
          const targetPositions = letterWidths.map((width) => {
            const position = currentX;
            currentX += width + spacingInPx; // Move to next letter position
            return position;
          });

          // Animate each letter to its target position
          // Position regroup to start after all fall animations complete
          // Last fall: starts at 0.24s (index 2 * 0.12), duration 1.0s, ends at 1.24s
          // Add small pause (0.15s) before regroup begins
          const regroupStartTime = 0.24 + 1.0 + 0.15; // 1.39s

          letterData.forEach((data, index) => {
            const currentLeft = data.left;
            const targetLeft = targetPositions[index];
            const offset = targetLeft - currentLeft;

            step2Timeline.to(
              data.element,
              {
                x: offset,
                duration: 1.0,
                ease: "power2.out",
              },
              regroupStartTime, // Start after fall animations complete
            );
          });
        }

        // ============================================
        // STEP 3: Blend Loader "DANI" with Hero "DANI"
        // ============================================
        // Calculate when STEP 2 completes
        // STEP 2: fall ends at 1.24s, regroup starts at 1.39s, duration 1.0s, ends at 2.39s
        const step2Duration = 1.39 + 1.0; // 2.39s
        // Only wait for STEP 2 to complete + brief pause (we're already inside STEP 2 setTimeout)
        const step3Delay = step2Duration + 0.15;

        setTimeout(() => {
          // Get hero "DANI" element and loader letters
          const heroDani = document.querySelector(
            '[data-hero-dani="true"]',
          ) as HTMLElement;
          const keepLetters = lettersToKeep.map(
            (index) => lettersRef.current[index],
          );

          if (!heroDani || keepLetters.length !== 4) return;

          // Ensure hero is ready but hidden initially
          gsap.set(heroDani, {
            opacity: 0,
          });

          // Animate from regrouped position to hero position
          const loaderTextContainer = textContainerRef.current;
          if (!loaderTextContainer) return;

          // Get current position (regrouped, centered in viewport)
          const loaderRect = loaderTextContainer.getBoundingClientRect();
          const loaderCenterY = loaderRect.top + loaderRect.height / 2;
          const loaderCenterX = loaderRect.left + loaderRect.width / 2;

          // Get hero position
          const heroRect = heroDani.getBoundingClientRect();
          const heroCenterY = heroRect.top + heroRect.height / 2;
          const heroCenterX = heroRect.left + heroRect.width / 2;

          // Calculate offset to move from regrouped position to hero position
          const offsetX = heroCenterX - loaderCenterX;
          const offsetY = heroCenterY - loaderCenterY;

          // Hero properties
          const heroColor = "rgba(0, 0, 0, 0.15)";

          // Create STEP 3 timeline
          const step3Timeline = gsap.timeline();
          animationTimelinesRef.current.push(step3Timeline);

          // Animate loader text container from regrouped position to hero position
          step3Timeline.to(
            loaderTextContainer,
            {
              x: offsetX + 7,
              y: offsetY,
              duration: 1.2,
              ease: "power3.out",
            },
            0,
          );

          // Keep the regrouped letter spacing from STEP 2 - don't change it
          // Just animate color to match hero
          keepLetters.forEach((letter) => {
            step3Timeline.to(
              letter,
              {
                color: heroColor,
                duration: 1.2,
                ease: "power3.out",
              },
              0,
            );
          });

          // Phase 1: Hero fades in first (loader stays visible)
          step3Timeline.to(
            heroDani,
            {
              opacity: 1,
              duration: 0.4,
              ease: "power2.out",
            },
            1.0, // Start near end of alignment, hero fully visible at 1.4s
          );

          // Phase 2: Overlay fades out once hero is visible
          step3Timeline.to(
            containerRef.current,
            {
              opacity: 0,
              duration: 0.5,
              ease: "power2.out",
              onComplete: () => {
                if (containerRef.current) {
                  containerRef.current.style.display = "none";
                  containerRef.current.style.pointerEvents = "none";
                }
                // Notify parent that loader is complete
                onComplete?.();
              },
            },
            1.2, // Start once hero is mostly visible
          );

          // Phase 3: Loader fades out last, after hero is fully visible
          step3Timeline.to(
            keepLetters,
            {
              opacity: 0,
              duration: 0.3,
              ease: "power2.out",
            },
            1.4, // Start after hero is fully visible (1.0 + 0.4 = 1.4s)
          );
        }, step3Delay * 1000);
      },
      (step1Duration + 0.5) * 1000,
    );
  }, [fontReady, onComplete]);

  // Split "DHANISH" into individual letters
  const text = "DHANISH";
  const letters = text.split("");

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] bg-white flex items-center justify-center pointer-events-auto"
      style={{
        // Full-screen overlay that blocks interaction
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      {/* Skip Button */}
      <nav className="absolute top-0 right-0 z-[10000] px-4 md:px-8 py-4">
        <button
          onClick={skipAnimation}
          className="bg-foreground p-2 rounded-sm flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
          aria-label="Skip loader animation"
        >
          <SkipForward className="w-4 h-4 md:w-5 md:h-5 text-background" />
        </button>
      </nav>

      {/* Animated Text Container */}
      <div
        ref={textContainerRef}
        className="flex items-center justify-center"
        style={{
          fontFamily: "'Calcio Ultra Condensed', sans-serif",
          fontSize: "30rem",
          letterSpacing: "0.5rem", // Increased spacing for editorial breathing room
          lineHeight: "1.5",
          userSelect: "none",
          pointerEvents: "none",
          visibility: fontReady ? "visible" : "hidden", // Hide until font is ready
          overflow: "hidden",
        }}
      >
        {letters.map((letter, index) => (
          <span
            key={`${letter}-${index}`}
            ref={(el) => {
              if (el) lettersRef.current[index] = el;
            }}
            className="inline-block"
            style={{
              color: "#1B211A",
            }}
          >
            {letter}
          </span>
        ))}
      </div>
    </div>
  );
}
