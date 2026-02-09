<script>
	import { goto } from '$app/navigation';
import Breadcrum from '$lib/components/Breadcrum.svelte';
import { t } from '$lib/translations/translations';
	import { onMount } from 'svelte';
import SuccesModal from '../../detalhe/[id]/modals/SuccesModal.svelte';
import { page } from '$app/stores';
import { get } from 'svelte/store';
import toastr from 'toastr';
	import { configurePortalSidebar } from '../../../sidebar.config.js';
import { sidebarOptions } from '$lib/runes/sidebarOptions.rune.svelte';

const translate = (key) => get(t)(key);
configurePortalSidebar('dashboard', translate);

/**
 * Translation helper with fallback.
 * @param {string} key - Translation key
 * @param {string} ptFallback - PT fallback
 * @param {string} enFallback - EN fallback
 */
function tf(key, ptFallback, enFallback) {
	const val = $t(key);
	if (val !== key) return val;
	return locale.get() === 'pt' ? ptFallback : enFallback;
}

function getNetworkFieldKey(networkName) {
	const mapping = {
		Facebook: 'texto_facebook',
		Twitter: 'texto_twitter',
		Instagram: 'texto_instagram',
		LinkedIn: 'texto_linkedin',
		Tiktok: 'texto_tiktok',
		'Portal IPVC': 'texto_portalipvc'
	};
	return mapping[networkName] || null;
}

function toggleRedeCustomization(redeSocial) {
	if (!redeSocial.checked) return;
	
	// Create a new array to trigger reactivity in Svelte 5
	redesSociais = redesSociais.map(r => {
		if (r.id_rede_social === redeSocial.id_rede_social) {
			const nextCustomize = !r.customize;
			const fieldKey = getNetworkFieldKey(r.nome);
			
			if (!nextCustomize && fieldKey) {
				formField[fieldKey] = '';
			}
			if (nextCustomize && fieldKey && !formField[fieldKey]) {
				formField[fieldKey] = formField.descricao;
			}
			
			return { ...r, customize: nextCustomize };
		}
		return r;
	});
}


	const noticiaId = $page.params.id;

	let formField = $state({
		titulo: '',
		descricao: '',
		texto_rs: '',
		id_categoria_FK: '',
		nome_categoria: '',
		texto_facebook: '',
		texto_instagram: '',
		texto_twitter: '',
		texto_linkedin: '',
		texto_tiktok: '',
		anexos: '',
		tags: '',
	id_projeto: '',
		code: '00000',
	});

	  /**
	 * Array para armazenar as redes sociais.
	 * @type {Array}
	 */
	 let codes = $state([]);


	let redesSociais = $state([]);
	let categorias = $state([]);
let projetos = $state([]);
let hasProjeto = $state(false);
	let tags = $state([]);
	let newTag = $state('');
	let selectedTags = $state([]);
	let anexos = $state([]);
	let updatedAnexos = $state([]);
	let showModal = $state(false);
	let modalMessage = $state('');
	let code = $state([]);
let fileInputRef;
let isDragActive = $state(false);
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'video/mp4']);
const DEFAULT_TIMEZONE = 'Europe/Lisbon';
let agendamentos = $state([]);
let agendamentosLoading = $state(false);
let agendamentosError = $state('');
let showScheduleModal = $state(false);
let newSchedule = $state({
	id_rede_social: '',
	horario_local: '',
	fuso_horario: DEFAULT_TIMEZONE
});
let confirmDelete = $state({ open: false, target: null });

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
			const noticia = await fetch(`/ep/portal_noticias/noticia?id=${noticiaId}`).then((d) => d.json());
			
			if (!noticia || !noticia.id_noticia) {
				toastr.error('Notícia não encontrada', 'ERRO!', { timeOut: 5000, progressBar: true });
				goto('/portal_noticias');
				return;
			}

			categorias = await fetch('/ep/portal_noticias/categorias').then((d) => d.json());
			projetos = await fetch('/ep/portal_noticias/getJson').then((d) => d.json());
			redesSociais = await fetch('/ep/portal_noticias/redes').then((d) => d.json());
			
			formField = {
				titulo: noticia.titulo || '',
				descricao: noticia.texto || '',
				nome_categoria: noticia.pn_categoria?.nome || '',
				texto_facebook: noticia.texto_facebook || '',
				texto_instagram: noticia.texto_instagram || '',
				texto_twitter: noticia.texto_twitter || '',
				texto_linkedin: noticia.texto_linkedin || '',
				texto_tiktok: noticia.texto_tiktok || '',
				texto_portalipvc: noticia.texto_portalipvc || '',
				id_categoria_FK: noticia.id_categoria_FK || '',
				id_projeto: noticia.id_projeto || '',
				anexos: noticia.pn_anexos || [],
				tags: noticia.pn_noticia_Tag || [],
			};
			hasProjeto = Boolean(noticia.id_projeto);

			code = (formField.anexos || []).map(anexo => anexo.code_rede_social);

			tags = await fetch('/ep/portal_noticias/tags').then((d) => d.json());

			(formField.tags || []).forEach((tagNoticia) => {
				tags.forEach((tag) => {
					if (tag.id_tag === tagNoticia.id_tag) {
						selectedTags.push(tag);
					}
				});
			});

			updatedAnexos = (formField.anexos || []).map((file) => {
				// Converte o code_rede_social para um array de caracteres
				let codeArray = (file.code_rede_social || '000000').split('');
				// Garante que o array tem pelo menos 6 caracteres (pode ter menos se for um anexo antigo)
				while (codeArray.length < 6) {
					codeArray.push('0');
				}

				// Mapeia os índices onde há '1' para as respectivas redes sociais
				let redes = [];
				if (codeArray[0] === '1') redes.push('Instagram');
				if (codeArray[1] === '1') redes.push('Facebook');
				if (codeArray[2] === '1') redes.push('Twitter');
				if (codeArray[3] === '1') redes.push('LinkedIn');
				if (codeArray[4] === '1') redes.push('Tiktok');
				if (codeArray[5] === '1') redes.push('Portal IPVC');

				// Retorna o objeto atualizado
				return { ...file, redes };
			});

			// Lógica FINAL de Redes Sociais:
			// 1. Identificar redes vindas da BD (tabela pn_rs_noticia)
			const redesSelecionadasIds = (noticia.pn_rs_noticia || []).map((rs) =>
				String(rs.id_rede_social_FK).toLowerCase()
			);

			// 2. Mapear o array redesSociais combinando todas as fontes
			redesSociais = redesSociais.map((rede) => {
				const redeId = String(rede.id_rede_social).toLowerCase();
				const fieldName = `texto_${rede.nome.toLowerCase().replace(/\s/g, '')}`;
				const hasTexto = formField[fieldName] && String(formField[fieldName]).trim() !== '';
				
				// Verificar se esta rede está selecionada em algum anexo
				let isEmAnexo = false;
				updatedAnexos.forEach(file => {
					if (file.redes && file.redes.includes(rede.nome)) isEmAnexo = true;
				});

				// Está marcada se: veio da BD OR tem texto personalizado OR está associada a um anexo
				const isSelected = redesSelecionadasIds.includes(redeId) || hasTexto || isEmAnexo;
				
				return { ...rede, checked: isSelected, customize: hasTexto };
			});

			await loadAgendamentos();

		// Remove the old key from each object
		//updatedAnexos.forEach((anexo) => delete anexo.caminho_ficheiro);
		} catch (error) {
			console.error('Erro ao carregar dados da notícia:', error);
			toastr.error('Erro ao carregar a notícia. Por favor, recarregue a página.', 'ERRO!', {
				timeOut: 5000,
				progressBar: true
			});
		}
	});

	function getCodeRedeSocial(redes) {
		// We're hardcoding the order: 0=>Instagram, 1=>Facebook, 2=>Twitter, 3=>LinkedIn, 4=>Tiktok, 5=>Portal IPVC
		const code = ['0', '0', '0', '0', '0', '0'];

		if (redes.includes('Instagram')) code[0] = '1';
		if (redes.includes('Facebook'))  code[1] = '1';
		if (redes.includes('Twitter'))   code[2] = '1';
		if (redes.includes('LinkedIn'))  code[3] = '1';
		if (redes.includes('Tiktok'))    code[4] = '1';
		if (redes.includes('Portal IPVC')) code[5] = '1';
		
			return code.join('');
	
  	}


	function getSelectedSocialNames() {
		return redesSociais
			.filter((redeSocial) => redeSocial.checked)
			.map((redeSocial) => redeSocial.nome);
	}

