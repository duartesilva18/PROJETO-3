<script>
	import Breadcrum from '$lib/components/Breadcrum.svelte';
	import { sidebarOptions } from '$lib/runes/sidebarOptions.rune.svelte';
	import { configurePortalSidebar } from '../sidebar.config.js';
	import { locale, t } from '$lib/translations/translations';
	import { get } from 'svelte/store';
	import { onMount } from 'svelte';
	import Chart from 'chart.js';

	const tf = (key) => get(t)(key);
	const translate = (key) => get(t)(key);
	configurePortalSidebar('estatisticas', translate);

	let loading = $state(true);

	let filtros = $state({
		ano: ''
	});

	let anoSelecionado = $state('');

	let noticias = $state([]);
	let radios = $state([]);
	let redesSociais = $state([]);
	let tags = $state([]);

	function filtrarNoticias() {
		let lista = noticias;

		if (filtros.ano) {
			lista = lista.filter((n) => {
				if (!n.data_criacao) return false;
				const ano = new Date(n.data_criacao).getFullYear().toString();
				return ano === filtros.ano;
			});
		}

		return lista;
	}

	function calcularKPIs() {
		const lista = filtrarNoticias().filter((n) => n.estado !== 'eliminada');

		const total = lista.length;
		const publicados = lista.filter((n) => n.estado === 'Publicado');
		
		// Total de Publicações (Redes Sociais e Rádio/Jornal)
		const totalPublicacoes = publicados.length;
		
		// Notícias publicadas nas Redes Sociais (têm pn_rs_noticia)
		const publicadasRedesSociais = publicados.filter((n) => 
			n.pn_rs_noticia && n.pn_rs_noticia.length > 0
		).length;
		
		// Notícias publicadas Rádios/Jornais (tipo === 1)
		const publicadasRadiosJornais = publicados.filter((n) => n.tipo === 1).length;
		
		// Notícias Pendentes (útil para gestão)
		const pendentes = lista.filter((n) => n.estado === 'Pendente').length;

		const radiosSet = new Set();
		lista.forEach((n) => {
			if (!n.emails) return;
			n.emails
				.split(',')
				.map((s) => s.trim())
				.filter(Boolean)
				.forEach((id) => radiosSet.add(id));
		});
		const radiosDistintos = radiosSet.size;

		// Notícias Agendadas (têm agendamentos)
		const agendadas = lista.filter((n) => 
			n.pn_agendamento_rede && Array.isArray(n.pn_agendamento_rede) && n.pn_agendamento_rede.length > 0
		).length;

		// Notícias que foram APENAS para Portal IPVC
		// Encontrar o ID da rede social Portal IPVC
		const portalIPVC = redesSociais?.find((r) => r.nome === 'Portal IPVC');
		const portalIPVCId = portalIPVC?.id_rede_social;
		
		const apenasPortalIPVC = lista.filter((n) => {
			// Deve ter texto_portalipvc preenchido
			if (!n.texto_portalipvc || n.texto_portalipvc.trim() === '') return false;
			
			// Deve ter pn_rs_noticia
			if (!n.pn_rs_noticia || !Array.isArray(n.pn_rs_noticia) || n.pn_rs_noticia.length === 0) return false;
			
			// Deve ter APENAS Portal IPVC nas redes sociais (nenhuma outra)
			if (!portalIPVCId) return false;
			
			const redesIds = n.pn_rs_noticia
				.map((rs) => rs.id_rede_social_FK)
				.filter(Boolean);
			
			// Deve ter exatamente 1 rede social e deve ser Portal IPVC
			return redesIds.length === 1 && String(redesIds[0]) === String(portalIPVCId);
		}).length;

		return {
			totalPublicacoes,
			publicadasRedesSociais,
			publicadasRadiosJornais,
			pendentes,
			agendadas,
			radiosDistintos,
			apenasPortalIPVC
		};
	}

	let anosDisponiveis = $state([]);

	onMount(async () => {
		try {
			const [dados, radiosData, redesSociaisData, tagsData] = await Promise.all([
				fetch('/ep/portal_noticias/dados').then((d) => d.json()),
				fetch('/ep/portal_noticias/radio_jornal').then((d) => d.json()),
				fetch('/ep/portal_noticias/redes').then((d) => d.json()),
				fetch('/ep/portal_noticias/tags').then((d) => d.json())
			]);

			noticias = Array.isArray(dados) ? dados : [];
			radios = Array.isArray(radiosData) ? radiosData : [];
			redesSociais = Array.isArray(redesSociaisData) ? redesSociaisData : [];
			tags = Array.isArray(tagsData) ? tagsData : [];

			const anosSet = new Set(
				noticias
					.filter((n) => n.data_criacao)
					.map((n) => new Date(n.data_criacao).getFullYear().toString())
			);
			anosDisponiveis = Array.from(anosSet).sort().reverse();
			
			// Inicializar anoSelecionado com o valor atual do filtro
			anoSelecionado = filtros.ano;
		} catch (e) {
			console.error('Erro a carregar estatísticas de notícias', e);
		} finally {
			loading = false;
		}
	});

	let kpis = $derived(calcularKPIs());

	// Sem botões extra no breadcrumb para esta página
	let items_breadcrum = $derived([]);

