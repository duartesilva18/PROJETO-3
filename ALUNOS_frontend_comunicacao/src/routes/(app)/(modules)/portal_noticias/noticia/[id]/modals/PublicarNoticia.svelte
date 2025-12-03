<script>
	import { onMount } from 'svelte';
	import toastr from 'toastr';
	//import { updateNoticiaStatus } from '$lib/ep/noticiasv2/fetch_page/+page.js';
	//import { fetchTags } from '$lib/ep/noticiasv2/fetch_tag/tag.js';
	
	
	/** @type {{noticiaSelecionada?: any, tagView?: any, redesSocial?: any}} */
	let { noticiaSelecionada = {}, tagView = $bindable([]), redesSocial = [] } = $props();
	let selectedRedesSociais = $state([]);
	let selectedImageAnexo =  $state([]);
	let selectedVideoAnexo =  $state([]);
	let namenoticia = noticiaSelecionada.titulo;
	let imageAnexos = noticiaSelecionada.pn_anexos.filter((anexo) => anexo.tipo.startsWith('image/'));
	let hasImages = imageAnexos.length > 0;
	
	let videoAnexos = noticiaSelecionada.pn_anexos.filter((anexo) => anexo.tipo.startsWith('video/'));
	let hasVideos = videoAnexos.length > 0;
	let imageCodes = imageAnexos.map((anexo) => anexo.code_rede_social || '').filter(Boolean);
	let videoCodes = videoAnexos.map((anexo) => anexo.code_rede_social || '').filter(Boolean);
	
	let aux = 0; 




	let loadingStates = $state({
		Twitter: false,
		Facebook: false,
		LinkedIn: false,
		Instagram: false
	});
	let successStates = $state({
		Twitter: false,
		Facebook: false,
		LinkedIn: false,
		Instagram: false
	});
	let errorStates = $state({
		Twitter: false,
		Facebook: false,
		LinkedIn: false,
		Instagram: false
	});

	// Função para obter as tags formatadas como uma string
	function getFormattedTags(tagView, pn_noticia_Tag) {
		let tags = '';
		tagView.forEach(tagViewItem => {
			pn_noticia_Tag.forEach(tag => {
				if (tag.id_tag === tagViewItem.id_tag) {
					tags += `#${tagViewItem.nome} `;
				}
			});
		});
		return tags.trim();
	}

	onMount(async () => {
		selectedRedesSociais = noticiaSelecionada.pn_rs_noticia.map(
			(socialMedia) => getNomeRedeSocialById(socialMedia.id_rede_social_FK).nome
		);
		
		
		if (imageAnexos.length === 1) {
			selectedImageAnexo = imageAnexos;
		
		}else {
			selectedVideoAnexo = videoAnexos;
			
		}
		tagView = await fetch('/ep/portal_noticias/tags').then(d =>d.json());
	});

	function getNomeRedeSocialById(id) {
		const rede = redesSocial.find((rede) => rede.id_rede_social === id);
		if (rede) {
			return rede;
		} else {
			console.error('Rede social não encontrada para o ID:', id);
			return null;
		}
	}

	
	async function publicarNoticia() {
	if (noticiaSelecionada) {
		if (selectedRedesSociais.length === 0 && !hasImages && !hasVideos) {
			alert('Por favor, selecione pelo menos uma rede social para publicar ou selecione um anexo.');
			console.log("tou aqui 1");
			return;
		}
		let texto_facebook = noticiaSelecionada.texto_facebook;
		let texto_twitter = noticiaSelecionada.texto_twitter;
		let texto_linkedin = noticiaSelecionada.texto_linkedin;
		let texto_instagram = noticiaSelecionada.texto_instagram;

		const formattedTags = getFormattedTags(tagView, noticiaSelecionada.pn_noticia_Tag);
		console.log("tou aqui 2313131");
		let allSuccess = true;

		try {
			console.log("tou aqui sim");

			if (selectedRedesSociais.includes('Twitter') && texto_twitter) {
				
				aux = 1;

				loadingStates.Twitter = true;
				const twitterImageUrls = imageAnexos.filter((anexo) => anexo.code_rede_social && anexo.code_rede_social[2] === '1') .map((anexo) => anexo.id_anexo);				
				
				const twitterVideoUrls = videoAnexos.filter((anexo) => anexo.code_rede_social && anexo.code_rede_social[2] === '1') .map((anexo) => anexo.id_anexo);

				const twitterMessage = `${texto_twitter} ${formattedTags}`;

				let twitterfinalUrl;




				const twittervideoUrl = selectedVideoAnexo ? selectedVideoAnexo.id_anexo : '';
			
				const twitterImageCode = selectedImageAnexo && selectedImageAnexo.code_rede_social ? selectedImageAnexo.code_rede_social: '';
				

				if(twitterImageUrls.length == 0 && twitterVideoUrls.length == 1){

					twitterfinalUrl = twitterVideoUrls;
				} else {

					twitterfinalUrl = twitterImageUrls;
				}

				

				try {
					const twitterResponse = await fetch('/ep/portal_noticias/redes/post/twitter',{
						method: 'POST',
						body: JSON.stringify({
							message: twitterMessage,
							mediaUrls: twitterfinalUrl,
							noticia_id: noticiaSelecionada.id_noticia
						})
					})//postToTwitter(twitterImageUrl, twitterMessage);
					if (twitterResponse.error || twitterResponse.statusCode == 500) {
						errorStates.Twitter = true;
						allSuccess = false;
					} else {
						successStates.Twitter = true;
					}
				} catch {
					errorStates.Twitter = true;
					allSuccess = false;
				}
				loadingStates.Twitter = false;
			}
			if (selectedRedesSociais.includes('Facebook') && texto_facebook) {
				loadingStates.Facebook = true;
				aux = 1;

				//const facebookImageUrl = selectedImageAnexo ? selectedImageAnexo.id_anexo: '';
				const facebookImageUrl = selectedImageAnexo && selectedImageAnexo.id_anexo ? selectedImageAnexo.id_anexo : (selectedVideoAnexo ? selectedVideoAnexo.id_anexo : '');		
				const facebookMessage = `${texto_facebook} ${formattedTags}`;	
				const isVideo = selectedVideoAnexo && selectedVideoAnexo.tipo ? selectedVideoAnexo.tipo.slice(0, 5) === 'video' : false;
				const facebookImageUrls = imageAnexos.filter((anexo) => anexo.code_rede_social && anexo.code_rede_social[1] === '1') .map((anexo) => anexo.id_anexo);				
				const facebookVideoUrls = videoAnexos.filter((anexo) => anexo.code_rede_social && anexo.code_rede_social[1] === '1') .map((anexo) => anexo.id_anexo);

				let facebookfinalUrl;

				if(facebookImageUrls.length == 0 && facebookVideoUrls.length == 1){

					facebookfinalUrl = facebookVideoUrls;
				} else {

					facebookfinalUrl = facebookImageUrls;
				}




				try {
  
					let imgurUrl = '';
					

					const facebookResponse = await fetch('/ep/portal_noticias/redes/post/facebook', {
						method: 'POST',
						body: JSON.stringify({
							mediaUrls: facebookfinalUrl,
							message: facebookMessage,
							noticia_id: noticiaSelecionada.id_noticia,
						}),
						headers: {
							'Content-Type': 'application/json',
						},
					});

					if (!facebookResponse.ok || facebookResponse.status === 500) {
						errorStates.Facebook = true;
						allSuccess = false;
					} else {
						successStates.Facebook = true;
					}
				} catch (error) {
					console.error(error);
					errorStates.Facebook = true;
					allSuccess = false;
				} finally {
					loadingStates.Facebook = false;
				}
			}
			if (selectedRedesSociais.includes('LinkedIn') && texto_linkedin) {
				aux = 1;
				loadingStates.LinkedIn = true;
				const linkedinImageUrl = selectedImageAnexo ? selectedImageAnexo.id_anexo: '';
				const linkedinMessage = `${texto_linkedin} ${formattedTags}`;
				try {
					const linkedinResponse = await fetch('/ep/portal_noticias/redes/post/linkedin',{
						method: 'POST',
						body: JSON.stringify({
							imageUrl: linkedinImageUrl,
							caption: linkedinMessage,
							noticia_id: noticiaSelecionada.id_noticia
						})
					}) //postToLinkedin(linkedinImageUrl, linkedinMessage);
					if (linkedinResponse.error || linkedinResponse.statusCode == 500) {
						errorStates.LinkedIn = true;
						allSuccess = false;
					} else {
						successStates.LinkedIn = true;
					}
				} catch {
					errorStates.LinkedIn = true;
					allSuccess = false;
				}
				loadingStates.LinkedIn = false;
			}
			if (selectedRedesSociais.includes('Instagram') && texto_instagram && selectedImageAnexo) {
				aux = 1;
				loadingStates.Instagram = true;
				const instaImageUrl = selectedImageAnexo ? selectedImageAnexo.id_anexo : '';
				const instagramMessage = `${texto_instagram} ${formattedTags}`;

				const instagramImageUrls = imageAnexos.filter((anexo) => anexo.code_rede_social && anexo.code_rede_social[0] === '1') .map((anexo) => anexo.id_anexo);				
				const instagramVideoUrls = videoAnexos.filter((anexo) => anexo.code_rede_social && anexo.code_rede_social[0] === '1') .map((anexo) => anexo.id_anexo);

				let instagramfinalUrl;

				if(instagramImageUrls.length == 0 && instagramVideoUrls.length == 1){

					instagramfinalUrl = instagramVideoUrls;
				} else {

					instagramfinalUrl = instagramImageUrls;
				}


				try {
					const instagramResponse = await fetch('/ep/portal_noticias/redes/post/instagram', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json'
						},
						body: JSON.stringify({
							mediaUrls: instagramfinalUrl,
							caption: instagramMessage,
							noticia_id: noticiaSelecionada.id_noticia
						})
					});

					// Processando a resposta corretamentecd
					if (!instagramResponse.ok) { // Verifica se o status não está entre 200-299
						errorStates.Instagram = true;
						allSuccess = false;
						console.error('Erro ao publicar no Instagram:', await instagramResponse.json());
					} else {
						successStates.Instagram = true;
						const responseData = await instagramResponse.json();
						console.log(responseData);
					}
				} catch (error) {
					console.error('Erro de rede ou servidor:', error);
					errorStates.Instagram = true;
					allSuccess = false;
				}
				loadingStates.Instagram = false;
			}
			if(aux === 0){
				console.log("tamos aqui agora");
				let novoStatus = "Publicado";
				try {
					const noticiaupdatestatus = await fetch(`/ep/portal_noticias/update_status?id_noticia=${noticiaSelecionada.id_noticia}&status=${novoStatus}`, {
						method: 'GET', 
						headers: {
							'Content-Type': 'application/json',
						},
					});

					if (!noticiaupdatestatus.ok) {
						const errorData = await noticiaupdatestatus.json();
						throw new Error(`Erro ao atualizar status: ${errorData.message}`);
					}

					const responseData = await noticiaupdatestatus.json();
					console.log('Status atualizado com sucesso:', responseData);

				} catch (error) {
					console.error('Erro ao tentar atualizar status da notícia:', error);
				}


			}


			debugger
		} catch (error) {
			toastr.error('Erro ao publicar nas redes sociais:', 'ERRO',{});
		}
	}
}