function getSelectedSocialNetworksNames() {
	return getSelectedSocialNames();
}

	function getSelectedSocialNetworks() {
		return redesSociais.filter((redeSocial) => redeSocial.checked);
	}

function toggleRedeSelectionLocal(redeSocial) {
	const outOfService = ['LinkedIn', 'Facebook', 'Instagram', 'Tiktok'];
	if (!redeSocial.checked && outOfService.includes(redeSocial.nome)) {
		toastr.info(`${redeSocial.nome} fora de serviço mas será criado na mesma`, 'Aviso', {
			timeOut: 5000,
			progressBar: true
		});
	}

	redesSociais = redesSociais.map((r) => {
		if (r.id_rede_social === redeSocial.id_rede_social) {
			const nextChecked = !r.checked;
			let nextCustomize = r.customize;
			
			if (!nextChecked) {
				nextCustomize = false;
				const fieldKey = getNetworkFieldKey(r.nome);
				if (fieldKey) {
					formField[fieldKey] = '';
				}
			}
			
			return { ...r, checked: nextChecked, customize: nextCustomize };
		}
		return r;
	});
}

	function listarNoticias() {
		goto('/portal_noticias');
	}

	function toggleFileNetwork(file, networkName) {
	// If 'file.redes' already includes this network, remove it
		if (file.redes.includes(networkName)) {
			file.redes = file.redes.filter((n) => n !== networkName);
		} else {
			// Otherwise, add it
			file.redes.push(networkName);
	}

	
		updateSelectedNetworks(); // Update buttons when networks are toggled
	}

	function checkifcanornot(file, networkName) {
    // Extrair o tipo do arquivo após o último ponto
		
		if (!file.name) {
    		file.name = file.nome_original_ficheiro; // Atribui nome_original_ficheiro se name não existir
		}

		const typefile = file.name.split('.').pop().toLowerCase();

		let aux = '';
		
		// Validação especial para Portal IPVC: só aceita 1 imagem
		if (networkName === 'Portal IPVC') {
			// Verificar se é uma imagem
			if (typefile !== 'jpg' && typefile !== 'png' && typefile !== 'jpeg' && typefile !== 'gif') {
				aux = 'Portal IPVC aceita apenas imagens (JPG, PNG, JPEG, GIF)';
				return [false, aux];
			}
			
			// Contar quantas imagens já estão associadas ao Portal IPVC (incluindo updatedAnexos)
			let countImagesPortalIPVC = 0;
			const allAnexos = [...updatedAnexos, ...anexos];
			
			for(let i = 0; i < allAnexos.length; i++) {
				const anexoName = allAnexos[i].name || allAnexos[i].nome_original_ficheiro || '';
				const anexotypefile = anexoName.split('.').pop().toLowerCase();
				const isImage = anexotypefile === 'jpg' || anexotypefile === 'png' || anexotypefile === 'jpeg' || anexotypefile === 'gif';
				
				// Verificar se é um anexo diferente e se já está associado ao Portal IPVC
				if (anexoName !== file.name && anexoName !== (file.nome_original_ficheiro || '')) {
					if (isImage && allAnexos[i].redes && allAnexos[i].redes.includes('Portal IPVC')) {
						countImagesPortalIPVC++;
					}
				}
			}
			
			// Se já existe 1 imagem e este ficheiro não está selecionado, não permite adicionar mais
			if (countImagesPortalIPVC >= 1 && !file.redes.includes('Portal IPVC')) {
				aux = 'Portal IPVC aceita apenas 1 imagem. Já existe uma imagem selecionada para esta rede.';
				return [false, aux];
			}
			
			// Se este ficheiro já está selecionado, permite remover
			if (file.redes && file.redes.includes('Portal IPVC')) {
				return [true, aux];
			}
		}
		
		// Exibir o tipo do arquivo no console
		console.log(`Tipo de arquivo: ${typefile}`);

		for(let j = 0; j < anexos.length; j++){
		if(anexos[j].name == file.name && anexos[j].redes.includes(networkName)){
			return [true, aux];
		}
		}


		for(let i = 0; i < anexos.length; i++) {
		let anexotypefile = anexos[i].name.split('.').pop().toLowerCase();
		if(anexos[i].name != file.name){    
			if(typefile == 'jpg' || typefile == 'png' || typefile == 'jpeg'){
			if (anexos[i].redes.includes(networkName)){
				if(anexotypefile == 'mp4' || anexotypefile == 'mov' || anexotypefile == 'avi'){
				aux = 'imagem invalida para a rede ' + networkName + ' ja se encontra um video associado a rede.';
				return [false , aux];
				}
			}
			}else if(typefile == 'mp4' || typefile == 'mov' || typefile == 'avi'){
			if (anexos[i].redes.includes(networkName)){
				if(anexotypefile == 'jpg' || anexotypefile == 'png' || anexotypefile == 'jpeg'){
				aux = 'video invalida para a rede ' + networkName + ' ja se encontra uma imagem associada a rede.';
				return [false , aux];
				}
				if(anexotypefile == 'mp4' || anexotypefile == 'mov' || anexotypefile == 'avi'){
				aux = 'video invalida para a rede ' + networkName + ' ja se encontra um video associado a rede.';
				return [false, aux];
				}
			}
		}
		}
	}
	return [true, aux]; // Retorna o tipo de arquivo, caso necessário
  }

	async function loadAgendamentos() {
		agendamentosLoading = true;
		agendamentosError = '';
		try {
			const response = await fetch(`/ep/portal_noticias/redes/agendamentos?id_noticia=${noticiaId}`);
			if (!response.ok) {
				throw new Error('Não foi possível carregar os agendamentos.');
			}
			const data = await response.json();
			agendamentos = Array.isArray(data) ? data : [];
		} catch (error) {
			console.error('Erro ao carregar agendamentos:', error);
			agendamentosError = 'Não foi possível carregar os agendamentos desta notícia.';
		} finally {
			agendamentosLoading = false;
		}
	}

	function toLocalInputValue(isoString) {
		if (!isoString) return '';
		const date = new Date(isoString);
		if (Number.isNaN(date.getTime())) return '';
		const pad = (n) => String(n).padStart(2, '0');
		const year = date.getFullYear();
		const month = pad(date.getMonth() + 1);
		const day = pad(date.getDate());
		const hours = pad(date.getHours());
		const minutes = pad(date.getMinutes());
		return `${year}-${month}-${day}T${hours}:${minutes}`;
	}

	function toIsoFromLocal(localValue) {
		if (!localValue) return null;
		const date = new Date(localValue);
		if (Number.isNaN(date.getTime())) return null;
		return date.toISOString();
	}

	async function handleUpdateAgendamento(agendamento) {
		const isoDate = toIsoFromLocal(agendamento.horario_agendado);
		if (!isoDate) {
			toastr.warning('Data/hora inválida para o agendamento.', 'Agendamento', {
				timeOut: 4000,
				progressBar: true
			});
			return;
		}

		try {
			const response = await fetch(
				`/ep/portal_noticias/redes/agendamentos/${agendamento.id_agendamento}`,
				{
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						horario_agendado: isoDate,
						fuso_horario: agendamento.fuso_horario || DEFAULT_TIMEZONE,
						status: agendamento.status || 'pendente'
					})
				}
			);

			if (!response.ok) {
				const body = await response.json().catch(() => ({}));
				throw new Error(body?.message ?? 'Erro ao atualizar agendamento.');
			}

			// atualiza o estado local para refletir no input imediatamente
			agendamento.horario_agendado = isoDate;
			agendamento.fuso_horario = agendamento.fuso_horario || DEFAULT_TIMEZONE;
			agendamento.status = agendamento.status || 'pendente';

			toastr.success('Agendamento atualizado com sucesso.', 'Agendamento', {
				timeOut: 4000,
				progressBar: true
			});
			await loadAgendamentos();
		} catch (error) {
			console.error('Erro ao atualizar agendamento:', error);
			toastr.error('Não foi possível atualizar o agendamento.', 'Agendamento', {
				timeOut: 5000,
				progressBar: true
			});
		}
	}

	async function handleDeleteAgendamento(agendamento) {
		try {
			const response = await fetch(
				`/ep/portal_noticias/redes/agendamentos/${agendamento.id_agendamento}`,
				{
					method: 'DELETE'
				}
			);

			if (!response.ok) {
				const body = await response.json().catch(() => ({}));
				throw new Error(body?.message ?? 'Erro ao remover agendamento.');
			}

			toastr.success('Agendamento removido com sucesso.', 'Agendamento', {
				timeOut: 4000,
				progressBar: true
			});
			agendamentos = agendamentos.filter(
				(a) => a.id_agendamento !== agendamento.id_agendamento
			);
		} catch (error) {
			console.error('Erro ao remover agendamento:', error);
			toastr.error('Não foi possível remover o agendamento.', 'Agendamento', {
				timeOut: 5000,
				progressBar: true
			});
		}
	}

	function openNewScheduleModal() {
		const selectedNetworks = redesSociais.filter((rede) => rede.checked);
		if (selectedNetworks.length === 0) {
			toastr.warning(
				'Selecione pelo menos uma rede social antes de criar um agendamento.',
				'Agendamento',
				{ timeOut: 4000, progressBar: true }
			);
			return;
		}
		const firstNetwork = selectedNetworks[0];
		newSchedule = {
			id_rede_social: firstNetwork?.id_rede_social ?? '',
			horario_local: '',
			fuso_horario: DEFAULT_TIMEZONE
		};
		showScheduleModal = true;
	}

	function closeNewScheduleModal() {
		showScheduleModal = false;
	}

	async function handleCreateAgendamento() {
		const iso = toIsoFromLocal(newSchedule.horario_local);
		if (!newSchedule.id_rede_social || !iso) {
			toastr.warning('Seleccione a rede e uma data/hora válida.', 'Agendamento', {
				timeOut: 4000,
				progressBar: true
			});
			return;
		}

		try {
			const response = await fetch('/ep/portal_noticias/redes/agendamentos', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					id_noticia: noticiaId,
					agendamentos: [
						{
							id_rede_social: newSchedule.id_rede_social,
							horario_agendado: iso,
							fuso_horario: newSchedule.fuso_horario || DEFAULT_TIMEZONE,
							status: 'pendente'
						}
					]
				})
			});

			if (!response.ok) {
				const body = await response.json().catch(() => ({}));
				throw new Error(body?.message ?? 'Erro ao criar agendamento.');
			}

			toastr.success('Agendamento criado com sucesso.', 'Agendamento', {
				timeOut: 4000,
				progressBar: true
			});
			showScheduleModal = false;
			await loadAgendamentos();
		} catch (error) {
			console.error('Erro ao criar agendamento:', error);
			toastr.error('Não foi possível criar o agendamento.', 'Agendamento', {
				timeOut: 5000,
				progressBar: true
			});
		}
	}

	function askDeleteAgendamento(agendamento) {
		confirmDelete = { open: true, target: agendamento };
	}

	function closeDeleteDialog() {
		confirmDelete = { open: false, target: null };
	}

	async function confirmDeleteAgendamento() {
		if (!confirmDelete.target) return;
		const target = confirmDelete.target;
		confirmDelete = { open: false, target: null };
		await handleDeleteAgendamento(target);
	}


	async function onHandleSubmit(event) {
		event.preventDefault();
		debugger

		const titulo = formField.titulo;
		const descricao = formField.descricao;
		const estado = 'Pendente';
		const id_categoria_FK = formField.id_categoria_FK;
		const texto_facebook = formField.texto_facebook;
		const texto_instagram = formField.texto_instagram;
		const texto_twitter = formField.texto_twitter;
		const texto_linkedin = formField.texto_linkedin;
		const texto_tiktok = formField.texto_tiktok;
		const selectedSocialNetworks = getSelectedSocialNetworks();
		const socialNetworksNames = getSelectedSocialNames();
		const tags = selectedTags;
		const id_projeto = hasProjeto ? formField.id_projeto : '';
		const formDataAnexos = new FormData();
		let codes = [];
		
		// Capturar os textos diretamente do formField atualizado
		const t_facebook = formField.texto_facebook;
		const t_instagram = formField.texto_instagram;
		const t_twitter = formField.texto_twitter;
		const t_linkedin = formField.texto_linkedin;
		const t_tiktok = formField.texto_tiktok;
		const t_portalipvc = formField.texto_portalipvc;

		console.log("anexos 1 :", updatedAnexos);


		anexos.forEach((file) => {
			file.codeRede = getCodeRedeSocial(file.redes);
			const code = getCodeRedeSocial(file.redes); 
			codes.push(code);

     	});

		

			let anexosUploaded = [];
			if (anexos.length > 0) {
				
				anexos.forEach((anexo, index) => {
					formDataAnexos.append('files', anexo);
					
				});
				formDataAnexos.append('codes', JSON.stringify(codes));

				
				const fileInfo = anexos.map((file) => ({
					originalName: file.name,
					codeRede: file.codeRede
				}));

				formDataAnexos.append('fileInfo', JSON.stringify(fileInfo));

				const options = {
					method: 'POST',
					body: formDataAnexos,
					headers: {
						'Accept': 'application/json',
					},
				};
				anexosUploaded = await fetch('/ep/portal_noticias/anexos',options).then(d => d.json())
			}

			if (!id_categoria_FK) {
				toastr.error('Por favor, selecione uma categoria', 'ERRO!', {
					timeOut: 5000,
					progressBar: true
				});
				return;
			}

			const updatedNoticia = { 
				titulo: String(titulo),
				texto: String(descricao),
				estado: String(estado),
				id_categoria_FK: String(id_categoria_FK),
				tipo: 0, // Garante que é rede social
				redesSociais: selectedSocialNetworks || [], // Ensure this is an array
				tags: tags || [], // Ensure this is an array
					id_projeto: id_projeto || null,
				anexos: [...updatedAnexos, ...(Array.isArray(anexosUploaded) ? anexosUploaded : [])] // Ensure anexosUploaded is an array
			};
			
			// Adiciona textos das redes sociais - se a rede estiver selecionada, usa o texto personalizado ou o texto padrão
			if (socialNetworksNames.includes('Facebook')) {
				updatedNoticia.texto_facebook = t_facebook && t_facebook.trim() != '' ? t_facebook : descricao;
			} else {
				updatedNoticia.texto_facebook = null;
			}
			
			if (socialNetworksNames.includes('Instagram')) {
				updatedNoticia.texto_instagram = t_instagram && t_instagram.trim() != '' ? t_instagram : descricao;
			} else {
				updatedNoticia.texto_instagram = null;
			}
			
			if (socialNetworksNames.includes('Twitter')) {
				updatedNoticia.texto_twitter = t_twitter && t_twitter.trim() != '' ? t_twitter : descricao;
			} else {
				updatedNoticia.texto_twitter = null;
			}
			
			if (socialNetworksNames.includes('LinkedIn')) {
				updatedNoticia.texto_linkedin = t_linkedin && t_linkedin.trim() != '' ? t_linkedin : descricao;
			} else {
				updatedNoticia.texto_linkedin = null;
			}
			
			if (socialNetworksNames.includes('Tiktok')) {
				updatedNoticia.texto_tiktok = t_tiktok && t_tiktok.trim() != '' ? t_tiktok : descricao;
			} else {
				updatedNoticia.texto_tiktok = null;
			}
			
			if (socialNetworksNames.includes('Portal IPVC')) {
				updatedNoticia.texto_portalipvc = t_portalipvc && t_portalipvc.trim() != '' ? t_portalipvc : descricao;
			} else {
				updatedNoticia.texto_portalipvc = null;
			}

			console.log("DADOS A ENVIAR (PUT):", updatedNoticia);

			// Atualiza agendamentos existentes antes de salvar a notícia
			if (agendamentos && agendamentos.length > 0) {
				await Promise.all(agendamentos.map((ag) => handleUpdateAgendamento(ag)));
			}

			try {
				const response = await fetch(`/ep/portal_noticias/dados?id_noticia=${noticiaId}`, {
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(updatedNoticia)
				});

				if (!response.ok) {
					const errorData = await response.json().catch(() => ({ message: 'Erro ao atualizar notícia' }));
					throw new Error(errorData.message || `Erro ${response.status}`);
				}

				toastr.success('Atualizou a notícia com sucesso!', 'SUCESSO!', {
					timeOut: 5000,
					progressBar: true
				});
				// Adiciona timestamp para forçar atualização da tabela
				goto(`/portal_noticias?refresh=${Date.now()}`);
			} catch (error) {
				console.error('Erro ao atualizar notícia:', error);
				toastr.error(
					error.message || 'Erro ao atualizar a notícia. Por favor, tente novamente.',
					'ERRO!',
					{ timeOut: 5000, progressBar: true }
				);
			}

	
}

