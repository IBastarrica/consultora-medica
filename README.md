# Consultora Médica (Arquitectura en N Capas)

Nueva versión del TP de Estadística Bivariada "Consultora Médica", reconstruida con la
arquitectura profesional en N capas de **Bibliotech**: **Node.js + Express + MariaDB**,
Stored Procedures, Repository Pattern, middlewares de seguridad, validación Fluent,
i18n Singleton y frontend Zero-innerHTML.

## Roles del Sistema (RBAC)

| Rol | Usuario semilla | Permisos |
| :--- | :--- | :--- |
| **paciente** | `pepe` / `123456` (también `maria`) | Reservar turnos, ver y cancelar sus turnos |
| **medico** | `dr.perez`, `dra.gomez`, `dr.rodriguez`, `dra.blanco`, `dr.martinez` / `123456` | Ver turnos asignados con datos de pacientes y modificarlos (estado, hora, duración, notas) |
| **analista** | `analista` / `123456` | Ver todo el análisis estadístico: descriptiva (CV por doctor), regresión, correlación de Pearson, R² y outliers |
| **admin** | `admin` / `123456` | Gestionar usuarios y roles, CRUD de doctores, ver todos los turnos y acceder al análisis de datos |

## Arquitectura en N Capas

```text
Frontend (Vanilla JS + CSS propio, Zero innerHTML)
   └── api_service.js (Interceptor JWT)
          │
          ▼
Routes (auth / patient / doctor / analyst / admin)
   └── auth_middleware (verifyToken + requireRole)
   └── validation_middleware (Validator Fluent + Strategy + Visitor)
          │
          ▼
Controllers (lógica semántica por rol)
          │
          ▼
Repositories (Repository Pattern → Stored Procedures)
          │
          ▼
MariaDB (consultora_medica_web) — usuario PoLP (solo SELECT + EXECUTE)
```

## Estructura

```text
consultora-medica/
├── backend/
│   ├── config/          db.js, init.sql (DDL + SPs + seeds), delete.sql
│   ├── controllers/     auth, patient, doctor, analyst, admin
│   ├── middleware/      auth (JWT+RBAC), validation, global_error
│   ├── repositories/    user, doctor, turno, stats
│   ├── routes/          auth, patient, doctor, analyst, admin, view
│   ├── utils/
│   │   ├── db_utils/    db_setup.js, db_check.js
│   │   ├── i18n/        Singleton es/en
│   │   ├── stats/       stats_engine.js (port del TP de Python a JS)
│   │   └── validator/   validator.js + rules/
│   ├── .env / .env.example
│   └── server.js
└── frontend/
    ├── css/style.css
    ├── html/            login, register, 4 dashboards por rol
    └── js/              utils, services, components, front_controllers
```

## Motor Estadístico (port del TP original)

- Media, varianza muestral, desvío estándar y Coeficiente de Variación (umbrales 15% / 30%).
- Regresión por Mínimos Cuadrados: `b = SSxy/SSxx`, `a = ȳ − b·x̄`.
- Correlación de Pearson `r`, coeficiente de determinación `R²` y error estándar `se`.
- Detección de outliers con `|e| > 2·se`.
- Predicción de duración de turno por edad del paciente usando el modelo del doctor elegido.
- Gráficos de dispersión con recta de regresión y centroide (Chart.js).

## Puesta en Marcha

### Flujo A — Primera vez (equipo sin nada instalado)

1. **Instalar requisitos:**
   - **Node.js 18 o superior:** desde https://nodejs.org (instalador LTS).
   - **MariaDB:** con XAMPP/Laragon (Windows) o en Linux:
     ```bash
     sudo apt update && sudo apt install mariadb-server nodejs npm
     ```
2. **Iniciar MariaDB** (según tu instalación):
   ```bash
   sudo service mariadb start      # Linux
   # o activar MariaDB desde el panel de XAMPP en Windows
   ```
3. **Clonar el repositorio y entrar al backend:**
   ```bash
   git clone https://github.com/IBastarrica/consultora-medica.git
   cd consultora-medica/backend
   ```
4. **Instalar dependencias de Node:**
   ```bash
   npm install
   ```
