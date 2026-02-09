<script>
	import { goto } from '$app/navigation';
	import Breadcrum from '$lib/components/Breadcrum.svelte';
	import { locale, t } from '$lib/translations/translations';
	import { onMount, tick } from 'svelte';
import SuccesModal from '../../../rede-social/detalhe/[id]/modals/SuccesModal.svelte';
	import { page } from '$app/stores';
	import { get } from 'svelte/store';
import { configurePortalSidebar } from '../../../sidebar.config.js';
	import { sidebarOptions } from '$lib/runes/sidebarOptions.rune.svelte';
	import toastr from 'toastr';

const translate = (key) => get(t)(key);
configurePortalSidebar('midiaList', translate);


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
		id_projeto: 0,
		code: '00000',
		emails: '',
		estado: 'Pendente',
	});

	 /**
	 * Array para armazenar as categorias.
	 * @type {Array}
	 */
	 let radio_jornal = $state([]);

	 /**
	 * @type {Array}
	 */
	 let selectedradiosjornais = $state([]);

	 // mapa id_radio_jornal -> texto personalizado (frontend apenas)
	 let radioTexts = $state({});



	  /**
	 * Array para armazenar as redes sociais.
	 * @type {Array}
	 */
	 let codes = $state([]);


	let redesSociais = $state([]);
	let categorias = $state([]);