function addFilesFromList(fileList) {
		if (!fileList || fileList.length === 0) return;

		const filesArray = Array.from(fileList);

		const invalidFiles = filesArray.filter(
			(file) => !ALLOWED_MIME_TYPES.has(file.type)
		);

		if (invalidFiles.length > 0) {
			const names = invalidFiles.map((f) => f.name).join(', ');
			toastr.warning(
				`Ficheiro(s) não suportado(s): ${names}. Use apenas JPG, PNG, GIF ou MP4.`,
				'Anexos',
				{ timeOut: 5000, progressBar: true }
			);
		}

		const validFiles = filesArray.filter((file) => ALLOWED_MIME_TYPES.has(file.type));

		const incoming = validFiles.map((file) =>
			Object.assign(file, {
				url: URL.createObjectURL(file),
				redes: Array.isArray(file.redes) ? file.redes : []
			})
		);

		anexos = [...anexos, ...incoming];
		updateSelectedNetworks();
}

	function handleFileChange(event) {
		addFilesFromList(event.target.files);
		event.target.value = '';
	}

	function handleDrop(event) {
		if (event?.preventDefault) event.preventDefault();
		addFilesFromList(event?.dataTransfer?.files ?? []);
		isDragActive = false;
	}

	function handleDragOver(event) {
		if (event?.preventDefault) event.preventDefault();
		isDragActive = true;
	}

	function handleDragLeave(event) {
		if (event?.preventDefault) event.preventDefault();
		isDragActive = false;
	}

	function handleSelectTag(tag) {
		const index = selectedTags.findIndex((selectedTag) => selectedTag.id_tag === tag.id_tag);
		if (index === -1) {
			selectedTags = [...selectedTags, tag];
		} else {
			selectedTags.splice(index, 1);
			selectedTags = [...selectedTags];
		}
		console.log('Tags selecionadas:', formField);
	}

	async function handleAddTag() {
		console.log('Adicionando tag:', newTag);
		if (newTag.trim() !== '') {
			const existingTag = tags.find((tag) => tag.nome === newTag);
			if (existingTag) {
				if (existingTag.status === 'Ativo') {
					console.log('A tag já existe e está ativa.');
				} else {
					console.log('A tag já existe, mas está inativa, Será ativada.');
					await fetch(`/ep/portal_noticias/tags/activate?id_tag=${existingTag.id_tag}`)
					existingTag.status = 'Ativo';
					tags = [...tags];
					console.log(existingTag.nome, 'ativada');
				}
			} else {
				const addedTag = await fetch('/ep/portal_noticias/tags',{
					method: 'POST',
					body: JSON.stringify({ nome: newTag })
				}).then(d => d.json())//addTag(newTag);

				if (addedTag) {
					tags = [...tags, addedTag];
					newTag = '';
				}
			}
		}
	}

	async function handleRemoveTag(tagToRemove) {
		const removed = await fetch(`/ep/portal_noticias/tags?id_tag=${tagToRemove.id_tag}`,{method:"DELETE"})//removeTag(tagToRemove.id_tag);
		if (removed) {
			tags = tags.filter((tag) => tag.id_tag !== tagToRemove.id_tag);
			tags = [...tags];
		}
	}

	function removeFile(index) {
		updatedAnexos.splice(index, 1);
		updatedAnexos = [...updatedAnexos];
	}

	function removeFileUploaded(index) {
		anexos.splice(index, 1);
		anexos = [...anexos];
	}

	function handleCloseModal() {
		showModal = false;
	}

	function updateSelectedNetworks() {
		// Não resetamos tudo aqui para não apagar o que veio da BD ou seleções manuais
		// Apenas garantimos que se uma rede está num anexo, ela deve estar selecionada
		let modified = false;
		[...updatedAnexos, ...anexos].forEach(file => {
			file.redes?.forEach(networkName => {
				let network = redesSociais.find(n => n.nome === networkName);
				if (network && !network.checked) {
					network.checked = true;
					modified = true;
				}
			});
		});
		
		if (modified) {
			redesSociais = [...redesSociais];
		}
	}


	let items_breadcrum = $derived([
		{
			icon_class: 'fas fa-list',
			url: '#',
			designacao: $t('divPublicar.listar'),
			function: listarNoticias
		}
	]);
