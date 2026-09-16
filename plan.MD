# Antigravity Project Launcher — Especificación V1

## 1. Objetivo

Aplicación local para Windows 11 que reduzca al mínimo la fricción para:

```text
abrir proyecto existente
crear proyecto vacío
crear proyecto desde planificación Markdown
iniciar opcionalmente una planificación en ChatGPT
recordar notas asociadas a proyectos
```

Flujo objetivo:

```text
hotkey → proyecto → Enter → Antigravity IDE
```

Creación básica:

```text
hotkey → New Project → nombre → Enter
→ crear carpeta
→ abrir Antigravity IDE
```

Creación desde Markdown:

```text
arrastrar proyecto.md
→ carpeta "proyecto"
→ copiar proyecto.md dentro
→ abrir Antigravity IDE
```

Planificación opcional:

```text
Plan with ChatGPT
→ abrir ChatGPT
→ pegar prompt
→ conversación
→ obtener proyecto.md
→ arrastrarlo al launcher
→ proyecto creado
```

**ChatGPT NO es requisito para crear proyectos.**

---

# 2. Principios

```text
[R] Windows 11.
[R] Antigravity IDE es el editor objetivo.
[R] Keyboard-first.
[R] Operación completamente local salvo ChatGPT opcional.
[R] Proyectos = carpetas/workspaces reales.
[R] AppData almacena configuración y metadata propia.
[R] Markdown puede materializar un proyecto.
[R] ChatGPT es un acelerador opcional.
[D] Antigravity sigue siendo dueño de su historial de recientes.
[D] El launcher no modifica directamente la DB de Antigravity.
[A] Sin backend.
[A] Sin cuentas.
[A] Sin cloud sync.
[A] Sin API de OpenAI V1.
[A] Electron + Node.js + TypeScript.
[A] UI vanilla HTML/CSS/TypeScript.
```

---

# 3. Alcance

## IN

* global hotkey;
* ventana launcher;
* proyectos recientes de Antigravity IDE;
* proyectos encontrados bajo `projectsRoot`;
* búsqueda por nombre, ruta y nota;
* apertura de proyectos;
* creación manual por nombre;
* creación mediante drag & drop de `.md`;
* copia del Markdown al proyecto;
* planificación opcional con ChatGPT;
* notas por proyecto;
* configuración local;
* system tray;
* inicio con Windows;
* empaquetado `.exe`.

## OUT V1

* Git management;
* `git init` automático;
* templates;
* stacks/framework generators;
* terminal integrada;
* editor;
* file explorer propio;
* tareas;
* Kanban;
* tags;
* prioridades estructuradas;
* sincronización cloud;
* cuentas;
* colaboración;
* OpenAI API;
* almacenamiento de conversaciones;
* renombrado/movimiento de proyectos;
* eliminación de proyectos;
* parsing semántico del Markdown.

---

# 4. Flujos

## 4.1 Abrir proyecto

```text
global hotkey
→ mostrar launcher
→ cargar proyectos
→ focus búsqueda
→ usuario escribe
→ filtrar
→ ↑/↓ seleccionar
→ Enter
→ spawn Antigravity(path)
→ ocultar launcher
```

También:

```text
click proyecto
→ abrir
```

---

## 4.2 Crear proyecto manualmente

```text
New Project
→ nombre
→ validate
→ <projectsRoot>\<nombre>
→ comprobar colisión
→ mkdir
→ abrir Antigravity
```

Ejemplo:

```text
nombre: Invoice API

C:\Users\User\Projects\Invoice API\
```

No se crea ningún archivo obligatorio.

---

## 4.3 Crear proyecto desde Markdown

Entrada:

```text
Invoice API.md
```

Resultado:

```text
<projectsRoot>\
└── Invoice API\
    └── Invoice API.md
```

Flujo:

```text
drop .md
→ obtener filePath
→ basename sin ".md"
→ validar nombre
→ calcular destination
→ comprobar colisión
→ mkdir
→ copiar Markdown
→ abrir Antigravity
```

No requiere haber utilizado previamente:

```text
Plan with ChatGPT
```

Puede utilizarse con cualquier `.md`.

---

## 4.4 Planificar con ChatGPT

```text
New Project
→ Plan with ChatGPT
→ cargar planningPrompt
→ copiar prompt
→ abrir/focalizar ChatGPT
→ comprobar foreground window
→ pegar prompt
→ usuario continúa manualmente
```

Después:

```text
ChatGPT
→ planificación final
→ usuario obtiene <project-name>.md
→ arrastra archivo al launcher
→ proyecto creado
```

No existe estado obligatorio compartido entre:

```text
ChatGPT planning
y
Markdown import
```

