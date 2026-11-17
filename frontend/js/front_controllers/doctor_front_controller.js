/**
 * @file doctor_front_controller.js
 * @brief Controlador frontend del panel del médico.
 * @project Consultora Médica
 */

const ESTADOS = ['Activo', 'Confirmado', 'Atendido', 'Cancelado'];

const doctorFrontController = {
    async loadTurnos() {
        const container = document.getElementById('tablaTurnos');
        try {
            const turnos = await apiService.request('/doctor/turnos?pendientes=1');
            UI.clear(container);

            if (turnos.length === 0) {
                container.appendChild(UI.el('p', null, 'No tenés turnos pendientes por el momento.'));
                return;
            }

            const rows = turnos.map(t => {
                const editable = t.estado !== 'Vencido';
                const btnEditar = editable
                    ? UI.actionButton('Modificar', 'active', () => this.openEditModal(t))
                    : UI.el('span', null, '-');
                const btnFicha = UI.actionButton('Ficha', '', () => this.openFicha(t));
                const nombrePaciente = [t.nombre, t.apellido].filter(Boolean).join(' ') || t.paciente;
                return [
                    t.fecha_turno,
                    t.hora_turno,
                    nombrePaciente,
                    t.edad !== null ? t.edad : '-',
                    t.email || '-',
                    UI.badge(t.estado, t.estado),
                    t.notas || '-',
                    btnFicha,
                    btnEditar
                ];
            });

            container.appendChild(UI.buildTable(
                ['Fecha', 'Hora', 'Paciente', 'Edad', 'Email', 'Estado', 'Notas', 'Historia', 'Acción'],
                rows
            ));
        } catch (error) {
            UI.showToast(error.message, 'err');
        }
    },

    /**
     * @brief Abre la ficha del paciente con su historia clínica y botón de descarga.
     */
    async openFicha(turno) {
        try {
            const h = await apiService.request(`/doctor/pacientes/${turno.id_paciente}/historia`);

            const bg = UI.el('div', 'cm-modal-bg');
            const modal = UI.el('div', 'cm-modal');

            const nombreCompleto = [h.nombre, h.apellido].filter(Boolean).join(' ');
            modal.appendChild(UI.el('h3', null, `Historia Clínica - ${nombreCompleto}`));

            const items = [
                ['Email', h.email],
                ['Edad', h.edad],
                ['Ciudad', h.ciudad],
                ['Nacionalidad', h.nacionalidad],
                ['Fecha de nacimiento', h.fecha_nacimiento],
                ['Grupo sanguíneo', h.grupo_sanguineo],
                ['Alergias', h.alergias],
                ['Medicación actual', h.medicacion_actual],
                ['Antecedentes', h.antecedentes],
                ['Observaciones', h.observaciones],
                ['Última actualización', h.fecha_actualizacion]
            ];

            if (!h.id_historia) {
                modal.appendChild(UI.el('p', null, 'Este paciente no tiene historia clínica cargada.'));
            }
            items.forEach(([campo, valor]) => {
                modal.appendChild(UI.el('p', null, `${campo}: ${valor || '-'}`));
            });

            const actions = UI.el('div', 'cm-modal-actions');
            const btnDescargar = UI.el('button', 'cm-tab active', 'Descargar');
            btnDescargar.addEventListener('click', () => this.descargarHistoria(turno));
            const btnCerrar = UI.el('button', 'cm-tab', 'Cerrar');
            btnCerrar.addEventListener('click', () => bg.remove());
            actions.appendChild(btnDescargar);
            actions.appendChild(btnCerrar);
            modal.appendChild(actions);

            bg.appendChild(modal);
            document.body.appendChild(bg);
        } catch (error) {
            UI.showToast(error.message, 'err');
        }
    },

    /**
     * @brief Descarga la historia clínica como archivo .txt (con token JWT).
     */
    async descargarHistoria(turno) {
        try {
            const token = authHelper.getToken();
            const response = await fetch(`/api/doctor/pacientes/${turno.id_paciente}/historia/descargar`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({ message: 'Error al descargar' }));
                UI.showToast(err.message, 'err');
                return;
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `historia_${turno.paciente}.txt`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } catch (error) {
            UI.showToast(error.message, 'err');
        }
    },

    openEditModal(turno) {
        UI.showFormModal('Modificar Turno', [
            { id: 'estado', label: 'Estado', type: 'select', value: turno.estado,
              options: ESTADOS.map(e => ({ value: e, text: e })) },
            { id: 'hora_turno', label: 'Hora (HH:MM)', value: String(turno.hora_turno).slice(0, 5) },
            { id: 'tiempo_atencion_real_min', label: 'Tiempo real de atención (min, obligatorio al marcar Atendido)',
              value: turno.tiempo_atencion_real_min !== null ? turno.tiempo_atencion_real_min : '' },
            { id: 'notas', label: 'Notas', value: turno.notas || '' }
        ], async (values, modalBg) => {
            try {
                const payload = {
                    estado: values.estado,
                    hora_turno: values.hora_turno,
                    notas: values.notas
                };
                if (values.tiempo_atencion_real_min !== '') {
                    payload.tiempo_atencion_real_min = Number(values.tiempo_atencion_real_min);
                }

                const result = await apiService.request(`/doctor/turnos/${turno.id_turno}`, 'PUT', payload);
                modalBg.remove();
                UI.showToast(result.message, 'ok');
                this.loadTurnos();
            } catch (error) {
                UI.showToast(error.message, 'err');
            }
        });
    },

    init() {
        if (!authHelper.guard('medico')) return;
        this.loadTurnos();
    }
};

document.addEventListener('DOMContentLoaded', () => doctorFrontController.init());