function redeEstaAgendada(redeId) {
	return (noticiaSelecionada?.pn_agendamento_rede ?? []).some(
		(agendamento) => agendamento.id_rede_social === redeId
	);
}

function getAgendamentoDetalhe(redeId) {
	return (noticiaSelecionada?.pn_agendamento_rede ?? []).find(
		(agendamento) => agendamento.id_rede_social === redeId
	);
}

function formatAgendamentoLabel(agendamento) {
	if (!agendamento?.horario_agendado) return '';
	const parsed = new Date(agendamento.horario_agendado);
	if (Number.isNaN(parsed.getTime())) return '';

	const data = parsed.toLocaleDateString('pt-PT');
	const hora = parsed.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
	const fuso = agendamento.fuso_horario ?? 'UTC';
	return `${data} ${hora} (${fuso})`;
}
</script>



<div style="padding: 20px; border: 1px solid #ccc; border-radius: 10px; background-color: #f9f9f9;">
	<div style="margin-bottom: 10px; font-weight: bold;">
		A notícia vai ser publicada nas seguintes redes sociais:
	</div>
	<ul class="publish-networks">
		{#each noticiaSelecionada.pn_rs_noticia as socialMedia}
			{@const redeInfo = getNomeRedeSocialById(socialMedia.id_rede_social_FK)}
			{@const definidaComoAgendada = redeEstaAgendada(socialMedia.id_rede_social_FK)}
			{@const detalheAgendamento = getAgendamentoDetalhe(socialMedia.id_rede_social_FK)}
			<li class={`publish-network ${definidaComoAgendada ? 'is-scheduled' : 'is-available'}`}>
				<input
					type="checkbox"
					bind:group={selectedRedesSociais}
					value={redeInfo.nome}
					checked={selectedRedesSociais.includes(redeInfo.nome)}
					disabled={successStates[redeInfo.nome] || (redeInfo.nome === 'Instagram' && !hasImages)}
				/>
				<div class="network-details">
					<div class="network-title">
						{redeInfo.nome}
						{#if redeInfo.nome === 'Instagram' && !hasImages && !hasVideos}
							<span class="warn-label">
								(Publicação no Instagram disponível apenas para notícias com imagens)
							</span>
						{/if}
					</div>
					{#if definidaComoAgendada}
						<p class="schedule-badge">
							Agendado para {formatAgendamentoLabel(detalheAgendamento)}
						</p>
					{:else}
						<p class="schedule-badge available">Sem agendamento definido</p>
					{/if}
				</div>
				{#if loadingStates[redeInfo.nome]}
					<span class="loader ml-2">
						<span>.</span>
						<span>.</span>
						<span>.</span>
					</span>
				{:else if successStates[redeInfo.nome]}
					<span class="estado success ml-2">
						✔ Sucesso
					</span>
				{:else if errorStates[redeInfo.nome]}
					<span class="estado error ml-2">
						✖ Erro no pedido, contactar suporte
					</span>
				{/if}
			</li>
		{/each}
	</ul>

	
	
		
	<div style="margin-top: 20px;">
		<p>Tags da Notícia:</p>
		{#if getFormattedTags(tagView, noticiaSelecionada.pn_noticia_Tag) !== ''}
			<ul style="list-style-type: none; padding: 0;">
				{#each getFormattedTags(tagView, noticiaSelecionada.pn_noticia_Tag).split(' ') as tagName}
					<li style="display: inline-block; margin-right: 10px;">{tagName}</li>
				{/each}
			</ul>
		{:else if selectedRedesSociais.length !== 0 }
			<div class="alert alert-info mt-1" role="alert">
				<i class="fas fa-info-circle"></i>
				Não foram selecionadas Tags
			</div>
		{/if}
	</div>


	<button
		style="margin-top: 20px; width: 100%; padding: 10px; border-radius: 5px; background-color: #007bff; color: white; font-size: 16px; border: none;"
		onclick={publicarNoticia}
		>Confirmar
	</button>
</div>

<style>
	.loader {
		display: inline-block;
		font-size: 20px;
		line-height: 1;
	}

	.publish-networks {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.publish-network {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 8px 12px;
		border: 1px solid #e0e6ed;
		border-radius: 6px;
		background: #fff;
	}

	.publish-network.is-available {
		border-color: #bcdcc7;
	}

	.publish-network.is-scheduled {
		border-color: #f2c97d;
		background: #fff8ed;
	}

	.publish-network input[type='checkbox'] {
		margin: 0;
	}

	.network-details {
		display: flex;
		flex-direction: column;
		flex: 1;
	}

	.network-title {
		font-weight: 600;
		color: #29363d;
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}

	.warn-label {
		color: #c4332b;
		font-size: 12px;
	}

	.schedule-badge {
		font-size: 12px;
		color: #6c757d;
		margin: 4px 0 0;
	}

	.schedule-badge.available {
		color: #3c8b5f;
	}

	@keyframes blink {
		0% { opacity: 0.2; }
		20% { opacity: 1; }
		100% { opacity: 0.2; }
	}

	.loader span {
		animation-name: blink;
		animation-duration: 1.4s;
		animation-iteration-count: infinite;
		animation-fill-mode: both;
	}

	.loader span:nth-child(2) {
		animation-delay: 0.2s;
	}

	.loader span:nth-child(3) {
		animation-delay: 0.4s;
	}
</style>