</script>
<style>
	@import "../../../portal_noticias.css";
	.texto-input {
  height: 200px; /* Doubled size for text input */
  resize: vertical; /* Allows manual resizing */
}

.char-counter {
  font-size: 12px;
  color: gray;
  margin-bottom: 5px; /* Moves counter closer to input */
  text-align: right; /* Aligns counter to the right */
}

.selected-file {
  background-color: #f8f9fa;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  margin-bottom: 10px;
  position: relative;
  display: flex;
  flex-direction: column;
}

.file-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 5px;
}

.file-link {
  display: flex;
  align-items: center;
  text-decoration: none;
  color: #007bff;
}

.file-link i {
  margin-right: 8px;
}

.btn-delete {
  background: none;
  border: none;
  color: red;
  cursor: pointer;
  font-size: 16px;
}

.btn-delete:hover {
  color: darkred;
}

.file-networks {
  display: flex;
  flex-wrap: nowrap;
  gap: 30px;
  justify-content: flex-start;
  padding-top: 10px;
  overflow-x: auto;
}

.file-networks label {
  display: flex;
  align-items: center;
  gap: 5px; /* Space between checkbox and label text */
  font-size: 14px;
  cursor: pointer;
  padding: 5px 10px;
  border-radius: 5px;
  transition: background 0.3s;
}