Son funcionalidades desacopladas.

---

## 4.5 Añadir/editar nota

```text
seleccionar proyecto
→ Edit Note
→ textarea
→ modificar
→ debounce
→ atomic save state.json
```

Ejemplo:

```text
Pendiente porque todavía no tengo acceso a la API del cliente.
```

La nota no se escribe dentro del proyecto.

---

# 5. UX principal

Ventana:

```text
┌─────────────────────────────────────────────────┐
│ 🔎 Search projects...                           │
├─────────────────────────────────────────────────┤
│ Invoice API                                     │
│ C:\...\Projects\Invoice API                     │
│ Pendiente: conseguir credenciales API           │
│                                                 │
│ Project Launcher                                │
│ C:\...\Projects\Project Launcher                │
│                                                 │
│ Website                                         │
│ D:\Clients\Website                              │
├─────────────────────────────────────────────────┤
│ + New Project                             Ctrl+N │
└─────────────────────────────────────────────────┘
```

Interacción:

```text
global hotkey  → mostrar/ocultar
↑ ↓            → navegar
Enter          → abrir
Ctrl+N         → nuevo proyecto
Esc            → cerrar
```

---

# 6. UX — New Project

```text
┌───────────────────────────────────────────────┐
│ New Project                                   │
│                                               │
│ Project name                                  │
│ [___________________________________________] │
│                                               │
│ [ Create Project ]                            │
│                                               │
│ ───────────────── OR ─────────────────────── │
│                                               │
│ [ Plan with ChatGPT ]                         │
│                                               │
│ ┌───────────────────────────────────────────┐ │
│ │ Drop a planning Markdown here            │ │
│ │                                           │ │
│ │ filename.md → filename\filename.md       │ │
│ └───────────────────────────────────────────┘ │
└───────────────────────────────────────────────┘
```

Los tres caminos son independientes:

```text
A. nombre → Create
B. Plan with ChatGPT
C. drop Markdown
```

---

# 7. Regla Markdown → proyecto

Función conceptual:

```ts
importMarkdown("C:\\Downloads\\Invoice API.md")
```

Derivación:

```text
sourceFilename = Invoice API.md
stem           = Invoice API
projectName    = Invoice API
projectPath    = <projectsRoot>\Invoice API
planPath       = <projectsRoot>\Invoice API\Invoice API.md
```

Implementación:

```ts
async function importMarkdown(source: string) {
  assertMarkdown(source)

  const filename = path.basename(source)
  const projectName = sanitizeProjectName(
    path.basename(filename, path.extname(filename))
  )

  const projectPath = path.join(projectsRoot, projectName)

  assertInsideProjectsRoot(projectPath)
  assertNoCollision(projectPath)

  await fs.mkdir(projectPath)
  await fs.copyFile(
    source,
    path.join(projectPath, filename)
  )

  await antigravity.open(projectPath)
}
```

---

# 8. Colisiones

## Manual

Si existe:

```text
<projectsRoot>\Invoice API
```

y usuario intenta crear:

```text
Invoice API
```

mostrar:

```text
Project already exists.

[ Open Existing ]
[ Cancel ]
```

No crear:

```text
Invoice API (2)
```

automáticamente.

---

## Markdown

Si:

```text
Invoice API\
```

ya existe y se arrastra:

```text
Invoice API.md
```

mostrar:

```text
A project named "Invoice API" already exists.

[ Open Existing ]
[ Copy Markdown Into Existing ]
[ Cancel ]
```

`Copy Markdown Into Existing`:

```text
si Invoice API.md no existe
→ copiar

si ya existe
→ pedir Replace / Cancel
```

Nunca sobrescribir sin interacción explícita.

---

# 9. Validación de nombres

Rechazar:

```text
vacío
.
..
```

Caracteres Windows inválidos:

```text
< > : " / \ | ? *
```

Nombres reservados:

```text
CON
PRN
AUX
NUL
COM1..COM9
LPT1..LPT9
```

También:

```text
trailing space
trailing period
```

No introducir automáticamente slug/kebab-case.

```text
"My Finance Tool"
```

permanece:

```text
My Finance Tool
```

---

# 10. Descubrimiento de proyectos

Dos fuentes:

```text
AntigravityRecentProvider
        +
ProjectsRootProvider
        ↓
ProjectDiscoveryService
        ↓
deduplicate canonical path
```

---

## 10.1 Antigravity recientes

Lectura únicamente.

Ruta esperada:

```text
%APPDATA%\Antigravity IDE\User\globalStorage\state.vscdb
```

Consulta conceptual:

```sql
SELECT value
FROM ItemTable
WHERE key = 'history.recentlyOpenedPathsList';
```