let dashboardVisible = $state(true);

function toggleDashboard() {
	dashboardVisible = !dashboardVisible;
	if (dashboardVisible && !loading) {
		updateCharts();
	}
}

let estadoChartCanvas;
let categoriaChartCanvas;
let mesChartCanvas;
let midiaMesChartCanvas;
let tipoChartCanvas;
let topRadiosChartCanvas;
let redesSociaisChartCanvas;
let topTagsChartCanvas;
let estadoChart;
let categoriaChart;
let mesChart;
let midiaMesChart;
let tipoChart;
let topRadiosChart;
let redesSociaisChart;
let topTagsChart;

function buildEstadoData(lista) {
	const counts = {
		Pendente: 0,
		Publicado: 0,
		Outros: 0
	};

	lista.forEach((n) => {
		if (n.estado === 'Pendente') counts.Pendente += 1;
		else if (n.estado === 'Publicado') counts.Publicado += 1;
		else counts.Outros += 1;
	});

	return counts;
}

function buildCategoriaData(lista) {
	const mapa = new Map();
	lista.forEach((n) => {
		const nome = n.pn_categoria?.nome || 'Sem categoria';
		mapa.set(nome, (mapa.get(nome) || 0) + 1);
	});

	const labels = Array.from(mapa.keys());
	const values = Array.from(mapa.values());
	return { labels, values };
}

function buildMesData(lista) {
	const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
	const counts = new Array(12).fill(0);

	lista.forEach((n) => {
		if (!n.data_criacao) return;
		const d = new Date(n.data_criacao);
		const m = d.getMonth();
		if (!Number.isNaN(m)) {
			counts[m] += 1;
		}
	});

	return { labels: meses, values: counts };
}

function buildTipoData(lista) {
	const midia = lista.filter((n) => n.tipo === 1).length;
	const normal = lista.length - midia;
	return { midia, normal };
}

function buildTopRadiosData(lista, maxItems = 5) {
	const mapa = new Map();

	lista
		.filter((n) => n.tipo === 1 && n.emails)
		.forEach((n) => {
			n.emails
				.split(',')
				.map((s) => s.trim())
				.filter(Boolean)
				.forEach((id) => {
					mapa.set(id, (mapa.get(id) || 0) + 1);
				});
		});

	const entries = Array.from(mapa.entries()).sort((a, b) => b[1] - a[1]).slice(0, maxItems);
	const labels = entries.map(([id]) => {
		const radio = radios.find((r) => String(r.id_radio_jornal) === String(id));
		return radio?.nome || id;
	});
	const values = entries.map(([, count]) => count);

	return { labels, values };
}