let projetos = $state([]);
	let tags = $state([]);
	let newTag = $state('');
	let selectedTags = $state([]);
	let anexos = $state([]);
	let updatedAnexos = $state([]);
	let showModal = $state(false);
	let modalMessage = $state('');
	let code = $state([]);

	onMount(async () => {
		const noticia = await fetch(`/ep/portal_noticias/noticia?id=${noticiaId}`).then(d => d.json())
		categorias = await fetch('/ep/portal_noticias/categorias').then(d => d.json())
		projetos = await fetch('/ep/portal_noticias/getJson').then(d => d.json())
		radio_jornal = await fetch('/ep/portal_noticias/radio_jornal').then((d) => d.json())

		redesSociais = await fetch('/ep/portal_noticias/redes').then((d) => d.json())

		const jq = globalThis.$ ?? globalThis.jQuery;
		if (jq?.fn?.select2) {
			jq('#unidinvestigacao').select2();
			jq('#unidinvestigacao').on('change', selecionarRadioJornal);
			jq('.select2-single-multi').select2({
				theme: 'bootstrap',
				language: locale.get() == 'pt' ? 'pt' : 'en'
			});
		}
		formField = {
			titulo: noticia.titulo,
			descricao: noticia.texto,
			nome_categoria: noticia.pn_categoria?.nome || '',
			texto_facebook: noticia.texto_facebook,
			texto_instagram: noticia.texto_instagram,
			texto_twitter: noticia.texto_twitter,
			texto_linkedin: noticia.texto_linkedin,
			texto_tiktok: noticia.texto_tiktok,
			texto_portalipvc: noticia.texto_portalipvc || '',
			id_categoria_FK: noticia.id_categoria_FK,
			id_projeto: noticia.id_projeto,
			anexos: noticia.pn_anexos || [],
			tags: noticia.pn_noticia_Tag || [],
			emails: noticia.emails || '',
			estado: (noticia.estado && String(noticia.estado).trim() === 'Publicado') ? 'Publicado' : 'Pendente',
		};

		selectedradiosjornais = formField.emails ? formField.emails.split(',').filter(Boolean).map(id => String(id)) : [];
		console.log('selectedradiosjornais : ', $state.snapshot(selectedradiosjornais));
		await tick(); // Aguarda a renderização do select

		// Atualiza a seleção manualmente no select
		const select = document.getElementById("unidinvestigacao");
		if (select) {
		for (let option of select.options) {
			option.selected = selectedradiosjornais.includes(option.value);
		}
		}

		// Inicializa o Select2 após a renderização
		jQuery("#unidinvestigacao").select2();
		jQuery("#unidinvestigacao").on("change", selecionarRadioJornal);

		// Atualiza a seleção no Select2
		jQuery("#unidinvestigacao").val(selectedradiosjornais).trigger("change");

		// Inicializa o Select2 com idioma e tema Bootstrap
		jQuery(".select2-single-multi").select2({
		theme: "bootstrap",
		language: locale.get() === "pt" ? "pt" : "en"
		});

		code = formField.anexos.map(anexo => anexo.code_rede_social);

	
		console.log('emails : ', formField.emails);

		redesSociais.forEach((redeSocial) => {
			redeSocial.checked = formField[`texto_${redeSocial.nome.toLowerCase()}`] != null;
		});

		tags = await fetch('/ep/portal_noticias/tags').then(d => d.json())

		tags.forEach((tag) => {
			formField.tags.forEach((tagNoticia) => {
				if (tag.id_tag === tagNoticia.id_tag) {
					selectedTags.push(tag);
				}
			});
		});

		updatedAnexos = formField.anexos.map(file => {
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

			// Retorna o objeto atualizado com radios inicializado como array vazio
			return { ...file, redes, radios: [] };
		});

		// Carregar associações existentes de anexos com rádios/jornais
		try {
			const midiaAnexosResponse = await fetch(`/ep/portal_noticias/midia_anexos/${noticiaId}`);
			if (midiaAnexosResponse.ok) {
				const midiaAnexos = await midiaAnexosResponse.json();
				
				// Criar um mapa: id_anexo -> [id_radio_jornal, ...]
				const anexoRadiosMap = {};
				midiaAnexos.forEach((item) => {
					const anexoId = String(item.id_anexo);
					if (!anexoRadiosMap[anexoId]) {
						anexoRadiosMap[anexoId] = [];
					}
					// Normalizar ID para string
					anexoRadiosMap[anexoId].push(String(item.id_radio_jornal));
				});
				
				console.log('midiaAnexos carregados:', midiaAnexos);
				console.log('anexoRadiosMap (normalizado):', anexoRadiosMap);

				// Atualizar updatedAnexos com as associações carregadas
				updatedAnexos = updatedAnexos.map((anexo) => {
					const anexoId = String(anexo.id_anexo);
					let radiosAssociados = (anexoRadiosMap[anexoId] || []).map(id => String(id));
					
					// Se não há associações guardadas e há apenas um rádio/jornal selecionado, pré-selecionar automaticamente
					if (radiosAssociados.length === 0 && selectedradiosjornais.length === 1) {
						radiosAssociados = [String(selectedradiosjornais[0])];
					}
					
					console.log(`Anexo ${anexoId}: radios associados =`, radiosAssociados);
					console.log(`Anexo ${anexoId}: anexoRadiosMap[anexoId] =`, anexoRadiosMap[anexoId]);
					const updated = { ...anexo, radios: radiosAssociados };
					console.log(`Anexo ${anexoId}: updated.radios =`, updated.radios);
					return updated;
				});
				
				// Forçar atualização reativa
				updatedAnexos = [...updatedAnexos];
				
				console.log('Associações carregadas (anexoRadiosMap):', anexoRadiosMap);
				console.log('selectedradiosjornais:', $state.snapshot(selectedradiosjornais));
				console.log('updatedAnexos após carregar associações:', $state.snapshot(updatedAnexos));
			}
		} catch (error) {
			console.error('Erro ao carregar associações de anexos:', error);
		}

		// Agora cada file em updatedAnexos terá a propriedade "redes" e "radios" corretamente atribuídas.
		console.log("updatedAnexos com associações:", $state.snapshot(updatedAnexos));

		// Carregar textos personalizados por rádio/jornal
		try {
			const midiaPersonalizadaResponse = await fetch(`/ep/portal_noticias/midia_personalizada/${noticiaId}`);
			if (midiaPersonalizadaResponse.ok) {
				const midiaPersonalizada = await midiaPersonalizadaResponse.json();
				const textosMap = {};
				if (Array.isArray(midiaPersonalizada)) {
					midiaPersonalizada.forEach((item) => {
						if (item.id_radio_jornal && item.texto_custom) {
							textosMap[item.id_radio_jornal] = item.texto_custom;
						}
					});
				}
				radioTexts = textosMap;
			}
		} catch (error) {
			console.error('Erro ao carregar textos personalizados:', error);
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

	function getSelectedSocialNetworks() {
		return redesSociais.filter((redeSocial) => redeSocial.checked);
	}

	function listarNoticias() {
		goto('/portal_noticias/radios-jornais/lista');
	}

	function toggleFileNetwork(file, networkName) {
	// If 'file.redes' already includes this network, remove it
		if (file.redes.includes(networkName)) {
			file.redes = file.redes.filter((n) => n !== networkName);
		} else {
			// Otherwise, add it
			file.redes.push(networkName);
	}

	


		console.log('file name:', file.name);
		console.log('file redes:', file.redes);
	}

	function selecionarRadioJornal(event) {
    	console.log("Select2 - Função chamada!");
		selectedradiosjornais = globalThis.$(event.target).val() || [];
		console.log("selectedradiosjornais 2 :", $state.snapshot(selectedradiosjornais));
	}

	function removerRadioJornal(id) {
		selectedradiosjornais = selectedradiosjornais.filter(rj => rj !== id);
		console.log("selectedradiosjornais:", $state.snapshot(selectedradiosjornais));
	}

	function getNomeById(id) {
		const item = radio_jornal.find(rj => rj.id_radio_jornal === id);
		return item ? item.nome : "Desconhecido";
	}

	function setRadioTexto(id, value) {
		const trimmed = value ?? '';
		radioTexts = { ...radioTexts, [id]: trimmed };
	}

	// Chama o backend para gravar textos personalizados de mídia (sem imagens)
	async function saveMidiaPersonalizada(idNoticiaCreated) {
		const idNoticia = String(idNoticiaCreated ?? '');
		if (!idNoticia) return;

		const items = selectedradiosjornais.map((id) => ({
			id_radio_jornal: String(id),
			texto_custom: (radioTexts[id] ?? '').trim()
		}));

		const payload = {
			id_noticia: idNoticia,
			items
		};

		try {
			const res = await fetch('/ep/portal_noticias/midia_personalizada', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(payload)
			});
			if (!res.ok) {
				const errText = await res.text();
				console.error('Erro ao guardar textos personalizados:', res.status, errText);
				if (typeof toastr !== 'undefined') {
					toastr.warning('Os textos personalizados por rádio/jornal não foram guardados. Tente editar a notícia e gravar de novo.', 'Aviso');
				}
			}
		} catch (e) {
			console.error('Erro ao guardar personalizações de mídia (ignorado):', e);
			if (typeof toastr !== 'undefined') {
				toastr.warning('Os textos personalizados por rádio/jornal não foram guardados.', 'Aviso');
			}
		}
	}

	// Função para toggle de rádios/jornais em anexos existentes
	function toggleFileRadioExisting(fileIndex, radioId, checked) {
		const file = updatedAnexos[fileIndex];
		let radios = Array.isArray(file.radios) ? file.radios.map(r => String(r)) : [];
		const radioIdStr = String(radioId);

		if (checked) {
			if (!radios.includes(radioIdStr)) {
				radios = [...radios, radioIdStr];
			}
		} else {
			radios = radios.filter((id) => String(id) !== radioIdStr);
		}

		file.radios = radios;
		updatedAnexos = [...updatedAnexos];
	}

	// Função para salvar associações de anexos com rádios/jornais
	async function saveMidiaAnexos(idNoticiaCreated, anexosUploaded) {
		const mapa = {};

		// Processar anexos existentes (que não foram removidos)
		updatedAnexos.forEach((file) => {
			const radios = Array.isArray(file.radios) ? file.radios : [];
			if (!file.id_anexo || radios.length === 0) return;

			radios.forEach((idRadio) => {
				if (!mapa[idRadio]) {
					mapa[idRadio] = [];
				}
				mapa[idRadio].push(file.id_anexo);
			});
		});

		// Processar novos anexos
		anexos.forEach((file, idx) => {
			const radios = Array.isArray(file.radios) ? file.radios : [];
			// @ts-ignore
			const uploaded = Array.isArray(anexosUploaded) ? anexosUploaded[idx] : null;

			if (!uploaded || !uploaded.id_anexo || radios.length === 0) return;

			radios.forEach((idRadio) => {
				if (!mapa[idRadio]) {
					mapa[idRadio] = [];
				}
				mapa[idRadio].push(uploaded.id_anexo);
			});
		});

		const items = Object.entries(mapa).map(([id_radio_jornal, ids_anexos]) => ({
			id_radio_jornal,
			// @ts-ignore
			ids_anexos
		}));

		const payload = {
			id_noticia: idNoticiaCreated,
			items
		};

		try {
			await fetch('/ep/portal_noticias/midia_anexos', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(payload)
			});
		} catch (e) {
			console.error('Erro ao guardar anexos por rádio/jornal (ignorado):', e);
		}
	}


	async function onHandleSubmit(event) {
		event.preventDefault();

		// Garantir que estamos a atualizar (PUT), nunca a criar (POST): exige id da URL
		if (!noticiaId) {
			toastr.error('ID da notícia em falta. Não é possível gravar.', 'Erro');
			return;
		}

		const titulo = formField.titulo;
		const descricao = formField.descricao;
		// Estado escolhido no formulário (campo bind:value={formField.estado})
		const estado = (formField.estado && String(formField.estado).trim()) || 'Pendente';
		const id_categoria_FK = formField.id_categoria_FK;
		const texto_facebook = formField.texto_facebook;
		const texto_instagram = formField.texto_instagram;
		const texto_twitter = formField.texto_twitter;
		const texto_linkedin = formField.texto_linkedin;
		const texto_tiktok = formField.texto_tiktok;
		const selectedSocialNetworks = getSelectedSocialNetworks();
		const getSelectedSocialNetworksNames = getSelectedSocialNames();
		const tags = selectedTags;
		const id_projeto = formField.id_projeto;
		const formDataAnexos = new FormData();
		console.log("anexos 1 :", $state.snapshot(updatedAnexos));


		anexos.forEach((file) => {
			console.log("file :", file);

			console.log("file.redes 1 :", file.redes);

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

			const updatedNoticia = { 
				titulo: String(titulo),
				texto: String(descricao),
				estado: String(estado),
				id_categoria_FK: String(id_categoria_FK),
				redesSociais: selectedSocialNetworks, // Ensure this is an array
				tags: tags, // Ensure this is an array
				id_projeto: id_projeto,
				emails : selectedradiosjornais.join(','),
				anexos: [...updatedAnexos, ...(Array.isArray(anexosUploaded) ? anexosUploaded : [])], // Ensure anexosUploaded is an array
				tipo: 1 // Manter como mídia (rádios/jornais); sem isto o backend coloca tipo null e a notícia passa para "Listar Notícias"
			};
			
			// Adiciona textos das redes sociais apenas se não forem nulos e estiverem nas redes selecionadas
			if (getSelectedSocialNetworksNames.includes('Facebook') && texto_facebook != '')
				updatedNoticia.texto_facebook = texto_facebook;
			else updatedNoticia.texto_facebook = null;
			if (getSelectedSocialNetworksNames.includes('Instagram') && texto_instagram != '')
				updatedNoticia.texto_instagram = texto_instagram;
			else updatedNoticia.texto_instagram = null;
			if (getSelectedSocialNetworksNames.includes('Twitter') && texto_twitter != '')
				updatedNoticia.texto_twitter = texto_twitter;
			else updatedNoticia.texto_twitter = null;
			if (getSelectedSocialNetworksNames.includes('LinkedIn') && texto_linkedin != '')
				updatedNoticia.texto_linkedin = texto_linkedin;
			else updatedNoticia.texto_linkedin = null;
			if (getSelectedSocialNetworksNames.includes('Tiktok') && texto_tiktok != '')
				updatedNoticia.texto_tiktok = texto_tiktok;
			else updatedNoticia.texto_tiktok = null;

			const resposta = await fetch(`/ep/portal_noticias/dados?id_noticia=${noticiaId}`,{
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(updatedNoticia)
			});

			if (!resposta.ok) {
				const errorData = await resposta.json();
				throw new Error(errorData.message || 'Erro ao atualizar notícia.');
			}

			const noticiaAtualizada = await resposta.json();
			
			// Salvar associações de anexos com rádios/jornais
			if (noticiaId) {
				await saveMidiaAnexos(noticiaId, anexosUploaded);
				await saveMidiaPersonalizada(noticiaId);
			}

			toastr.success('Notícia atualizada com sucesso!','SUCESSO!',{ timeOut: 5000, progressBar: true});
			// Sempre redirecionar para a lista de mídia (rádios/jornais), não para listar notícias
			goto('/portal_noticias/radios-jornais/lista', { replaceState: true });

	
}

	function handleFileChange(event) {
		const files = event.target.files;
		anexos = [...anexos];

		const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'];
		const rejectedNames = [];

		for (let i = 0; i < files.length; i++) {
			const file = files[i];

			if (!allowedTypes.includes(file.type)) {
				rejectedNames.push(file.name);
				continue;
			}

			// Cria uma URL de objeto para o arquivo atual
			const fileUrl = URL.createObjectURL(file);
			// Adiciona a URL como uma propriedade do objeto do arquivo
			file.url = fileUrl;
			file.redes = [];
			// Inicializa arrays para redes sociais e rádios/jornais ligados a este ficheiro
			file.radios = [];
			// Se houver apenas um rádio selecionado, anexar automaticamente este ficheiro a ele
			if (selectedradiosjornais.length === 1) {
				file.radios = [selectedradiosjornais[0]];
			}
			// Adiciona o arquivo modificado ao array anexos
			anexos.push(file);
		}

		if (rejectedNames.length > 0 && typeof toastr !== 'undefined') {
			toastr.warning(
				`Alguns ficheiros foram ignorados por não serem suportados (apenas JPG, PNG, GIF, MP4): ${rejectedNames.join(', ')}`,
				'Formato não suportado',
				{ timeOut: 5000, progressBar: true }
			);
		}

		console.log('Anexos selecionados:', $state.snapshot(anexos));
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

	let items_breadcrum = $derived([
		{
			icon_class: 'fas fa-list',
			url: '#',
			designacao: 'Listar Mídia',
			function: listarNoticias
		}
	]);
</script>
<style>
	@import "../../../portal_noticias.css";
	.texto-input {
  height: 200px; /* Makes the text area taller */
  resize: vertical; /* Allows manual resizing */
}

.char-counter {
  font-size: 12px;
  color: gray;
  margin-bottom: 5px; /* Spaces it right above the input */
  text-align: right; /* Aligns to the right side */
}





.selected-radios-container {
  max-width: 100%; /* Keeps it responsive */
  height: 45px; /* ✅ Fixed height */
  overflow-x: auto; /* ✅ Enables horizontal scrolling */
  overflow-y: hidden; /* ✅ Prevents vertical scrolling */
  white-space: nowrap; /* Prevents wrapping */
  padding: 5px 10px; /* ✅ Adds padding inside the box */
  border: 1px solid #ccc;
  border-radius: 6px;
  display: flex;
  align-items: center;
  background-color: #f9f9f9;
  margin-bottom: 10px; /* ✅ Adds spacing between the two boxes */
}

/* ✅ Ensures the scrollbar does not overlap the radio/jornal tags */
.selected-radios-container::-webkit-scrollbar {
  height: 6px; /* ✅ Smaller scrollbar */
}

.selected-radios-container::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 10px;
}

.selected-radios-container::-webkit-scrollbar-thumb:hover {
  background: #555;
}

.selected-radios {
  display: flex;
  gap: 8px;
}

.radio-tag {
  display: flex;
  align-items: center;
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 14px;
  white-space: nowrap; /* Prevents text from wrapping */
}

/* ✅ Ensures remove button is properly aligned */
.radio-tag button {
  background: none;
  border: none;
  color: red;
  font-weight: bold;
  margin-left: 8px;
  cursor: pointer;
}

.radio-tag button:hover {
  color: darkred;
}

/* estilos do seletor de anexos (igual ao Criar Mídia) */
.file-upload-wrapper {
  width: 100%;
}

.file-input-hidden {
  display: none;
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
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 4px;
}

.file-drop-zone-subtitle {
  font-size: 13px;
  color: #9aa9b8;
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
					<p class="char-counter">{formField.descricao.length} / 10000</p>
				</div>

				<div class="form-group">
					<label>{$t('divPublicar.radiosjornais')}:<span style="color: red;">*</span></label>
				  
					
				  
					<select 
						name="investigation_unit_id" 
						id="unidinvestigacao" 
						class="form-control select2-single-multi" 
						multiple 
						bind:value={selectedradiosjornais}
						>
						{#each radio_jornal as rj}
							<option value={rj.id_radio_jornal}>{rj.nome}</option>
						{/each}
					</select>

					{#if selectedradiosjornais.length > 0}
						<div class="mt-3">
							{#each selectedradiosjornais as id (id)}
								<div class="mb-3">
									<label class="form-label small">
										Texto personalizado para {getNomeById(id)} (opcional)
									</label>
									<textarea
										class="form-control"
										rows="2"
										value={radioTexts[id] ?? ''}
										oninput={(e) => setRadioTexto(id, e.target.value)}
									></textarea>
								</div>
							{/each}
						</div>
					{/if}
				</div>
				  
				

				<div class="form-group">
					<label>Projetos:<span style="color: red;">*</span></label>
					<select bind:value={formField.id_projeto} class="form-control" required>
					  <option value="">Selecione um projeto</option>
					  {#each projetos as projeto}
						<option value={projeto.id_projeto}>{projeto.assunto}</option>
					  {/each}
					</select>
				  </div>

				<div class="form-group">
					<label>Estado:</label>
					<select bind:value={formField.estado} class="form-control" required>
					  <option value="Pendente">Pendente</option>
					  <option value="Publicado">Publicado</option>
					</select>
				  </div>

				<div class="form-group">
					<label for="fileInput">{$t('divPublicar.Anexos')}:</label>
					<div class="file-upload-wrapper">
						<input
							class="file-input-hidden"
							type="file"
							id="fileInput"
							name="fileInput"
							placeholder={$t('divPublicar.inAnexos')}
							accept=".jpg,.jpeg,.png,.gif,.mp4"
							onchange={(event) => handleFileChange(event)}
							multiple
						/>
						<div
							class="file-drop-zone"
							onclick={() => document.getElementById('fileInput')?.click()}
							role="button"
							tabindex="0"
							aria-label={$t('divPublicar.dropTitle')}
						>
							<i class="fas fa-upload file-drop-zone-icon" aria-hidden="true"></i>
							<p class="file-drop-zone-title">
								{$t('divPublicar.dropTitle')}
							</p>
							<span class="file-drop-zone-subtitle">
								{$t('divPublicar.dropSubtitle')}
							</span>
						</div>
					</div>

					{#if updatedAnexos.length > 0 || anexos.length > 0}
						<div class="selected-files mt-3">
							<label for="fileInput" class="form-label">{$t('divPublicar.sAnexos')}:</label>

							{#each updatedAnexos as file, index}
								<div class="selected-file">
									<div class="file-header">
										<a href={`/ep/portal_noticias/getFileById?id=${file.id_anexo}`} target="_blank" class="file-link">
											<i class="fas fa-file-alt"></i> {file.nome_original_ficheiro || file.name}
										</a>
										<button
											type="button"
											class="btn-delete"
											onclick={() => removeFile(index)}
										>
											<i class="fa fa-trash"></i>
										</button>
									</div>

									<div class="file-body">
										{#if file.tipo?.startsWith('image/')}
											<div class="file-preview">
												<img
													src={`/ep/portal_noticias/getFileById?id=${file.id_anexo}`}
													alt={file.nome_original_ficheiro || file.name}
													class="file-preview-image"
												/>
											</div>
										{/if}

										{#if selectedradiosjornais.length > 0}
											<div class="mt-2">
												<label class="form-label" style="font-size: 16px; font-weight: 600; margin-bottom: 15px;">RÁDIOS/JORNAIS:</label>
												<div style="display: flex; flex-wrap: wrap; gap: 20px; padding: 10px 0;">
													{#each selectedradiosjornais as idRj}
														{@const isChecked = Array.isArray(file.radios) && file.radios.map(r => String(r)).includes(String(idRj))}
														{@const debugInfo = `Anexo ${file.id_anexo}, Radio ${idRj}, radios: [${file.radios?.join(',') || 'none'}], checked: ${isChecked}`}
														<!-- DEBUG: {debugInfo} -->
														<label style="display: flex; align-items: center; gap: 8px; font-size: 16px; cursor: pointer; padding: 8px 12px; border-radius: 5px; transition: background 0.3s;">
															<input
																type="checkbox"
																checked={isChecked}
																onchange={(e) => {
																	console.log(`Toggle anexo ${file.id_anexo}, radio ${idRj}, checked: ${e.target.checked}`);
																	console.log('file.radios antes:', file.radios);
																	toggleFileRadioExisting(index, idRj, e.target.checked);
																	console.log('file.radios depois:', file.radios);
																}}
																style="width: 18px; height: 18px; cursor: pointer;"
															/>
															{getNomeById(idRj)}
														</label>
													{/each}
												</div>
											</div>
										{/if}
									</div>
								</div>
							{/each}
							{#each anexos as file, index}
								<div class="selected-file">
									<div class="file-header">
										<a href={file.url} target="_blank" class="file-link">
											<i class="fas fa-file-alt"></i> {file.name}
										</a>
										<button
											type="button"
											class="btn-delete"
											onclick={() => removeFileUploaded(index)}
										>
											<i class="fa fa-trash"></i>
										</button>
									</div>

									<div class="file-body">
										{#if file.type?.startsWith('image/')}
											<div class="file-preview">
												<img
													src={file.url}
													alt={file.name}
													class="file-preview-image"
												/>
											</div>
										{/if}

										{#if selectedradiosjornais.length > 0}
											<div class="mt-2">
												<label class="form-label" style="font-size: 16px; font-weight: 600; margin-bottom: 15px;">RÁDIOS/JORNAIS:</label>
												<div style="display: flex; flex-wrap: wrap; gap: 20px; padding: 10px 0;">
													{#each selectedradiosjornais as idRj}
														<label style="display: flex; align-items: center; gap: 8px; font-size: 16px; cursor: pointer; padding: 8px 12px; border-radius: 5px; transition: background 0.3s;">
															<input
																type="checkbox"
																checked={Array.isArray(file.radios) && file.radios.map(r => String(r)).includes(String(idRj))}
																onchange={(e) => {
																	let radios = Array.isArray(file.radios) ? file.radios.map(r => String(r)) : [];
																	const idRjStr = String(idRj);
																	if (e.target.checked) {
																		if (!radios.includes(idRjStr)) {
																			radios = [...radios, idRjStr];
																		}
																	} else {
																		radios = radios.filter((id) => String(id) !== idRjStr);
																	}
																	file.radios = radios;
																	anexos = [...anexos];
																}}
																style="width: 18px; height: 18px; cursor: pointer;"
															/>
															{getNomeById(idRj)}
														</label>
													{/each}
												</div>
											</div>
										{/if}
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
<SuccesModal show={showModal} message={modalMessage} onClose={handleCloseModal} />
