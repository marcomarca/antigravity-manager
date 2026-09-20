# Guía de Ejecución y Pruebas — Antigravity Project Launcher

Esta guía describe cómo levantar el entorno de desarrollo, ejecutar las pruebas automatizadas y validar manualmente cada funcionalidad del launcher en Windows.

---

## 1. Prerrequisitos

- **OS**: Windows 10/11 (64-bit).
- **Runtime**: [Bun](https://bun.sh/) (v1.1+ recomendado) o Node.js v20+.
- **Antigravity IDE** instalado o ejecutable configurado (opcional si solo se prueba la UI/gestión de carpetas).

---

## 2. Comandos Principales

Ejecuta los siguientes comandos desde la raíz del proyecto (`d:\apps-2026\antigravity-manager`):

### 2.1. Instalar dependencias
```bash
bun install
```

### 2.2. Ejecutar suite de pruebas y chequeo de tipos
```bash
bun run check
```
*(Ejecuta `tsc --noEmit` y `bun test` en paralelo/secuencia).*

### 2.3. Ejecutar solo pruebas unitarias e integración
```bash
bun test
```

### 2.4. Compilar y levantar la aplicación en modo desarrollo
```bash
bun run dev
```
*(Compila el proceso Main, Preload y Renderer con esbuild e inicia Electron).*

### 2.5. Generar ejecutable distribuible (.exe)
```bash
bun run package
```
*(Genera el instalador y portable en la carpeta `release`).*

### 2.6. Publicar Release y Activar Auto-Update
```bash
bun run release
```
*(Ejecuta chequeo de tipos, pruebas, compila binarios y sube a GitHub Releases todos los archivos requeridos: `latest.yml`, blockmaps, setup y portable para habilitar actualizaciones automáticas).*

---

## 3. Matriz de Pruebas Manuales

Una vez levantada la aplicación con `bun run dev`, valida los siguientes flujos funcionales:

### Flujo 1: Atajo Global y System Tray
1. Oprime `Ctrl+Alt+Space` en cualquier lugar de Windows: la ventana del launcher debe mostrarse y tomar foco en el buscador.
2. Presiona `Escape`: la ventana debe ocultarse.
3. Vuelve a presionar `Ctrl+Alt+Space`: la ventana debe reaparecer limpia.
4. Verifica el ícono en la bandeja del sistema (System Tray):
   - Clic derecho -> "Open Launcher" / "Settings" / "Quit".

### Flujo 2: Búsqueda y Navegación con Teclado
1. Escribe el nombre de un proyecto existente o una palabra clave contenida en una nota.
2. Navega con las flechas `ArrowUp` y `ArrowDown`.
3. Presiona `Enter` sobre un proyecto seleccionado para solicitar la apertura en Antigravity IDE.
4. Presiona `Tab` para mover el foco hacia el panel lateral de notas.

### Flujo 3: Creación de Proyecto Vacío
1. Presiona `Ctrl+N` o haz clic en el botón `+ New Project`.
2. Ingresa un nombre válido (ej. `mi-nuevo-proyecto`) y presiona `Enter`.
3. Verifica que la carpeta sea creada en la ruta configurada (`projectsRoot`) y que la aplicación intente abrirla.
4. **Validación de errores**: Intenta crear un proyecto con caracteres inválidos de Windows (`<`, `>`, `:`, `"`, `/`, `\`, `|`, `?`, `*`) o con un nombre existente para verificar el mensaje de colisión.

### Flujo 4: Importación por Drag & Drop de Markdown
1. Arrastra un archivo `.md` (ej. `especificacion-proyecto.md`) y suéltalo sobre la ventana del launcher.
2. Comprueba que:
   - Se cree la carpeta con el nombre derivado del markdown.
   - El archivo `.md` se copie dentro de la nueva carpeta del proyecto.
   - Se seleccione o abra el proyecto creado.

### Flujo 5: Notas Rápidas por Proyecto
1. Selecciona cualquier proyecto de la lista.
2. Escribe una nota en el área de texto del panel lateral.
3. Verifica el indicador visual "Guardado".
4. Reinicia la aplicación (`bun run dev`) y comprueba que la nota persista.

### Flujo 6: Integración con ChatGPT (Prompt Generator)
1. Presiona `Ctrl+Shift+P` o haz clic en el botón `Plan with ChatGPT`.
2. Valida que se copie el prompt estructurado al portapapeles y se abra la URL de ChatGPT en el navegador predeterminado.

### Flujo 7: Configuración Local
1. Presiona `Ctrl+,` o haz clic en el ícono de engranaje (Settings).
2. Modifica:
   - La carpeta raíz de proyectos (`projectsRoot`).
   - El atajo global (ej. `Ctrl+Shift+Space`).
   - El inicio automático con Windows.
3. Guarda los cambios y verifica que las nuevas configuraciones surtan efecto inmediatamente.

---

## 4. Estructura de Datos Persistentes

Los archivos de configuración y metadata local se almacenan en:
`%APPDATA%\Antigravity Project Launcher\`
- `config.json`: Configuración general de la aplicación.
- `metadata.json`: Notas y etiquetas asociadas a rutas canónicas de proyectos.
