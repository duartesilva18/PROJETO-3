<script>
	import Breadcrum from '$lib/components/Breadcrum.svelte';
	import { sidebarOptions } from '$lib/runes/sidebarOptions.rune.svelte';
import { configurePortalSidebar } from '../sidebar.config.js';
import { locale, t } from '$lib/translations/translations';
import { preventDefault } from 'svelte/legacy';
	import { get } from 'svelte/store';
	import { onMount } from 'svelte';
	import toastr from 'toastr';
	import * as dt_pt from '$lib/translations/pt/datatables.json';
	import * as dt_en from '$lib/translations/en/datatables.json';

	const translate = (key) => get(t)(key);
	configurePortalSidebar('agendamentos', translate);

	const globalWithJQuery = /** @type {any} */ (globalThis);
	const jq = globalWithJQuery?.jQuery ?? globalWithJQuery?.$;

	const STATUS_OPTIONS = ['pendente', 'enviado', 'erro', 'cancelado'];
	const TIMEZONE_OPTIONS = ['Europe/Lisbon', 'UTC'];

	let loadingData = $state(true);
	let agendamentos = [];
	let filteredAgendamentos = [];

	let formFilter = $state({
		termo: '',
		status: '',
		rede: ''
	});

	let formState = $state({
		id: null,
		id_noticia: '',
		titulo: '',
		rede_nome: '',
		horario_agendado: '',
		fuso_horario: 'Europe/Lisbon',
		status: 'pendente'
	});

	let table = $state();
	let el = $state();
	let isSaving = $state(false);

	/** @type {{ icon_class: string; url: string; designacao: string; function?: () => void }[]} */
	let items_breadcrum = $derived([
		{
			icon_class: 'fas fa-rotate',
			url: '#',
			designacao: 'Atualizar',
			function: loadAgendamentos
		}
	]);

	onMount(async () => {
		if (jq?.fn?.dataTable?.ext) {
			jq.fn.dataTable.ext.errMode = 'none';
		}
		await loadAgendamentos();
		table = jq(el).DataTable({
			dom: 'Bfrtip',
			columns: tableColumns,
			responsive: true,
			buttons: ['pageLength', 'pdf', 'csv', 'excel', 'copy', 'colvis'],
			pageLength: 25,
			order: [[2, 'asc']],
			language: locale.get() === 'pt' ? dt_pt : dt_en
		});
		refreshTable();
	});

	async function loadAgendamentos() {
		try {
			loadingData = true;
			const response = await fetch('/ep/portal_noticias/redes/agendamentos');
			const data = await response.json();
			agendamentos = Array.isArray(data) ? data : [];
			filteredAgendamentos = agendamentos;
		} catch (error) {
			console.error(error);
			toastr.error('Não foi possível carregar os agendamentos.', 'Erro');
			agendamentos = [];
			filteredAgendamentos = [];
		} finally {
			loadingData = false;
			applyFilters();
		}
	}

	function applyFilters() {
		const termo = formFilter.termo.toLowerCase().trim();
		const rede = formFilter.rede;
		const status = formFilter.status;

		filteredAgendamentos = agendamentos.filter((item) => {
			const matchTitulo =
				termo === '' ||
				item.titulo?.toLowerCase().includes(termo) ||
				item.rede_nome?.toLowerCase().includes(termo);
			const matchRede = rede === '' || item.id_rede_social === rede;
			const matchStatus =
				status === '' || (item.status ?? '').toLowerCase() === status.toLowerCase();
			return matchTitulo && matchRede && matchStatus;
		});

		refreshTable();
	}

	function refreshTable() {
		if (!table) return;

		table.clear();

		filteredAgendamentos.forEach((item, index) => {
			table
				.row.add([
					`<div class="clickable-cell" data-rowindex="${index}">${item.titulo ?? '-'}</div>`,
					item.rede_nome ?? '-',
					formatDateTime(item.horario_agendado),
					item.fuso_horario ?? 'UTC',
					renderStatusBadge(item.status),
					actionButton('table_button_edit_agendamento', index, 'fa fa-edit', 'btn-outline-primary'),
					actionButton('table_button_delete_agendamento', index, 'fa fa-trash', 'btn-outline-danger')
				])
				.node();
		});

		jq(el)
			.off('click', '.clickable-cell')
			.on('click', '.clickable-cell', (event) => {
				const target = /** @type {HTMLElement} */ (event.currentTarget);
				const rowIndex = jq(target).data('rowindex');
				const item = filteredAgendamentos[rowIndex];
				beginEdit(item);
			});

		jq(document)
			.off('click', '.table_button_edit_agendamento')
			.on('click', '.table_button_edit_agendamento', (event) => {
				const target = /** @type {HTMLElement} */ (event.currentTarget);
				const rowIndex = jq(target).data('rowindex');
				const item = filteredAgendamentos[rowIndex];
				beginEdit(item);
			});

		jq(document)
			.off('click', '.table_button_delete_agendamento')
			.on('click', '.table_button_delete_agendamento', (event) => {
				const target = /** @type {HTMLElement} */ (event.currentTarget);
				const rowIndex = jq(target).data('rowindex');
				const item = filteredAgendamentos[rowIndex];
				deleteAgendamento(item);
			});

		table.draw();
	}

	function renderStatusBadge(status) {
		if (!status) return '-';
		const normalized = status.toLowerCase();
		const cls = normalized === 'pendente' ? 'estado-pendente' : normalized === 'enviado' ? 'estado-publicado' : 'estado-rascunho';
		return `<span class="estado ${cls}">${status}</span>`;
	}

	function actionButton(className, index, icon, btnClass) {
		return `<div class="d-flex justify-content-center">
			<button data-rowindex="${index}" class="btn btn-sm ${btnClass} ${className}">
				<i class="${icon}"></i>
			</button>
		</div>`;
	}

	function formatDateTime(value) {
		if (!value) return '-';
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return '-';
		return `${date.toLocaleDateString('pt-PT')} ${date.toLocaleTimeString('pt-PT', {
			hour: '2-digit',
			minute: '2-digit'
		})}`;
	}

	function beginEdit(item) {
		if (!item) return;
		formState = {
			id: item.id_agendamento,
			id_noticia: item.id_noticia,
			titulo: item.titulo ?? '',
			rede_nome: item.rede_nome ?? '',
			horario_agendado: toInputDateValue(item.horario_agendado),
			fuso_horario: item.fuso_horario ?? 'Europe/Lisbon',
			status: item.status ?? 'pendente'
		};
	}

	function resetForm() {
		formState = {
			id: null,
			id_noticia: '',
			titulo: '',
			rede_nome: '',
			horario_agendado: '',
			fuso_horario: 'Europe/Lisbon',
			status: 'pendente'
		};
	}

	function toInputDateValue(value) {
		if (!value) return '';
		const d = new Date(value);
		if (Number.isNaN(d.getTime())) return '';
		const iso = d.toISOString();
		return iso.slice(0, 16);
	}

	async function saveAgendamento() {
		if (!formState.id) {
			toastr.warning('Selecione um agendamento para atualizar.', 'Aviso');
			return;
		}
		if (!formState.horario_agendado) {
			toastr.warning('Indique o horário agendado.', 'Aviso');
			return;
		}

		isSaving = true;
		try {
			const response = await fetch(`/ep/portal_noticias/redes/agendamentos/${formState.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					horario_agendado: new Date(formState.horario_agendado).toISOString(),
					fuso_horario: formState.fuso_horario,
					status: formState.status
				})
			});

			if (!response.ok) {
				const errorBody = await response.json().catch(() => ({}));
				throw new Error(errorBody?.message ?? 'Erro ao atualizar o agendamento');
			}

			toastr.success('Agendamento atualizado com sucesso.', 'Sucesso');
			resetForm();
			await loadAgendamentos();
		} catch (error) {
			console.error(error);
			toastr.error(error?.message ?? 'Não foi possível atualizar o agendamento.', 'Erro');
		} finally {
			isSaving = false;
		}
	}

	async function deleteAgendamento(item) {
		if (!item?.id_agendamento) return;
		const confirmacao = confirm('Remover este agendamento?');
		if (!confirmacao) return;

		try {
			const response = await fetch(`/ep/portal_noticias/redes/agendamentos/${item.id_agendamento}`, {
				method: 'DELETE'
			});

			if (!response.ok) {
				const errorBody = await response.json().catch(() => ({}));
				throw new Error(errorBody?.message ?? 'Erro ao eliminar o agendamento');
			}

			toastr.success('Agendamento removido.', 'Sucesso');
			if (formState.id === item.id_agendamento) {
				resetForm();
			}
			await loadAgendamentos();
		} catch (error) {
			console.error(error);
			toastr.error(error?.message ?? 'Não foi possível remover o agendamento.', 'Erro');
		}
	}

	const tableColumns = [
		{ title: 'Notícia', width: '25%' },
		{ title: 'Rede social', width: '15%' },
		{ title: 'Horário', width: '20%' },
		{ title: 'Fuso horário', width: '10%' },
		{ title: 'Estado', width: '10%', orderable: false },
		{ title: '', orderable: false, width: '10%' },
		{ title: '', orderable: false, width: '10%' }
	];

	function redesDisponiveis() {
		const redeMap = new Map();
		agendamentos.forEach((item) => {
			if (item.id_rede_social && !redeMap.has(item.id_rede_social)) {
				redeMap.set(item.id_rede_social, item.rede_nome ?? 'Rede');
			}
		});
		return Array.from(redeMap.entries()).map(([id, nome]) => ({ id, nome }));
	}

	function mapStatusClass(status) {
		const normalized = status?.toLowerCase();
		if (normalized === 'enviado') return 'estado-publicado';
		if (normalized === 'erro') return 'estado-rascunho';
		return 'estado-pendente';
	}
</script>

<Breadcrum
	modulo={sidebarOptions.currentModule}
	objeto={sidebarOptions.currentObject}
	menu_items={items_breadcrum}
/>

<div class="tableNews">
	<div class="row g-4">
		<div class="col-lg-8">
			<div class="card-simple">
				<div class="card-header">
					<div>
						<h5>Agendamentos</h5>
						<p class="text-muted mb-0">
							Lista de todas as publicações agendadas por rede social.
						</p>
					</div>
					<form class="filters" onsubmit={preventDefault(applyFilters)}>
						<input
							class="form-control"
							placeholder="Pesquisar por título ou rede..."
							bind:value={formFilter.termo}
							oninput={applyFilters}
						/>
						<select class="form-control" bind:value={formFilter.rede} onchange={applyFilters}>
							<option value="">Todas as redes</option>
							{#each redesDisponiveis() as rede}
								<option value={rede.id}>{rede.nome}</option>
							{/each}
						</select>
						<select class="form-control" bind:value={formFilter.status} onchange={applyFilters}>
							<option value="">Todos os estados</option>
							{#each STATUS_OPTIONS as status}
								<option value={status}>{status}</option>
							{/each}
						</select>
					</form>
				</div>

				<div class="datatable-on">
					<table class="table table-striped w-100" bind:this={el}></table>
					{#if loadingData}
						<div class="text-center p-4 text-muted small">A carregar...</div>
					{/if}
				</div>
			</div>
		</div>

		<div class="col-lg-4">
			<div class="card-simple">
				<h5 class="mb-3">Editar agendamento</h5>
				<form onsubmit={preventDefault(saveAgendamento)} class="agendamento-form">
					<div class="mb-3">
						<label class="form-label" for="agendamento-noticia">Notícia</label>
						<input id="agendamento-noticia" class="form-control" readonly value={formState.titulo} />
					</div>
					<div class="mb-3">
						<label class="form-label" for="agendamento-rede">Rede social</label>
						<input id="agendamento-rede" class="form-control" readonly value={formState.rede_nome} />
					</div>
					<div class="mb-3">
						<label class="form-label" for="agendamento-horario">Data e hora</label>
						<input
							id="agendamento-horario"
							type="datetime-local"
							class="form-control"
							required
							bind:value={formState.horario_agendado}
						/>
					</div>
					<div class="mb-3">
						<label class="form-label" for="agendamento-fuso">Fuso horário</label>
						<select
							id="agendamento-fuso"
							class="form-control"
							bind:value={formState.fuso_horario}
						>
							{#each TIMEZONE_OPTIONS as tz}
								<option value={tz}>{tz}</option>
							{/each}
						</select>
					</div>
					<div class="mb-4">
						<label class="form-label" for="agendamento-status">Estado</label>
						<select
							id="agendamento-status"
							class="form-control"
							bind:value={formState.status}
						>
							{#each STATUS_OPTIONS as status}
								<option value={status}>{status}</option>
							{/each}
						</select>
					</div>
					<div class="d-flex gap-2">
						<button class="btn btn-primary flex-grow-1" type="submit" disabled={isSaving}>
							{#if isSaving}
								<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
							{/if}
							Guardar alterações
						</button>
						<button class="btn btn-outline-secondary" type="button" onclick={resetForm}>
							Cancelar
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
</div>

<style>
	@import '../portal_noticias.css';

	.card-simple {
		border: 1px solid #dde3ea;
		border-radius: 10px;
		padding: 16px;
		background: #fff;
	}

	.card-header {
		display: flex;
		flex-direction: column;
		gap: 12px;
		margin-bottom: 16px;
	}

	@media (min-width: 768px) {
		.card-header {
			flex-direction: row;
			align-items: flex-end;
			justify-content: space-between;
		}
	}

	.filters {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
		gap: 8px;
	}

	.agendamento-form .form-label {
		font-weight: 600;
		color: #3f4d5a;
	}

	.agendamento-form input[readonly] {
		background: #f7f9fc;
	}
</style>

