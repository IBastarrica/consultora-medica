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

1. **Requisitos:** Node.js 18+, MariaDB/MySQL activo.
2. **Instalar dependencias:**
   ```bash
   cd backend
   npm install
   ```
3. **Inicializar la base de datos** (crea la BD, el usuario PoLP, tablas, 10 Stored Procedures y los seeds: 5 doctores, 100 consultas, turnos de ejemplo):
   ```bash
   npm run db:setup
   ```
4. **Iniciar el servidor:**
   ```bash
   npm start
   ```
   👉 `http://localhost:4000`

5. *(Opcional)* Verificar conectividad: `npm run db:check`

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