.file-networks label:hover {
  background: #f0f0f0;
}

.file-upload-wrapper {
  width: 100%;
}

.file-input-hidden {
  display: none;
}

.file-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.file-preview {
  display: inline-flex;
  justify-content: flex-start;
}

.file-preview-image {
  max-width: 160px;
  max-height: 120px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #dde3ea;
}

.file-drop-zone {
  border: 2px dashed #cfd6dd;
  border-radius: 8px;
  padding: 32px;
  text-align: center;
  background: #f9fbfd;
  color: #7fa0b5;
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease;
}

.file-drop-zone:hover,
.file-drop-zone.active {
  border-color: #c2c7d0;
  background: #edf0f3;
}

.file-drop-zone-icon {
  font-size: 32px;
  color: #a0adba;
  margin-bottom: 8px;
}

.file-drop-zone-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 4px;
  color: #6c7a88;
}

.file-drop-zone-subtitle {
  font-size: 14px;
  color: #9aa6b2;
}

	.file-drop-zone-helper {
		font-size: 12px;
		color: #7fa0b5;
		margin-top: 6px;
	}

	.projeto-toggle {
		align-items: center;
		gap: 18px;
		flex-wrap: wrap;
	}

	.projeto-toggle .form-check-label {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		margin: 2px 0;
		font-weight: 700;
		color: #2f3a44;
		text-transform: uppercase;
		letter-spacing: 0.02em;
	}

	.projeto-toggle .form-check-input {
		margin: 0;
		accent-color: #4f6b82;
		vertical-align: middle;
		position: relative;
		top: 1px;
	}

	/* Botões de redes sociais ativos (selecionados) */
	:global(.social-media-button .btn-outline-primary.active) {
		background-color: #00a4e6 !important;
		color: #fff !important;
		border-color: #00a4e6 !important;
	}

	.network-section-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 12px;
	}

	.network-section-hint {
		font-size: 12px;
		color: #7fa0b5;
		margin: 4px 0 0;
	}

	.network-customization {
		display: flex;
		flex-direction: column;
		gap: 12px;
		margin-bottom: 24px;
	}

	.network-card {
		border: 1px solid #dde3ea;
		border-radius: 8px;
		padding: 16px;
		background: #fff;
		transition: border-color 0.2s ease, box-shadow 0.2s ease;
	}

	.network-card.active {
		border-color: #00a4e6;
	}

	.network-card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 12px;
	}

	.network-meta {
		display: flex;
		flex-direction: column;
	}

	.network-name {
		font-weight: 600;
		color: #29363d;
	}

	.network-status {
		font-size: 11px;
		text-transform: uppercase;
		color: #7fa0b5;
		letter-spacing: 0.04em;
	}

	.network-card-body {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.network-actions {
		display: flex;
		gap: 8px;
	}

	.network-textarea textarea {
		min-height: 120px;
	}

.schedule-section {
	border: 1px solid #dde3ea;
	border-radius: 8px;
	padding: 16px;
	background: #fff;
	margin-top: 16px;
}

.schedule-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	margin-bottom: 8px;
}

