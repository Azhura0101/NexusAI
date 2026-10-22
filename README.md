# Nexus AI

Landing page y demo interactiva de **Nexus AI**, un producto ficticio de inteligencia artificial creado como proyecto de portafolio. Incluye una página comercial, un dashboard de demostración y un flujo de registro simulado.

> **Aviso:** Nexus AI no es un producto real. Todas las métricas, modelos, datasets, reportes y respuestas son ficticios. La demo no se conecta a una IA real, no procesa pagos, no crea cuentas y **no guarda ni envía datos personales**.

## Qué incluye

- **Landing page** con hero, características, flujo de trabajo, equipo, precios, CTA y footer.
- **Demo de la plataforma** con navegación por pestañas:
  - **Asistente IA:** respuestas predefinidas según palabras clave, con estado de escritura simulado.
  - **Dashboard:** métricas, gráfico de actividad y actividad reciente de ejemplo.
  - **Modelos:** catálogo ilustrativo, especificaciones y progreso ficticio de entrenamiento.
  - **Datasets:** fuentes de muestra con sincronización animada que no modifica datos.
  - **Configuración:** interruptores visuales y botón de guardado que solo cambia la interfaz.
  - **Reportes:** indicadores, sparklines e informes ficticios.
- **Chat flotante** de onboarding: pide un nombre y ofrece respuestas guiadas sobre producto, planes, seguridad e integraciones.
- **Registro simulado** (`signup.html`) con selección de plan mediante query string.
- **Efectos visuales:** partículas en canvas, glow del cursor, tilt 3D, botones magnéticos, texto descifrado y animaciones al hacer scroll.
- **Diseño responsive** y soporte para `prefers-reduced-motion` y navegación por teclado.

## Stack

- HTML5 semántico.
- CSS3 con variables, grid, flexbox, animaciones y glassmorphism.
- JavaScript vanilla, sin framework, sin build y sin dependencias instaladas.
- Canvas 2D, `IntersectionObserver`, `matchMedia` y SVG sprite.
- Google Fonts: **Outfit** y **JetBrains Mono**.
- Imágenes de equipo desde Unsplash.

## Estructura

```text
NexusAI/
├── index.html      # Landing page + demo de la plataforma + chat flotante
├── signup.html     # Checkout/registro simulado y lógica de planes
├── style.css       # Estilos globales, animaciones y responsive
├── app.js          # Interacciones de la landing, demo, chat y modal
└── data.js         # Banco de preguntas de un quiz anterior; no está enlazado
```

`data.js` no se carga desde ninguna página actual. Se conserva como material previo del proyecto.

## Cómo ejecutarlo

No requiere instalación ni compilación.

1. Abre `index.html` directamente en el navegador, o
2. levanta un servidor local:

```bash
python3 -m http.server 8000
```

Luego visita `http://localhost:8000`.

### Planes en el registro

El plan se elige desde la URL:

```text
signup.html?plan=starter
signup.html?plan=pro
signup.html?plan=enterprise
```

- `starter` es el valor por defecto.
- `pro` muestra la tarjeta holográfica de pago simulado.
- `enterprise` muestra el plan personalizado sin precio fijo.

El formulario siempre termina en un modal de éxito y no envía información a ningún servidor.

## Personalización

- **Colores, tipografía y radios:** variables en `:root` dentro de `style.css`.
- **Contenido de la demo:** plantillas del dashboard en el objeto `demoTemplates` de `app.js`.
- **Respuestas del asistente:** arreglo `aiAnswers` dentro del bloque de la pestaña `assistant` en `app.js`.
- **Respuestas del chat flotante:** objeto `prebakedAnswers` en `app.js`.
- **Planes y precios:** sección de precios en `index.html` y lógica de planes en el script inline de `signup.html`.
- **Textos de la landing:** directamente en `index.html`.

## Accesibilidad y responsive

- Pestañas de la demo con roles `tablist`/`tab`/`tabpanel`, `aria-selected` y navegación con flechas.
- Foco visible con `:focus-visible`.
- Cierre de modal, chat y menú móvil con `Escape`.
- Efectos de mouse desactivados en dispositivos táctiles.
- Animaciones reducidas cuando el sistema tiene `prefers-reduced-motion`.
- Breakpoints principales en `1080px`, `1000px`, `820px`, `768px`, `600px`, `560px` y `480px`.

## Validación

Comprobación de sintaxis de los archivos JavaScript:

```bash
node --check app.js
node --check data.js
```

No hay tests automatizados ni linter configurado. La validación visual y de interacción se hace manualmente en el navegador.

## Limitaciones conocidas

- No hay backend, base de datos ni persistencia: recargar la página reinicia todo.
- Los datos, métricas, modelos y reportes son ficticios.
- El asistente y el chat usan respuestas predefinidas; no hay integración con un modelo de IA.
- El registro y el pago son simulados; no se crean cuentas ni se procesan transacciones.
- La demo depende de Google Fonts y Unsplash para tipografías e imágenes externas.