Luego:

```text
JSON
→ recent folders/workspaces
→ decode URI
→ normalize Windows path
→ comprobar existencia
```

Regla:

```text
state.vscdb = READ ONLY
```

Nunca:

```text
INSERT
UPDATE
DELETE
```

---

## 10.2 Projects root

Default:

```text
%USERPROFILE%\Projects
```

Si existe:

```text
enumerar hijos directos
```

Ejemplo:

```text
Projects\
├── Invoice API
├── Website
└── Launcher
```

No hacer recursión profunda.

Un proyecto = carpeta hija directa.

`projectsRoot` configurable.

---

## 10.3 Deduplicación

Canonicalización:

```text
resolve absolute path
→ normalize separators
→ remove trailing separator
→ lowercase para comparison key
```

Ejemplo:

```text
C:\Projects\App
c:\projects\app\
```

= mismo proyecto.

---

# 11. Modelo de dominio

```ts
type ProjectType =
  | "folder"
  | "workspace"

type ProjectSource = {
  antigravityRecent: boolean
  projectsRoot: boolean
}

type Project = {
  path: string
  name: string
  type: ProjectType

  exists: boolean

  source: ProjectSource

  recentIndex?: number

  note?: string
}
```

`Project` se construye en runtime.

No persistir todo el objeto.

---

# 12. Metadata persistente

Persistir únicamente datos propios:

```ts
type ProjectMetadata = {
  note?: string
}
```

Key:

```text
canonical project path
```

---

# 13. AppData

```text
%APPDATA%\Antigravity Project Launcher\
├── config.json
├── state.json
└── logs\
```

No guardar datos dentro de:

```text
Program Files
projectsRoot
Antigravity AppData
```

salvo el Markdown explícitamente importado.

---

# 14. config.json

```json
{
  "version": 1,
  "projectsRoot": "C:\\Users\\User\\Projects",
  "hotkey": "Ctrl+Alt+Space",
  "launchAtStartup": true,
  "antigravityExecutable": null,
  "chatgptMode": "auto"
}
```

`antigravityExecutable = null`:

```text
usar autodetection
```

`chatgptMode`:

```text
auto
desktop
web
```

V1 UI puede exponer solo:

```text
projectsRoot
hotkey
launchAtStartup
```

Los demás pueden resolverse automáticamente.

---

# 15. state.json

```json
{
  "version": 1,
  "projects": {
    "c:\\users\\user\\projects\\invoice api": {
      "note": "Pendiente: conseguir credenciales API."
    },
    "d:\\clients\\website": {
      "note": "Revisar nueva propuesta antes de continuar."
    }
  }
}
```

---

# 16. Escritura segura del estado

No:

```text
write directamente state.json
```

Sí:

```text
serialize
→ state.json.tmp
→ close
→ rename state.json.tmp → state.json
```

Resultado:

```text
escritura atómica práctica
→ menor riesgo de corrupción
```

Autosave notas:

```text
input
→ debounce 300–500 ms
→ save
```

---

# 17. Limitación conocida: rename/move

Metadata ligada a:

```text
canonical path
```

Si:

```text
C:\Projects\Foo
```

se renombra externamente a:

```text
C:\Projects\Bar
```

la V1 no puede demostrar que ambos sean el mismo proyecto.

Resultado:

```text
nota antigua queda asociada a path antiguo
```

Decisión:

```text
LATER
```

No introducir File IDs ni sidecars en V1.

---

# 18. Búsqueda

Input:

```text
query
```

Buscar sobre:

```text
project.name
project.path
project.note
```

Normalización:

```text
lowercase
trim
remove duplicate whitespace
```

Ranking básico:

```text
exact name
→ name startsWith
→ name includes
→ note includes
→ path includes
```

No introducir motor de búsqueda externo.

Con:

```text
<1000 proyectos
```

el filtrado en memoria es suficiente.

---

# 19. Orden inicial

Sin query:

```text
1. Antigravity recientes, por recentIndex
2. resto de projectsRoot, alfabético
```

Un proyecto presente en ambas fuentes aparece una sola vez.

---

# 20. Apertura en Antigravity IDE

Servicio:

```ts
interface AntigravityLauncher {
  locate(): Promise<string>
  open(target: string): Promise<void>
}
```

Operación:

```text
resolve executable
→ spawn(executable, [projectPath])
→ detached
→ unref
```

Conceptualmente:

```ts
spawn(executable, [projectPath], {
  detached: true,
  stdio: "ignore"
}).unref()
```

No bloquear el launcher esperando que Antigravity termine.

---

# 21. Localización de Antigravity

Orden:

```text
1. config.antigravityExecutable válido
2. paths de instalación conocidos
3. PATH / shortcuts detectables
4. pedir selección manual del .exe
5. guardar selección
```

Una ruta detectada debe verificarse con:

```text
fs.access()
```

No guardar paths hardcoded con username.

---

# 22. Adaptador de recientes de Antigravity

```ts
interface RecentProjectsProvider {
  list(): Promise<RecentProject[]>
}
```

Implementación:

```text
AntigravityStateDbProvider
```

Responsabilidad única:

```text
state.vscdb
→ datos normalizados
```

Si Antigravity cambia su almacenamiento:

```text
reemplazar provider
```

No afectar UI ni lógica de proyectos.

---

# 23. Fallo de Antigravity DB

```text
state.vscdb inexistente
→ continuar

SQLite locked/error
→ continuar

JSON incompatible
→ continuar
```

Fallback:

```text
ProjectsRootProvider
```

La aplicación no debe fallar porque Antigravity cambie su historial.

---

# 24. Planificación con ChatGPT

Interfaz:

```ts
interface PlanningLauncher {
  start(prompt: string): Promise<void>
}
```

Servicio:

```text
PlanningService
└── ChatGPTPlanningLauncher
```

---

# 25. Prompt de planificación

Guardar como recurso local:

```text
resources/
└── planning-prompt.md
```

No hardcodear un string enorme dentro de:

```ts
main.ts
```

El prompt debe pedir a ChatGPT:

```text
convertir idea ambigua → especificación implementable
hacer pocas preguntas de alto impacto
inferir defaults
definir alcance
requisitos
modelo
flujos
arquitectura
stack
riesgos
plan de implementación
criterios de aceptación
proponer nombre adecuado
entregar resultado final Markdown
usar nombre de proyecto como nombre del .md
```

---

# 26. Automatización ChatGPT

No usar únicamente:

```text
sleep(3000)
→ Ctrl+V
```

Flujo:

```text
planning.start()
→ clipboard.writeText(prompt)
→ ChatGPTLauncher.open()
→ localizar ventana
→ foreground/focus
→ verificar foreground
→ enviar Ctrl+V
```

Condición obligatoria:

```text
target window == ChatGPT
```

solo entonces:

```text
paste
```

Si no puede garantizarse:

```text
prompt queda en clipboard
→ notification:
"Prompt copied. Paste it into ChatGPT."
```

Nunca enviar `Ctrl+V` a una ventana desconocida.

---

# 27. Abrir ChatGPT

Modo:

```text
auto
```

Resolución:

```text
ChatGPT desktop instalado
→ usar desktop

else
→ abrir https://chatgpt.com/
```

Esto está encapsulado.

No debe afectar al flujo Markdown.

---

# 28. Envío automático

V1:

```text
pegar prompt
→ NO presionar Enter
```

Motivo:

```text
usuario puede revisar/modificar
menor riesgo de enviar algo incorrectamente
```

Configurable posteriormente:

```text
autoSubmitPrompt
```

pero:

```text
LATER
```

---

# 29. Drag & Drop Markdown

Renderer recibe archivo.

Validación:

```text
exactamente 1 archivo
extensión case-insensitive == .md
archivo legible
```

Si se arrastran varios:

```text
reject
→ "Drop one Markdown file at a time."
```

V1 no crea múltiples proyectos simultáneamente.

---

# 30. Electron file path

No depender de:

```text
File.path
```

como contrato permanente.

Preload debe exponer una operación controlada para resolver el path del archivo arrastrado mediante las APIs actuales de Electron.

Flujo:

```text
renderer File
→ preload
→ absolute local path
→ IPC importMarkdown(path)
```

---

# 31. Arquitectura

```text
┌────────────────────────────────────────┐
│ Renderer                               │
│                                        │
│ Launcher UI                            │
│ New Project UI                         │
│ Settings UI                            │
│ Notes UI                               │
└─────────────────┬──────────────────────┘
                  │ typed IPC
┌─────────────────▼──────────────────────┐
│ Preload                                │
│                                        │
│ window.app.projects.*                  │
│ window.app.planning.*                  │
│ window.app.settings.*                  │
└─────────────────┬──────────────────────┘
                  │
┌─────────────────▼──────────────────────┐
│ Electron Main                          │
│                                        │
│ ProjectDiscoveryService                │
│ ProjectService                         │
│ ProjectMetadataService                 │
│ PlanningService                        │
│ AntigravityLauncher                    │
│ ConfigService                          │
│ HotkeyService                          │
└──────┬───────────┬──────────┬─────────┘
       │           │          │
       ▼           ▼          ▼
 filesystem    state.vscdb  Windows/ChatGPT
```

---

# 32. Seguridad Electron