function buildRedesSociaisData(lista) {
	const mapa = new Map();

	// Contar notícias por rede social
	lista
		.filter((n) => n.pn_rs_noticia && Array.isArray(n.pn_rs_noticia))
		.forEach((n) => {
			n.pn_rs_noticia.forEach((rs) => {
				if (rs && rs.id_rede_social_FK) {
					const id = rs.id_rede_social_FK;
					mapa.set(id, (mapa.get(id) || 0) + 1);
				}
			});
		});

	// Ordenar por quantidade (maior para menor)
	const entries = Array.from(mapa.entries()).sort((a, b) => b[1] - a[1]);
	
	const labels = entries.map(([id]) => {
		const rede = redesSociais.find((r) => String(r.id_rede_social) === String(id));
		return rede?.nome || id;
	});
	const values = entries.map(([, count]) => count);

	return { labels, values };
}

function buildTopTagsData(lista, maxItems = 10) {
	const mapa = new Map();

	// Contar notícias por tag
	lista
		.filter((n) => n.pn_noticia_Tag && Array.isArray(n.pn_noticia_Tag))
		.forEach((n) => {
			n.pn_noticia_Tag.forEach((tagRel) => {
				if (tagRel && tagRel.id_tag) {
					const id = tagRel.id_tag;
					mapa.set(id, (mapa.get(id) || 0) + 1);
				}
			});
		});

	// Ordenar por quantidade (maior para menor) e limitar
	const entries = Array.from(mapa.entries()).sort((a, b) => b[1] - a[1]).slice(0, maxItems);
	
	const labels = entries.map(([id]) => {
		const tag = tags.find((t) => String(t.id_tag) === String(id));
		return tag?.nome || id;
	});
	const values = entries.map(([, count]) => count);

	return { labels, values };
}

