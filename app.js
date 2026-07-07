document.addEventListener('DOMContentLoaded', () => {

    // Detecta si el dispositivo puede realmente "hacer hover" con precisión
    // (mouse/trackpad) vs. touch. Los efectos de mouse (partículas, glow,
    // tilt 3D, botones magnéticos) no tienen sentido en touch y, peor,
    // pueden dejar tarjetas/botones con transform "atascado" tras un tap,
    // porque en touch no siempre llega el evento mouseleave que los resetea.
    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ===================== QUANTUM NEURAL NET BACKGROUND =====================
    const canvas = document.getElementById('particle-canvas');
    const ctx = canvas.getContext('2d');
    let mouse = { x: -9999, y: -9999 };
    let shockwaves = [];

    function resizeCanvas() { 
        canvas.width = canvas.offsetWidth; 
        canvas.height = canvas.offsetHeight; 
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    document.addEventListener('mousemove', (e) => { 
        mouse.x = e.clientX + window.scrollX; 
        mouse.y = e.clientY + window.scrollY; 
    });

    // Add quantum shockwave on click
    document.addEventListener('click', (e) => {
        const x = e.clientX + window.scrollX;
        const y = e.clientY + window.scrollY;
        shockwaves.push({
            x: x,
            y: y,
            radius: 0,
            maxRadius: 200,
            speed: 5,
            alpha: 0.8
        });
    });

    const PARTICLE_COUNT = 70;
    const particles = [];
    class Particle {
        constructor() { this.reset(); }
        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.r = Math.random() * 2 + 0.5;
            this.baseVx = (Math.random() - 0.5) * 0.4;
            this.baseVy = (Math.random() - 0.5) * 0.4;
            this.vx = this.baseVx;
            this.vy = this.baseVy;
            this.alpha = Math.random() * 0.5 + 0.25;
            this.color = Math.random() > 0.5 ? '0, 242, 254' : '0, 245, 160'; // Cyber Cyan or Cyber Mint
        }
        update() {
            // Repel from mouse
            const dx = this.x - mouse.x;
            const dy = this.y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 0 && dist < 180) {
                const force = (180 - dist) / 180 * 1.2;
                this.vx += (dx / dist) * force * 0.15;
                this.vy += (dy / dist) * force * 0.15;
            }

            // Interact with click shockwaves
            shockwaves.forEach(sw => {
                const sdx = this.x - sw.x;
                const sdy = this.y - sw.y;
                const sdist = Math.sqrt(sdx * sdx + sdy * sdy);
                if (sdist > 0 && Math.abs(sdist - sw.radius) < 20) {
                    const force = 6 * sw.alpha;
                    this.vx += (sdx / sdist) * force;
                    this.vy += (sdy / sdist) * force;
                }
            });

            // Return to base speeds
            this.vx += (this.baseVx - this.vx) * 0.04;
            this.vy += (this.baseVy - this.vy) * 0.04;

            this.x += this.vx;
            this.y += this.vy;

            if (this.x < -20 || this.x > canvas.width + 20 || this.y < -20 || this.y > canvas.height + 20) this.reset();
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${this.color}, ${this.alpha})`;
            ctx.fill();
        }
    }
    for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(new Particle());

    function drawConnections() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 140) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    // Network connection colors
                    const grad = ctx.createLinearGradient(particles[i].x, particles[i].y, particles[j].x, particles[j].y);
                    grad.addColorStop(0, `rgba(${particles[i].color}, ${0.18 * (1 - dist / 140)})`);
                    grad.addColorStop(1, `rgba(${particles[j].color}, ${0.18 * (1 - dist / 140)})`);
                    ctx.strokeStyle = grad;
                    ctx.lineWidth = 0.85;
                    ctx.stroke();
                }
            }
        }
    }

    function updateShockwaves() {
        // Antes se usaba forEach + splice(idx,1) mientras se iteraba: al
        // borrar un elemento a mitad de la iteración, el siguiente se
        // recorre "saltado" porque el arreglo se recorta pero forEach
        // sigue avanzando el índice como si nada. Iterar hacia atrás evita
        // el problema porque los índices ya visitados no se ven afectados
        // por el splice de los que vienen después.
        for (let i = shockwaves.length - 1; i >= 0; i--) {
            const sw = shockwaves[i];
            sw.radius += sw.speed;
            sw.alpha = 1 - (sw.radius / sw.maxRadius);

            // Draw visual pulse wave
            ctx.beginPath();
            ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(0, 242, 254, ${sw.alpha * 0.45})`;
            ctx.lineWidth = 2.5;
            ctx.stroke();

            if (sw.radius >= sw.maxRadius) {
                shockwaves.splice(i, 1);
            }
        }
    }

    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => { p.update(); p.draw(); });
        drawConnections();
        updateShockwaves();
        requestAnimationFrame(animateParticles);
    }

    // En touch no hay cursor real que repela partículas, y en
    // "reduced motion" el usuario pidió explícitamente menos animación:
    // en ambos casos no vale la pena gastar batería/CPU en este loop.
    if (canHover && !prefersReducedMotion) {
        animateParticles();
    } else {
        canvas.style.display = 'none';
    }

    // ===================== CURSOR GLOW =====================
    const cursorGlow = document.getElementById('cursor-glow');
    if (canHover) {
        document.addEventListener('mousemove', (e) => {
            requestAnimationFrame(() => {
                cursorGlow.style.left = `${e.clientX}px`;
                cursorGlow.style.top = `${e.clientY}px`;
            });
        });

        // Grow the glow when hovering interactive sections
        const interactiveElements = document.querySelectorAll('.feature-card, .team-card, .pricing-card, .signup-card');
        interactiveElements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursorGlow.style.width = '700px';
                cursorGlow.style.height = '700px';
                cursorGlow.style.background = 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.05) 40%, transparent 65%)';
            });
            el.addEventListener('mouseleave', () => {
                cursorGlow.style.width = '500px';
                cursorGlow.style.height = '500px';
                cursorGlow.style.background = 'radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, rgba(139, 92, 246, 0.04) 40%, transparent 65%)';
            });
        });
    } else if (cursorGlow) {
        // Sin mouse real no hay nada que "seguir": antes se quedaba fijo
        // en la esquina superior izquierda (posición inicial) en móvil.
        cursorGlow.style.display = 'none';
    }

    // ===================== NAVBAR =====================
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 50);
    });

    // Mobile Menu
    const mobileMenu = document.getElementById('mobile-menu');
    const navMenu = document.querySelector('.nav-menu');
    mobileMenu.addEventListener('click', () => {
        mobileMenu.classList.toggle('active');
        navMenu.classList.toggle('active');
    });
    document.querySelectorAll('.nav-menu li a').forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    // Smooth scroll
    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', e => {
            const target = document.querySelector(a.getAttribute('href'));
            if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
        });
    });

    // ===================== SCROLL REVEAL =====================
    const scrollElements = document.querySelectorAll('.fade-in-scroll');
    const revealObserver = new IntersectionObserver(entries => {
        entries.forEach(e => { 
            if (e.isIntersecting) {
                e.target.classList.add('visible'); 
                // Trigger text scramble if it is a title
                if (e.target.classList.contains('section-title') && !e.target.dataset.scrambled) {
                    scrambleText(e.target);
                    e.target.dataset.scrambled = "true";
                }
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });
    scrollElements.forEach(el => revealObserver.observe(el));

    // ===================== DYNAMIC PLATFORM SIMULATOR =====================
    const sidebarItems = document.querySelectorAll('.sidebar-item');
    const demoContent = document.querySelector('.demo-content');

    const demoTemplates = {
        '📊 dashboard': `
            <div class="demo-stat-row">
                <div class="demo-stat-card">
                    <span class="demo-stat-number">14,312</span>
                    <span class="demo-stat-label">Nodos Activos</span>
                </div>
                <div class="demo-stat-card">
                    <span class="demo-stat-number">2.7M</span>
                    <span class="demo-stat-label">Eventos / seg</span>
                </div>
                <div class="demo-stat-card">
                    <span class="demo-stat-number">99.97%</span>
                    <span class="demo-stat-label">Uptime</span>
                </div>
            </div>
            <div class="demo-chart-area">
                <div class="chart-bar-group">
                    <div class="chart-bar animated" style="--h: 35%"></div>
                    <div class="chart-bar animated" style="--h: 60%"></div>
                    <div class="chart-bar animated" style="--h: 45%"></div>
                    <div class="chart-bar animated" style="--h: 80%"></div>
                    <div class="chart-bar animated" style="--h: 55%"></div>
                    <div class="chart-bar animated" style="--h: 90%"></div>
                    <div class="chart-bar animated" style="--h: 70%"></div>
                    <div class="chart-bar animated" style="--h: 50%"></div>
                </div>
            </div>
        `,
        '🧠 modelos': `
            <div class="demo-model-list">
                <div class="demo-model-item">
                    <div class="demo-model-info">
                        <span class="demo-model-name">🧠 nexus-llm-v4</span>
                        <span class="demo-model-meta">Latencia: 38ms | Precisión: 98.4%</span>
                    </div>
                    <span class="demo-status-badge active">Activo</span>
                </div>
                <div class="demo-model-item">
                    <div class="demo-model-info">
                        <span class="demo-model-name">🖼️ nexus-vision-pro</span>
                        <span class="demo-model-meta">Entrenando con imágenes corporativas...</span>
                    </div>
                    <span class="demo-status-badge training">Entrenando (72%)</span>
                </div>
                <div class="demo-model-item">
                    <div class="demo-model-info">
                        <span class="demo-model-name">🎙️ nexus-voice-medium</span>
                        <span class="demo-model-meta">Generación TTS en tiempo real</span>
                    </div>
                    <span class="demo-status-badge standby">Espera</span>
                </div>
            </div>
        `,
        '📁 datasets': `
            <div class="demo-dataset-list">
                <div class="demo-dataset-item">
                    <div class="demo-dataset-details">
                        <span class="demo-dataset-name">📁 customer_interactions_v2.json</span>
                        <span class="demo-dataset-size">Tamaño: 245.8 MB | Registros: 1.2M</span>
                    </div>
                    <button class="demo-dataset-btn">Sincronizar</button>
                </div>
                <div class="demo-dataset-item">
                    <div class="demo-dataset-details">
                        <span class="demo-dataset-name">📊 financial_forecast_2026.csv</span>
                        <span class="demo-dataset-size">Tamaño: 48.2 MB | Registros: 420K</span>
                    </div>
                    <button class="demo-dataset-btn">Sincronizar</button>
                </div>
                <div class="demo-dataset-item">
                    <div class="demo-dataset-details">
                        <span class="demo-dataset-name">📝 user_feedback_sentiments.parquet</span>
                        <span class="demo-dataset-size">Tamaño: 89.1 MB | Registros: 780K</span>
                    </div>
                    <button class="demo-dataset-btn">Sincronizar</button>
                </div>
            </div>
        `,
        '⚙️ config': `
            <div class="demo-config-list">
                <div class="demo-config-item">
                    <div class="demo-config-info">
                        <span class="demo-config-title">Auto-escalado Inteligente</span>
                        <span class="demo-config-desc">Escalar recursos automáticamente según picos de demanda.</span>
                    </div>
                    <label class="demo-switch">
                        <input type="checkbox" checked>
                        <span class="demo-slider"></span>
                    </label>
                </div>
                <div class="demo-config-item">
                    <div class="demo-config-info">
                        <span class="demo-config-title">Compresión de Contexto GPU</span>
                        <span class="demo-config-desc">Optimiza el uso de VRAM para inferencia de modelos pesados.</span>
                    </div>
                    <label class="demo-switch">
                        <input type="checkbox" checked>
                        <span class="demo-slider"></span>
                    </label>
                </div>
                <div class="demo-config-item">
                    <div class="demo-config-info">
                        <span class="demo-config-title">Modo de Ahorro de API</span>
                        <span class="demo-config-desc">Habilita caché local para ahorrar costos en tokens repetidos.</span>
                    </div>
                    <label class="demo-switch">
                        <input type="checkbox">
                        <span class="demo-slider"></span>
                    </label>
                </div>
            </div>
        `,
        '📈 reportes': `
            <div class="demo-reports-list">
                <div class="demo-report-card">
                    <div class="demo-report-header">
                        <span class="demo-report-title">Análisis de Latencia Semanal</span>
                        <span class="demo-report-time">Hace 2 horas</span>
                    </div>
                    <p class="demo-report-summary">La latencia media global bajó a 34ms (-8.2%). El servidor regional en San Pablo, LATAM, completó la integración Edge con éxito.</p>
                </div>
                <div class="demo-report-card">
                    <div class="demo-report-header">
                        <span class="demo-report-title">Auditoría de Tokens Consumidos</span>
                        <span class="demo-report-time">Ayer</span>
                    </div>
                    <p class="demo-report-summary">Ahorro de $1,420 USD gracias al nuevo algoritmo de caché. Total procesado: 48.2M tokens.</p>
                </div>
            </div>
        `
    };

    sidebarItems.forEach(item => {
        item.style.cursor = 'pointer';
        item.addEventListener('click', () => {
            if (item.classList.contains('active')) return;
            
            // Highlight active sidebar item
            sidebarItems.forEach(sib => sib.classList.remove('active'));
            item.classList.add('active');
            
            // Fade out
            demoContent.classList.add('fade-out');
            
            setTimeout(() => {
                const key = item.innerText.toLowerCase().trim();
                if (demoTemplates[key]) {
                    demoContent.innerHTML = demoTemplates[key];
                    
                    // Bind event listeners or trigger animations if necessary inside templates
                    if (key === '📊 dashboard') {
                        // Re-trigger bar animations inside newly loaded dashboard template
                        const newBars = demoContent.querySelectorAll('.chart-bar');
                        newBars.forEach((bar) => {
                            bar.style.transform = 'scaleY(0)';
                            setTimeout(() => {
                                bar.classList.add('animated');
                                bar.style.transform = '';
                            }, 50);
                        });
                    } else if (key === '📁 datasets') {
                        // Interactive button states
                        const syncBtns = demoContent.querySelectorAll('.demo-dataset-btn');
                        syncBtns.forEach(btn => {
                            btn.addEventListener('click', () => {
                                btn.innerText = 'Sincronizando...';
                                btn.style.background = 'rgba(234,179,8,0.1)';
                                btn.style.color = '#fbbf24';
                                btn.style.borderColor = 'rgba(234,179,8,0.3)';
                                setTimeout(() => {
                                    btn.innerText = 'Completado ✓';
                                    btn.style.background = 'rgba(34,197,94,0.1)';
                                    btn.style.color = '#22c55e';
                                    btn.style.borderColor = 'rgba(34,197,94,0.3)';
                                }, 1500);
                            });
                        });
                    }
                }
                
                // Fade in
                demoContent.classList.remove('fade-out');
            }, 250);
        });
    });

    // ===================== CHART BARS SCROLL TRIGGER =====================
    const chartBars = document.querySelectorAll('.chart-bar');
    const chartObserver = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                e.target.classList.add('animated');
                chartObserver.unobserve(e.target);
            }
        });
    }, { threshold: 0.3 });
    chartBars.forEach(bar => chartObserver.observe(bar));

    // ===================== COUNTER ANIMATION (spring easing) =====================
    function animateCounter(el, target) {
        let start = 0;
        const duration = 2000;
        const step = timestamp => {
            if (!start) start = timestamp;
            const progress = Math.min((timestamp - start) / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 4);
            el.textContent = Math.floor(ease * target).toLocaleString();
            if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }
    const counterObserver = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                const target = parseInt(e.target.dataset.count);
                animateCounter(e.target, target);
                counterObserver.unobserve(e.target);
            }
        });
    }, { threshold: 0.5 });
    document.querySelectorAll('[data-count]').forEach(el => counterObserver.observe(el));

    // ===================== PARALLAX on Hero Image =====================
    const heroImg = document.querySelector('.hero-img');
    const glowOrb = document.querySelector('.glow-orb');
    
    if (heroImg) {
        window.addEventListener('scroll', () => {
            const scrollY = window.scrollY;
            const speed = 0.12;
            if (scrollY < window.innerHeight) {
                heroImg.style.transform = `translateY(${scrollY * speed}px)`;
                if (glowOrb) glowOrb.style.transform = `translate(-50%, calc(-50% + ${scrollY * speed * 0.5}px))`;
            }
        });
    }

    // ===================== HOLOGRAPHIC 3D TILT & GLARE EFFECT =====================
    // Solo tiene sentido con mouse: en touch, "mouseleave" no siempre
    // llega tras un tap, así que la tarjeta podía quedar inclinada/
    // desplazada para siempre hasta el próximo toque en otro lado.
    if (canHover) {
        const tiltCards = document.querySelectorAll('.feature-card, .team-card, .pricing-card, .hero-img');
        tiltCards.forEach(card => {
            card.classList.add('glare-card');

            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;

                // Calculate tilt
                const rotateX = ((y - centerY) / centerY) * -5;
                const rotateY = ((x - centerX) / centerX) * 5;

                // Apply tilt & custom properties for reflection mapping
                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-10px) scale(1.02)`;
                card.style.setProperty('--glare-x', `${x}px`);
                card.style.setProperty('--glare-y', `${y}px`);
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = '';
            });
        });
    }

    // ===================== MAGNETIC BUTTONS =====================
    if (canHover) {
        const magneticBtns = document.querySelectorAll('.btn');
        magneticBtns.forEach(btn => {
            btn.addEventListener('mousemove', (e) => {
                const rect = btn.getBoundingClientRect();
                // Calculate vector distance from center
                const cx = rect.left + rect.width / 2;
                const cy = rect.top + rect.height / 2;
                const dx = e.clientX - cx;
                const dy = e.clientY - cy;

                // Pull the button towards cursor coordinates
                btn.style.transform = `translate(${dx * 0.3}px, ${dy * 0.3}px) scale(1.04)`;
            });

            btn.addEventListener('mouseleave', () => {
                btn.style.transform = '';
            });
        });
    }

    // ===================== TEXT DECRYPTION SCRAMBLER =====================
    function scrambleText(element) {
        // Antes se guardaba solo innerText y, al terminar, se restauraba
        // con element.innerText = originalText. Eso funciona para texto
        // plano, pero el <h1> del hero tiene un <br> y un
        // <span class="gradient-text"> dentro: al restaurar como texto
        // plano se perdía el salto de línea y el degradado de color para
        // siempre después de la animación. Ahora se guarda también el
        // HTML original y se restaura al final.
        const originalHTML = element.innerHTML;
        const originalText = element.innerText;

        if (prefersReducedMotion) {
            element.innerHTML = originalHTML;
            return;
        }

        const chars = '!<>-_\\/[]{}—=+*^?#________';
        let frame = 0;
        const queue = [];
        
        for (let i = 0; i < originalText.length; i++) {
            const from = '';
            const to = originalText[i];
            const start = Math.floor(Math.random() * 15);
            const end = start + Math.floor(Math.random() * 25);
            queue.push({ from, to, start, end, char: '' });
        }
        
        function update() {
            let output = '';
            let complete = 0;
            
            for (let i = 0; i < queue.length; i++) {
                let { to, start, end, char } = queue[i];
                if (frame >= end) {
                    complete++;
                    output += to;
                } else if (frame >= start) {
                    if (!char || Math.random() < 0.28) {
                        char = chars[Math.floor(Math.random() * chars.length)];
                        queue[i].char = char;
                    }
                    output += `<span class="scramble-char">${char}</span>`;
                } else {
                    output += '';
                }
            }
            
            element.innerHTML = output;
            
            if (complete === queue.length) {
                element.innerHTML = originalHTML;
            } else {
                frame++;
                requestAnimationFrame(update);
            }
        }
        
        update();
    }
    
    // Scramble Hero Title on Load
    const heroH1 = document.querySelector('.hero-content h1');
    if (heroH1) {
        setTimeout(() => scrambleText(heroH1), 400);
    }
    const heroBadge = document.querySelector('.badge');
    if (heroBadge) {
        setTimeout(() => scrambleText(heroBadge), 100);
    }

    // ===================== FORM / MODAL =====================
    const signupForm = document.getElementById('signup-form');
    const modal = document.getElementById('success-modal');

    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            modal.classList.add('active');
            signupForm.reset();
        });
    }

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('active');
        });
    }

    window.closeModal = function() {
        if (modal) modal.classList.remove('active');
    };

    // ===================== AI CHAT WIDGET (Interactive Onboarding) =====================
    const chatToggle = document.getElementById('chat-toggle');
    const chatWidget = document.getElementById('chat-widget');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');
    const chatChipsContainer = document.getElementById('chat-chips');

    let userName = null;

    chatToggle.addEventListener('click', () => {
        chatToggle.classList.toggle('open');
        chatWidget.classList.toggle('open');
        if (chatWidget.classList.contains('open') && !userName) {
            setTimeout(() => chatInput.focus(), 400);
        }
    });

    const prebakedAnswers = {
        '¿Qué es Nexus AI? 🧠': 'Nexus AI es una suite de Inteligencia Artificial que permite a empresas procesar datos complejos y desplegar modelos de lenguaje personalizados en su propia nube privada en cuestión de minutos. 🚀',
        'Planes y Precios 💰': 'Tenemos 3 planes adaptados a ti: **Starter** (100% gratis, 1,000 consultas al mes), **Pro** ($49/mes con 50,000 consultas) y **Enterprise** con recursos GPU dedicados y soporte 24/7. 💳',
        'Seguridad y Privacidad 🔒': 'Tus datos son sagrados. Contamos con cifrado AES-256 en reposo y tránsito, cumplimiento absoluto de normas GDPR y SOC 2, y garantizamos que tus datos jamás se usarán para entrenar modelos públicos. 🔒',
        'Integraciones 🔗': 'Nos conectamos nativamente con más de 200 plataformas (Slack, Notion, Salesforce, Google Drive, AWS) y disponemos de una API REST ultra-documentada para desarrolladores. 🔗'
    };

    function addMessage(text, type) {
        const msg = document.createElement('div');
        msg.className = `chat-msg ${type}`;
        msg.innerHTML = `<span>${text}</span>`;
        chatMessages.appendChild(msg);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function showTyping() {
        const typing = document.createElement('div');
        typing.className = 'typing-indicator';
        typing.id = 'typing-dots';
        typing.innerHTML = '<span></span><span></span><span></span>';
        chatMessages.appendChild(typing);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function removeTyping() {
        const typing = document.getElementById('typing-dots');
        if (typing) typing.remove();
    }

    function renderOptionChips() {
        chatChipsContainer.innerHTML = '';
        Object.keys(prebakedAnswers).forEach(option => {
            const chip = document.createElement('button');
            chip.className = 'chat-chip';
            chip.innerText = option;
            chip.addEventListener('click', () => handleChipSelection(option));
            chatChipsContainer.appendChild(chip);
        });
        chatChipsContainer.style.display = 'flex';
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function handleChipSelection(optionText) {
        // Disable chips container to avoid spam
        chatChipsContainer.style.pointerEvents = 'none';
        chatChipsContainer.style.opacity = '0.5';

        addMessage(optionText, 'user');

        showTyping();
        const delay = 800 + Math.random() * 800;
        
        setTimeout(() => {
            removeTyping();
            addMessage(prebakedAnswers[optionText], 'bot');
            
            // Re-enable chips for further questions
            chatChipsContainer.style.pointerEvents = 'all';
            chatChipsContainer.style.opacity = '1';
        }, delay);
    }

    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // We are in Phase 1: Name entry
        if (!userName) {
            const inputVal = chatInput.value.trim();
            if (!inputVal) return;
            
            userName = inputVal;
            addMessage(userName, 'user');
            
            // Lock the input form to transition to chips phase
            chatInput.value = '';
            chatInput.disabled = true;
            chatInput.placeholder = 'Selecciona una pregunta abajo...';
            chatForm.style.opacity = '0.5';
            chatForm.style.pointerEvents = 'none';

            showTyping();
            
            setTimeout(() => {
                removeTyping();
                addMessage(`¡Un placer conocerte, <strong>${userName}</strong>! 👋 Soy el asistente virtual de Nexus AI. ¿Qué te gustaría saber hoy?`, 'bot');
                
                // Show option chips
                setTimeout(() => {
                    renderOptionChips();
                }, 400);
            }, 1200);
        }
    });

    // ===================== TIMED PROMO TOAST (30s delay) =====================
    setTimeout(() => {
        if (document.getElementById('top-promo-notification')) return;

        const notification = document.createElement('div');
        notification.id = 'top-promo-notification';
        notification.className = 'top-notification';
        notification.innerHTML = `
            <div class="top-notification-content" id="trigger-chat-btn">
                <span>💡 ¿Quieres saber más sobre Nexus AI? ¡Prueba nuestro asistente interactivo en el chat abajo a la derecha! 🤖</span>
            </div>
            <button class="top-notification-close" id="close-promo-btn" aria-label="Cerrar">✕</button>
        `;
        document.body.appendChild(notification);

        // Slide down smoothly
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        // Trigger chatbot opening and highlight input field
        const triggerBtn = document.getElementById('trigger-chat-btn');
        if (triggerBtn) {
            triggerBtn.addEventListener('click', () => {
                const cToggle = document.getElementById('chat-toggle');
                const cWidget = document.getElementById('chat-widget');
                if (cToggle && cWidget) {
                    cToggle.classList.add('open');
                    cWidget.classList.add('open');
                    const cInput = document.getElementById('chat-input');
                    if (cInput) setTimeout(() => cInput.focus(), 400);
                }
                // Dismiss toast
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 600);
            });
        }

        // Close button click
        const closeBtn = document.getElementById('close-promo-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 600);
            });
        }
    }, 30000);

});