BrowserWindow:

```ts
webPreferences: {
  contextIsolation: true,
  nodeIntegration: false,
  sandbox: true,
  preload
}
```

Renderer no obtiene directamente:

```text
fs
child_process
shell
SQLite
arbitrary IPC
```

Todo pasa por APIs limitadas.

---

# 33. IPC público

```ts
projects.list()

projects.open({
  path
})

projects.create({
  name
})

projects.importMarkdown({
  filePath
})

projects.setNote({
  path,
  note
})

planning.start()

settings.get()

settings.update({
  ...
})
```

No crear:

```ts
execute(command, args)
runShell(command)
readFile(path)
writeFile(path)
```

como APIs genéricas para renderer.

---

# 34. Validación IPC

El main process vuelve a validar todo.

Nunca confiar solo en renderer.

Ejemplo:

```text
projects.open(path)
→ canonicalize
→ exists
→ folder/workspace permitido
→ launch
```

Import Markdown:

```text
file exists
→ regular file
→ .md
→ filename válido
→ destination dentro projectsRoot
```

---

# 35. Servicios

```ts
ProjectDiscoveryService
  list(): Promise<Project[]>

ProjectService
  create(name): Promise<Project>
  importMarkdown(filePath): Promise<Project>
  open(path): Promise<void>

ProjectMetadataService
  get(path): ProjectMetadata
  setNote(path, note): Promise<void>

AntigravityLauncher
  locate(): Promise<string>
  open(path): Promise<void>

RecentProjectsProvider
  list(): Promise<RecentProject[]>

ProjectsRootProvider
  list(): Promise<Project[]>

PlanningService
  start(): Promise<void>

PlanningLauncher
  start(prompt): Promise<void>

ConfigService
  get(): Config
  update(patch): Promise<Config>
```

---

# 36. Estructura del proyecto

```text
antigravity-project-launcher/
├── package.json
├── tsconfig.json
├── electron-builder.yml
│
├── resources/
│   ├── icon.ico
│   └── planning-prompt.md
│
├── src/
│   ├── main/
│   │   ├── main.ts
│   │   ├── window.ts
│   │   ├── hotkeys.ts
│   │   ├── tray.ts
│   │   │
│   │   ├── antigravity/
│   │   │   ├── locator.ts
│   │   │   ├── launcher.ts
│   │   │   ├── recent-provider.ts
│   │   │   └── state-db-provider.ts
│   │   │
│   │   ├── projects/
│   │   │   ├── project-service.ts
│   │   │   ├── discovery-service.ts
│   │   │   ├── root-provider.ts
│   │   │   ├── import-markdown.ts
│   │   │   ├── validation.ts
│   │   │   └── canonical-path.ts
│   │   │
│   │   ├── planning/
│   │   │   ├── planning-service.ts
│   │   │   ├── prompt-loader.ts
│   │   │   ├── chatgpt-launcher.ts
│   │   │   └── windows-automation.ts
│   │   │
│   │   ├── metadata/
│   │   │   └── metadata-service.ts
│   │   │
│   │   ├── config/
│   │   │   └── config-service.ts
│   │   │
│   │   └── ipc/
│   │       ├── projects-ipc.ts
│   │       ├── planning-ipc.ts
│   │       └── settings-ipc.ts
│   │
│   ├── preload/
│   │   ├── preload.ts
│   │   └── types.ts
│   │
│   └── renderer/
│       ├── index.html
│       ├── app.ts
│       ├── state.ts
│       ├── search.ts
│       │
│       ├── components/
│       │   ├── launcher.ts
│       │   ├── project-row.ts
│       │   ├── new-project.ts
│       │   ├── markdown-dropzone.ts
│       │   ├── note-editor.ts
│       │   └── settings.ts
│       │
│       └── styles/
│           └── app.css
│
└── tests/
    ├── unit/
    └── integration/
```

---

# 37. Stack

| Herramienta             | Función               | Motivo                        |
| ----------------------- | --------------------- | ----------------------------- |
| Electron                | desktop shell         | hotkeys, tray, window, Node   |
| TypeScript              | app                   | contratos + IPC seguro        |
| Node.js                 | filesystem/processes  | APIs suficientes              |
| HTML/CSS/TS             | renderer              | UI pequeña; React innecesario |
| SQLite reader           | recientes Antigravity | leer `state.vscdb`            |
| electron-builder        | packaging             | instalador Windows            |
| Node test runner/Vitest | tests                 | lógica aislada                |

No usar:

```text
Express
Nest
Next.js
Redux
Prisma
PostgreSQL
Redis
Docker
Kubernetes
```

---

# 38. SQLite dependency

Encapsular completamente:

