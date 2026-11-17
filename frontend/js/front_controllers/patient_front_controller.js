/**
 * @file patient_front_controller.js
 * @brief Controlador frontend del panel del paciente.
 * @project Consultora Médica
 */

const patientFrontController = {
    async loadPerfil() {
        const container = document.getElementById('infoPersonal');
        try {
            const p = await apiService.request('/patient/perfil');
            this.perfilData = p;
            UI.clear(container);

            const formatearFecha = (f) => {
                if (!f) return '-';
                const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(f));
                return m ? `${m[3]}/${m[2]}/${m[1]}` : f;
            };

            const nombreCompleto = [p.nombre, p.apellido].filter(Boolean).join(' ');
            const rows = [
                ['Nombre completo', nombreCompleto || '-'],
                ['Email', p.email || '-'],
                ['Usuario', p.username || '-'],
                ['Edad', p.edad !== null ? p.edad : '-'],
                ['Ciudad', p.ciudad || '-'],
                ['Nacionalidad', p.nacionalidad || '-'],
                ['Fecha de nacimiento', formatearFecha(p.fecha_nacimiento)]
            ];

            container.appendChild(UI.buildTable(['Campo', 'Valor'], rows));
        } catch (error) {
            UI.showToast(error.message, 'err');
        }
    },

    async loadDoctores() {
        const select = document.getElementById('id_doctor');
        try {
            const doctores = await apiService.request('/patient/doctores');
            UI.clear(select);
            doctores.forEach(d => {
                const option = UI.el('option', null, `${d.nombre} (${d.especialidad})`);
                option.value = d.id_doctor;
                select.appendChild(option);
            });
        } catch (error) {
            UI.showToast(error.message, 'err');
        }
    },

    async loadTurnos() {
        const container = document.getElementById('tablaTurnos');
        try {
            const turnos = await apiService.request('/patient/turnos');
            UI.clear(container);

            if (turnos.length === 0) {
                container.appendChild(UI.el('p', null, 'Todavía no tenés turnos reservados.'));
                return;
            }

            const rows = turnos.map(t => {
                const btnCancel = UI.actionButton('Cancelar', '', async () => {
                    try {
                        await apiService.request(`/patient/turnos/${t.id_turno}/cancelar`, 'POST');
                        UI.showToast('Turno cancelado.', 'ok');
                        this.loadTurnos();
                    } catch (error) {
                        UI.showToast(error.message, 'err');
                    }
                });

                const cancelable = t.estado === 'Activo' || t.estado === 'Confirmado';
                return [
                    t.fecha_turno,
                    t.hora_turno,
                    t.medico,
                    t.especialidad,
                    UI.badge(t.estado, t.estado),
                    cancelable ? btnCancel : UI.el('span', null, '-')
                ];
            });

            container.appendChild(UI.buildTable(
                ['Fecha', 'Hora', 'Médico', 'Especialidad', 'Estado', 'Acción'],
                rows
            ));
        } catch (error) {
            UI.showToast(error.message, 'err');
        }
    },

    initForm() {
        const form = document.getElementById('turnoForm');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const payload = {
                id_doctor: Number(document.getElementById('id_doctor').value),
                fecha_turno: document.getElementById('fecha_turno').value,
                hora_turno: document.getElementById('hora_turno').value
            };

            try {
                const result = await apiService.request('/patient/turnos', 'POST', payload);
                UI.showToast(result.message, 'ok');
                form.reset();
                this.loadTurnos();
            } catch (error) {
                UI.showToast(error.message, 'err');
            }
        });
    },

    openEditPerfil() {
        const p = this.perfilData;
        if (!p) return;

        UI.showFormModal('Modificar Mis Datos', [
            { id: 'nombre', label: 'Nombre', value: p.nombre || '' },
            { id: 'apellido', label: 'Apellido', value: p.apellido || '' },
            { id: 'ciudad', label: 'Ciudad de residencia', value: p.ciudad || '' },
            { id: 'nacionalidad', label: 'Nacionalidad', value: p.nacionalidad || '' },
            { id: 'fecha_nacimiento', label: 'Fecha de nacimiento', type: 'date',
              value: p.fecha_nacimiento ? String(p.fecha_nacimiento).slice(0, 10) : '' },
            { id: 'edad', label: 'Edad (opcional)', type: 'number',
              value: p.edad !== null ? p.edad : '' }
        ], async (values, modalBg) => {
            try {
                const payload = {
                    nombre: values.nombre,
                    apellido: values.apellido,
                    ciudad: values.ciudad,
                    nacionalidad: values.nacionalidad,
                    fecha_nacimiento: values.fecha_nacimiento
                };
                if (values.edad !== '') payload.edad = Number(values.edad);

                const result = await apiService.request('/patient/perfil', 'PUT', payload);
                modalBg.remove();
                UI.showToast(`${result.message} Email: ${result.email}`, 'ok');
                this.loadPerfil();
            } catch (error) {
                UI.showToast(error.message, 'err');
            }
        });
    },

    init() {
        if (!authHelper.guard('paciente')) return;
        this.loadPerfil();
        this.loadDoctores();
        this.loadTurnos();
        this.initForm();

        const btnEditar = document.getElementById('btnEditarPerfil');
        if (btnEditar) {
            btnEditar.addEventListener('click', () => this.openEditPerfil());
        }
    }
};

document.addEventListener('DOMContentLoaded', () => patientFrontController.init());