function updateCharts() {
	if (!dashboardVisible) return;
	const lista = filtrarNoticias().filter((n) => n.estado !== 'eliminada');
	const midiaLista = lista.filter((n) => n.tipo === 1);

	if (
		!estadoChartCanvas ||
		!categoriaChartCanvas ||
		!mesChartCanvas ||
		!midiaMesChartCanvas ||
		!tipoChartCanvas ||
		!topRadiosChartCanvas ||
		!redesSociaisChartCanvas ||
		!topTagsChartCanvas
	)
		return;

	const estadoData = buildEstadoData(lista);
	const categoriaData = buildCategoriaData(lista);
	const mesData = buildMesData(lista);
	const mesMidiaData = buildMesData(midiaLista);
	const tipoData = buildTipoData(lista);
	const topRadiosData = buildTopRadiosData(midiaLista);
	const redesSociaisData = buildRedesSociaisData(lista);
	const topTagsData = buildTopTagsData(lista);

	if (estadoChart) {
		estadoChart.destroy();
	}
	if (categoriaChart) {
		categoriaChart.destroy();
	}
	if (mesChart) {
		mesChart.destroy();
	}
	if (midiaMesChart) {
		midiaMesChart.destroy();
	}
	if (tipoChart) {
		tipoChart.destroy();
	}
	if (topRadiosChart) {
		topRadiosChart.destroy();
	}
	if (redesSociaisChart) {
		redesSociaisChart.destroy();
	}
	if (topTagsChart) {
		topTagsChart.destroy();
	}

	const baseOptions = {
		legend: {
			labels: { fontFamily: 'inherit' }
		},
		maintainAspectRatio: false,
		responsive: true,
		devicePixelRatio: 2, // melhora nitidez em ecrãs retina
		animation: false
	};

	estadoChart = new Chart(estadoChartCanvas, {
		type: 'doughnut',
		data: {
			labels: [get(t)('divNoticias.pendente'), get(t)('divNoticias.publicado'), get(t)('divEstatisticas.outros') || 'Outros'],
			datasets: [
				{
					data: [estadoData.Pendente, estadoData.Publicado, estadoData.Outros],
					backgroundColor: ['#ffb74d', '#66bb6a', '#90a4ae']
				}
			]
		},
		options: {
			...baseOptions,
			cutoutPercentage: 60
		}
	});

	categoriaChart = new Chart(categoriaChartCanvas, {
		type: 'bar',
		data: {
			labels: categoriaData.labels,
			datasets: [
				{
					label: get(t)('divEstatisticas.numeroNoticias') || 'N.º notícias',
					data: categoriaData.values,
					backgroundColor: '#26c6da'
				}
			]
		},
		options: {
			...baseOptions,
			scales: {
				yAxes: [
					{
						ticks: {
							beginAtZero: true,
							stepSize: 1
						}
					}
				]
			}
		}
	});

	mesChart = new Chart(mesChartCanvas, {
		type: 'line',
		data: {
			labels: mesData.labels,
			datasets: [
				{
					label: get(t)('divEstatisticas.noticiasRedesSociaisMes'),
					data: mesData.values,
					borderColor: '#42a5f5',
					backgroundColor: 'rgba(66, 165, 245, 0.15)',
					fill: true,
					lineTension: 0.2,
					pointRadius: 3
				}
			]
		},
		options: {
			...baseOptions,
			scales: {
				yAxes: [
					{
						ticks: {
							beginAtZero: true,
							stepSize: 1
						}
					}
				]
			}
		}
	});

	midiaMesChart = new Chart(midiaMesChartCanvas, {
		type: 'line',
		data: {
			labels: mesMidiaData.labels,
			datasets: [
				{
					label: get(t)('divEstatisticas.radiosJornaisMes'),
					data: mesMidiaData.values,
					borderColor: '#ef5350',
					backgroundColor: 'rgba(239, 83, 80, 0.15)',
					fill: true,
					lineTension: 0.2,
					pointRadius: 3
				}
			]
		},
		options: {
			...baseOptions,
			scales: {
				yAxes: [
					{
						ticks: {
							beginAtZero: true,
							stepSize: 1
						}
					}
				]
			}
		}
	});

	tipoChart = new Chart(tipoChartCanvas, {
		type: 'doughnut',
		data: {
			labels: [get(t)('divEstatisticas.redesSociais'), get(t)('divEstatisticas.radiosJornaisLabel')],
			datasets: [
				{
					data: [tipoData.normal, tipoData.midia],
					backgroundColor: ['#42a5f5', '#ef5350']
				}
			]
		},
		options: {
			...baseOptions,
			cutoutPercentage: 55
		}
	});

	topRadiosChart = new Chart(topRadiosChartCanvas, {
		type: 'bar',
		data: {
			labels: topRadiosData.labels,
			datasets: [
				{
					label: get(t)('divEstatisticas.numeroRadiosJornais'),
					data: topRadiosData.values,
					backgroundColor: '#ab47bc'
				}
			]
		},
		options: {
			...baseOptions,
			scales: {
				yAxes: [
					{
						ticks: {
							beginAtZero: true,
							stepSize: 1
						}
					}
				]
			}
		}
	});

	// Cores para redes sociais (mais importantes primeiro)
	// Ordem: Facebook, Instagram, Twitter, LinkedIn, Tiktok, Portal IPVC, outras
	const coresRedesSociais = ['#1877f2', '#e4405f', '#1da1f2', '#0077b5', '#000000', '#ff0050', '#25f4ee', '#fe2c55'];
	
	// Mapear cores específicas para redes conhecidas
	const coresPorRede = new Map([
		['Facebook', '#1877f2'],
		['Instagram', '#e4405f'],
		['Twitter', '#1da1f2'],
		['LinkedIn', '#0077b5'],
		['Tiktok', '#000000'],
		['Portal IPVC', '#ff6b35'] // Cor laranja/vermelho distintiva para Portal IPVC
	]);
	
	const backgroundColorRedes = redesSociaisData.labels.map((label) => {
		// Usar cor específica se existir, senão usar do array por índice
		return coresPorRede.get(label) || coresRedesSociais[redesSociaisData.labels.indexOf(label) % coresRedesSociais.length];
	});

	redesSociaisChart = new Chart(redesSociaisChartCanvas, {
		type: 'bar',
		data: {
			labels: redesSociaisData.labels,
			datasets: [
				{
					label: get(t)('divEstatisticas.numeroNoticiasPorRede'),
					data: redesSociaisData.values,
					backgroundColor: backgroundColorRedes
				}
			]
		},
		options: {
			...baseOptions,
			scales: {
				yAxes: [
					{
						ticks: {
							beginAtZero: true,
							stepSize: 1
						}
					}
				]
			}
		}
	});

	// Cores para tags (gradiente de cores vibrantes)
	const coresTags = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', '#eb4d4b', '#6c5ce7', '#a29bfe', '#00b894', '#00cec9'];
	const backgroundColorTags = topTagsData.labels.map((_, index) => 
		coresTags[index % coresTags.length]
	);

	topTagsChart = new Chart(topTagsChartCanvas, {
		type: 'horizontalBar',
		data: {
			labels: topTagsData.labels,
			datasets: [
				{
					label: get(t)('divEstatisticas.numeroNoticiasPorTag'),
					data: topTagsData.values,
					backgroundColor: backgroundColorTags
				}
			]
		},
		options: {
			...baseOptions,
			scales: {
				xAxes: [
					{
						ticks: {
							beginAtZero: true,
							stepSize: 1
						}
					}
				]
			}
		}
	});
}