```text
AntigravityStateDbProvider
```

Puede utilizar:

```text
better-sqlite3
```

en modo read-only.

Si el packaging del módulo nativo genera problemas:

```text
cambiar implementación
```

sin modificar dominio/UI.

---

# 39. Ventana

Características:

```text
frameless
small
centered
always-on-top mientras visible
hidden by default
hide on blur
```

No mantener una aplicación grande permanentemente visible.

Comportamiento:

```text
hotkey cuando hidden
→ show + focus

hotkey cuando visible
→ hide

Esc
→ hide

focus lost
→ hide
```

Excepto cuando:

```text
dialog/modal interno activo
```

---

# 40. Tray

Menú mínimo:

```text
Open Launcher
New Project
Settings
Quit
```

Tray no debe ser requisito para interacción habitual.

---

# 41. Startup

Setting:

```text
launchAtStartup: true
```

Al iniciar Windows:

```text
launch app
→ registrar hotkey
→ NO mostrar ventana
→ quedar en tray/background
```

---

# 42. Hotkey

Default:

```text
Ctrl+Alt+Space
```

Configurable.

Si registro falla:

```text
mostrar error en settings
→ no crash
```

---

# 43. Notas

Nota:

```text
plain text
multiline
```

No Markdown obligatorio.

Límite defensivo:

```text
~10–50 KB por nota
```

No hace falta imponerlo visualmente salvo abuso.

Search incluye notas.

---

# 44. Features

| Feature               |      Valor |   Coste | Riesgo | Decisión |
| --------------------- | ---------: | ------: | -----: | -------- |
| Global hotkey         |       alto |    bajo |   bajo | MUST     |
| Recientes Antigravity |       alto |   medio |  medio | MUST     |
| Scan projectsRoot     |       alto |    bajo |   bajo | MUST     |
| Search                |       alto |    bajo |   bajo | MUST     |
| Open project          |       alto |    bajo |   bajo | MUST     |
| Manual create         |       alto |    bajo |   bajo | MUST     |
| Markdown → project    |       alto |    bajo |   bajo | MUST     |
| Copiar Markdown       |       alto |    bajo |   bajo | MUST     |
| Project notes         |       alto |    bajo |   bajo | MUST     |
| ChatGPT planning      | medio/alto |   medio |  medio | SHOULD   |
| Tray                  |      medio |    bajo |   bajo | SHOULD   |
| Windows startup       |      medio |    bajo |   bajo | SHOULD   |
| Search notes          |      medio | trivial |   bajo | SHOULD   |
| Auto-submit ChatGPT   |       bajo |    bajo |  medio | LATER    |
| Templates             |      medio |   medio |  medio | LATER    |
| Git init              |      medio |    bajo |   bajo | LATER    |
| Project priority      |      medio |    bajo |   bajo | LATER    |
| Tags                  |       bajo |   medio |   bajo | LATER    |
| Rename tracking       |       bajo |   medio |  medio | LATER    |
| OpenAI API            |       bajo |   medio |  medio | NO V1    |
| Embedded chat         |       bajo |    alto |   alto | NO       |
| Own projects DB       |       bajo |   medio |  medio | NO       |
| Cloud sync            |       bajo |    alto |   alto | NO       |

---

# 45. Edge cases

### Proyecto reciente eliminado

```text
path no existe
→ ocultar de lista normal
```

Opcional posterior:

```text
Show missing
```

---

### projectsRoot no existe

```text
crear cuando se crea primer proyecto
```

No es necesario crearlo al arrancar.

---

### Markdown source desaparece durante drop

```text
copy falla
→ rollback carpeta recién creada si quedó vacía
→ mostrar error
```

---

### mkdir funciona pero copy falla

```text
si carpeta fue creada por esta operación y está vacía
→ eliminarla
```

---

### copy funciona pero Antigravity falla

No borrar proyecto.

```text
proyecto ya fue creado correctamente
→ mostrar "Project created, Antigravity could not be opened."
```

---

### Antigravity no instalado/localizado

```text
proyecto permanece
→ pedir localizar executable
```

---

### Nota con proyecto inexistente

Mantener metadata.

No borrar automáticamente; el proyecto podría estar temporalmente desconectado.

---

### Workspace `.code-workspace`

Proyecto reciente:

```text
type = workspace
path = file .code-workspace
```

Abrir directamente ese archivo con Antigravity.

No tratarlo como projectsRoot folder.

---

### Hotkey ocupado

```text
register fails
→ notification
→ Settings
```

---

### ChatGPT no se puede focalizar

```text
NO keyboard injection
→ prompt queda copiado
→ informar al usuario
```

---

# 46. Errores

Modelo simple:

```ts
type AppErrorCode =
  | "PROJECT_EXISTS"
  | "INVALID_PROJECT_NAME"
  | "INVALID_MARKDOWN"
  | "PROJECT_ROOT_UNAVAILABLE"
  | "ANTIGRAVITY_NOT_FOUND"
  | "ANTIGRAVITY_LAUNCH_FAILED"
  | "CHATGPT_LAUNCH_FAILED"
  | "CHATGPT_FOCUS_FAILED"
  | "STATE_READ_FAILED"
  | "STATE_WRITE_FAILED"
```

Renderer recibe:

```text
code
message
recoverable
```

No stack traces al usuario.

---

# 47. Logging

Archivo:

```text
%APPDATA%\Antigravity Project Launcher\logs\app.log
```

Guardar:

```text
startup
Antigravity discovery
recent DB failures
project create/import
launch failures
config/state errors
```

No guardar:

```text
contenido de notas
contenido Markdown
planning prompt completo
conversaciones
```

---

# 48. Performance

Objetivos V1:

```text
hotkey → ventana visible: <150 ms percibidos
search 1000 projects: <16 ms por update típico
project listing: <500 ms normal
```

No hacer SQLite + filesystem completo cada keystroke.

Al abrir:

```text
load projects
→ cache en memoria
```

Refresh:

```text
window show
manual refresh
después de create/import
```

---

# 49. Concurrencia

Evitar dos importaciones simultáneas con mismo destino.

Operación:

```text
check
→ mkdir
```

`mkdir` es autoridad final.

Aunque dos operaciones pasen `exists()`:

```text
segunda mkdir falla
→ PROJECT_EXISTS
```

No confiar únicamente en pre-check.

---

# 50. Seguridad de paths

Regla crítica:

```text
destination = resolve(projectsRoot, projectName)
```

Luego:

```text
destination debe ser descendiente directo de projectsRoot
```

Evita:

```text
..\..\Windows
```

Aunque la validación del nombre ya debería impedirlo.

Defensa duplicada.

---

# 51. Plan de implementación

## P0 — Shell

Implementar:

```text
Electron bootstrap
single instance
BrowserWindow
hide/show
global hotkey
Esc
hide on blur
tray básico
```

Verificación:

```text
hotkey → launcher
Esc → hidden
segunda instancia → no duplica procesos
```

---

## P1 — Antigravity Launcher

Implementar:

```text
locate executable
manual fallback
spawn project path
```

Verificación:

```text
seleccionar carpeta conocida
→ Antigravity la abre
```

---

## P2 — Project Discovery

Implementar:

```text
ProjectsRootProvider
AntigravityStateDbProvider
merge
canonicalize
deduplicate
sort
```

Verificación:

```text
recientes + root
→ lista única
```

---

## P3 — Search UI

Implementar:

```text
input
keyboard selection
filter
ranking
Enter
click
```

Verificación:

```text
1000 fixtures
→ interacción fluida
```

---

## P4 — Manual Create

Implementar:

```text
New Project
name validation
collision
mkdir
open
```

Verificación:

```text
nombre → carpeta → Antigravity
```

---

## P5 — Markdown Import

Implementar:

```text
dropzone
resolve path
.md validation
derive name
collision handling
mkdir
copy
launch
rollback parcial
```

Verificación:

```text
Foo.md
→ Foo\Foo.md
→ Antigravity
```

Este milestone completa el flujo central de planificación, incluso sin integrar ChatGPT.

---

## P6 — Project Metadata

Implementar:

```text
state.json
atomic save
notes
autosave
search notes
```

Verificación:

```text
nota
→ restart app
→ nota permanece
```

---

## P7 — ChatGPT Planning

Implementar:

```text
planning-prompt.md
clipboard
ChatGPT detection
open/focus
foreground validation
paste
safe fallback
```

Verificación:

```text
Plan with ChatGPT
→ ChatGPT
→ prompt aparece listo para enviar
```

No afecta a P5.

---

## P8 — Settings

Implementar:

```text
projectsRoot
hotkey
launchAtStartup
Antigravity fallback path
```

Verificación:

```text
restart
→ settings persist
```

---

## P9 — Packaging

Implementar:

```text
electron-builder
Windows installer
icon
startup behavior
release build
```

Verificación:

```text
clean Windows install
→ installer
→ launch
→ configure
→ create/open project
```

---

# 52. Tests unitarios

Cubrir:

```text
sanitizeProjectName
canonicalPath
project name from Markdown
destination containment
search ranking
deduplication
state serialization
collision decisions
config migration
```

Especialmente:

```text
..
CON
file.md
FILE.MD
spaces
Unicode
accented names
case-insensitive paths
```

---

