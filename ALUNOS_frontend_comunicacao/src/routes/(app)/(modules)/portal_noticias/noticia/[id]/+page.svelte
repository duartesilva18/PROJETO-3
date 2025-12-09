<script>
	import { goto } from '$app/navigation';
import Breadcrum from '$lib/components/Breadcrum.svelte';
import { t } from '$lib/translations/translations';
	import { onMount } from 'svelte';
	import RemoveModal from '../../noticia/[id]/modals/RemoveModal.svelte';
	import Modal from './Modal.svelte';
	import FacebookPreview from './modals/FacebookPreview.svelte';
	import TwitterPreview from './modals/TwitterPreview.svelte';
	import InstagramPreview from './modals/InstagramPreview.svelte';
	import LinkedinPreview from './modals/LinkedinPreview.svelte';
	import TiktokPreview from './modals/TiktokPreview.svelte';
import { derived } from 'svelte/store';
import { sidebarOptions } from '$lib/runes/sidebarOptions.rune.svelte';
import { configurePortalSidebar } from '../../sidebar.config.js';

import { page } from '$app/stores';
import { get } from 'svelte/store';
import { modalStore } from '$lib/stores/modalStore';

	
const translate = (key) => get(t)(key);
configurePortalSidebar('dashboard', translate);

	// titulo da página
	// Extraia o id da notícia dos parâmetros da rota
	const noticiaId = $page.params.id;
	
	let currentIndex = $state(0);
	let noticiaSelecionada = $state();
	let redesSocial = $state([]);
	let pedidos = $state([]);
	let radios_jornais = $state([]);
	let pedidoassunto = $state('');
	let selectedSocialNetwork = $state('bacx');
	let resultString = $state('');
	let showPopup = $state(false);

	let removeModalBind = $state();

	const icones = {
		Facebook: 'fab fa-facebook-f',
		Twitter: 'fab fa-twitter',
		Instagram: 'fab fa-instagram',
		LinkedIn: 'fab fa-linkedin-in',
		Tiktok: 'fab fa-tiktok'
	};

	const socialColors = {
        Facebook: '#3b5998', // Facebook Blue
        Twitter: '#1DA1F2',  // Twitter Blue
        Instagram: 'linear-gradient(45deg, #405DE6, #5851DB, #833AB4, #C13584, #E1306C, #FD1D1D)', // Instagram Gradient
        Linkedin: '#0077B5', // LinkedIn Blue
        Tiktok: '#69C9D0'    // TikTok Blue
    };

	onMount(async () => {
		try {
			redesSocial = await fetch('/ep/portal_noticias/redes').then(d => d.json());
			noticiaSelecionada = await await fetch(`/ep/portal_noticias/noticia?id=${noticiaId}`).then(d => d.json());
			pedidos = await fetch('/ep/portal_noticias/getJson').then(d => d.json());
			radios_jornais = await fetch('/ep/portal_noticias/radio_jornal').then(d => d.json())
	       
			const idsEmails = noticiaSelecionada.emails.split(',');
			const matchedRadiosJornais = radios_jornais.filter(item => idsEmails.includes(item.id_radio_jornal));
			resultString = matchedRadiosJornais
            .map(item => `${item.nome}`)
            .join(', ');

			
			

			pedidoassunto = pedidos.find(p => p.id === noticiaSelecionada.id_pedido).assunto;

			console.log(pedidoassunto)
		
			redesSocial.forEach((rede) => {
				rede.icone = icones[rede.nome];
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

	function getSocialButtonStyle(redeName) {
        const color = socialColors[redeName];
        if (color) {
            return redeName === 'Instagram'
                ? `background: transparent; -webkit-background-clip: text; color: transparent; background-image: ${color};` // Gradient text for Instagram
                : `color: ${color}; background: transparent;`; // Solid color for others
        }
        return 'color: #ccc; background: transparent;'; // Default gray if no match
    }


	function handleClick(rede) {
		selectedSocialNetwork = rede.nome;
		console.log(rede);

		console.log('Rede:' + selectedSocialNetwork);
		
		console.log(' rede fk :' + rede.id_rede_social_FK);
		showPopup = true;
	}

	function handleBack() {
		goto('/portal_noticias');
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

	function onHandleSubmit(e) {
		e.preventDefault();
		console.log(formField);
		return;
	}

	function createNoticia() {
		if(noticiaSelecionada.tipo === 0){
			goto(`/portal_noticias/criar`);
		}else if(noticiaSelecionada.tipo === 1){
			goto(`/portal_noticias/criarmedia`);
		}
		
	
	}

	function editNoticia() {
		if (noticiaSelecionada?.tipo === 0) {
			goto(`/portal_noticias/editar/${noticiaId}`);
		} else if (noticiaSelecionada?.tipo === 1) {
			goto(`/portal_noticias/editarmedia/${noticiaId}`);
		}
	}

	function deleteNoticia() {
		const modal = get(modalStore);
		if (modal && modal.onOpenModal) {
			modal.onOpenModal(noticiaSelecionada);
		} else {
			console.error('RemoveModal não está disponível');
			alert('Erro: RemoveModal não está disponível. Por favor, recarregue a página.');
		}
	}

	function onDeleteRow() {
		goto('/portal_noticias');
	}

	let items_breadcrum = $derived([
		{
			icon_class: 'fas fa-arrow-left',
			url: '#',
			designacao: $t('divNoticias.back'),
			function: handleBack
		}
	]);
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

					<div class="row g-3 mt-2">
						<div class="col-md-4">
							<div class="detail-meta-card">
								<p class="detail-meta-label">{$t('divNoticias.categoria')}</p>
								<p class="detail-meta-value">{noticiaSelecionada.pn_categoria.nome}</p>
							</div>
						</div>
						<div class="col-md-4">
							<div class="detail-meta-card">
								<p class="detail-meta-label">{$t('divNoticias.Pedido')}</p>
								<p class="detail-meta-value">{pedidoassunto}</p>
							</div>
						</div>
						{#if noticiaSelecionada.tipo === 1}
							<div class="col-md-4">
								<div class="detail-meta-card">
									<p class="detail-meta-label">{$t('divNoticias.Radio_Jornal')}</p>
									<p class="detail-meta-value">{resultString}</p>
								</div>
							</div>
						{/if}
					</div>

					<hr class="detail-separator" />

					<div>
						<h5 class="detail-section-title">{$t('divNoticias.Texto')}</h5>
						<div class="detail-text-wrapper">
							{#each noticiaSelecionada.texto.split('\n') as paragrafo, index (index)}
								<p class="detail-text" class:detail-text-lead={index === 0}>{paragrafo}</p>
							{/each}
						</div>
					</div>

					{#if getTagNames().length > 0}
						<div class="mt-3">
							<h6 class="detail-small-title">Tags</h6>
							<div class="detail-tags">
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

				{#if noticiaSelecionada.pn_rs_noticia && noticiaSelecionada.pn_rs_noticia.length > 0}
					<div class="card-simple">
						<h5 class="detail-section-title mb-3">
							{$t('divNoticias.previewRedes')}
						</h5>
						<div class="detail-socials">
							{#each noticiaSelecionada.pn_rs_noticia as rede}
								<div class="detail-social-row">
									<button
										type="button"
										class="btn btn-outline-light detail-social-button"
										onclick={() => handleClick(getNomeRedeSocialById(rede.id_rede_social_FK))}
										style={getSocialButtonStyle(getNomeRedeSocialById(rede.id_rede_social_FK).nome)}
									>
										<div class="detail-social-main">
											<div class="detail-social-title">
												<i
													class={getNomeRedeSocialById(rede.id_rede_social_FK).icone}
													style="font-size: 1.1em; margin-right: 6px;"
												></i>
												{getNomeRedeSocialById(rede.id_rede_social_FK).nome}
											</div>
											<p class="detail-social-snippet">
												{#if getNomeRedeSocialById(rede.id_rede_social_FK).nome === 'Facebook'}
													{noticiaSelecionada.texto_facebook || '-'}
												{:else if getNomeRedeSocialById(rede.id_rede_social_FK).nome === 'Twitter'}
													{noticiaSelecionada.texto_twitter || '-'}
												{:else if getNomeRedeSocialById(rede.id_rede_social_FK).nome === 'Instagram'}
													{noticiaSelecionada.texto_instagram || '-'}
												{:else if getNomeRedeSocialById(rede.id_rede_social_FK).nome === 'LinkedIn'}
													{noticiaSelecionada.texto_linkedin || '-'}
												{:else}
													-
												{/if}
											</p>
										</div>
									</button>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>

	<Modal
		title="{selectedSocialNetwork} - Pré-visualização nas Redes Sociais"
		open={showPopup}
		onClosed={(data) => {
			showPopup = false;
		}}
	>
		{#if selectedSocialNetwork === 'Facebook'}
			<FacebookPreview {noticiaSelecionada} />
		{:else if selectedSocialNetwork === 'Twitter'}
			<TwitterPreview {noticiaSelecionada} />
		{:else if selectedSocialNetwork === 'Instagram'}
			<InstagramPreview {noticiaSelecionada} />
		{:else if selectedSocialNetwork === 'LinkedIn'}
			<LinkedinPreview {noticiaSelecionada} />	
		{:else if selectedSocialNetwork === 'Tiktok'}
			<TiktokPreview {noticiaSelecionada} />
		{/if}
	</Modal>

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
	@import "../../portal_noticias.css";

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

	.detail-meta-card {
		background-color: #f7f9fc;
		border-radius: 8px;
		padding: 8px 12px;
		height: 100%;
	}

	.detail-meta-label {
		font-size: 0.75rem;
		text-transform: uppercase;
		color: #6c7a89;
		margin-bottom: 2px;
		letter-spacing: 0.05em;
	}

	.detail-meta-value {
		font-size: 0.95rem;
		font-weight: 600;
		color: #212529;
		margin: 0;
	}

	.detail-separator {
		margin: 14px 0;
		border-top: 1px solid #e3e9f0;
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
</style>
