"use client";

import React, { useEffect, useRef, useState, KeyboardEvent } from "react";
import * as THREE from "three";

type TerminalLine = {
  text: string;
  cls: string;
};

export default function Home() {
  const [mode, setMode] = useState<"dev" | "design">("dev");
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeNav, setActiveNav] = useState("00");
  const [termLines, setTermLines] = useState<TerminalLine[]>([]);
  const [termInputValue, setTermInputValue] = useState("");
  const [bootLogLines, setBootLogLines] = useState<{ text: string; isOk: boolean }[]>([]);
  const [isBootFinished, setIsBootFinished] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const termBodyRef = useRef<HTMLDivElement>(null);
  const termInputRef = useRef<HTMLInputElement>(null);
  const cursorDotRef = useRef<HTMLDivElement>(null);
  const cursorRingRef = useRef<HTMLDivElement>(null);
  const navIndicatorRef = useRef<HTMLSpanElement>(null);
  const modeIndicatorRef = useRef<HTMLSpanElement>(null);
  const btnDevRef = useRef<HTMLButtonElement>(null);
  const btnDesignRef = useRef<HTMLButtonElement>(null);

  // --- Background THREE.js Logic ---
  useEffect(() => {
    if (!canvasRef.current) return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canvas = canvasRef.current;
    
    const getAccentColor = () => {
      const v = getComputedStyle(document.body).getPropertyValue("--accent").trim();
      return v || (mode === "dev" ? "#00e5ff" : "#ff2f92");
    };

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0e17, 0.045);

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
    camera.position.set(0, 3.2, 9);
    camera.lookAt(0, 0, -20);

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    const planeWidth = 140;
    const planeDepth = 140;
    const waveGeo = new THREE.PlaneGeometry(planeWidth, planeDepth, 90, 90);
    waveGeo.rotateX(-Math.PI / 2);
    const basePos = waveGeo.attributes.position.array.slice();

    const waveMat = new THREE.MeshBasicMaterial({ color: getAccentColor(), wireframe: true, transparent: true, opacity: 0.25 });
    const waveMesh = new THREE.Mesh(waveGeo, waveMat);
    waveMesh.position.y = -1.8;
    scene.add(waveMesh);

    const waveMeshTop = new THREE.Mesh(waveGeo.clone(), waveMat.clone());
    waveMeshTop.material.opacity = 0.08;
    waveMeshTop.position.y = 7;
    scene.add(waveMeshTop);

    const nodeGeo = new THREE.IcosahedronGeometry(0.045, 0);
    const nodeMat = new THREE.MeshBasicMaterial({ color: getAccentColor(), transparent: true, opacity: 0.4 });
    const nodes = new THREE.Group();
    if (!prefersReduced) {
      for (let i = 0; i < 60; i++) {
        const mesh = new THREE.Mesh(nodeGeo, nodeMat);
        mesh.position.set(
          (Math.random() - 0.5) * planeWidth * 0.9,
          Math.random() * 5 - 1,
          (Math.random() - 0.5) * planeDepth * 0.9 - 20
        );
        mesh.userData.speed = 0.15 + Math.random() * 0.35;
        nodes.add(mesh);
      }
    }
    scene.add(nodes);

    let mouseX = 0, mouseY = 0;
    let targetRotX = 0, targetRotY = 0;
    let flowX = 0, flowZ = 0;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX / window.innerWidth - 0.5;
      mouseY = e.clientY / window.innerHeight - 0.5;
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    let t = 0;
    let reqId: number;

    const updateWave = (geo: THREE.BufferGeometry, time: number, flowOffsetX: number, flowOffsetZ: number) => {
      const pos = geo.attributes.position;
      const arr = pos.array;
      for (let i = 0; i < arr.length; i += 3) {
        const x = basePos[i];
        const z = basePos[i + 2];
        const y = Math.sin(x * 0.1 + z * 0.05 + time + flowOffsetX) * 0.34 +
                  Math.sin(z * 0.13 + time * 0.7 + flowOffsetZ) * 0.27 +
                  Math.sin((x + z) * 0.06 + time * 0.4) * 0.19;
        arr[i + 1] = y;
      }
      pos.needsUpdate = true;
      geo.computeVertexNormals();
    };

    const animate = () => {
      reqId = requestAnimationFrame(animate);
      if (!prefersReduced) {
        t += 0.008;
        flowX += (mouseX * 1.2 - flowX) * 0.02;
        flowZ += (mouseY * 1.2 - flowZ) * 0.02;
        updateWave(waveGeo, t, flowX, flowZ);
        updateWave(waveMeshTop.geometry, t * 0.7 + 5, flowX * 0.5, flowZ * 0.5);

        nodes.children.forEach((mesh) => {
          mesh.position.z += mesh.userData.speed * 0.05;
          if (mesh.position.z > 10) mesh.position.z = -planeDepth * 0.5;
          mesh.rotation.x += 0.01;
          mesh.rotation.y += 0.01;
        });
      }

      targetRotX += (mouseY * 0.25 - targetRotX) * 0.04;
      targetRotY += (-mouseX * 0.35 - targetRotY) * 0.04;
      camera.position.x += (mouseX * 2.2 - camera.position.x) * 0.03;
      camera.position.y += (3.2 - mouseY * 1.4 - camera.position.y) * 0.03;
      camera.rotation.x = targetRotX;
      camera.rotation.y = targetRotY;
      camera.lookAt(0, 0, -20);

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(reqId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
    };
  }, [mode]); // Re-run slightly or just let CSS variables handle the color swap

  // --- Body Mode Application ---
  useEffect(() => {
    if (mode === "dev") {
      document.body.classList.add("mode-dev");
      document.body.classList.remove("mode-design");
      document.documentElement.classList.add("mode-dev");
      document.documentElement.classList.remove("mode-design");
    } else {
      document.body.classList.add("mode-design");
      document.body.classList.remove("mode-dev");
      document.documentElement.classList.add("mode-design");
      document.documentElement.classList.remove("mode-dev");
    }
  }, [mode]);

  // --- Active Mode Indicator ---
  useEffect(() => {
    const activeBtn = mode === "dev" ? btnDevRef.current : btnDesignRef.current;
    if (activeBtn && modeIndicatorRef.current) {
      modeIndicatorRef.current.style.width = `${activeBtn.offsetWidth}px`;
      modeIndicatorRef.current.style.transform = `translateX(${activeBtn.offsetLeft}px)`;
    }
  }, [mode]);

  // --- Scroll Progress ---
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setScrollProgress(pct);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  // --- Custom Cursor ---
  useEffect(() => {
    if (!window.matchMedia("(pointer:fine)").matches) return;
    const prefersReducedCursor = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
    let ringX = mouseX, ringY = mouseY;
    let activated = false;
    let reqId: number;

    const activate = () => {
      if (activated) return;
      activated = true;
      document.body.classList.add("has-custom-cursor");
      if (cursorDotRef.current) cursorDotRef.current.style.opacity = "1";
      if (cursorRingRef.current) cursorRingRef.current.style.opacity = "1";
    };

    const handleMouseMove = (e: MouseEvent) => {
      activate();
      mouseX = e.clientX; mouseY = e.clientY;
      if (cursorDotRef.current) {
        cursorDotRef.current.style.left = `${mouseX}px`;
        cursorDotRef.current.style.top = `${mouseY}px`;
      }
      if (prefersReducedCursor && cursorRingRef.current) {
        ringX = mouseX; ringY = mouseY;
        cursorRingRef.current.style.left = `${ringX}px`;
        cursorRingRef.current.style.top = `${ringY}px`;
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    
    const raf = () => {
      if (!prefersReducedCursor && cursorRingRef.current) {
        ringX += (mouseX - ringX) * 0.18;
        ringY += (mouseY - ringY) * 0.18;
        cursorRingRef.current.style.left = `${ringX}px`;
        cursorRingRef.current.style.top = `${ringY}px`;
      }
      reqId = requestAnimationFrame(raf);
    };
    if (!prefersReducedCursor) raf();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(reqId);
    };
  }, []);

  // --- Scroll Reveal & Stat Observers ---
  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const revealEls = document.querySelectorAll(".reveal");
    
    if (prefersReduced) {
      revealEls.forEach((el) => el.classList.add("in"));
    } else {
      const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            revealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15, rootMargin: "0px 0px -60px 0px" });
      revealEls.forEach((el) => revealObserver.observe(el));
      
      return () => revealObserver.disconnect();
    }
  }, []);

  // --- Nav Active Link Logic ---
  useEffect(() => {
    const sections = document.querySelectorAll("section[id]");
    const navObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute("id");
          const link = document.querySelector(`.nav-links a[href="#${id}"]`) as HTMLAnchorElement;
          if (link) {
            setActiveNav(link.getAttribute("data-idx") || "00");
            if (navIndicatorRef.current) {
              navIndicatorRef.current.style.opacity = "1";
              navIndicatorRef.current.style.width = `${link.offsetWidth}px`;
              navIndicatorRef.current.style.transform = `translateX(${link.offsetLeft}px)`;
            }
          }
        }
      });
    }, { rootMargin: "-45% 0px -45% 0px", threshold: 0 });
    
    sections.forEach((sec) => navObserver.observe(sec));
    return () => navObserver.disconnect();
  }, []);

  // --- Terminal Commands ---
  const commands: Record<string, () => string> = {
    help: () => `Available commands:<br><b>whoami</b>       — quick summary<br><b>education</b>    — degree & GPA<br><b>experience</b>   — work history<br><b>skills</b>       — tech & design stack<br><b>projects</b>     — featured builds<br><b>contact</b>      — how to reach me<br><b>clear</b>        — clear the terminal`,
    whoami: () => "Saif Ali — CS student, Full-Stack Developer & UI/UX Designer based in Jakarta, Indonesia.",
    education: () => `B.Sc. Computer Science (Informatics), Universitas Pembangunan Nasional "Veteran" Jakarta — 2024–2028 (expected). GPA: <b>3.90/4.00</b>.`,
    experience: () => `<b>UI/UX Designer</b> @ KSM Multimedia (Mar 2025 – Nov 2025)<br><b>Head of Public Relations</b> @ HIMA Informatika (Jan 2025 – Jan 2026)`,
    skills: () => "Languages: HTML/CSS, JS/TS, Java, Kotlin, Python, React. Backend: Node, Express, Next.js, FastAPI. DB: MySQL, PostgreSQL, MongoDB, Neo4j. Design: Figma, Maze.",
    projects: () => `1. Community-Based Marketplace App — Android, Kotlin, Supabase<br>2. AI Infrastructure Reporting System — React, Flutter, Leaflet.js`,
    contact: () => "Email: saifalialhaddad2@gmail.com · GitHub: github.com/saifalihdd · LinkedIn: linkedin.com/in/saifalihdd · Instagram: instagram.com/saifalihdd",
    sudo: () => "Permission denied: guest is not in the sudoers file. This incident will be reported.",
  };

  const handleTerminalSubmit = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const raw = termInputValue.trim();
      if (!raw) return;
      const newLines = [...termLines, { text: `<span class="prefix" style="color:var(--success)">guest@saif:~$</span> ${raw}`, cls: "cmd" }];
      
      const cmd = raw.toLowerCase();
      if (cmd === "clear") {
        setTermLines([]);
      } else if (commands[cmd]) {
        const out = commands[cmd]();
        setTermLines([...newLines, { text: out, cls: "out" }]);
      } else {
        setTermLines([...newLines, { text: `command not found: ${raw} — type <b>help</b> for a list of commands.`, cls: "err" }]);
      }
      setTermInputValue("");
      setTimeout(() => {
        if (termBodyRef.current) termBodyRef.current.scrollTop = termBodyRef.current.scrollHeight;
      }, 50);
    }
  };

  const basePath = "/Portfolio";

  return (
    <>
      <canvas id="bg-canvas" ref={canvasRef}></canvas>

      <div className="cursor-dot" id="cursorDot" ref={cursorDotRef}></div>
      <div className="cursor-ring" id="cursorRing" ref={cursorRingRef}></div>

      <div id="scrollProgress" style={{ width: `${scrollProgress}%` }}></div>

      <nav>
        <div className="nav-inner">
          <div className="nav-links">
            <span className="nav-indicator" id="navIndicator" ref={navIndicatorRef}></span>
            {["ABOUT", "EXPERIENCE", "PROJECTS", "SKILLS", "TERMINAL", "CONTACT"].map((item, i) => (
              <a 
                key={item} 
                href={`#${item.toLowerCase()}`} 
                data-idx={`0${i}`} 
                className={activeNav === `0${i}` ? "active" : ""}
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </nav>

      <section id="hero" className="hero">
        <div className="wrap">
          <div className="boot-log mono" id="bootLog">
             {/* Simulated Boot sequence can be added here or statically written as below for React safety */}
             <div style={{opacity: 1}}><span className="ok">[OK]</span> Loading profile: Computer Science @ UPN Veteran Jakarta...</div>
             <div style={{opacity: 1}}><span className="ok">[OK]</span> Mounting skills: Full-Stack + UI/UX...</div>
             <div style={{opacity: 1}}><span className="ok">[OK]</span> Compiling projects...</div>
             <div style={{opacity: 1}}><span className="ok">[OK]</span> Boot sequence complete.</div>
             <div><span className="boot-line-cursor"></span></div>
          </div>

          <h1 className="hero-name">Saif Ali<span className="accent">.</span></h1>
          <p className="hero-role mono">
            Computer Science student turning <span className="cursor-role">{mode === "dev" ? "production code" : "usable interfaces"}</span> into products —
            building end to end, from Figma wireframe to shipped app.
          </p>

          <div className="mode-toggle">
            <span className="mode-indicator" id="modeIndicator" ref={modeIndicatorRef}></span>
            <button ref={btnDevRef} id="btnDev" className={mode === "dev" ? "active" : ""} onClick={() => setMode("dev")}>[ DEV_MODE ]</button>
            <div className="divider"></div>
            <button ref={btnDesignRef} id="btnDesign" className={mode === "design" ? "active" : ""} onClick={() => setMode("design")}>[ DESIGN_MODE ]</button>
          </div>
          <div className="mode-caption mono" id="modeCaption">
            &gt; booted into {mode === "dev" ? "developer profile — engineering-first view active." : "designer profile — research & UX view active."}
          </div>

          <div className="hero-cta">
            <a href="#projects" className="btn btn-primary">View projects →</a>
            <a href="#terminal" className="btn btn-ghost">Open terminal_</a>
          </div>
        </div>
      </section>

      <section id="about">
        <div className="wrap about-grid">
          <div className="reveal" data-tag="[LOADING] about.mod">
            <div className="eyebrow">About</div>
            <h2 className="section-title">Building things that work<br />and things that feel right.</h2>
            <div className="bio">
              <p>I&apos;m a Computer Science student at <b>Universitas Pembangunan Nasional &quot;Veteran&quot; Jakarta</b>, currently maintaining a 3.90/4.00 GPA while shipping full-stack and mobile products alongside UI/UX design work.</p>
              <p>My work sits at the intersection of two disciplines: I design interfaces in Figma with real user research behind them, then build the systems that power those interfaces — from Android apps with real-time data, to React dashboards mapping infrastructure damage across a city.</p>
              <p>Outside of coursework, I lead public relations for my university&apos;s Informatics student association, coordinating external communication and media strategy for the whole division.</p>
            </div>
            <div className="stat-row">
              <div className="stat"><div className="num" data-value="3.90" data-decimals="2">3.90</div><div className="label">GPA / 4.00</div></div>
              <div className="stat"><div className="num" data-value="2" data-decimals="0">2</div><div className="label">Shipped Products</div></div>
              <div className="stat"><div className="num" data-value="45" data-decimals="0" data-suffix="%">45%</div><div className="label">PR Engagement Growth</div></div>
            </div>
          </div>
          <div className="edu-card glass-surface reveal" style={{ '--d': 2 } as React.CSSProperties}>
            <span className="tag">Education</span>
            <h3>B.Sc. Computer Science</h3>
            <div className="school">Informatics — Universitas Pembangunan Nasional &quot;Veteran&quot; Jakarta</div>
            <div className="meta"><span>2024 – 2028 (Expected)</span> <b>GPA 3.90/4.00</b></div>
          </div>
        </div>
      </section>

      <section id="experience">
        <div className="wrap">
          <div className="eyebrow reveal" data-tag="[LOADING] experience.mod">01 · Experience</div>
          <h2 className="section-title reveal" style={{ '--d': 1 } as React.CSSProperties}>Where I&apos;ve worked</h2>
          <div className="timeline">
            <div className="exp-item glass-surface reveal" style={{ '--d': 2 } as React.CSSProperties} data-track="design">
              <div className="exp-date mono">Mar 2025 – Nov 2025</div>
              <div>
                <div className="exp-role">UI/UX Designer</div>
                <div className="exp-org mono">KSM Multimedia — UPN &quot;Veteran&quot; Jakarta</div>
                <ul>
                  <li>Conducted user research and designed wireframes and interactive prototypes in Figma for digital product development projects.</li>
                  <li>Collaborated with multidisciplinary teams to create user-centered interfaces and improve overall usability.</li>
                </ul>
              </div>
            </div>
            <div className="exp-item glass-surface reveal" style={{ '--d': 3 } as React.CSSProperties} data-track="dev">
              <div className="exp-date mono">Jan 2025 – Jan 2026</div>
              <div>
                <div className="exp-role">Head of Public Relations</div>
                <div className="exp-org mono">Himpunan Mahasiswa Informatika — UPN &quot;Veteran&quot; Jakarta</div>
                <ul>
                  <li>Led and coordinated the public relations division, overseeing external communication, media relations and digital branding strategy.</li>
                  <li>Managed external partnerships and media campaigns, growing social media engagement by 45% as primary point of contact for external stakeholders.</li>
                  <li>Developed strategic communication and crisis-management skills, aligning PR campaigns with the association&apos;s core objectives.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="projects">
        <div className="wrap">
          <div className="eyebrow reveal" data-tag="[LOADING] projects.mod">02 · Projects</div>
          <h2 className="section-title reveal" style={{ '--d': 1 } as React.CSSProperties}>Featured work</h2>
          <div className="project-grid">
            <div className="project-card glass-surface reveal" style={{ '--d': 2 } as React.CSSProperties}>
              <span className="role">Core Feature Developer · May – Jun 2026</span>
              <h3>Community-Based Marketplace App</h3>
              <img 
                src={`${basePath}/projects/circlo.png`} 
                alt="Community-Based Marketplace App preview" 
                className="project-image" 
                width={640} 
                height={360} 
              />
              <p>Android marketplace app built around a 3-stage donation flow and a structured state machine for item status transitions. Developed the highest number of features on the team — 11 core functionalities in total, including a real-time chat system over Supabase Realtime WebSocket.</p>
              <div className="stack-tags">
                <span>Java</span><span>Kotlin</span><span>Supabase</span><span>RecyclerView</span><span>REST API</span>
              </div>
              <a className="proj-link" href="https://github.com/exfRiendd/circlo" target="_blank" rel="noopener noreferrer">View repository →</a>
            </div>
            <div className="project-card glass-surface reveal" style={{ '--d': 3 } as React.CSSProperties}>
              <span className="role">Frontend Developer · Jun 2026</span>
              <h3>AI Infrastructure Reporting System</h3>
              <img
                src={`${basePath}/projects/infravision.png`} 
                alt="AI Infrastructure Reporting System preview" 
                className="project-image" 
                width={640} 
                height={360} 
              />
              <p>Web platform for reporting infrastructure damage with an interactive GIS map — marker clustering, severity heatmaps and spatial filtering built on Leaflet.js and OpenStreetMap. Includes a companion Flutter app and role-based dashboards for citizens, admins and maintenance teams.</p>
              <div className="stack-tags">
                <span>React.js</span><span>Flutter</span><span>Tailwind</span><span>Leaflet.js</span><span>Axios</span>
              </div>
              <a className="proj-link" href="https://infravision-jynuumn4r-anggasspms-projects.vercel.app" target="_blank" rel="noopener noreferrer">View website →</a>
            </div>
            <div className="project-card glass-surface reveal" style={{ '--d': 4 } as React.CSSProperties}>
              <span className="role">Game Developer · Dec 2025</span>
              <h3>Night City Racing Game</h3>
              <img 
                src={`${basePath}/projects/midnightrush.png`} 
                alt="Night city racing game preview" 
                className="project-image" 
                width={640} 
                height={360} 
              />
              <p>Racing game built in Unity set in a sprawling city map at night, using third-party assets for environment and vehicle models. Features multiple car classes, each with distinct handling, top speed, and acceleration specs for varied gameplay styles.</p>
              <div className="stack-tags">
                <span>Unity</span><span>C#</span><span>Asset Store</span><span>Vehicle Physics</span>
              </div>
              <a className="proj-link" href="https://github.com/saifalihdd/midnight-rush">View repository →</a>
            </div>
          </div>
        </div>
      </section>

      <section id="skills">
        <div className="wrap">
          <div className="eyebrow reveal" data-tag="[LOADING] skills.mod">03 · Skills</div>
          <h2 className="section-title reveal" style={{ '--d': 1 } as React.CSSProperties}>Current toolkit</h2>
          <div className="skills-grid">
            <div className="skill-group reveal" style={{ '--d': 2 } as React.CSSProperties}>
              <h4>Languages</h4>
              <div className="skill-tags" data-track="dev">
                <span>HTML/CSS</span><span>JavaScript</span><span>TypeScript</span><span>Java</span><span>Kotlin</span><span>Python</span><span>React.js</span><span>React Native</span>
              </div>
            </div>
            <div className="skill-group reveal" style={{ '--d': 3 } as React.CSSProperties}>
              <h4>Frameworks &amp; Backend</h4>
              <div className="skill-tags" data-track="dev">
                <span>Node.js</span><span>Express.js</span><span>Next.js</span><span>FastAPI</span><span>Tailwind CSS</span><span>Supabase</span><span>Firebase</span>
              </div>
            </div>
            <div className="skill-group reveal" style={{ '--d': 4 } as React.CSSProperties}>
              <h4>Databases</h4>
              <div className="skill-tags" data-track="dev">
                <span>MySQL</span><span>PostgreSQL</span><span>SQLite</span><span>MongoDB</span><span>Neo4j</span><span>Qdrant</span>
              </div>
            </div>
            <div className="skill-group reveal" style={{ '--d': 5 } as React.CSSProperties}>
              <h4>Design &amp; Tools</h4>
              <div className="skill-tags" data-track="design">
                <span>Figma</span><span>Maze</span><span>Git</span><span>GitHub</span><span>Notion</span><span>Postman</span><span>Docker</span><span>Vercel</span><span>Google Cloud</span>
              </div>
            </div>
          </div>

          <div className="gh-chart-card glass-surface reveal" style={{ '--d': 6 } as React.CSSProperties}>
            <h4>&gt; Open-Source Contributions</h4>
            {/* Using native img for straightforward github chart loading to avoid next/image domain configurations in next.config.js */}
            <img src="https://ghchart.rshah.org/00e5ff/saifalihdd" alt="GitHub Contributions" loading="lazy" />
            <a className="gh-link mono" href="https://github.com/saifalihdd" target="_blank" rel="noopener noreferrer">⌥ github.com/saifalihdd →</a>
          </div>
        </div>
      </section>

      <section id="terminal" onClick={() => termInputRef.current?.focus()}>
        <div className="wrap">
          <div className="eyebrow reveal" data-tag="[LOADING] terminal.mod">04 · System Terminal</div>
          <h2 className="section-title reveal" style={{ '--d': 1 } as React.CSSProperties}>Interact directly</h2>
          <div className="terminal-window glass-surface reveal" style={{ '--d': 2 } as React.CSSProperties}>
            <div className="terminal-bar">
              <span className="dot r"></span><span className="dot y"></span><span className="dot g"></span>
              <span className="terminal-title">saif@portfolio: ~</span>
            </div>
            <div className="terminal-body" id="termBody" ref={termBodyRef}>
              <div className="term-boot">
                <pre className="ascii">{` ████  ███  █████ █████    ███  █     █████
█     █   █   █   █       █   █ █       █  
█     █   █   █   █       █   █ █       █  
 ███  █████   █   ████    █████ █       █  
    █ █   █   █   █       █   █ █       █  
    █ █   █   █   █       █   █ █       █  
████  █   █ █████ █       █   █ █████ █████`}</pre>
                <div className="os-line">SAIF ALI OS v1.0 — Full-Stack Developer &amp; UI/UX Designer</div>
                <div className="copy-line">(c) 2026 Saif Ali. All rights reserved.</div>
                <div className="help-line">Type <b>help</b> to see available commands.</div>
              </div>
              
              {termLines.map((line, idx) => (
                <div key={idx} className={`term-line ${line.cls}`} dangerouslySetInnerHTML={{ __html: line.text }} />
              ))}

              <div className="term-input-row">
                <span className="prefix">guest@saif:~$</span>
                <input 
                  type="text" 
                  id="termInput" 
                  ref={termInputRef}
                  autoComplete="off" 
                  spellCheck="false" 
                  value={termInputValue}
                  onChange={(e) => setTermInputValue(e.target.value)}
                  onKeyDown={handleTerminalSubmit}
                />
              </div>
            </div>
          </div>
          <div className="terminal-hint">Try: whoami · education · experience · skills · projects · contact · clear</div>
        </div>
      </section>

      <section id="contact" style={{ borderBottom: "none" }}>
        <div className="wrap contact-inner">
          <div className="eyebrow reveal" data-tag="[LOADING] contact.mod">05 · Get in touch</div>
          <h2 className="contact-title reveal" style={{ '--d': 1 } as React.CSSProperties}>Open to internships, collaborations, and interesting problems.</h2>
          <p className="reveal" style={{ '--d': 2, color: 'var(--text-dim)', maxWidth: '520px' } as React.CSSProperties}>Whether it&apos;s a product to design, a system to build, or just a good conversation about either — my inbox is open.</p>
          <div className="contact-links reveal" style={{ '--d': 3 } as React.CSSProperties}>
            <a href="mailto:saifalialhaddad2@gmail.com">✉ saifalialhaddad2@gmail.com</a>
            <a href="https://github.com/saifalihdd" target="_blank" rel="noopener noreferrer">⌥ github.com/saifalihdd</a>
            <a href="https://www.linkedin.com/in/saifalihdd/" target="_blank" rel="noopener noreferrer">in linkedin.com/in/saifalihdd</a>
            <a href="https://www.instagram.com/saifalihdd" target="_blank" rel="noopener noreferrer">◎ instagram.com/saifalihdd</a>
          </div>
        </div>
      </section>

      <footer>© 2026 — SAIF ALI. Built with Next.js & React.</footer>
    </>
  );
}