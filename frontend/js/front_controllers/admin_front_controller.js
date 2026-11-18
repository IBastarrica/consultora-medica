/**
 * @file admin_front_controller.js
 * @brief Controlador frontend del panel de administración (root).
 * @project Consultora Médica
 */

const ROLES = ['admin', 'medico', 'analista', 'paciente'];

const adminFrontController = {
    // ---------- Pestañas ----------

    initTabs() {
        const tabs = document.querySelectorAll('#tabs .cm-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                ['usuarios', 'doctores', 'turnos', 'estadisticas'].forEach(name => {
                    const panel = document.getElementById(`tab-${name}`);
                    panel.style.display = name === tab.dataset.tab ? 'block' : 'none';
                });

                if (tab.dataset.tab === 'estadisticas') this.loadStats();
            });
        });
    },

    // ---------- Usuarios ----------

    async loadUsers() {
        const container = document.getElementById('tablaUsuarios');
        try {
            const users = await apiService.request('/admin/users');
            UI.clear(container);

            const rows = users.map(u => {
                const activo = Number(u.activo) === 1;
                const select = document.createElement('select');
                select.style.padding = '4px 8px';
                ROLES.forEach(r => {
                    const opt = UI.el('option', null, r);
                    opt.value = r;
                    if (r === u.role) opt.selected = true;
                    select.appendChild(opt);
                });

                const btnSave = UI.actionButton('Cambiar rol', '', async () => {
                    try {
                        const result = await apiService.request(`/admin/users/${u.id}/role`, 'PUT', { role: select.value });
                        UI.showToast(result.message, 'ok');
                        this.loadUsers();
                    } catch (error) {
                        UI.showToast(error.message, 'err');
                    }
                });

                const btnToggle = UI.actionButton(activo ? 'Desactivar' : 'Activar', '', async () => {
                    try {
                        const result = await apiService.request(`/admin/users/${u.id}/${activo ? 'desactivar' : 'activar'}`, 'PUT');
                        UI.showToast(result.message, 'ok');
                        this.loadUsers();
                    } catch (error) {
                        UI.showToast(error.message, 'err');
                    }
                });

                return [u.id, u.username,
                    [u.nombre, u.apellido].filter(Boolean).join(' ') || '-',
                    u.email || '-',
                    u.edad !== null ? u.edad : '-',
                    u.created_at || '-',
                    UI.badge(activo ? 'Activo' : 'Inactivo', activo ? 'activo' : 'inactivo'),
                    u.role, select, btnSave, btnToggle];
            });

            container.appendChild(UI.buildTable(
                ['ID', 'Usuario', 'Nombre', 'Email', 'Edad', 'Alta', 'Estado', 'Rol actual', 'Nuevo rol', '', ''],
                rows
            ));
        } catch (error) {
            UI.showToast(error.message, 'err');
        }
    },

    // ---------- Doctores ----------

    async loadDoctores() {
        const container = document.getElementById('tablaDoctores');
        try {
            const doctores = await apiService.request('/admin/doctores');
            UI.clear(container);

            const rows = doctores.map(d => {
                const btnEditar = UI.actionButton('Editar', 'active', () => this.openDoctorModal(d));
                const btnEliminar = UI.actionButton('Eliminar', '', async () => {
                    try {
                        const result = await apiService.request(`/admin/doctores/${d.id_doctor}`, 'DELETE');
                        UI.showToast(result.message, 'ok');
                        this.loadDoctores();
                    } catch (error) {
                        UI.showToast(error.message, 'err');
                    }
                });
                return [
                    d.id_doctor, d.nombre, d.especialidad, d.anios_experiencia,
                    d.username || 'Sin cuenta', btnEditar, btnEliminar
                ];
            });

            container.appendChild(UI.buildTable(
                ['ID', 'Nombre', 'Especialidad', 'Exp. (años)', 'Cuenta vinculada', '', ''],
                rows
            ));
        } catch (error) {
            UI.showToast(error.message, 'err');
        }
    },

    openDoctorModal(doctor = null) {
        UI.showFormModal(doctor ? 'Editar Doctor' : 'Nuevo Doctor', [
            { id: 'nombre', label: 'Nombre', value: doctor ? doctor.nombre : '' },
            { id: 'especialidad', label: 'Especialidad', value: doctor ? doctor.especialidad : '' },
            { id: 'anios_experiencia', label: 'Años de experiencia',
              value: doctor ? doctor.anios_experiencia : '' },
            { id: 'user_id', label: 'ID de cuenta de usuario (opcional)', value: doctor && doctor.user_id ? doctor.user_id : '' }
        ], async (values, modalBg) => {
            try {
                const payload = {
                    nombre: values.nombre,
                    especialidad: values.especialidad,
                    anios_experiencia: Number(values.anios_experiencia)
                };
                if (values.user_id !== '') payload.user_id = Number(values.user_id);

                let result;
                if (doctor) {
                    result = await apiService.request(`/admin/doctores/${doctor.id_doctor}`, 'PUT', payload);
                } else {
                    result = await apiService.request('/admin/doctores', 'POST', payload);
                }

                modalBg.remove();
                UI.showToast(result.message, 'ok');
                this.loadDoctores();
            } catch (error) {
                UI.showToast(error.message, 'err');
            }
        });
    },

    // ---------- Turnos ----------

    async loadTurnos() {
        const container = document.getElementById('tablaTurnos');
        try {
            const turnos = await apiService.request('/admin/turnos');
            UI.clear(container);

            if (turnos.length === 0) {
                container.appendChild(UI.el('p', null, 'No hay turnos registrados.'));
                return;
            }

            const rows = turnos.map(t => {
                const nombrePaciente = [t.nombre, t.apellido].filter(Boolean).join(' ') || t.paciente;
                return [
                    t.id_turno,
                    t.fecha_turno,
                    t.hora_turno,
                    nombrePaciente,
                    t.edad !== null ? t.edad : '-',
                    t.medico,
                    UI.badge(t.estado, t.estado),
                    t.tiempo_estimado_min !== null ? `${Number(t.tiempo_estimado_min).toFixed(2)} min` : '-'
                ];
            });

            container.appendChild(UI.buildTable(
                ['ID', 'Fecha', 'Hora', 'Paciente', 'Edad', 'Médico', 'Estado', 'Tiempo est.'],
                rows
            ));
        } catch (error) {
            UI.showToast(error.message, 'err');
        }
    },

    // ---------- Estadísticas ----------

    async loadStats() {
        try {
            const [descriptiva, regresion, analisisTurnos, conclusiones] = await Promise.all([
                apiService.request('/admin/stats/descriptiva'),
                apiService.request('/admin/stats/regresion'),
                apiService.request('/admin/stats/turnos-analisis'),
                apiService.request('/admin/stats/conclusiones')
            ]);

            statsRenderer.renderDescriptiva(descriptiva, regresion);
            statsRenderer.renderRegresion(regresion);
            statsRenderer.renderBoxplot('boxplotMuestra', descriptiva.boxplot, 'Tiempo de atención (min)');
            statsRenderer.renderProbabilidades(descriptiva, 'tablaProbabilidades', regresion);
            statsRenderer.renderTurnosAnalisis(analisisTurnos);
            statsRenderer.renderBoxplot('boxplotReales', analisisTurnos.boxplot, 'Tiempo real (min)');
            statsRenderer.renderOutliersIQR(descriptiva, analisisTurnos, 'tablaOutliersIQR');
            statsRenderer.renderProbabilidadesReales(analisisTurnos, 'tablaProbabilidadesReales');
            statsRenderer.renderConclusiones(conclusiones.conclusiones, 'listaConclusiones');
        } catch (error) {
            UI.showToast(error.message, 'err');
        }
    },

    // ---------- Init ----------

    init() {
        if (!authHelper.guard('admin')) return;

        this.initTabs();
        this.loadUsers();
        this.loadDoctores();
        this.loadTurnos();

        const btnNuevo = document.getElementById('btnNuevoDoctor');
        if (btnNuevo) {
            btnNuevo.addEventListener('click', () => this.openDoctorModal());
        }

        const btnExportar = document.getElementById('btnExportarAdmin');
        if (btnExportar) {
            btnExportar.addEventListener('click', () =>
                UI.downloadFile('/api/admin/stats/exportar', 'reporte_consultora_medica.xlsx'));
        }
    }
};

document.addEventListener('DOMContentLoaded', () => adminFrontController.init());