.schedule-title {
	font-weight: 600;
	color: #29363d;
	margin: 0;
}

.schedule-hint {
	font-size: 12px;
	color: #7fa0b5;
	margin: 4px 0 0;
}

.schedule-grid {
	margin-top: 12px;
	display: flex;
	flex-direction: column;
	gap: 10px;
}

.schedule-row {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
	align-items: center;
}

.schedule-label {
	min-width: 140px;
	font-weight: 500;
	color: #4b5c6b;
}

.schedule-inputs {
	flex: 1;
	display: flex;
	flex-wrap: nowrap;
	align-items: center;
	gap: 8px;
}

.schedule-inputs .form-control,
.schedule-inputs select {
	min-width: 140px;
	flex: 1;
}

.schedule-inputs .btn {
	white-space: nowrap;
	flex: 0 0 auto;
}

.schedule-actions {
	display: flex;
	gap: 6px;
	justify-content: flex-end;
}

.modal-backdrop {
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background: rgba(0, 0, 0, 0.55);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1050;
}

.modal-dialog-centered {
	width: 400px !important;
	max-width: 400px !important;
}

.modal-content-custom {
	background: #fff;
	border-radius: 8px;
	box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
	overflow: hidden;
	height: 400px !important;
	display: flex;
	flex-direction: column;
}

.modal-header-custom {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 12px 16px;
	border-bottom: 1px solid #dde3ea;
}

.modal-body-custom {
	padding: 16px;
	flex: 1;
	overflow-y: auto;
}

.modal-footer-custom {
	display: flex;
	justify-content: flex-end;
	gap: 8px;
	padding: 12px 16px;
	border-top: 1px solid #dde3ea;
}

.modal-body-custom .form-group {
	margin-left: 50px;
	margin-right: 50px;
}

/* Novos estilos para modal padrão de eliminação */
.modal-backdrop-custom {
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background: rgba(0, 0, 0, 0.55);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1050;
}

.modal-card {
	background: #fff !important;
	border-radius: 8px !important;
	padding: 24px !important;
	width: min(420px, calc(100% - 32px)) !important;
	box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25) !important;
	height: auto !important;
	display: block !important;
}

.modal-card h5 {
	font-size: 18px !important;
	margin-bottom: 12px !important;
	font-weight: 600 !important;
}

.modal-text {
	font-size: 14px !important;
	margin-bottom: 20px !important;
	color: #4a5568 !important;
}

.modal-actions {
	display: flex !important;
	gap: 12px !important;
	justify-content: flex-end !important;
}
</style>


<Breadcrum
	modulo={sidebarOptions.currentModule}
	objeto={sidebarOptions.currentObject}
	menu_items={items_breadcrum}
