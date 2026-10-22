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
        const isOpen = mobileMenu.classList.toggle('active');
        navMenu.classList.toggle('active', isOpen);
        mobileMenu.setAttribute('aria-expanded', String(isOpen));
        mobileMenu.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');
    });
    document.querySelectorAll('.nav-menu li a').forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.remove('active');
            navMenu.classList.remove('active');
            mobileMenu.setAttribute('aria-expanded', 'false');
            mobileMenu.setAttribute('aria-label', 'Abrir menú');
        });
    });

    // Smooth scroll
    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', e => {
            const target = document.querySelector(a.getAttribute('href'));
            if (target) { e.preventDefault(); target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' }); }
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

    const demoIcon = name => `<svg class="ui-icon" aria-hidden="true"><use href="#icon-${name}"></use></svg>`;

    const demoTemplates = {
        'dashboard': `
            <section class="workspace-view" aria-labelledby="overview-title">
                <header class="view-heading">
                    <div><span class="view-kicker">VISTA GENERAL / WORKSPACE</span><h2 id="overview-title">Tu actividad, en perspectiva</h2><p>Un resumen claro de lo que ocurre en tu espacio de trabajo.</p></div>
                    <div class="view-period"><svg class="ui-icon" aria-hidden="true"><use href="#icon-clock"></use></svg><span>Últimos 7 días</span><span aria-hidden="true">⌄</span></div>
                </header>
                <div class="overview-metrics">
                    <article class="overview-card"><span class="overview-card-icon"><svg class="ui-icon" aria-hidden="true"><use href="#icon-bolt"></use></svg></span><span class="overview-card-label">Consultas procesadas</span><strong class="overview-card-value">24,860 <small class="metric-trend">+12.8%</small></strong><span class="overview-card-foot">vs. semana anterior</span></article>
                    <article class="overview-card"><span class="overview-card-icon"><svg class="ui-icon" aria-hidden="true"><use href="#icon-clock"></use></svg></span><span class="overview-card-label">Tiempo recuperado</span><strong class="overview-card-value">38.5 h <small class="metric-neutral">este mes</small></strong><span class="overview-card-foot">en tareas repetitivas</span></article>
                    <article class="overview-card"><span class="overview-card-icon"><svg class="ui-icon" aria-hidden="true"><use href="#icon-cpu"></use></svg></span><span class="overview-card-label">Modelos disponibles</span><strong class="overview-card-value">08 <small class="metric-neutral">de 10</small></strong><span class="overview-card-foot">3 usados esta semana</span></article>
                    <article class="overview-card"><span class="overview-card-icon"><svg class="ui-icon" aria-hidden="true"><use href="#icon-chart"></use></svg></span><span class="overview-card-label">Calidad de respuesta</span><strong class="overview-card-value">96.4% <small class="metric-trend">+2.1%</small></strong><span class="overview-card-foot">promedio de evaluación</span></article>
                </div>
                <div class="dashboard-insights-grid">
                    <section class="surface-card activity-card" aria-label="Actividad del workspace">
                        <div class="surface-card-heading"><div><h3>Actividad del workspace</h3><p>Consultas completadas durante la semana</p></div><span class="chart-legend"><i></i> Consultas</span></div>
                        <div class="activity-chart"><div class="chart-y-labels"><span>5k</span><span>3k</span><span>1k</span><span>0</span></div><div class="chart-plot"><div class="chart-grid-lines" aria-hidden="true"><i></i><i></i><i></i><i></i></div><div class="chart-bar-group"><div class="chart-bar" style="--h:46%"><span>Lun</span></div><div class="chart-bar" style="--h:67%"><span>Mar</span></div><div class="chart-bar" style="--h:56%"><span>Mié</span></div><div class="chart-bar" style="--h:79%"><span>Jue</span></div><div class="chart-bar" style="--h:62%"><span>Vie</span></div><div class="chart-bar" style="--h:91%"><span>Sáb</span></div><div class="chart-bar" style="--h:73%"><span>Dom</span></div></div></div></div>
                    </section>
                    <aside class="surface-card quick-insights"><div class="surface-card-heading"><div><h3>Señales destacadas</h3><p>Lecturas de ejemplo del workspace</p></div><span class="insight-spark"><svg class="ui-icon" aria-hidden="true"><use href="#icon-sparkles"></use></svg></span></div><div class="insight-highlight"><span class="insight-highlight-icon"><svg class="ui-icon" aria-hidden="true"><use href="#icon-bolt"></use></svg></span><div><strong>Más actividad el sábado</strong><p>El volumen de consultas subió un 18% respecto al promedio diario.</p></div></div><div class="insight-highlight"><span class="insight-highlight-icon blue"><svg class="ui-icon" aria-hidden="true"><use href="#icon-brain"></use></svg></span><div><strong>Respuestas más consistentes</strong><p>La evaluación de calidad mejoró en los flujos de soporte.</p></div></div><div class="insight-foot"><span class="status-dot"></span> Datos ficticios para esta demostración</div></aside>
                </div>
                <section class="surface-card activity-feed"><div class="surface-card-heading"><div><h3>Actividad reciente</h3><p>Una muestra de los últimos eventos del equipo</p></div><span class="text-action">Ver actividad <svg class="ui-icon" aria-hidden="true"><use href="#icon-arrow"></use></svg></span></div><div class="activity-feed-list"><div class="feed-row"><span class="feed-icon mint"><svg class="ui-icon" aria-hidden="true"><use href="#icon-sparkles"></use></svg></span><div><strong>Análisis de comentarios completado</strong><small>Flujo de análisis · hace 12 min</small></div><span class="feed-status">Completado</span></div><div class="feed-row"><span class="feed-icon violet"><svg class="ui-icon" aria-hidden="true"><use href="#icon-cpu"></use></svg></span><div><strong>Modelo de soporte actualizado</strong><small>Modelos · hace 48 min</small></div><span class="feed-status">Publicado</span></div><div class="feed-row"><span class="feed-icon amber"><svg class="ui-icon" aria-hidden="true"><use href="#icon-folder"></use></svg></span><div><strong>Dataset de operaciones sincronizado</strong><small>Fuentes de datos · hace 2 h</small></div><span class="feed-status">Revisado</span></div></div></section>
            </section>
        `,
        'models': `
            <section class="workspace-view" aria-labelledby="models-title">
                <header class="view-heading"><div><span class="view-kicker">CENTRO DE MODELOS</span><h2 id="models-title">Inteligencia para cada tarea</h2><p>Explora los modelos de ejemplo y una selección de capacidades disponibles.</p></div><div class="view-period"><svg class="ui-icon" aria-hidden="true"><use href="#icon-cpu"></use></svg><span>Catálogo demo</span></div></header>
                <div class="model-summary-strip"><div><span class="summary-number">08</span> modelos disponibles</div><i></i><div><span class="summary-number">03</span> en uso</div><i></i><div><span class="summary-number">99.2%</span> disponibilidad ilustrativa</div></div>
                <div class="model-featured-grid">
                    <article class="model-feature-card featured-model"><div class="model-feature-top"><span class="model-symbol"><svg class="ui-icon" aria-hidden="true"><use href="#icon-brain"></use></svg></span><span class="model-pill"><i></i> Disponible</span></div><span class="model-category">LENGUAJE · GENERAL</span><h3>Nexus Language Pro</h3><p>Comprende instrucciones y ayuda a resumir, redactar y explorar información.</p><div class="model-specs"><span><small>Latencia media</small><strong>420 ms</strong></span><span><small>Contexto</small><strong>128k tokens</strong></span></div><span class="model-use-action">Modelo recomendado <svg class="ui-icon" aria-hidden="true"><use href="#icon-arrow"></use></svg></span></article>
                    <article class="model-feature-card"><div class="model-feature-top"><span class="model-symbol violet"><svg class="ui-icon" aria-hidden="true"><use href="#icon-file"></use></svg></span><span class="model-pill training"><i></i> Ajuste de muestra</span></div><span class="model-category">VISIÓN · DOCUMENTOS</span><h3>Nexus Vision</h3><p>Interpreta documentos e imágenes en escenarios de demostración.</p><div class="model-specs"><span><small>Progreso visual</small><strong>72%</strong></span><span><small>Tipo</small><strong>Multimodal</strong></span></div><div class="model-progress-label"><span>Preparación ficticia</span><strong>72%</strong></div><div class="model-progress"><i style="width:72%"></i></div><div class="model-feature-foot">Estado ilustrativo · no está entrenando realmente</div></article>
                    <article class="model-feature-card"><div class="model-feature-top"><span class="model-symbol blue"><svg class="ui-icon" aria-hidden="true"><use href="#icon-chat"></use></svg></span><span class="model-pill"><i></i> Disponible</span></div><span class="model-category">TEXTO · CLASIFICACIÓN</span><h3>Nexus Sentiment</h3><p>Organiza opiniones por tono y tema para explorar tendencias de ejemplo.</p><div class="model-specs"><span><small>Latencia media</small><strong>180 ms</strong></span><span><small>Uso</small><strong>Moderado</strong></span></div><span class="model-use-action subtle">Ver capacidad <svg class="ui-icon" aria-hidden="true"><use href="#icon-arrow"></use></svg></span></article>
                </div>
                <div class="section-inline-heading"><div><h3>Biblioteca del workspace</h3><p>Otros modelos de muestra disponibles</p></div><span class="demo-counter">3 elementos</span></div>
                <div class="model-library"><div class="library-row"><span class="library-icon"><svg class="ui-icon" aria-hidden="true"><use href="#icon-sparkles"></use></svg></span><div><strong>Nexus Embed Small</strong><small>Embeddings · búsqueda semántica</small></div><span class="library-tag">Disponible</span><span class="library-latency">95 ms</span></div><div class="library-row"><span class="library-icon violet"><svg class="ui-icon" aria-hidden="true"><use href="#icon-file"></use></svg></span><div><strong>Nexus Translate</strong><small>Traducción · 18 idiomas</small></div><span class="library-tag">Disponible</span><span class="library-latency">260 ms</span></div><div class="library-row"><span class="library-icon blue"><svg class="ui-icon" aria-hidden="true"><use href="#icon-bolt"></use></svg></span><div><strong>Nexus Realtime</strong><small>Asistencia · baja latencia</small></div><span class="library-tag muted">En espera</span><span class="library-latency">—</span></div></div>
                <p class="demo-data-caption"><svg class="ui-icon" aria-hidden="true"><use href="#icon-warning"></use></svg> Nombres, estados y métricas son ilustrativos; no representan modelos activos.</p>
            </section>
        `,
        'datasets': `
            <section class="workspace-view" aria-labelledby="datasets-title">
                <header class="view-heading"><div><span class="view-kicker">FUENTES DE INFORMACIÓN</span><h2 id="datasets-title">Datos listos para explorar</h2><p>Una vista organizada de las fuentes ficticias de tu workspace.</p></div><span class="view-primary-action"><svg class="ui-icon" aria-hidden="true"><use href="#icon-link"></use></svg> Conectar fuente</span></header>
                <section class="dataset-overview"><div class="dataset-overview-main"><span class="dataset-overview-icon"><svg class="ui-icon" aria-hidden="true"><use href="#icon-folder"></use></svg></span><div><strong>Almacenamiento del workspace</strong><small>Espacio ilustrativo utilizado por los datasets de ejemplo</small></div><span class="dataset-overview-status"><i></i> Todo actualizado</span></div><div class="dataset-usage"><div><span>Uso simulado</span><strong>383 MB <small>de 2 GB</small></strong></div><div class="usage-track"><i style="width:19%"></i></div></div></section>
                <div class="section-inline-heading"><div><h3>Datasets conectados</h3><p>Última actividad simulada hace unos minutos</p></div><span class="demo-counter">03 fuentes</span></div>
                <div class="dataset-table"><div class="dataset-table-head"><span>FUENTE</span><span>TAMAÑO</span><span>REGISTROS</span><span>ESTADO</span><span></span></div>
                    <div class="dataset-row"><div class="dataset-file"><i class="file-type json">JSON</i><span><strong>customer_interactions_v2.json</strong><small>Actualizado hace 12 min</small></span></div><span class="dataset-cell">245.8 MB</span><span class="dataset-cell">1.2 M</span><span class="dataset-state"><i></i> Conectado</span><button class="demo-dataset-btn" type="button">Sincronizar</button></div>
                    <div class="dataset-row"><div class="dataset-file"><i class="file-type csv">CSV</i><span><strong>financial_forecast_2026.csv</strong><small>Actualizado hace 1 h</small></span></div><span class="dataset-cell">48.2 MB</span><span class="dataset-cell">420 K</span><span class="dataset-state"><i></i> Conectado</span><button class="demo-dataset-btn" type="button">Sincronizar</button></div>
                    <div class="dataset-row"><div class="dataset-file"><i class="file-type parquet">PAR</i><span><strong>user_feedback_sentiments.parquet</strong><small>Actualizado ayer</small></span></div><span class="dataset-cell">89.1 MB</span><span class="dataset-cell">780 K</span><span class="dataset-state"><i></i> Conectado</span><button class="demo-dataset-btn" type="button">Sincronizar</button></div>
                </div>
                <p class="demo-data-caption"><svg class="ui-icon" aria-hidden="true"><use href="#icon-warning"></use></svg> Fuentes, tamaños y registros son datos de muestra. El botón de sincronizar solo anima esta interfaz.</p>
            </section>
        `,
        'config': `
            <section class="workspace-view" aria-labelledby="settings-title">
                <header class="view-heading"><div><span class="view-kicker">PREFERENCIAS DEL WORKSPACE</span><h2 id="settings-title">Configura tu espacio</h2><p>Ajustes de ejemplo para personalizar la experiencia visual.</p></div><span class="settings-demo-label"><svg class="ui-icon" aria-hidden="true"><use href="#icon-warning"></use></svg> Solo demostración</span></header>
                <div class="settings-layout"><div class="settings-nav" aria-label="Categorías de configuración"><span class="settings-nav-item active"><svg class="ui-icon" aria-hidden="true"><use href="#icon-settings"></use></svg> General <span>›</span></span><span class="settings-nav-item"><svg class="ui-icon" aria-hidden="true"><use href="#icon-cpu"></use></svg> Modelos <span>›</span></span><span class="settings-nav-item"><svg class="ui-icon" aria-hidden="true"><use href="#icon-lock"></use></svg> Privacidad <span>›</span></span><span class="settings-nav-item"><svg class="ui-icon" aria-hidden="true"><use href="#icon-settings"></use></svg> Notificaciones <span>›</span></span></div>
                    <div class="settings-main"><section class="surface-card settings-card"><div class="settings-card-heading"><div><h3>Comportamiento de la plataforma</h3><p>Activa o desactiva preferencias de muestra</p></div><span class="settings-mini-badge">GENERAL</span></div>
                        <label class="setting-row"><span class="setting-symbol"><svg class="ui-icon" aria-hidden="true"><use href="#icon-bolt"></use></svg></span><span class="setting-copy"><strong>Escalado inteligente</strong><small>Ajusta visualmente la capacidad según la demanda.</small></span><span class="demo-switch"><input type="checkbox" checked data-demo-toggle data-label="Escalado inteligente" aria-label="Activar escalado inteligente"><span class="demo-slider"></span></span></label>
                        <label class="setting-row"><span class="setting-symbol violet"><svg class="ui-icon" aria-hidden="true"><use href="#icon-brain"></use></svg></span><span class="setting-copy"><strong>Respuestas con contexto</strong><small>Prioriza información relevante en las respuestas de ejemplo.</small></span><span class="demo-switch"><input type="checkbox" checked data-demo-toggle data-label="Respuestas con contexto" aria-label="Activar respuestas con contexto"><span class="demo-slider"></span></span></label>
                        <label class="setting-row"><span class="setting-symbol blue"><svg class="ui-icon" aria-hidden="true"><use href="#icon-lock"></use></svg></span><span class="setting-copy"><strong>Confirmar acciones sensibles</strong><small>Muestra un paso de revisión antes de continuar.</small></span><span class="demo-switch"><input type="checkbox" checked data-demo-toggle data-label="Confirmar acciones sensibles" aria-label="Confirmar acciones sensibles"><span class="demo-slider"></span></span></label>
                        <label class="setting-row"><span class="setting-symbol amber"><svg class="ui-icon" aria-hidden="true"><use href="#icon-globe"></use></svg></span><span class="setting-copy"><strong>Idioma de la interfaz</strong><small>Preferencia visual para esta sesión de demostración.</small></span><span class="setting-select">Español <span>⌄</span></span></label>
                    </section>
                    <div class="settings-bottom-row"><div class="surface-card setting-info-card"><span class="setting-info-icon"><svg class="ui-icon" aria-hidden="true"><use href="#icon-lock"></use></svg></span><div><strong>Tus ajustes no salen de esta vista</strong><p>Los interruptores solo cambian su apariencia; no guardan ni modifican datos.</p></div><span class="info-arrow"><svg class="ui-icon" aria-hidden="true"><use href="#icon-arrow"></use></svg></span></div><button class="settings-save" type="button"><svg class="ui-icon" aria-hidden="true"><use href="#icon-check"></use></svg> Guardar cambios de prueba</button></div><p class="settings-feedback" aria-live="polite"><span class="status-dot"></span><span>Sin cambios guardados · experiencia ficticia</span></p></div>
                </div>
            </section>
        `,
        'assistant': `
            <section class="demo-ai-panel" aria-label="Demostración del asistente de Nexus AI">
                <div class="demo-ai-heading">
                    <div class="demo-ai-brand"><span class="demo-ai-avatar" aria-hidden="true">${demoIcon('sparkles')}</span><div><strong>Nexus AI Assistant</strong><small>Asistente de demostración · respuestas guiadas</small></div></div>
                    <span class="demo-ai-demo-tag">DEMO FICTICIA</span>
                </div>
                <div class="demo-ai-messages" aria-live="polite" aria-relevant="additions">
                    <div class="demo-ai-message">¡Hola! Soy el asistente de muestra de Nexus AI. Pregúntame sobre el producto, los planes, la seguridad o las integraciones.</div>
                </div>
                <div class="demo-ai-suggestions" aria-label="Preguntas sugeridas">
                    <button class="demo-ai-suggestion" type="button" data-demo-question="¿Qué puede hacer Nexus AI?">¿Qué puede hacer?</button>
                    <button class="demo-ai-suggestion" type="button" data-demo-question="¿Cuáles son los planes y precios?">Planes y precios</button>
                    <button class="demo-ai-suggestion" type="button" data-demo-question="¿Cómo funciona la seguridad?">Seguridad</button>
                    <button class="demo-ai-suggestion" type="button" data-demo-question="¿Con qué herramientas se integra?">Integraciones</button>
                </div>
                <form class="demo-ai-form">
                    <input type="text" aria-label="Escribe una pregunta para la demostración" placeholder="Prueba una pregunta…" autocomplete="off">
                    <button type="submit">Preguntar <span aria-hidden="true"><svg class="ui-icon"><use href="#icon-arrow"></use></svg></span></button>
                </form>
                <p class="demo-ai-note">Esta demo utiliza respuestas predefinidas; no envía mensajes ni se conecta a una IA real.</p>
            </section>
        `,
        'reports': `
            <section class="workspace-view" aria-labelledby="reports-title">
                <header class="view-heading"><div><span class="view-kicker">ANÁLISIS DEL WORKSPACE</span><h2 id="reports-title">Informes y actividad</h2><p>Una lectura ejecutiva de indicadores de ejemplo para esta semana.</p></div><div class="view-period"><svg class="ui-icon" aria-hidden="true"><use href="#icon-clock"></use></svg><span>Esta semana</span><span aria-hidden="true">⌄</span></div></header>
                <div class="report-highlight-grid"><article class="report-highlight"><span class="report-highlight-icon"><svg class="ui-icon" aria-hidden="true"><use href="#icon-bolt"></use></svg></span><span class="report-highlight-label">Consultas procesadas</span><strong>24.8k</strong><small><b>+12.8%</b> respecto a la semana pasada</small><div class="mini-sparkline" aria-hidden="true"><i style="--bar:42%"></i><i style="--bar:58%"></i><i style="--bar:48%"></i><i style="--bar:76%"></i><i style="--bar:65%"></i><i style="--bar:94%"></i><i style="--bar:79%"></i></div></article><article class="report-highlight"><span class="report-highlight-icon violet"><svg class="ui-icon" aria-hidden="true"><use href="#icon-clock"></use></svg></span><span class="report-highlight-label">Tiempo recuperado</span><strong>38.5 h</strong><small><b>+6.4 h</b> de productividad estimada</small><div class="report-progress"><i style="width:76%"></i></div><span class="report-progress-caption">76% de la meta mensual ilustrativa</span></article><article class="report-highlight"><span class="report-highlight-icon blue"><svg class="ui-icon" aria-hidden="true"><use href="#icon-brain"></use></svg></span><span class="report-highlight-label">Calidad promedio</span><strong>96.4%</strong><small><b>+2.1%</b> en evaluaciones de muestra</small><div class="report-completion"><i style="width:96%"></i></div></article></div>
                <div class="section-inline-heading report-list-heading"><div><h3>Informes recientes</h3><p>Resumenes generados para la experiencia de demostración</p></div><span class="demo-counter">03 informes</span></div>
                <div class="report-list"><div class="report-list-item"><span class="report-doc-icon mint"><svg class="ui-icon" aria-hidden="true"><use href="#icon-chart"></use></svg></span><span class="report-list-copy"><strong>Rendimiento semanal del workspace</strong><small>Actividad, consultas y tendencias · Hoy, 09:40</small></span><span class="report-list-tag">Actividad</span><span class="report-open" aria-hidden="true"><svg class="ui-icon"><use href="#icon-arrow"></use></svg></span></div><div class="report-list-item"><span class="report-doc-icon violet"><svg class="ui-icon" aria-hidden="true"><use href="#icon-cpu"></use></svg></span><span class="report-list-copy"><strong>Uso y evaluación de modelos</strong><small>Uso por modelo y calidad estimada · Ayer, 16:20</small></span><span class="report-list-tag violet">Modelos</span><span class="report-open" aria-hidden="true"><svg class="ui-icon"><use href="#icon-arrow"></use></svg></span></div><div class="report-list-item"><span class="report-doc-icon blue"><svg class="ui-icon" aria-hidden="true"><use href="#icon-folder"></use></svg></span><span class="report-list-copy"><strong>Estado de fuentes de datos</strong><small>Conexiones y sincronizaciones de muestra · 18 oct, 11:05</small></span><span class="report-list-tag blue">Datos</span><span class="report-open" aria-hidden="true"><svg class="ui-icon"><use href="#icon-arrow"></use></svg></span></div></div>
                <p class="demo-data-caption"><svg class="ui-icon" aria-hidden="true"><use href="#icon-warning"></use></svg> Todos los indicadores y reportes son ejemplos ficticios, no datos de producción.</p>
            </section>
        `
    };

    sidebarItems.forEach(item => {
        item.style.cursor = 'pointer';
        item.setAttribute('role', 'tab');
        item.setAttribute('tabindex', item.classList.contains('active') ? '0' : '-1');
        item.setAttribute('aria-selected', String(item.classList.contains('active')));
        item.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                item.click();
            } else if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
                event.preventDefault();
                const next = sidebarItems[(Array.from(sidebarItems).indexOf(item) + 1) % sidebarItems.length];
                next.focus();
            } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
                event.preventDefault();
                const index = Array.from(sidebarItems).indexOf(item);
                sidebarItems[(index - 1 + sidebarItems.length) % sidebarItems.length].focus();
            }
        });
        item.addEventListener('click', () => {
            if (item.classList.contains('active')) return;
            
            // Highlight active sidebar item
            sidebarItems.forEach(sib => {
                sib.classList.remove('active');
                sib.setAttribute('aria-selected', 'false');
                sib.setAttribute('tabindex', '-1');
            });
            item.classList.add('active');
            item.setAttribute('aria-selected', 'true');
            item.setAttribute('tabindex', '0');

            demoContent.setAttribute('aria-labelledby', item.id);
            
            // Fade out
            demoContent.classList.add('fade-out');
            
            setTimeout(() => {
                const key = item.dataset.tab;
                if (demoTemplates[key]) {
                    demoContent.innerHTML = demoTemplates[key];
                    
                    // Bind event listeners or trigger animations if necessary inside templates
                    if (key === 'assistant') {
                        const aiForm = demoContent.querySelector('.demo-ai-form');
                        const aiInput = aiForm.querySelector('input');
                        const aiMessages = demoContent.querySelector('.demo-ai-messages');
                        const aiAnswers = [
                            { terms: ['qué', 'hacer', 'producto', 'nexus'], answer: 'Nexus AI es una experiencia ficticia que muestra cómo un equipo podría explorar información, consultar un asistente y organizar flujos de trabajo desde un mismo espacio.' },
                            { terms: ['plan', 'precio', 'cuesta'], answer: 'En esta maqueta hay tres planes de ejemplo: Starter gratuito, Pro por $49/mes y Enterprise con precio personalizado. Son valores ilustrativos, no una oferta comercial real.' },
                            { terms: ['seguridad', 'privacidad', 'dato'], answer: 'La demo representa controles de privacidad y revisión humana como parte del producto imaginario. No procesa datos reales ni debe considerarse una certificación de seguridad.' },
                            { terms: ['integr', 'herramient', 'conecta'], answer: 'La experiencia ilustra integraciones hipotéticas con herramientas de trabajo. No hay conectores activos en esta demostración.' }
                        ];
                        const addDemoMessage = (text, type) => {
                            const message = document.createElement('div');
                            message.className = `demo-ai-message${type === 'user' ? ' user' : ''}`;
                            message.textContent = text;
                            aiMessages.appendChild(message);
                            aiMessages.scrollTop = aiMessages.scrollHeight;
                        };
                        const submitDemoQuestion = question => {
                            const text = question.trim();
                            if (!text) return;
                            addDemoMessage(text, 'user');
                            aiInput.value = '';
                            const typing = document.createElement('div');
                            typing.className = 'demo-ai-typing';
                            typing.textContent = 'Nexus AI está preparando una respuesta…';
                            aiMessages.appendChild(typing);
                            aiMessages.scrollTop = aiMessages.scrollHeight;
                            window.setTimeout(() => {
                                typing.remove();
                                const normalized = text.toLocaleLowerCase('es');
                                const match = aiAnswers.find(item => item.terms.some(term => normalized.includes(term)));
                                addDemoMessage(match ? match.answer : 'Puedo orientarte sobre las capacidades, los planes de ejemplo, la seguridad o las integraciones. Prueba una de las preguntas sugeridas.', 'assistant');
                            }, 650);
                        };
                        aiForm.addEventListener('submit', event => {
                            event.preventDefault();
                            submitDemoQuestion(aiInput.value);
                        });
                        demoContent.querySelectorAll('[data-demo-question]').forEach(button => {
                            button.addEventListener('click', () => submitDemoQuestion(button.dataset.demoQuestion));
                        });
                    } else if (key === 'dashboard') {
                        // Re-trigger bar animations inside newly loaded dashboard template
                        const newBars = demoContent.querySelectorAll('.chart-bar');
                        newBars.forEach((bar) => {
                            bar.style.transform = 'scaleY(0)';
                            setTimeout(() => {
                                bar.classList.add('animated');
                                bar.style.transform = '';
                            }, 50);
                        });
                    } else if (key === 'datasets') {
                        const syncBtns = demoContent.querySelectorAll('.demo-dataset-btn');
                        syncBtns.forEach(btn => {
                            btn.addEventListener('click', () => {
                                if (btn.disabled || btn.classList.contains('is-complete')) return;
                                const status = btn.closest('.dataset-row')?.querySelector('.dataset-state');
                                const statusDot = status?.querySelector('i');
                                btn.disabled = true;
                                btn.innerHTML = '<span class="button-spinner" aria-hidden="true"></span> Actualizando';
                                if (status) status.lastChild.textContent = ' Sincronizando';
                                if (statusDot) statusDot.classList.add('is-syncing');
                                window.setTimeout(() => {
                                    btn.innerHTML = `${demoIcon('check')} Actualizado`;
                                    btn.classList.add('is-complete');
                                    btn.disabled = false;
                                    if (status) status.lastChild.textContent = ' Actualizado ahora';
                                    if (statusDot) statusDot.classList.remove('is-syncing');
                                }, 950);
                            });
                        });
                    } else if (key === 'config') {
                        const feedback = demoContent.querySelector('.settings-feedback');
                        const feedbackText = feedback?.querySelector('span:last-child');
                        const saveButton = demoContent.querySelector('.settings-save');
                        demoContent.querySelectorAll('[data-demo-toggle]').forEach(toggle => {
                            toggle.addEventListener('change', () => {
                                if (!feedback || !feedbackText) return;
                                feedbackText.textContent = `${toggle.dataset.label}: ${toggle.checked ? 'activado' : 'desactivado'} · solo efecto visual`;
                                feedback.classList.add('is-updated');
                                saveButton?.classList.remove('is-saved');
                                if (saveButton) saveButton.innerHTML = `${demoIcon('check')} Guardar cambios de prueba`;
                            });
                        });
                        saveButton?.addEventListener('click', () => {
                            saveButton.classList.add('is-saved');
                            saveButton.innerHTML = `${demoIcon('check')} Guardado en esta demo`;
                            if (feedback && feedbackText) {
                                feedbackText.textContent = 'Preferencias de muestra actualizadas en pantalla · no se guardan datos';
                                feedback.classList.add('is-updated');
                            }
                            window.setTimeout(() => {
                                saveButton.classList.remove('is-saved');
                                saveButton.innerHTML = `${demoIcon('check')} Guardar cambios de prueba`;
                            }, 1700);
                        });
                    }
                }
                
                // Fade in
                demoContent.classList.remove('fade-out');
            }, 250);
        });
    });

    // Bind the default assistant view so it is interactive before the first tab change.
    const initialAssistantTab = document.querySelector('.sidebar-item[data-tab="assistant"]');
    if (initialAssistantTab) {
        initialAssistantTab.classList.remove('active');
        initialAssistantTab.click();
    }

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
        if (prefersReducedMotion) {
            el.textContent = target.toLocaleString();
            return;
        }
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
    
    if (heroImg && !heroImg.classList.contains('dashboard-art')) {
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
        const isOpen = chatWidget.classList.toggle('open');
        chatToggle.classList.toggle('open', isOpen);
        chatToggle.setAttribute('aria-expanded', String(isOpen));
        if (isOpen && !userName) {
            setTimeout(() => chatInput.focus(), 400);
        }
    });

    const prebakedAnswers = {
        '¿Qué es Nexus AI? ': 'Nexus AI es una suite de Inteligencia Artificial que permite a empresas procesar datos complejos y desplegar modelos de lenguaje personalizados en su propia nube privada en cuestión de minutos. ',
        'Planes y Precios ': 'Tenemos 3 planes adaptados a ti: Starter (100% gratis, 1,000 consultas al mes), Pro ($49/mes con 50,000 consultas) y Enterprise con recursos GPU dedicados y soporte 24/7. ',
        'Seguridad y Privacidad ': 'Tus datos son sagrados. Contamos con cifrado AES-256 en reposo y tránsito, cumplimiento absoluto de normas GDPR y SOC 2, y garantizamos que tus datos jamás se usarán para entrenar modelos públicos. ',
        'Integraciones ': 'Nos conectamos nativamente con más de 200 plataformas (Slack, Notion, Salesforce, Google Drive, AWS) y disponemos de una API REST ultra-documentada para desarrolladores. '
    };

    function addMessage(text, type) {
        const msg = document.createElement('div');
        msg.className = `chat-msg ${type}`;
        const content = document.createElement('span');
        content.textContent = text;
        msg.appendChild(content);
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
                addMessage(`¡Un placer conocerte, ${userName}!  Soy el asistente virtual de Nexus AI. ¿Qué te gustaría saber hoy?`, 'bot');
                
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
                <span><svg class="ui-icon" aria-hidden="true"><use href="#icon-sparkles"></use></svg> ¿Quieres saber más sobre Nexus AI? ¡Prueba nuestro asistente interactivo en el chat abajo a la derecha! <svg class="ui-icon" aria-hidden="true"><use href="#icon-robot"></use></svg></span>
            </div>
            <button class="top-notification-close" id="close-promo-btn" aria-label="Cerrar"><svg class="ui-icon" aria-hidden="true"><use href="#icon-close"></use></svg></button>
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

    document.addEventListener('keydown', event => {
        if (event.key !== 'Escape') return;
        if (chatWidget && chatWidget.classList.contains('open')) {
            chatWidget.classList.remove('open');
            chatToggle.classList.remove('open');
            chatToggle.setAttribute('aria-expanded', 'false');
            chatToggle.focus();
        }
        if (modal && modal.classList.contains('active')) {
            modal.classList.remove('active');
        }
        if (navMenu && navMenu.classList.contains('active')) {
            navMenu.classList.remove('active');
            mobileMenu.classList.remove('active');
            mobileMenu.setAttribute('aria-expanded', 'false');
            mobileMenu.setAttribute('aria-label', 'Abrir menú');
            mobileMenu.focus();
        }
    });

});