5. **Configurar variables de entorno:**
   ```bash
   cp .env.example .env
   # Editar .env solo si tus credenciales de MariaDB difieren (DB_HOST/DB_USER/DB_PASS)
   ```
6. **Crear la base de datos** (crea BD, usuario PoLP, tablas, stored procedures y datos semilla: 27 usuarios, 5 doctores, 100 consultas y ~49 turnos):
   ```bash
   npm run db:setup
   ```
   *(Si el usuario root de MariaDB tiene contraseña: `ROOT_PASS=tuclave npm run db:setup`)*
7. **Verificar la conexión** (opcional):
   ```bash
   npm run db:check
   ```
8. **Iniciar el servidor:**
   ```bash
   npm start
   ```
   👉 Abrir `http://localhost:4000` y entrar con los usuarios semilla (todos con contraseña `123456`):
   `admin`, `analista`, `pepe`/`maria` (pacientes), `dr.perez`/`dra.gomez`/`dr.rodriguez`/`dra.blanco`/`dr.martinez` (médicos).

### Flujo B — Ya está todo instalado (después de cada cambio)

| Qué cambiaste | Qué tenés que hacer |
| :--- | :--- |
| Solo frontend (`.html`, `.css`, `.js` de `frontend/`) | **Nada.** Recargar el navegador con `Ctrl + F5` (forzar caché) |
| Backend `.js` (controllers, routes, middleware, utils) | Reiniciar el servidor: `Ctrl + C` en la terminal y de nuevo `npm start` |
| `config/init.sql` (tablas, stored procedures o seeds) | Recrear la BD: `npm run db:setup` y reiniciar `npm start` |
| Nueva librería en `package.json` | `npm install` y reiniciar `npm start` |

Comandos de reinicio rápido (desde `backend/`):
```bash
# matar el servidor anterior y levantar el nuevo
pkill -f "node server.js" ; npm start
```

Subir los cambios a GitHub:
```bash
cd consultora-medica          # raíz del proyecto
git add -A
git commit -m "Descripción del cambio"
git push
```

## Endpoints de la API

| Método | Ruta | Rol | Descripción |
| :--- | :--- | :--- | :--- |
| POST | `/api/auth/register` | público | Registrar paciente |
| POST | `/api/auth/login` | público | Login (JWT 2h) |
| GET | `/api/patient/doctores` | paciente | Doctores disponibles |
| GET | `/api/patient/turnos` | paciente | Sus turnos |
| POST | `/api/patient/turnos` | paciente | Reservar turno (con predicción de duración) |
| POST | `/api/patient/turnos/:id/cancelar` | paciente | Cancelar turno propio |
| GET | `/api/doctor/perfil` | medico | Perfil del médico logueado |
| GET | `/api/doctor/turnos` | medico | Turnos asignados (con datos del paciente) |
| PUT | `/api/doctor/turnos/:id` | medico | Modificar estado/hora/duración/notas |
| GET | `/api/analyst/descriptiva` | analista | Descriptiva y CV por doctor |
| GET | `/api/analyst/regresion` | analista | Regresión, r, R², outliers |
| GET | `/api/analyst/doctores/:id/regresion` | analista | Regresión individual de un doctor |
| GET | `/api/admin/users` | admin | Listar usuarios (incluye estado activo/inactivo) |
| PUT | `/api/admin/users/:id/role` | admin | Cambiar rol |
| PUT | `/api/admin/users/:id/desactivar` | admin | Desactivar usuario (soft delete, conserva historial) |
| PUT | `/api/admin/users/:id/activar` | admin | Reactivar usuario |
| GET/POST/PUT/DELETE | `/api/admin/doctores` | admin | CRUD de doctores |
| GET | `/api/admin/turnos` | admin | Todos los turnos |
| GET | `/api/admin/stats/...` | admin | Análisis de datos (misma lógica que analista) |

## Próximos pasos sugeridos

- Frontend de pruebas automatizadas (como el laboratorio de tests de Bibliotech).
- Agenda diaria con solapamiento de horarios por doctor.
- Cambio de idioma en caliente (i18n desde el frontend).
- Dashboard del analista con regresión por doctor seleccionable.