/>
<div class="container-fluid mt-4">
	<form onsubmit={onHandleSubmit} class="form-container">
		<div class="row">
			<div class="col-md-6">
				<div class="form-group">
					<label for="tituloInput">{$t('divPublicar.Titulo')}:</label>
					<input
						class="form-control"
						type="text"
						id="tituloInput"
						name="tituloInput"
						required
						bind:value={formField.titulo}
						oninput={(e) => formField.titulo = e.target.value.slice(0, 100)}
						maxlength="100"
					/>
					<!-- Character Counter (Above the Input) -->
					<p class="char-counter">{formField.titulo.length} / 100</p>
				</div>
				<div class="form-group">
					<label for="areatext">{$t('divPublicar.Texto')}:</label>
					<textarea
						class="form-control texto-input"
						id="areatext"
						name="textInput"
						required
						bind:value={formField.descricao}
						oninput={(e) => formField.descricao = e.target.value.slice(0, 10000)}
						maxlength="10000"
					></textarea>
					<!-- Character Counter (Above the Textarea) -->
					<p class="char-counter">{formField.descricao.length} / 10000</p>
				</div>

				<div class="form-group">
					<label>{$t('divPublicar.Categorias')}:</label>
					<select bind:value={formField.id_categoria_FK} class="form-control">
						<option value="">{$t('divPublicar.selCategoria')}</option>
						{#each categorias.filter((categoria) => categoria.status === 'Ativo') as categoria}
							<option value={categoria.id_categoria}>{categoria.nome}</option>
						{/each}
					</select>
				</div>

				<div class="form-group">
					<label>Tem projeto associado?</label>
					<div class="d-flex gap-3 projeto-toggle">
						<label class="form-check-label">
							<input
								type="radio"
								name="temProjetoEdit"
								value="sim"
								class="form-check-input"
								checked={hasProjeto}
								onchange={() => {
									hasProjeto = true;
									if (!formField.id_projeto) {
										formField.id_projeto = '';
									}
								}}
							/>
							Sim
						</label>
						<label class="form-check-label">
							<input
								type="radio"
								name="temProjetoEdit"
								value="nao"
								class="form-check-input"
								checked={!hasProjeto}
								onchange={() => {
									hasProjeto = false;
									formField.id_projeto = '';
								}}
							/>
							Não
						</label>
					</div>
				</div>

				{#if hasProjeto}
					<div class="form-group">
						<label>Projetos:</label>
						<select bind:value={formField.id_projeto} class="form-control" required={hasProjeto}>
							<option value="">Selecione um projeto</option>
							{#each projetos as projeto}
								<option value={projeto.id_projeto}>{projeto.assunto}</option>
							{/each}
						</select>
					</div>
				{/if}


				<div class="form-group">
					<label for="fileInput">{$t('divPublicar.Anexos')}:</label>
					<div class="file-upload-wrapper">
					<input
						class="file-input-hidden"
						type="file"
						id="fileInput"
						name="fileInput"
						bind:this={fileInputRef}
						accept=".jpg,.jpeg,.png,.gif,.mp4"
						onchange={(event) => handleFileChange(event)}
						multiple
					/>
						<div
							class={`file-drop-zone ${isDragActive ? 'active' : ''}`}
							onclick={() => fileInputRef?.click()}
							ondragover={handleDragOver}
							ondragleave={handleDragLeave}
							ondrop={handleDrop}
							role="button"
							tabindex="0"
							aria-label={$t('divPublicar.dropTitle')}
						>
							<i class="fas fa-upload file-drop-zone-icon" aria-hidden="true"></i>
							<p class="file-drop-zone-title">{$t('divPublicar.dropTitle')}</p>
							<span class="file-drop-zone-subtitle">
								{$t('divPublicar.dropSubtitle')}
							</span>
							<p class="file-drop-zone-helper">
								{$t('divPublicar.fileTypesHint')}
							</p>
						</div>
					</div>

					{#if updatedAnexos.length > 0 || anexos.length > 0}
					<div class="selected-files mt-3">
						<label for="fileInput" class="form-label">{$t('divPublicar.sAnexos')}:</label>

						{#each [...updatedAnexos, ...anexos] as file, index}
						<div class="selected-file">
							<div class="file-header">
								<a href={file.url ? file.url : `/ep/portal_noticias/getFileById?id=${file.id_anexo}`} target="_blank" class="file-link">
									<i class="fas fa-file-alt"></i> {file.nome_original_ficheiro || file.name}
								</a>
								<button
									type="button"
									class="btn-delete"
									onclick={() => (file.id_anexo ? removeFile(index) : removeFileUploaded(index))}
								>
									<i class="fa fa-trash"></i>
								</button>
							</div>

							<div class="file-body">
								{#if file.tipo?.startsWith('image/') || file.type?.startsWith('image/')}
									<div class="file-preview">
										<img
											src={file.url ? file.url : `/ep/portal_noticias/getFileById?id=${file.id_anexo}`}
											alt={file.nome_original_ficheiro || file.name}
											class="file-preview-image"
										/>
									</div>
								{/if}

								<div class="file-networks">
									{#if getSelectedSocialNetworks().length === 0}
										<p class="text-muted small mb-0">
											Selecione as redes sociais acima para associar os anexos.
										</p>
									{:else}
										{#each getSelectedSocialNetworksNames() as network}
											<label>
												<input
													type="checkbox"
													checked={file.redes.includes(network)}
													onchange={(event) => {
														const outOfService = ["LinkedIn", "Facebook", "Instagram", "Tiktok"];
														if (event.target.checked && outOfService.includes(network)) {
															toastr.info(`${network} fora de serviço mas será criado na mesma`, 'Aviso', {
																timeOut: 5000,
																progressBar: true
															});
														}

														const [canToggle, message] = checkifcanornot(file, network);
														if (canToggle) {
															toggleFileNetwork(file, network);
														} else {
															event.target.checked = file.redes.includes(network);
															toastr.warning(message, 'Aviso');
														}
													}}
												/>
												{network}
											</label>
										{/each}
									{/if}
								</div>
							</div>
						</div>
						{/each}
					</div>
					{:else}
					<div class="alert alert-info mt-1" role="alert">
						<i class="fas fa-info-circle"></i>
						{$t('divEditar.noAnexos')}
					</div>
					{/if}

				</div>
			</div>

			<div class="col-md-6 form-group">
				<div class="network-section-header">
					<div>
						<label>{$t('divPublicar.rs')}</label>
						<p class="network-section-hint">
							{tf(
								'divPublicar.redesHint',
								'Selecione as redes sociais e personalize apenas se precisar de textos diferentes.',
								'Select the social networks to send and customize the ones that need different copy.'
							)}
						</p>
					</div>
				</div>

				<div class="network-customization">
					{#each redesSociais as redeSocial}
						<div class="network-card {redeSocial.checked ? 'active' : ''}">
							<div class="network-card-header">
								<div class="network-meta">
									<span class="network-name">{redeSocial.nome}</span>
									<span class="network-status">
										{#if redeSocial.checked}
											{redeSocial.customize
												? tf(
														'divPublicar.statusCustom',
														'A usar conteúdo personalizado',
														'Using custom content'
													)
												: tf(
														'divPublicar.statusBase',
														'A usar o texto base',
														'Using base content'
													)}
										{:else}
											{tf(
												'divPublicar.statusInactive',
												'Rede não selecionada',
												'Network not selected'
											)}
										{/if}
									</span>
								</div>
								<label class="toggle-switch">
									<input
										type="checkbox"
										checked={redeSocial.checked}
										onchange={() => toggleRedeSelectionLocal(redeSocial)}
									/>
									<span class="slider round"></span>
								</label>
							</div>
							<div class="network-card-body">
								<div class="network-actions">
									<button
										type="button"
										class="btn btn-sm btn-outline-secondary"
										disabled={!redeSocial.checked}
										onclick={() => toggleRedeCustomization(redeSocial)}
									>
										{redeSocial.customize
											? tf('divPublicar.usarBaseBtn', 'Usar texto base', 'Use base text')
											: tf('divPublicar.personalizarBtn', 'Personalizar', 'Customize')}
									</button>
								</div>
								{#if redeSocial.checked && redeSocial.customize}
									<div class="form-group network-textarea">
										<label for={`texto-${redeSocial.id}`}>
											{$t('divPublicar.textoPara')} {redeSocial.nome}:
										</label>
										<textarea
											class="form-control"
											id={`texto-${redeSocial.id}`}
											placeholder={tf(
												'divPublicar.customPlaceholder',
												'Escreve o texto específico para esta rede...',
												'Write the specific copy for this network...'
											)}
											bind:value={formField[getNetworkFieldKey(redeSocial.nome)]}
										></textarea>
									</div>
								{/if}
							</div>
						</div>
					{/each}
				</div>

				<div class="form-group">
					{#if redesSociais.filter((redeSocial) => redeSocial.checked).length > 0}
						<div class="form-group tags-input" style="margin-top: 20px;">
							<label for="tagsInput">
								{#if redesSociais.filter((redeSocial) => redeSocial.checked).length > 0}
									{$t('divPublicar.tagsPara')}
									{#each redesSociais.filter((redeSocial) => redeSocial.checked) as redeSocial, i}
										{redeSocial.nome}
										{#if i < redesSociais.filter((redeSocial) => redeSocial.checked).length - 1}
											{', '}
										{/if}
									{/each}
								{/if}
							</label>
							<div class="available-tags">
								{#each tags.filter((tag) => tag.status === 'Ativo') as tag}
									<div
										class="tag {selectedTags.some(
											(selectedTag) => selectedTag.id_tag === tag.id_tag
										)
											? 'selected'
											: ''}"
										class:selected={selectedTags.some(
											(selectedTag) => selectedTag.id_tag === tag.id_tag
										)}
										class:bordered={selectedTags.some(
											(selectedTag) => selectedTag.id_tag === tag.id_tag
										)}
									>
										<span
											role="button"
											aria-label={$t('divPublicar.selTag')}
											tabindex="0"
											onkeydown={(e) => {
												if (e.key === 'Enter' || e.key === ' ') {
													handleSelectTag(tag);
												}
											}}
											onclick={() => handleSelectTag(tag)}
										>
											{tag.nome}
										</span>
										<span
											role="button"
											aria-label={$t('divPublicar.removerTag')}
											tabindex="0"
											class="remove-icon"
											onkeydown={(e) => {
												if (e.key === ' ') {
													handleRemoveTag(tag);
												}
											}}
											onclick={(e) => {
												e.stopPropagation();
												handleRemoveTag(tag);
											}}
										>
											x
										</span>
									</div>
								{/each}
							</div>
							<div class="tag-input" style="display: flex; align-items: center; gap: 10px;">
								<input
									class="form-control"
									type="text"
									id="tagsInput"
									name="tagsInput"
									placeholder={$t('divPublicar.selTag')}
									bind:value={newTag}
								/>
								<button
									type="button"
									class="btn btn-secondary custom-button"
									onclick={handleAddTag}
								>
									<span class="icon">+</span>
									{$t('divPublicar.addTag')}
								</button>
							</div>
						</div>
					{/if}
				</div>

				<div class="schedule-section mt-3">
					<div class="schedule-header">
						<div>
							<p class="schedule-title">Agendamentos desta notícia</p>
							<p class="schedule-hint">
								Crie, edite ou remova agendamentos para as redes sociais selecionadas.
							</p>
						</div>
						<button
							type="button"
							class="btn btn-sm btn-outline-primary"
							onclick={openNewScheduleModal}
						>
							Novo agendamento
						</button>
					</div>

					{#if agendamentosLoading}
						<p class="text-muted small mt-2">A carregar agendamentos...</p>
					{:else if agendamentosError}
						<div class="alert alert-warning mt-2" role="alert">
							{agendamentosError}
						</div>
					{:else if agendamentos.length > 0}
						<div class="schedule-grid">
							{#each agendamentos as ag}
								<div class="schedule-row">
									<div class="schedule-label">
										<strong>{ag.pn_redes_sociais?.nome ?? 'Rede'}</strong>
									</div>
									<div class="schedule-inputs">
											<input
												type="date"
												class="form-control"
												value={toLocalInputValue(ag.horario_agendado).split('T')[0]}
												oninput={(event) => {
													const date = event.currentTarget.value;
													const time = toLocalInputValue(ag.horario_agendado).split('T')[1] || '08:00';
													ag.horario_agendado = `${date}T${time}`;
												}}
											/>
											<select
												class="form-control"
												value={toLocalInputValue(ag.horario_agendado).split('T')[1].substring(0, 5) || '08:00'}
												onchange={(event) => {
													const date = toLocalInputValue(ag.horario_agendado).split('T')[0] || new Date().toISOString().split('T')[0];
													const time = event.currentTarget.value;
													ag.horario_agendado = `${date}T${time}`;
												}}
											>
												<option value="08:00">08:00</option>
												<option value="12:00">12:00</option>
												<option value="16:00">16:00</option>
												<option value="20:00">20:00</option>
											</select>
										<select
											class="form-control"
											bind:value={ag.fuso_horario}
										>
											<option value="Europe/Lisbon">Europe/Lisbon</option>
											<option value="UTC">UTC</option>
										</select>
										<select
											class="form-control"
											bind:value={ag.status}
										>
											<option value="pendente">Pendente</option>
											<option value="enviado">Enviado</option>
											<option value="erro">Erro</option>
											<option value="cancelado">Cancelado</option>
										</select>
									</div>
									<div class="schedule-actions">
										<button
											type="button"
											class="btn btn-sm btn-outline-danger"
											onclick={() => askDeleteAgendamento(ag)}
										>
											Remover
										</button>
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<p class="text-muted small mt-2">
							Esta notícia não tem agendamentos configurados. Clique em "Novo agendamento" para criar o primeiro.
						</p>
					{/if}
				</div>

				<div class="col-md-12 text-md-right">
					<button
						type="submit"
						class="btn btn-primary btn-lg get-source"
						style="margin-top: 30px; position: relative; padding-left: 50px;"
					>
						<i
							class="fas fa-paper-plane"
							style="position: absolute; left: 20px; top: 50%; transform: translateY(-50%);"
						></i>
						{$t('divEditar.editarNoticia')}
					</button>
				</div>
			</div>
		</div>
	</form>
</div>

{#if showScheduleModal}
	<div class="modal-backdrop">
		<div class="modal-dialog-centered">
			<div class="modal-content-custom">
				<div class="modal-header-custom">
					<h5 class="modal-title">Novo agendamento</h5>
					<button type="button" class="close" aria-label="Close" onclick={closeNewScheduleModal}>
						<span aria-hidden="true">&times;</span>
					</button>
				</div>
				<div class="modal-body-custom">
					<div class="form-group">
						<label>Rede social</label>
						<select
							class="form-control"
							bind:value={newSchedule.id_rede_social}
						>
							<option value="">Selecione uma rede</option>
							{#each redesSociais.filter((rede) => rede.checked) as rede}
								<option value={rede.id_rede_social}>{rede.nome}</option>
							{/each}
						</select>
					</div>
					<div class="form-group">
						<label>Data e hora</label>
						<div class="schedule-inputs">
							<input
								type="date"
								class="form-control"
								value={newSchedule.horario_local?.split('T')[0] ?? ''}
								oninput={(event) => {
									const date = event.currentTarget.value;
									const time = newSchedule.horario_local?.split('T')[1] || '08:00';
									newSchedule.horario_local = `${date}T${time}`;
								}}
							/>
							<select
								class="form-control"
								value={newSchedule.horario_local?.split('T')[1]?.substring(0, 5) ?? '08:00'}
								onchange={(event) => {
									const date = newSchedule.horario_local?.split('T')[0] || new Date().toISOString().split('T')[0];
									const time = event.currentTarget.value;
									newSchedule.horario_local = `${date}T${time}`;
								}}
							>
								<option value="08:00">08:00</option>
								<option value="12:00">12:00</option>
								<option value="16:00">16:00</option>
								<option value="20:00">20:00</option>
							</select>
						</div>
					</div>
					<div class="form-group">
						<label>Fuso horário</label>
						<select
							class="form-control"
							bind:value={newSchedule.fuso_horario}
						>
							<option value="Europe/Lisbon">Europe/Lisbon</option>
							<option value="UTC">UTC</option>
						</select>
					</div>
				</div>
				<div class="modal-footer-custom">
					<button
						type="button"
						class="btn btn-secondary"
						onclick={closeNewScheduleModal}
					>
						Cancelar
					</button>
					<button
						type="button"
						class="btn btn-primary"
						onclick={handleCreateAgendamento}
					>
						Guardar
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

{#if confirmDelete.open}
	<div class="modal-backdrop-custom">
		<div class="modal-card">
			<h5>Remover agendamento</h5>
			<p class="modal-text">Tem a certeza que pretende remover este agendamento? Esta ação não pode ser desfeita.</p>
			<div class="modal-actions">
				<button
					type="button"
					class="btn btn-sm btn-danger"
					onclick={confirmDeleteAgendamento}
				>
					Remover
				</button>
				<button
					type="button"
					class="btn btn-sm btn-outline-secondary"
					onclick={closeDeleteDialog}
				>
					Cancelar
				</button>
			</div>
		</div>
	</div>
{/if}

<SuccesModal show={showModal} message={modalMessage} onClose={handleCloseModal} />