# 53. Tests de integración

### Create

```text
temp root
→ create Foo
→ assert Foo exists
```

### Markdown

```text
Foo.md
→ import
→ Foo\Foo.md exists
→ contents equal
```

### Collision

```text
Foo exists
→ import Foo.md
→ no overwrite
```

### State

```text
save note
→ reload
→ same note
```

### Discovery

```text
root Foo
+
recent Foo
→ exactly one Foo
```

---

# 54. Criterios de aceptación V1

1. La app funciona en Windows 11 sin privilegios de administrador.
2. Solo puede existir una instancia del launcher.
3. Un hotkey global muestra la ventana.
4. `Esc` la oculta.
5. La navegación principal funciona completamente con teclado.
6. El launcher muestra recientes de Antigravity cuando su almacenamiento está disponible.
7. También muestra proyectos contenidos en `projectsRoot`.
8. El mismo path no aparece duplicado.
9. La búsqueda utiliza nombre, path y nota.
10. `Enter` abre el proyecto seleccionado en Antigravity IDE.
11. Crear manualmente requiere únicamente un nombre.
12. Un proyecto manual se crea bajo `projectsRoot`.
13. Un proyecto manual se abre inmediatamente en Antigravity.
14. Un `.md` puede arrastrarse sin haber utilizado ChatGPT.
15. `Foo.md` crea `<projectsRoot>\Foo`.
16. El `.md` queda copiado dentro del proyecto.
17. El proyecto importado se abre en Antigravity.
18. Una colisión nunca sobrescribe datos automáticamente.
19. Las notas persisten entre reinicios.
20. Las notas viven en AppData, no dentro de los proyectos.
21. Una falla leyendo recientes de Antigravity no bloquea la app.
22. Una falla abriendo ChatGPT no bloquea creación manual ni Markdown.
23. `Plan with ChatGPT` es opcional.
24. El prompt nunca se pega mediante keyboard injection si ChatGPT no está confirmado como ventana destino.
25. El renderer no tiene acceso directo a Node.js.
26. `state.vscdb` nunca se modifica.
27. `state.json` se actualiza mediante escritura segura.
28. Reiniciar Windows conserva settings y notas.
29. Con `launchAtStartup=true`, la app inicia oculta y registra el hotkey.
30. Instalar/desinstalar el launcher no modifica proyectos existentes.

---

# 55. Riesgos

```text
Antigravity cambia state.vscdb
→ recientes dejan de funcionar
→ adapter aislado + projectsRoot fallback

Antigravity cambia ruta executable
→ launch falla
→ autodetection + manual selection

Automatización ChatGPT cambia
→ planning button degrada
→ clipboard fallback

Electron native SQLite packaging
→ build complexity
→ adapter reemplazable

proyecto se mueve/renombra externamente
→ nota pierde asociación
→ aceptar V1; resolver después si importa

state.json corrupto
→ metadata no carga
→ atomic writes + backup opcional

hotkey conflict
→ launcher no abre por shortcut
→ setting configurable
```

---

# 56. Decisiones difíciles ya cerradas

```text
Arquitectura
→ monolito desktop Electron

Persistencia
→ JSON local; sin DB propia

Project source
→ Antigravity recents + projectsRoot

Project identity
→ canonical filesystem path

Creation
→ manual name OR Markdown

Markdown identity
→ filename determines project folder

ChatGPT
→ optional external planning accelerator

AI integration
→ no API V1

Antigravity DB
→ read-only

Renderer permissions
→ restricted IPC

Complexity
→ no backend / no cloud / no services distribuidos
```

---

# 57. Decisiones reversibles diferidas

```text
exact visual design
icons
animations
exact window size
React vs vanilla if UI grows
fuzzy-search library
auto-submit ChatGPT
Git init
templates
priorities
tags
rename tracking
backup policy beyond atomic state writes
```

Ninguna bloquea implementación.

---

# 58. Definition of Done

V1 está terminada cuando pueden ejecutarse sin configuración técnica manual estos cuatro flujos:

```text
1.
hotkey
→ buscar existente
→ Enter
→ Antigravity

2.
hotkey
→ New Project
→ nombre
→ Enter
→ carpeta
→ Antigravity

3.
hotkey
→ New Project
→ drop project.md
→ carpeta project
→ project.md copiado
→ Antigravity

4.
hotkey
→ New Project
→ Plan with ChatGPT
→ prompt en ChatGPT
→ planificación
→ project.md
→ drop
→ proyecto creado
```

Y adicionalmente:

```text
seleccionar proyecto
→ escribir nota
→ cerrar/reiniciar launcher
→ nota continúa existiendo
```

Ese conjunto constituye el producto V1.