$effect(() => {
	if (!loading) {
		updateCharts();
	}
});

// Atualizar gráficos quando o idioma mudar
$effect(() => {
	if (!loading && dashboardVisible) {
		// Força atualização dos gráficos quando o idioma muda
		const currentLocale = locale.get();
		updateCharts();
		}
	});

	function aplicarFiltro() {
		filtros.ano = anoSelecionado;
		// Força atualização dos KPIs e gráficos
		if (!loading && dashboardVisible) {
			updateCharts();
		}
	}
</script>

<Breadcrum
	modulo={sidebarOptions.currentModule}
	objeto={sidebarOptions.currentObject}
	menu_items={items_breadcrum}
/>

<div class="tableNews mt-2">
	<div class="row filter">
		<form on:submit|preventDefault={aplicarFiltro} class="w-100">
			<div class="row filter-row align-items-start g-3">
				<!-- ANO -->
				<div class="col-md-3 col-lg-3">
					<label class="filter-label">{$t('divEstatisticas.ano')}</label>
					<select class="form-control" bind:value={anoSelecionado}>
						<option value="">{$t('divEstatisticas.todos')}</option>
						{#each anosDisponiveis as ano}
							<option value={ano}>{ano}</option>
						{/each}
					</select>
				</div>

				<!-- BOTÃO PESQUISAR, À DIREITA -->
				<div class="col-md-3 col-lg-3 d-flex flex-column align-items-center align-items-md-start">
					<span class="filter-label d-block">&nbsp;</span>
					<button
						type="submit"
						class="btn btn-primary btn-sm filter-submit"
						style="margin-top: 0px; background-color: #00a4e6; border-color: #00a4e6;"
						aria-label={tf('divNoticias.btPesquisar')}
					>
						<i class="fas fa-search"></i>
					</button>
				</div>
			</div>
		</form>
	</div>

	<script>
		function aplicarFiltro() {
			filtros.ano = anoSelecionado;
			// Força atualização dos KPIs e gráficos
			if (!loading && dashboardVisible) {
				updateCharts();
			}
		}
	</script>

	<div class="row mt-4 kpi-row">
		<div class="col-md-2 col-sm-6 mb-3">
			<div class="kpi-card gradient-1">
				<div class="kpi-value">{kpis.totalPublicacoes}</div>
				<div class="kpi-label">{$t('divEstatisticas.totalPublicacoes')}</div>
				<div class="kpi-subtitle">{$t('divEstatisticas.totalPublicacoesSubtitle')}</div>
			</div>
		</div>
		<div class="col-md-2 col-sm-6 mb-3">
			<div class="kpi-card gradient-2">
				<div class="kpi-value">{kpis.publicadasRedesSociais}</div>
				<div class="kpi-label">{$t('divEstatisticas.noticiasPublicadas')}</div>
				<div class="kpi-subtitle">{$t('divEstatisticas.nasRedesSociais')}</div>
			</div>
		</div>
		<div class="col-md-2 col-sm-6 mb-3">
			<div class="kpi-card gradient-3">
				<div class="kpi-value">{kpis.publicadasRadiosJornais}</div>
				<div class="kpi-label">{$t('divEstatisticas.noticiasPublicadas')}</div>
				<div class="kpi-subtitle">{$t('divEstatisticas.radiosJornais')}</div>
			</div>
		</div>
		<div class="col-md-2 col-sm-6 mb-3">
			<div class="kpi-card gradient-4">
				<div class="kpi-value">{kpis.pendentes}</div>
				<div class="kpi-label">{$t('divEstatisticas.noticiasPendentes')}</div>
				<div class="kpi-subtitle">{$t('divEstatisticas.aguardandoPublicacao')}</div>
			</div>
		</div>
		<div class="col-md-2 col-sm-6 mb-3">
			<div class="kpi-card gradient-5">
				<div class="kpi-value">{kpis.agendadas}</div>
				<div class="kpi-label">{$t('divEstatisticas.noticiasAgendadas')}</div>
				<div class="kpi-subtitle">{$t('divEstatisticas.comAgendamento')}</div>
			</div>
		</div>
		<div class="col-md-2 col-sm-6 mb-3">
			<div class="kpi-card gradient-6">
				<div class="kpi-value">{kpis.apenasPortalIPVC}</div>
				<div class="kpi-label">{$t('divEstatisticas.noticiasApenasPortalIPVC')}</div>
				<div class="kpi-subtitle">{$t('divEstatisticas.soPortalIPVC')}</div>
			</div>
		</div>
	</div>

	<div class="row mt-3">
		<div class="col-12 d-flex align-items-center">
			<button
				type="button"
				class="btn btn-outline-info btn-sm dashboard-toggle-btn"
				on:click={toggleDashboard}
			>
				<i class="fas fa-chart-pie mr-1"></i>
				{dashboardVisible ? $t('divEstatisticas.ocultarDashboard') : $t('divEstatisticas.mostrarDashboard')}
			</button>
		</div>
	</div>

	{#if dashboardVisible}
		<div class="row mt-4">
			<div class="col-12">
				<h4 class="section-title">{$t('divEstatisticas.informacoesGerais')}</h4>
				<!-- 1. Distribuição por Estado (visão geral) -->
				<div class="row mt-3">
					<div class="col-md-6 mb-3">
						<div class="chart-card">
							<div class="chart-title">{$t('divEstatisticas.distribuicaoEstado')}</div>
							<div class="chart-wrapper">
								<canvas bind:this={estadoChartCanvas}></canvas>
							</div>
						</div>
					</div>
					<!-- 2. Notícias por Rede Social (novo - importante) -->
					<div class="col-md-6 mb-3">
						<div class="chart-card">
							<div class="chart-title">{$t('divEstatisticas.noticiasPorRedeSocial')}</div>
							<div class="chart-wrapper">
								<canvas bind:this={redesSociaisChartCanvas}></canvas>
							</div>
						</div>
					</div>
				</div>
				<!-- 3. Redes Sociais vs Rádios/Jornais (comparação importante) -->
				<div class="row mt-3">
					<div class="col-md-6 mb-3">
						<div class="chart-card">
							<div class="chart-title">{$t('divEstatisticas.redesSociaisVsRadios')}</div>
							<div class="chart-wrapper">
								<canvas bind:this={tipoChartCanvas}></canvas>
							</div>
						</div>
					</div>
					<!-- 4. Notícias por Categoria (Redes Sociais) -->
					<div class="col-md-6 mb-3">
						<div class="chart-card">
							<div class="chart-title">{$t('divEstatisticas.noticiasPorCategoria')}</div>
							<div class="chart-wrapper">
								<canvas bind:this={categoriaChartCanvas}></canvas>
							</div>
						</div>
					</div>
				</div>
				<!-- 5. Top Rádios/Jornais -->
				<div class="row mt-3">
					<div class="col-md-6 mb-3">
						<div class="chart-card">
							<div class="chart-title">{$t('divEstatisticas.topRadiosJornais')}</div>
							<div class="chart-wrapper">
								<canvas bind:this={topRadiosChartCanvas}></canvas>
							</div>
						</div>
					</div>
					<!-- 6. Notícias nas Redes Sociais por mês -->
					<div class="col-md-6 mb-3">
						<div class="chart-card">
							<div class="chart-title">{$t('divEstatisticas.noticiasRedesSociaisMes')}</div>
							<div class="chart-wrapper">
								<canvas bind:this={mesChartCanvas}></canvas>
							</div>
						</div>
					</div>
				</div>
				<!-- 7. Rádios/Jornais por mês -->
				<div class="row mt-3">
					<div class="col-md-6 mb-3">
						<div class="chart-card">
							<div class="chart-title">{$t('divEstatisticas.radiosJornaisMes')}</div>
							<div class="chart-wrapper">
								<canvas bind:this={midiaMesChartCanvas}></canvas>
							</div>
						</div>
					</div>
					<!-- 8. Top Tags (tags mais utilizadas) -->
					<div class="col-md-6 mb-3">
						<div class="chart-card">
							<div class="chart-title">{$t('divEstatisticas.topTags')}</div>
							<div class="chart-wrapper">
								<canvas bind:this={topTagsChartCanvas}></canvas>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	{:else}
		<div class="row mt-4">
			<div class="col-12">
				<p class="dashboard-hidden-text">{$t('divEstatisticas.dashboardOcultado')}</p>
			</div>
		</div>
	{/if}

	{#if loading}
		<div class="loading-area">
			<div class="spinner-border text-primary" role="status">
				<span class="visually-hidden">Loading...</span>
			</div>
		</div>
	{/if}
</div>

<style>
	@import '../portal_noticias.css';

	.filter-row {
		border-bottom: 1px solid #dde3ea;
		padding: 8px 24px 10px;
	}

	.filter-label {
		display: block;
		margin-bottom: 3px;
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: #7fa0b5;
	}

	.kpi-row {
		margin-top: 16px;
	}

	.kpi-card {
		border-radius: 8px;
		padding: 18px 20px;
		color: #0b3c5d;
		box-shadow: 0 6px 16px rgba(15, 35, 52, 0.15);
		background: linear-gradient(135deg, #e0f3ff 0%, #c3e4ff 50%, #f5fbff 100%);
	}

	/* Todos os cards usam o mesmo gradiente do primeiro */
	.kpi-card.gradient-2,
	.kpi-card.gradient-3,
	.kpi-card.gradient-4,
	.kpi-card.gradient-5,
	.kpi-card.gradient-6 {
		background: linear-gradient(135deg, #e0f3ff 0%, #c3e4ff 50%, #f5fbff 100%);
	}

	.kpi-value {
		font-size: 28px;
		font-weight: 700;
		margin-bottom: 4px;
	}

	.kpi-label {
		font-size: 13px;
		font-weight: 500;
		color: #4c6377;
	}

	.kpi-subtitle {
		font-size: 10px;
		font-weight: 400;
		color: #7f8b99;
		margin-top: 2px;
		font-style: italic;
	}

	.loading-area {
		margin-top: 20px;
		display: flex;
		justify-content: center;
	}

	.section-title {
		font-size: 18px;
		font-weight: 600;
		margin-top: 8px;
		margin-bottom: 4px;
	}

	.dashboard-hidden-text {
		font-size: 14px;
		color: #7f8b99;
		font-style: italic;
	}

	.chart-card {
		background: #ffffff;
		border-radius: 8px;
		box-shadow: 0 4px 12px rgba(15, 35, 52, 0.12);
		padding: 12px 16px 16px;
		height: 100%;
	}

	.chart-title {
		font-size: 14px;
		font-weight: 600;
		margin-bottom: 8px;
		color: #4c6377;
	}

	.chart-wrapper {
		position: relative;
		height: 260px;
	}
</style>


