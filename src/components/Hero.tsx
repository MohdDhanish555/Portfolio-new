import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { Search, Code2, Sparkles, Zap, TrendingUp } from "lucide-react";
import meImage from "../assets/me_black_full.png";
import meWhiteImage from "../assets/me_white_full.png";
import smokeVideo from "../assets/07_03_loop.webm";
import { ModeToggle } from "./mode-toggle";
import { HoodieToggle } from "./hoodie-toggle";
import { useTheme } from "./theme-provider";

interface HeroProps {
  isLoaderComplete: boolean;
}

export function Hero({ isLoaderComplete }: HeroProps) {
  const mainImageRef = useRef<HTMLImageElement>(null);
  const leftContentRef = useRef<HTMLDivElement>(null);
  const smokeVideoRef = useRef<HTMLVideoElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const previousHoodieRef = useRef<string | null>(null);
  const coverRef = useRef<HTMLDivElement>(null);

  const { theme, setTheme } = useTheme();

  // Determine the actual theme (resolve system theme)
  const getCurrentTheme = () => {
    if (theme === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return theme;
  };

  const currentTheme = getCurrentTheme();

  // State for hoodie type (independent from theme)
  const [hoodieType, setHoodieType] = useState<"black" | "white">(() => {
    const saved = localStorage.getItem("hoodie");
    return (saved === "white" ? "white" : "black") as "black" | "white";
  });

  // State to control displayed image source (prevents React from updating src immediately)
  const [displayedImageSrc, setDisplayedImageSrc] = useState<string>(() => {
    return hoodieType === "white" ? meWhiteImage : meImage;
  });

  // Use the displayed image source (controlled by animation) instead of current theme
  const imageSrc = displayedImageSrc;

  // Function to position smoke video over image
  const positionSmokeVideo = () => {
    const img = mainImageRef.current;
    const smokeVideo = smokeVideoRef.current;
    const imageContainer = imageContainerRef.current;

    if (!img || !smokeVideo || !imageContainer) return;

    // Get image dimensions
    const imgRect = img.getBoundingClientRect();
    const containerRect = imageContainer.getBoundingClientRect();

    // Calculate position relative to container
    const top = imgRect.top - containerRect.top;
    const left = imgRect.left - containerRect.left;

    // Scale up smoke video significantly to ensure it covers entire image including hoodie
    // Use much larger scale factor so smoke from bottom of video reaches the top of image
    const scaleFactor = 2.5; // Scale up 2.5x to ensure smoke covers from bottom to top
    const scaledWidth = imgRect.width * scaleFactor;
    const scaledHeight = imgRect.height * scaleFactor;

    // Position so the smoke covers the hoodie area - shift down more
    // Move the video down more so smoke focuses on hoodie/torso area
    const verticalOffset = imgRect.height * 0.3; // Shift down by 30% of image height
    const horizontalOffset = imgRect.width * 0.1; // Shift left by 10% of image width
    const scaledTop = top - (scaledHeight - imgRect.height) + verticalOffset;
    const scaledLeft =
      left - (scaledWidth - imgRect.width) / 2 - horizontalOffset;

    // Set smoke video to be much larger than image for full coverage
    gsap.set(smokeVideo, {
      top: `${scaledTop}px`,
      left: `${scaledLeft}px`,
      width: `${scaledWidth}px`,
      height: `${scaledHeight}px`,
      objectFit: "cover",
      objectPosition: "center 75%", // Position to show lower portion (75% from top) to focus more on hoodie area
    });
  };

  // Initialize smoke video position on mount
  useEffect(() => {
    const smokeVideo = smokeVideoRef.current;
    if (smokeVideo) {
      positionSmokeVideo();
      gsap.set(smokeVideo, { opacity: 0 });
    }
  }, []);

  // Handle hoodie change with smoke animation
  useEffect(() => {
    const img = mainImageRef.current;
    const smokeVideo = smokeVideoRef.current;
    const imageContainer = imageContainerRef.current;

    if (!img || !smokeVideo || !imageContainer) return;

    // Initialize previous hoodie on first render
    if (previousHoodieRef.current === null) {
      previousHoodieRef.current = hoodieType;
      return;
    }

    // Only trigger animation if hoodie actually changed
    if (previousHoodieRef.current !== hoodieType) {
      // Use requestAnimationFrame to ensure DOM is updated before positioning
      requestAnimationFrame(() => {
        // Position smoke video to match current image
        positionSmokeVideo();

        // Small delay to ensure positioning is accurate
        setTimeout(() => {
          // Re-position after a brief moment to account for any layout shifts
          positionSmokeVideo();

          // Ensure image starts at full opacity
          gsap.set(img, { opacity: 1 });

          // Create smoke reveal animation timeline
          const smokeTimeline = gsap.timeline({
            onStart: () => {
              // Reset and play smoke video
              smokeVideo.currentTime = 0;
              smokeVideo.play().catch(() => {
                // Handle play promise rejection (autoplay policies)
              });
            },
            onComplete: () => {
              // Pause video after animation completes
              smokeVideo.pause();
              smokeVideo.currentTime = 0;
            },
          });

          // Fade in smoke with higher opacity for visibility
          smokeTimeline.to(smokeVideo, {
            opacity: 1,
            duration: 0.5, // Increased from 0.4 to 0.5
            ease: "power2.out",
          });

          // Change image source immediately when smoke is visible
          smokeTimeline.call(
            () => {
              // Change source directly - no fade animation
              const newSrc = hoodieType === "white" ? meWhiteImage : meImage;
              img.src = newSrc;
              setDisplayedImageSrc(newSrc); // Update state so React doesn't change it back
            },
            [],
            0.3 // Change source when smoke is fully visible
          );

          // Hold smoke visible at full opacity
          smokeTimeline.to(
            smokeVideo,
            {
              opacity: 1,
              duration: 0.9, // Increased from 0.8 to 0.9
            },
            0.5 // Continue from where smoke fade-in ended (updated to match new fade-in duration)
          );

          // Fade out smoke smoothly with very gradual easing
          smokeTimeline.to(
            smokeVideo,
            {
              opacity: 0,
              duration: 1.5, // Even longer duration for very smooth fade-out
              ease: "sine.out", // Very smooth, gradual easing curve
            },
            1.4 // Start after smoke hold period (updated: 0.5 + 0.9 = 1.4)
          );
        }, 50);
      });

      // Update previous hoodie
      previousHoodieRef.current = hoodieType;
    }
  }, [hoodieType]);

  // Reposition smoke video on window resize
  useEffect(() => {
    const handleResize = () => {
      positionSmokeVideo();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const img = mainImageRef.current;
    // const leftContent = leftContentRef.current; // COMMENTED OUT - Left section animation disabled

    if (!img) return;

    // Set initial state immediately (before loader completes) to prevent flash
    gsap.set(img, {
      clipPath: "polygon(0 100%, 100% 100%, 100% 100%, 0 100%)",
      opacity: 0,
      scale: 1.03,
    });
  }, []);

  useEffect(() => {
    const img = mainImageRef.current;
    // const leftContent = leftContentRef.current; // COMMENTED OUT - Left section animation disabled
    if (!img || !isLoaderComplete) return;

    // Create timeline for hero animations
    const heroTimeline = gsap.timeline();
    // Animate hero image - starts slightly after text begins
    heroTimeline.to(
      img,
      {
        clipPath: "polygon(0 0%, 100% 0%, 100% 100%, 0 100%)",
        opacity: 1,
        scale: 1,
        duration: 1,
        ease: "power3.out",
      },
      0.3
    );
  }, [isLoaderComplete]);

  const animateThemeToggle = () => {
    const overlay = coverRef.current;
    if (!overlay) return;

    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    const START_ORIGIN = "100% 0%"; // top-right
    const END_ORIGIN = "0% 100%"; // bottom-left

    // Use ellipse for diagonal wipe effect
    // Expansion: ellipse grows from top-right, reaches bottom-left last
    // Contraction: ellipse shrinks from top-right origin, bottom-left disappears last
    const ellipseCollapsed = `ellipse(0px 0px at ${START_ORIGIN})`;
    const ellipseExpanded = `ellipse(200vw 200vh at ${START_ORIGIN})`;

    // Realistic cloth texture - canvas/linen-like weave with natural grain
    const clothTexture = `url("data:image/svg+xml,%3Csvg width='32' height='32' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='canvas' x='0' y='0' width='4' height='4' patternUnits='userSpaceOnUse'%3E%3Crect width='4' height='4' fill='rgba(255,255,255,0.02)'/%3E%3Cpath d='M 0 0 L 4 4' stroke='rgba(255,255,255,0.08)' stroke-width='0.5'/%3E%3Cpath d='M 4 0 L 0 4' stroke='rgba(0,0,0,0.08)' stroke-width='0.5'/%3E%3C/pattern%3E%3Cpattern id='weave' x='0' y='0' width='8' height='8' patternUnits='userSpaceOnUse'%3E%3Crect width='8' height='1' fill='rgba(255,255,255,0.06)'/%3E%3Crect y='7' width='8' height='1' fill='rgba(0,0,0,0.06)'/%3E%3Crect width='1' height='8' fill='rgba(255,255,255,0.04)'/%3E%3Crect x='7' width='1' height='8' fill='rgba(0,0,0,0.04)'/%3E%3C/pattern%3E%3Cfilter id='fabricGrain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.2' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.15 0'/%3E%3C/filter%3E%3C/defs%3E%3Crect width='32' height='32' fill='url(%23canvas)'/%3E%3Crect width='32' height='32' fill='url(%23weave)'/%3E%3Crect width='32' height='32' filter='url(%23fabricGrain)' opacity='0.7'/%3E%3C/svg%3E")`;

    // 1️⃣ Prepare overlay with NEXT theme color and cloth texture
    gsap.set(overlay, {
      backgroundColor:
        nextTheme === "dark" ? "hsl(240 10% 3.9%)" : "hsl(0 0% 100%)",
      backgroundImage: clothTexture,
      backgroundSize: "16px 16px",
      backgroundRepeat: "repeat",
      clipPath: ellipseCollapsed,
      zIndex: 10000,
      willChange: "clip-path",
    });

    const tl = gsap.timeline({
      defaults: { ease: "power3.inOut" },
    });

    // 2️⃣ Paint the screen (ellipse expands from top-right toward bottom-left)
    tl.to(overlay, {
      clipPath: ellipseExpanded,
      duration: 0.8,
    });

    // 3️⃣ Switch theme WHILE FULLY COVERED
    tl.call(() => {
      setTheme(nextTheme);
    });

    // 4️⃣ Remove cloth (starts contracting from top-right, ends at bottom-left)
    // Change origin to bottom-left and shrink from there
    // This makes the contraction start from top-right area (which disappears first)
    // and end at bottom-left (which disappears last)
    tl.to(overlay, {
      clipPath: `ellipse(0px 0px at ${END_ORIGIN})`,
      duration: 1.2,
    });

    // 5️⃣ Cleanup
    tl.set(overlay, {
      clipPath: "none",
      backgroundImage: "none",
      clearProps:
        "backgroundColor,backgroundSize,backgroundRepeat,willChange,zIndex",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div
        ref={coverRef}
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 9999,
          clipPath: "circle(0px at 100% 0%)",
          willChange: "clip-path",
        }}
      />

      {/* Main Hero Section */}
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Search Icon and Theme Toggle at Top */}
        <nav className="absolute top-0 right-0 z-20 px-4 md:px-8 py-4">
          <div className="flex items-center gap-2">
            <div className="bg-foreground p-2 rounded-sm flex items-center justify-center">
              <Search className="w-4 h-4 md:w-5 md:h-5 text-background cursor-pointer hover:opacity-80" />
            </div>
            <div className="bg-foreground p-2 rounded-sm flex items-center justify-center">
              <HoodieToggle
                hoodieType={hoodieType}
                onHoodieChange={(hoodie) => setHoodieType(hoodie)}
              />
            </div>
            <div className="bg-foreground p-2 rounded-sm flex items-center justify-center">
              <ModeToggle onToggle={animateThemeToggle} />
            </div>
          </div>
        </nav>

        {/* Background Typography - Calcio Ultra Condensed */}
        <div
          className="absolute top-35 h-full flex items-start justify-center z-0"
          style={{
            fontFamily: "'Calcio Ultra Condensed', sans-serif",
            // fontSize: "clamp(20rem, 80vh, 12rem)",
            fontSize: "30rem",
            letterSpacing: "-0.5rem",
            lineHeight: "1",
            userSelect: "none",
            pointerEvents: "none",
            // paddingTop: "clamp(2rem, 5vh, 4rem)",
            // paddingBottom: "clamp(2rem, 5vh, 4rem)",
          }}
        >
          <span
            data-hero-dani="true"
            className="whitespace-nowrap text-foreground/15"
            style={{
              opacity: 0, // Start hidden, will be revealed during STEP 3 handoff
              // style={{ transform: "scaleY(1.15)" }}
            }}
          >
            DANI
          </span>
        </div>

        {/* Texture noise overlay - centered */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30%] h-full z-[1]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            mixBlendMode: currentTheme === "dark" ? "screen" : "multiply",
            opacity: currentTheme === "dark" ? 0.15 : 0.3,
          }}
        ></div>

        {/* Left Side Content - Text-based introduction */}
        <div
          ref={leftContentRef}
          className="absolute left-4 md:left-8 lg:left-12 top-1/2 -translate-y-1/2 z-10 hidden lg:block max-w-[320px]"
        >
          <div className="space-y-6">
            {/* Eyebrow label */}
            <div className="text-xs uppercase tracking-wider text-foreground/40 font-medium">
              Front-End Developer
            </div>

            {/* Headline - 2 lines */}
            <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-[1.1] tracking-tight">
              Building digital
              <br />
              experiences that matter
            </h1>

            {/* Supporting text */}
            <p className="text-sm text-foreground/60 leading-relaxed max-w-[240px]">
              I craft thoughtful interfaces and systems that balance aesthetics
              with functionality. Every line of code serves a purpose.
            </p>

            {/* Subtle visual accent - thin line */}
            <div
              className="w-12 h-px bg-foreground/20"
              style={{
                opacity: 0,
                transform: "scaleX(0)",
                transformOrigin: "left",
              }}
            ></div>
          </div>
        </div>

        {/* Scroll indicator - positioned at bottom of left section */}
        <div className="absolute left-4 md:left-8 lg:left-12 bottom-8 z-10 hidden lg:block max-w-[320px] w-full">
          <div className="flex flex-col items-center">
            <div className="text-[10px] uppercase tracking-wider text-foreground/60 mb-3">
              Scroll
            </div>
            <svg
              width="32"
              height="80"
              viewBox="0 0 32 80"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-foreground/50"
            >
              {/* dashed starting path */}
              <path
                d="
      M 16 4
      Q 10 14, 14 24
    "
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="3 5"
                fill="none"
              />

              {/* solid continuation with loop */}
              <path
                d="
      M 14 24
      Q 22 38, 16 46
      Q 8 54, 16 60
      Q 18 64, 16 68
    "
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />

              {/* arrow head */}
              <path
                d="M 11 64 L 16 72 L 21 64"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </div>
        </div>

        {/* Right Side Content - Cards & SVGs */}
        <div className="absolute right-4 md:right-8 lg:right-12 top-1/2 -translate-y-1/2 z-10 hidden lg:block max-w-[320px]">
          {/* Card 1 - Tech Stack - Far away (small, faded, blurred) */}
          <div
            className="bg-card border border-border p-4 rounded-sm shadow-md hover:shadow-lg transition-all duration-300 absolute"
            style={{
              transform: "translate(0, -240px) rotate(-2deg) scale(0.75)",
              zIndex: 1,
              width: "280px",
              opacity: 0.75,
              filter: "blur(0.4px)",
            }}
          >
            <div className="flex items-start gap-3">
              <div className="bg-foreground p-2 rounded-sm flex-shrink-0">
                <Code2 className="w-4 h-4 text-background" />
              </div>
              <div className="flex-1">
                <h3 className="text-xs font-medium text-card-foreground uppercase tracking-wider mb-2">
                  Tech Stack
                </h3>
                <div className="flex flex-wrap gap-2">
                  {["React", "TypeScript", "Next.js", "Tailwind"].map(
                    (tech) => (
                      <span
                        key={tech}
                        className="text-[10px] px-2 py-1 bg-foreground/5 text-card-foreground/70 rounded-sm uppercase tracking-wide"
                      >
                        {tech}
                      </span>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Card 2 - Stats with SVG - Medium distance */}
          <div
            className="bg-card border border-border p-4 rounded-sm shadow-lg hover:shadow-xl transition-all duration-300 absolute"
            style={{
              transform: "translate(20px, -50px) rotate(1.5deg) scale(0.9)",
              zIndex: 2,
              width: "280px",
              opacity: 0.85,
              filter: "blur(0.5px)",
            }}
          >
            <div className="flex items-start gap-3">
              <div className="bg-foreground p-2 rounded-sm flex-shrink-0">
                <TrendingUp className="w-4 h-4 text-background" />
              </div>
              <div className="flex-1">
                <h3 className="text-xs font-medium text-card-foreground uppercase tracking-wider mb-3">
                  Focus Areas
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-card-foreground/60 uppercase">
                      UI/UX
                    </span>
                    <div className="flex-1 mx-2 h-1 bg-foreground/5 rounded-full overflow-hidden">
                      <div className="h-full bg-foreground w-[85%] rounded-full"></div>
                    </div>
                    <span className="text-[10px] text-card-foreground/40">
                      85%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-card-foreground/60 uppercase">
                      Performance
                    </span>
                    <div className="flex-1 mx-2 h-1 bg-foreground/5 rounded-full overflow-hidden">
                      <div className="h-full bg-foreground w-[90%] rounded-full"></div>
                    </div>
                    <span className="text-[10px] text-card-foreground/40">
                      90%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-card-foreground/60 uppercase">
                      Code Quality
                    </span>
                    <div className="flex-1 mx-2 h-1 bg-foreground/5 rounded-full overflow-hidden">
                      <div className="h-full bg-foreground w-[88%] rounded-full"></div>
                    </div>
                    <span className="text-[10px] text-card-foreground/40">
                      88%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3 - Modern SVG Pattern - Close (large, sharp, prominent) */}
          <div
            className="bg-card border border-border p-4 rounded-sm shadow-2xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden absolute"
            style={{
              transform: "translate(-15px, 80px) rotate(-1deg) scale(1.1)",
              zIndex: 4,
              width: "280px",
              opacity: 1,
              filter: "blur(0px)",
            }}
          >
            <div className="absolute top-0 right-0 w-20 h-20 opacity-5">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <defs>
                  <pattern
                    id="grid"
                    width="10"
                    height="10"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 10 0 L 0 0 0 10"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="0.5"
                      className="text-foreground/5"
                    />
                  </pattern>
                </defs>
                <rect width="100" height="100" fill="url(#grid)" />
              </svg>
            </div>
            <div className="flex items-start gap-3 relative z-10">
              <div className="bg-foreground p-2 rounded-sm flex-shrink-0">
                <Sparkles className="w-4 h-4 text-background" />
              </div>
              <div className="flex-1">
                <h3 className="text-xs font-medium text-card-foreground uppercase tracking-wider mb-2">
                  Expertise
                </h3>
                <p className="text-[11px] text-card-foreground/60 leading-relaxed">
                  Building modern, scalable web applications with clean code and
                  exceptional user experiences.
                </p>
              </div>
            </div>
          </div>

          {/* Card 4 - Animated SVG - Medium-far distance */}
          <div
            className="bg-card border border-border p-4 rounded-sm shadow-md hover:shadow-lg transition-all duration-300 absolute"
            style={{
              transform: "translate(25px, 220px) rotate(2.5deg) scale(0.85)",
              zIndex: 3,
              width: "280px",
              opacity: 0.8,
              filter: "blur(0.3px)",
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className="bg-foreground p-2 rounded-sm flex-shrink-0">
                  <Zap className="w-4 h-4 text-background" />
                </div>
                <div>
                  <h3 className="text-xs font-medium text-card-foreground uppercase tracking-wider mb-1">
                    Front-End Dev
                  </h3>
                  <p className="text-[10px] text-card-foreground/50">
                    Crafting digital experiences
                  </p>
                </div>
              </div>
              <div className="flex-shrink-0 ml-2">
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 40 40"
                  className="opacity-20 text-foreground"
                >
                  <circle
                    cx="20"
                    cy="20"
                    r="18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                  <circle
                    cx="20"
                    cy="20"
                    r="12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                  <circle cx="20" cy="20" r="6" fill="currentColor" />
                </svg>
              </div>
            </div>
          </div>

          {/* Decorative SVG Elements */}
          <div className="absolute -right-8 top-8 opacity-[0.03] pointer-events-none text-foreground">
            <svg width="120" height="120" viewBox="0 0 120 120">
              <path
                d="M 60 10 L 110 60 L 60 110 L 10 60 Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M 60 30 L 90 60 L 60 90 L 30 60 Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <circle cx="60" cy="60" r="15" fill="currentColor" />
            </svg>
          </div>
        </div>

        {/* Main Image */}
        <div
          ref={imageContainerRef}
          className="relative z-10 w-full h-full flex items-end justify-center p-1 md:p-2 lg:p-3 pt-8 md:pt-12 lg:pt-65"
        >
          <img
            ref={mainImageRef}
            src={imageSrc}
            alt="Profile"
            className="
    max-w-[65%] md:max-w-[60%] lg:max-w-[55%]
    max-h-[60vh] md:max-h-[65vh] lg:max-h-[70vh]
    object-contain drop-shadow-2xl

    /* Light mode → softer, weaker fade */
    [mask-image:linear-gradient(to_bottom,black_90%,transparent_100%)]
    [-webkit-mask-image:linear-gradient(to_bottom,black_90%,transparent_100%)]

    /* Dark mode → keep premium strong fade */
    dark:[mask-image:linear-gradient(to_bottom,black_70%,transparent_100%)]
    dark:[-webkit-mask-image:linear-gradient(to_bottom,black_70%,transparent_100%)]
  "
          />
          {/* Smoke overlay video */}
          <video
            ref={smokeVideoRef}
            src={smokeVideo}
            loop
            muted
            playsInline
            preload="auto"
            className="absolute pointer-events-none"
            style={{
              mixBlendMode: "normal",
              opacity: 0,
              objectFit: "cover",
              objectPosition: "center 75%",
            }}
          />
        </div>
      </div>
    </div>
  );
}
