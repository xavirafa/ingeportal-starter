# Instalar agentes de Claude Code

Esta carpeta contiene los agentes de Claude Code listos para usar en este proyecto.

## Instalación (Windows)

Abre una terminal y ejecuta:

```bash
xcopy "_claude-config\agents\*" "C:\Users\TU-USUARIO\.claude\agents\" /E /I /Y
```

Reemplaza `TU-USUARIO` con tu nombre de usuario de Windows.

**Ejemplo:**
```bash
xcopy "_claude-config\agents\*" "C:\Users\edixo\.claude\agents\" /E /I /Y
```

Luego **reinicia VS Code** para que Claude Code cargue los nuevos agentes.

---

## Agentes incluidos (31)

| Agente | Para qué sirve |
|--------|---------------|
| `python-pro` | Código Python moderno, type hints, async |
| `backend-developer` | APIs, microservicios, FastAPI |
| `frontend-developer` | React, Vue, Angular |
| `fullstack-developer` | Features completas frontend + backend |
| `react-specialist` | Optimización React 18+, estado complejo |
| `javascript-pro` | JS moderno ES2023+, Node.js |
| `typescript-pro` | Tipos avanzados, generics |
| `ui-designer` | Diseño visual, componentes, accesibilidad |
| `frontend-design` | Interfaces de alta calidad, Tailwind |
| `api-designer` | Diseño REST/GraphQL, OpenAPI |
| `database-administrator` | PostgreSQL, alta disponibilidad |
| `database-optimizer` | Queries lentas, índices, rendimiento |
| `postgres-pro` | PostgreSQL avanzado, replicación |
| `sql-pro` | Optimización SQL compleja |
| `debugger` | Diagnóstico de bugs, análisis de errores |
| `code-reviewer` | Revisión de código, seguridad, buenas prácticas |
| `refactoring-specialist` | Refactorizar código sin romper comportamiento |
| `security-engineer` | Seguridad, CI/CD, compliance |
| `security-auditor` | Auditorías de seguridad, vulnerabilidades |
| `deployment-engineer` | CI/CD, pipelines, automatización |
| `git-workflow-manager` | Estrategias Git, branching, merge |
| `test-automator` | Tests automatizados, frameworks |
| `qa-expert` | Estrategia QA, plan de pruebas |
| `performance-engineer` | Bottlenecks, optimización de rendimiento |
| `webapp-testing` | Testing de apps web con Playwright |
| `technical-writer` | Documentación API, guías, SDK |
| `project-manager` | Planes de proyecto, riesgos, stakeholders |
| `business-analyst` | Procesos de negocio, requisitos |
| `workflow-orchestrator` | Workflows complejos, estados, transacciones |
| `error-detective` | Diagnóstico de errores en producción |
| `prompt-engineer` | Optimización de prompts para LLMs |

---

## Skills del marketplace (instalar manualmente)

Los skills se instalan desde el marketplace de Claude Code.
En la terminal del proyecto escribe `/` y busca el skill, o instálalos desde la UI de Claude Code.

Skills recomendados para este stack:
- `simplify` — revisa código cambiado y lo mejora
- `update-config` — configura comportamientos automáticos (hooks)
- `ui-ux-pro-max` — diseño UI/UX profesional con 67 estilos

---

## Actualizar cuando el template tenga nuevos agentes

```bash
git fetch upstream
git merge upstream/main
xcopy "_claude-config\agents\*" "C:\Users\TU-USUARIO\.claude\agents\" /E /I /Y
```
