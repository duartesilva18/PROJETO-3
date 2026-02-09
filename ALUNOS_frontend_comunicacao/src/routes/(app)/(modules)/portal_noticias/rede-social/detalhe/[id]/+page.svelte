<script>
	import { goto } from '$app/navigation';
import Breadcrum from '$lib/components/Breadcrum.svelte';
import { t } from '$lib/translations/translations';
	import { onMount } from 'svelte';
import RemoveModal from './modals/RemoveModal.svelte';
	import Modal from './Modal.svelte';
import { derived } from 'svelte/store';
import { sidebarOptions } from '$lib/runes/sidebarOptions.rune.svelte';
import { configurePortalSidebar } from '../../../sidebar.config.js';

import { page } from '$app/stores';
import { get } from 'svelte/store';
import { modalStore } from '$lib/stores/modalStore';

	
const translate = (key) => get(t)(key);
// A configuração do sidebar será feita no onMount após carregar o tipo de notícia

	// titulo da página
	// Extraia o id da notícia dos parâmetros da rota
	const noticiaId = $page.params.id;
	
	let currentIndex = $state(0);
	let noticiaSelecionada = $state();
	let redesSocial = $state([]);
let projetos = $state([]);
let radios_jornais = $state([]);
	/** Textos personalizados por rádio/jornal (mídia) - from GET midia_personalizada */
	let midiaPersonalizada = $state([]);
	let projetoSelecionado = $state(null);
	let projetoAssunto = $state('');
	let agendamentoHora = $state('');
	let resultString = $state('');

	let removeModalBind = $state();

	const icones = {
		Facebook: 'fab fa-facebook-f',
		Twitter: 'fab fa-twitter',
		Instagram: 'fab fa-instagram',
		LinkedIn: 'fab fa-linkedin-in',
		Tiktok: 'fab fa-tiktok',
		'Portal IPVC': 'fas fa-globe'
	};

	const coresRedes = {
		Facebook: '#1877F2',
		Twitter: '#1DA1F2',
		Instagram: '#E4405F',
		LinkedIn: '#0A66C2',
		Tiktok: '#000000',
		'Portal IPVC': '#00a4e6'
	};

	onMount(async () => {
		try {
			redesSocial = await fetch('/ep/portal_noticias/redes').then((d) => d.json());
			noticiaSelecionada = await fetch(`/ep/portal_noticias/noticia?id=${noticiaId}`).then((d) =>
				d.json()
			);
			
			// Configura o sidebar dinamicamente com base no tipo de notícia
			if (noticiaSelecionada.tipo === 1) {
				configurePortalSidebar('midiaList', translate);
			} else {
				configurePortalSidebar('dashboard', translate);
			}

			projetos = await fetch('/ep/portal_noticias/getJson').then((d) => d.json());
			radios_jornais = await fetch('/ep/portal_noticias/radio_jornal').then((d) => d.json());

			// Textos personalizados por rádio/jornal (só para notícias tipo mídia)
			if (noticiaSelecionada.tipo === 1 && noticiaId) {
				try {
					const res = await fetch(`/ep/portal_noticias/midia_personalizada/${noticiaId}`);
					if (res.ok) {
						const data = await res.json();
						midiaPersonalizada = Array.isArray(data) ? data : [];
					}
				} catch (e) {
					console.error('Erro ao carregar textos personalizados por rádio/jornal:', e);
				}
			}

			const idsEmails = (noticiaSelecionada.emails ?? '').split(',');
			const matchedRadiosJornais = radios_jornais.filter((item) =>
				idsEmails.includes(item.id_radio_jornal)
			);
			resultString = matchedRadiosJornais.map((item) => `${item.nome}`).join(', ');

			projetoSelecionado = projetos.find((p) => p.id_projeto === noticiaSelecionada.id_projeto);
			projetoAssunto = projetoSelecionado?.assunto ?? '';
			
			const firstAgendamento = noticiaSelecionada.pn_agendamento_rede?.[0];
			agendamentoHora = firstAgendamento ? formatDateTime(firstAgendamento.horario_agendado) : '';

			redesSocial.forEach((rede) => {
				rede.icone = icones[rede.nome] || 'fas fa-share-alt';
				rede.cor = coresRedes[rede.nome] || '#6c7a89';
			});
		} catch (error) {
			console.error('Erro ao buscar notícia:', error);
		}
	});

	function nextImage() {
		if (currentIndex < noticiaSelecionada.pn_anexos.length - 1) {
			currentIndex++;
		}
	}

	function previousImage() {
		if (currentIndex > 0) {
			currentIndex--;
		}
	}
	
	let auxdois = 0;
	let currentVideoIndex = 0;
	let index = $state(0);
	let videoElement; // Referência ao elemento de vídeo

	// Função para obter os vídeos filtrados
	function getVideos() {
		return noticiaSelecionada?.pn_anexos?.filter(anexo => anexo.tipo.startsWith('video/')) || [];
	}

	function nextVideo() {
		const videos = getVideos();
		if (index < videos.length - 1) {
			index += 1;
			updateVideo(); // Atualiza o vídeo
		}
	}

	function prevVideo() {
		if (index > 0) {
			index -= 1;
			updateVideo(); // Atualiza o vídeo
		}
	}

	// Força o carregamento do vídeo novo
	function updateVideo() {
    	if (videoElement) {
			const videos = getVideos();
			videoElement.src = `/ep/portal_noticias/getFileById?id=${videos[index].id_anexo}`;
			videoElement.type = videos[index].tipo;
			videoElement.load(); // Força o navegador a recarregar o vídeo
		}
	}	

	function handleBack() {
		if (noticiaSelecionada?.tipo === 1) {
			goto('/portal_noticias/radios-jornais/lista');
		} else {
			goto('/portal_noticias');
		}
	}

	function formatDate(dateString) {
		const date = new Date(dateString);
		return date.toLocaleDateString('pt-BR', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
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

	function getTagNames() {
		return (
			noticiaSelecionada?.pn_noticia_Tag
				?.map((item) => item?.pn_tag?.nome)
				.filter((nome) => !!nome) ?? []
		);
	}
	function getNomeRedeSocialById(id) {
		// Certifique-se de que o tipo de 'id' corresponde ao tipo de 'rede.id_rede_social'
		const rede = redesSocial.find((rede) => rede.id_rede_social === id);
		if (rede) {
			return rede;
		} else {
			console.error('Rede social não encontrada para o ID:', id);
			return null; // Ou maneje o erro conforme necessário
		}
	}

	function getNomeRadioJornalById(id) {
		const rj = radios_jornais.find((r) => r.id_radio_jornal === id);
		return rj ? rj.nome : id;
	}

	function onHandleSubmit(e) {
		e.preventDefault();
		return;
	}

	function createNoticia() {
		if (noticiaSelecionada.tipo === 0) {
			goto(`/portal_noticias/rede-social/criar`);
		} else if (noticiaSelecionada.tipo === 1) {
			goto(`/portal_noticias/radios-jornais/criar`);
		}
	}

	function editNoticia() {
		// Se o tipo for null ou 0, assumimos rede-social (já que estamos nesta pasta)
		if (noticiaSelecionada?.tipo === 1) {
			goto(`/portal_noticias/radios-jornais/editar/${noticiaId}`);
		} else {
			goto(`/portal_noticias/rede-social/editar/${noticiaId}`);
		}
	}

	function deleteNoticia() {
		if (removeModalBind && removeModalBind.onOpenModal) {
			removeModalBind.onOpenModal(noticiaSelecionada);
		} else {
			// Fallback caso o bind falhe por algum motivo
			const modal = get(modalStore);
			if (modal && modal.onOpenModal) {
				modal.onOpenModal(noticiaSelecionada);
			} else {
				console.error('RemoveModal não está disponível');
				toastr.error('Erro ao abrir o modal de eliminação. Por favor, recarregue a página.', 'Erro');
			}
		}
	}

	function onDeleteRow() {
		if (noticiaSelecionada?.tipo === 1) {
			goto('/portal_noticias/radios-jornais/lista');
		} else {
			goto('/portal_noticias');
		}
	}

	let items_breadcrum = $derived([
		{
			icon_class: 'fas fa-edit',
			url: '#',
			designacao: $t('divNoticias.editar'),
			function: editNoticia
		},
		{
			icon_class: 'fas fa-trash',
			url: '#',
			designacao: $t('divNoticias.eliminar'),
			class: 'btn-danger-breadcrumb',
			function: deleteNoticia
		}
	]);

	let redesComTexto = $derived(
		redesSocial.filter(rede => {
			if (!noticiaSelecionada) return false;
			const field = `texto_${rede.nome.toLowerCase().replace(/\s/g, '')}`;
			const val = noticiaSelecionada[field];
			// Mostra se o valor existe e não é apenas espaços
			const show = val && val.trim() !== '';
			return show;
		})
	);
</script>

{#if noticiaSelecionada}
	<!-- Verifica se noticia não está vazio -->
	<Breadcrum
		modulo={sidebarOptions.currentModule}
		objeto={`${sidebarOptions.currentObject} <span class="separator-disc mx-2">&#8226;</span> ${$t(
			'Titulos.VerNoticia'
		)}`}
		menu_items={items_breadcrum}
	/>

	<div class="tableNews noticia-layout">
		<div class="row g-4">
			<div class="col-lg-8">
				<div class="card-simple">
					<div class="detail-header">
						<div>
							<p class="detail-label-upper">{$t('divNoticias.noticia')}</p>
							<h2 class="detail-title">{noticiaSelecionada.titulo}</h2>
							<p class="detail-subtitle">
								{$t('divNoticias.dataCriacao')}: {formatDate(noticiaSelecionada.data_criacao)}
							</p>
						</div>
						<div class="d-flex flex-column align-items-end">
							<span
								class={
									'badge detail-estado-chip ' +
									(noticiaSelecionada.estado === 'Publicado'
										? 'estado-publicado'
										: noticiaSelecionada.tipo === 1 && noticiaSelecionada.estado === 'Pendente'
											? 'estado-rascunho'
											: noticiaSelecionada.estado === 'Pendente'
												? 'estado-pendente'
												: 'estado-rascunho')
								}
							>
								{noticiaSelecionada.tipo === 1 && noticiaSelecionada.estado === 'Pendente'
									? 'Rascunho'
									: noticiaSelecionada.estado}
							</span>
						</div>
					</div>

					<div class="detail-meta-row mt-3">
						<div class="meta-item">
							<span class="meta-label">{$t('divNoticias.categoria')}:</span>
							<span class="meta-value">{noticiaSelecionada.pn_categoria.nome}</span>
						</div>
						
						<div class="meta-item">
							<span class="meta-label">Projeto:</span>
							<span class="meta-value">{projetoAssunto || 'Sem projeto'}</span>
						</div>

						{#if agendamentoHora}
							<div class="meta-item">
								<span class="meta-label">Hora agendada:</span>
								<span class="meta-value">{agendamentoHora}</span>
							</div>
						{/if}
					</div>

					{#if noticiaSelecionada.tipo === 1 && resultString}
						<div class="detail-meta-row mt-2">
							<div class="meta-item">
								<span class="meta-label">{$t('divNoticias.Radio_Jornal')}:</span>
								<span class="meta-value">{resultString}</span>
							</div>
						</div>
					{/if}

					<!-- Textos personalizados por rádio/jornal (mídia) -->
					{#if noticiaSelecionada.tipo === 1 && midiaPersonalizada.length > 0}
						<div class="mt-5 pt-2 border-top">
							<h5 class="detail-section-title mb-4">Textos personalizados por Rádio/Jornal</h5>
							<div class="custom-texts-list">
								{#each midiaPersonalizada.filter((item) => item.texto_custom && item.texto_custom.trim() !== '') as item}
									<div class="custom-text-block">
										<div class="custom-text-header">
											<i class="fas fa-broadcast-tower" style="color: #7fa0b5;"></i>
											<span style="color: #2f3a44">{getNomeRadioJornalById(item.id_radio_jornal)}</span>
										</div>
										<div class="custom-text-content">
											<p>{item.texto_custom}</p>
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/if}

					{#if projetoSelecionado?.descricao}
						<div class="detail-meta-row mt-2">
							<div class="meta-item">
								<span class="meta-label">Descrição do Projeto:</span>
								<span class="meta-description">{projetoSelecionado.descricao}</span>
							</div>
						</div>
					{/if}

					<hr class="detail-separator" />

					<div class="mb-4">
						<h5 class="detail-section-title">{$t('divNoticias.Texto')} Geral</h5>
						<div class="detail-text-wrapper">
							{#each noticiaSelecionada.texto.split('\n') as paragrafo, index (index)}
								{#if paragrafo.trim()}
									<p class="detail-text" class:detail-text-lead={index === 0}>{paragrafo}</p>
								{/if}
							{/each}
						</div>
					</div>

					<!-- Zona de Textos Personalizados -->
					{#if redesComTexto.length > 0}
						<div class="mt-5 pt-2 border-top">
							<h5 class="detail-section-title mb-4">Textos por Rede Social</h5>
							<div class="custom-texts-list">
								{#each redesComTexto as rede}
									<div class="custom-text-block">
										<div class="custom-text-header">
											<i class={rede.icone} style="color: {rede.cor};"></i>
											<span style="color: {rede.cor}">{rede.nome}</span>
										</div>
										<div class="custom-text-content">
											<p>{noticiaSelecionada[`texto_${rede.nome.toLowerCase().replace(/\s/g, '')}`]}</p>
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/if}

					{#if getTagNames().length > 0}
						<div class="mt-4">
							<h6 class="detail-small-title">Tags Associadas</h6>
							<div class="detail-tags mt-2">
								{#each getTagNames() as tag}
									<span class="detail-tag-pill">#{tag}</span>
								{/each}
							</div>
						</div>
					{/if}
				</div>

				{#if noticiaSelecionada.pn_agendamento_rede && noticiaSelecionada.pn_agendamento_rede.length > 0}
					<div class="card-simple mt-3">
						<h5 class="detail-section-title mb-3">{$t('divNoticias.agendamentosNoticia')}</h5>
						<div class="table-responsive">
							<table class="table table-sm mb-0">
								<thead>
									<tr>
										<th>{$t('divNoticias.rede')}</th>
										<th>{$t('divNoticias.dataHora')}</th>
										<th>{$t('divNoticias.fuso')}</th>
										<th>{$t('divNoticias.estadoAgendamento')}</th>
									</tr>
								</thead>
								<tbody>
									{#each noticiaSelecionada.pn_agendamento_rede as ag}
										<tr>
											<td>{getNomeRedeSocialById(ag.id_rede_social)?.nome ?? $t('divNoticias.rede')}</td>
											<td>{formatDateTime(ag.horario_agendado)}</td>
											<td>{ag.fuso_horario ?? 'Europe/Lisbon'}</td>
											<td class="text-capitalize">{ag.status ?? 'pendente'}</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					</div>
				{/if}
			</div>

			<div class="col-lg-4">
				<div class="card-simple mb-3">
					<h5 class="detail-section-title mb-2">{$t('divNoticias.anexosTitulo')}</h5>

					{#if noticiaSelecionada.pn_anexos.some((anexo) => anexo.tipo.startsWith('image/'))}
						<div class="detail-media-block mb-3">
							<div class="d-flex justify-content-between align-items-center mb-2">
								<span class="detail-small-title mb-0">{$t('divNoticias.imagens')}</span>
								<small class="text-muted">
									{$t('divNoticias.imagens')} {currentIndex + 1} / {noticiaSelecionada.pn_anexos.filter((anexo) =>
										anexo.tipo.startsWith('image/')
									).length}
								</small>
							</div>
							<div class="detail-image-wrapper mb-2">
								<img
									src={`/ep/portal_noticias/getFileById?id=${
										noticiaSelecionada.pn_anexos.filter((anexo) => anexo.tipo.startsWith('image/'))[
											currentIndex
										].id_anexo
									}`}
									alt={
										noticiaSelecionada.pn_anexos.filter((anexo) => anexo.tipo.startsWith('image/'))[
											currentIndex
										].nome
									}
								/>
							</div>
							<div class="d-flex gap-2">
								<button onclick={previousImage} disabled={currentIndex === 0} class="btn btn-light btn-sm w-100">
									<i class="fas fa-chevron-left"></i>
									{$t('divNoticias.anterior') || 'Anterior'}
								</button>
								<button
									onclick={nextImage}
									disabled={
										currentIndex ===
										noticiaSelecionada.pn_anexos.filter((anexo) => anexo.tipo.startsWith('image/')).length - 1
									}
									class="btn btn-light btn-sm w-100"
								>
									{$t('divNoticias.seguinte') || 'Seguinte'}
									<i class="fas fa-chevron-right"></i>
								</button>
							</div>
						</div>
					{/if}

					{#if noticiaSelecionada.pn_anexos.some((anexo) => anexo.tipo.startsWith('video/'))}
						<div class="detail-media-block">
							<div class="d-flex justify-content-between align-items-center mb-2">
								<span class="detail-small-title mb-0">{$t('divNoticias.videos')}</span>
								<small class="text-muted">
									{$t('divNoticias.videos')} {index + 1} / {getVideos().length}
								</small>
							</div>
							<div class="detail-video-wrapper mb-2">
								<video controls bind:this={videoElement}>
									<source
										src={`/ep/portal_noticias/getFileById?id=${getVideos()[index].id_anexo}`}
										type={getVideos()[index].tipo}
									/>
									{$t('common.video_not_supported') || 'Your browser does not support the video tag.'}
								</video>
							</div>
							<div class="d-flex gap-2">
								<button onclick={prevVideo} disabled={index === 0} class="btn btn-light btn-sm w-100">
									<i class="fas fa-chevron-left"></i>
									{$t('divNoticias.anterior') || 'Anterior'}
								</button>
								<button
									onclick={nextVideo}
									disabled={index === getVideos().length - 1}
									class="btn btn-light btn-sm w-100"
								>
									{$t('divNoticias.seguinte') || 'Seguinte'}
									<i class="fas fa-chevron-right"></i>
								</button>
							</div>
						</div>
					{/if}
				</div>

			</div>
		</div>
	</div>

	<!-- Remove Modal -->
	<RemoveModal bind:this={removeModalBind} on:refreshData={onDeleteRow} />
{:else}
	<div id="loading_area">
		<div id="loading-on">
			<span class="dot-on">.</span>
			<span class="dot-on2">.</span>
			<span class="dot-on3">.</span>
		</div>
	</div>
{/if}



<style>
	@import "../../../portal_noticias.css";

	.noticia-layout {
		margin-top: 16px;
		padding-bottom: 16px;
	}

	.card-simple {
		border: 1px solid #dde3ea;
		border-radius: 10px;
		padding: 16px;
		background: #fff;
	}

	.detail-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 12px;
		flex-wrap: wrap;
	}

	.detail-label-upper {
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: #6c7a89;
		margin-bottom: 2px;
	}

	.detail-title {
		font-size: 1.6rem;
		font-weight: 700;
		margin: 0 0 4px;
		color: #212529;
	}

	.detail-subtitle {
		font-size: 0.9rem;
		color: #6c757d;
		margin: 0;
	}

	.detail-estado-chip {
		padding: 0.25rem 0.75rem;
		border-radius: 999px;
		font-size: 0.8rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		align-self: flex-start;
	}

	.detail-meta-row {
		display: flex;
		flex-wrap: wrap;
		gap: 24px;
		align-items: center;
	}

	.meta-item {
		display: flex;
		align-items: baseline;
		gap: 8px;
	}

	.meta-label {
		font-size: 0.75rem;
		text-transform: uppercase;
		font-weight: 700;
		color: #7fa0b5;
		letter-spacing: 0.05em;
	}

	.meta-value {
		font-size: 0.95rem;
		font-weight: 500;
		color: #2f3a44;
	}

	.meta-description {
		font-size: 0.9rem;
		color: #6c757d;
		font-style: italic;
	}

	.custom-text-block {
		border: 1px solid #dde3ea;
		border-radius: 8px;
		padding: 16px;
		background: #fcfdfe;
		margin-bottom: 16px;
	}

	.custom-text-header {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 12px;
		padding-bottom: 8px;
		border-bottom: 1px solid #f0f3f7;
	}

	.custom-text-header i {
		font-size: 1.1rem;
	}

	.custom-text-header span {
		font-weight: 700;
		text-transform: uppercase;
		font-size: 0.85rem;
		letter-spacing: 0.03em;
	}

	.custom-text-content p {
		font-size: 0.95rem;
		line-height: 1.6;
		color: #343a40;
		margin: 0;
		white-space: pre-wrap;
	}

	.detail-separator {
		margin: 20px 0;
		border-top: 1px solid #eef2f7;
	}

	.detail-section-title {
		font-size: 1rem;
		font-weight: 600;
		margin-bottom: 6px;
	}

	.detail-text-wrapper {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.detail-text {
		margin: 0;
		font-size: 0.96rem;
		line-height: 1.6;
		color: #343a40;
	}

	.detail-text-lead {
		font-weight: 600;
		font-size: 1rem;
	}

	.detail-small-title {
		font-size: 0.85rem;
		font-weight: 600;
		text-transform: uppercase;
		color: #6c7a89;
		letter-spacing: 0.06em;
	}

	.detail-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}

	.detail-tag-pill {
		display: inline-flex;
		align-items: center;
		padding: 2px 8px;
		border-radius: 999px;
		background-color: #e9f5ff;
		color: #0069d9;
		font-size: 0.8rem;
	}

	.detail-media-block {
		border-top: 1px solid #e3e9f0;
		padding-top: 8px;
	}

	.detail-image-wrapper img,
	.detail-video-wrapper video {
		width: 100%;
		border-radius: 6px;
	}

	.detail-socials {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.detail-social-button {
		width: 100%;
		justify-content: flex-start;
		border-color: #dde3ea;
		color: #3f4d5a;
		background-color: #fff;
		padding-top: 8px;
		padding-bottom: 8px;
	}

	.detail-social-button:hover {
		background-color: #f7f9fc;
	}

	.detail-social-row {
		display: flex;
	}

	.detail-social-main {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
	}

	.detail-social-title {
		display: flex;
		align-items: center;
		font-weight: 600;
		margin-bottom: 2px;
	}

	.detail-social-snippet {
		margin: 0;
		font-size: 0.8rem;
		color: #6c757d;
		max-height: 2.8em;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.social-texts-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 16px;
	}

	.social-text-card {
		border: 1px solid #e3e9f0;
		border-radius: 8px;
		overflow: hidden;
		background: #fff;
		transition: transform 0.2s;
	}

	.social-text-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0,0,0,0.05);
	}

	.social-text-header {
		padding: 8px 12px;
		background: #f8f9fa;
		border-bottom: 1px solid #e3e9f0;
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.social-text-name {
		font-weight: 600;
		font-size: 0.9rem;
		color: #495057;
	}

	.social-text-body {
		padding: 12px;
	}

	.social-text-body p {
		margin: 0;
		font-size: 0.88rem;
		line-height: 1.5;
		color: #343a40;
		white-space: pre-wrap;
	}

	.action-buttons-compact {
		display: flex;
		gap: 8px;
	}

	.action-buttons-compact .btn {
		width: 32px;
		height: 32px;
		padding: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 6px;
	}
</style>
