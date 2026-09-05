# Proyecto: Catálogo Digital — Escama y Colmillo

## 1. Propósito

Aplicación web para mostrar un catálogo digital de ejemplares de reptiles. El frontend consulta los datos desde Supabase y genera dinámicamente las tarjetas del catálogo y las fichas ampliadas en modal.

Este README está estructurado para que desarrolladores o una IA puedan identificar rápidamente:

- la arquitectura del proyecto;
- la responsabilidad de cada archivo;
- las tecnologías utilizadas;
- los puntos de entrada;
- dónde modificar estilos, datos y lógica;
- cómo ejecutar el proyecto localmente.

---

## 2. Arquitectura

```text
proyecto-maqueta-vite/
├── index.html
├── package.json
├── package-lock.json
├── README.md
├── node_modules/
└── src/
    ├── assets/
    ├── js/
    │   ├── app.js
    │   ├── catalog.js
    │   ├── modal.js
    │   └── supabase-config.js
    ├── pages/
    │   ├── admin.html
    │   └── nosotros.html
    ├── partials/
    └── styles/
        ├── main.css
        ├── 0-settings/
        │   └── variables.css
        ├── 1-tools/
        ├── 2-base/
        │   ├── reset.css
        │   └── typography.css
        ├── 3-components/
        │   ├── card.css
        │   ├── footer.css
        │   ├── header.css
        │   └── modal.css
        └── 4-layouts/
```
---

## 3. Responsabilidades por archivo
index.html
Página principal de la aplicación.

Responsabilidad:

definir la estructura HTML inicial del catálogo y la estructura base del modal de vista rápida;

cargar el punto de entrada de JavaScript (app.js);

proporcionar los contenedores donde se renderizan las tarjetas y los filtros.

src/pages/nosotros.html
Página informativa sobre el criadero.

Responsabilidad:

presentar información institucional;

reutilizar la identidad visual definida por los estilos globales.

src/pages/admin.html
Panel de administración interno.

Responsabilidad:

interfaz para la gestión y alta/edición de ejemplares en el catálogo.

src/js/app.js
Punto de entrada principal de JavaScript.

Responsabilidad:

inicializar la aplicación;

coordinar los módulos de catalog.js y modal.js;

ejecutar la carga inicial de datos.

src/js/supabase-config.js
Configuración de la conexión con Supabase.

Responsabilidad:

almacenar/configurar los parámetros necesarios para conectar el frontend con Supabase;

exportar la instancia de cliente utilizada por otros módulos.

src/js/catalog.js
Lógica principal del catálogo y filtros.

Responsabilidad:

consultar los ejemplares en Supabase;

filtrar datos por genética, disponibilidad, sexo, año y precio;

generar las tarjetas dinámicas e insertarlas en el DOM;

gestionar eventos para la apertura del modal al hacer clic en las tarjetas.

src/js/modal.js
Lógica del modal de vista rápida (Ficha ampliada).

Responsabilidad:

desplegar detalles completos de un ejemplar seleccionado;

controlar la galería de imágenes secundarias y miniaturas;

implementar el zoom dinámico relativo al mover el cursor sobre la imagen principal;

gestionar la navegación entre ejemplares mediante botones laterales o teclas de dirección;

construir enlaces dinámicos hacia WhatsApp según la disponibilidad.

## 4. Sistema de estilos
src/styles/main.css
Punto de entrada CSS. Importa en orden las variables, bases, componentes y estilos responsivos generales.

src/styles/0-settings/variables.css
Variables de diseño centralizadas (colores, fuentes, radios, sombras).

src/styles/2-base/reset.css y typography.css
Normalización del navegador y jerarquía tipográfica adaptativa.

src/styles/3-components/
header.css: Encabezado, navegación y botón de contacto.

card.css: Filtros sticky, layout en grid y diseño de tarjetas.

modal.css: Layout overlay, visor de imágenes con zoom dinámico y ficha de detalles.

footer.css: Pie de página institucional.

---

## 5. Flujo de datos
index.html
    ↓
app.js
  ├──> catalog.js ──> supabase-config.js ──> Supabase ──> DOM (Tarjetas + Filtros)
  └──> modal.js ──> Galería / Zoom / Navegación ──> DOM (Modal Overlay)
---

## 6. Funcionalidades actuales
[x] Conexión y consulta en tiempo real con Supabase.

[x] Renderizado dinámico de tarjetas y contadores.

[x] Sistema de filtrado múltiple (genética, estado, sexo, año, precio).

[x] Modal de vista rápida ampliada con enlace mediante URL (#ID).

[x] Galería de imágenes secundarias e interacción con miniaturas.

[x] Zoom dinámico en la imagen del modal guiado por el cursor.

[x] Navegación secuencial entre ejemplares en el modal (flechas/botones).

[x] Integración directa con WhatsApp adaptando el mensaje al estatus del ejemplar.

[x] Diseño responsivo adaptado a móviles (grid de 2 columnas y tipografía compacta).

---

## 7. Tecnologías Tecnología Uso / Vite Servidor y tooling de desarrollo / JavaScript ES6+Lógica modular (ES Modules) / SupabaseBase de datos y backend / CSS3 (BEM / Modular)Estilos, Flexbox, Grid y Media Queries / HTML5Estructura semántica

---

## 8. Instalación y ejecución
# Instalación de dependencias
npm install

# Servidor de desarrollo
npm run dev

---

##  9. Guía rápida para modificaciones
SolicitudArchivo principal a revisarCambiar colores / fuentessrc/styles/0-settings/variables.cssCambiar diseño de tarjetassrc/styles/3-components/card.cssCambiar vista rápida / modalsrc/styles/3-components/modal.css / src/js/modal.jsCambiar encabezadosrc/styles/3-components/header.cssCambiar lógica de filtros o consultasrc/js/catalog.jsCambiar conexión Supabasesrc/js/supabase-config.jsModificar panel de administraciónsrc/pages/admin.html

---