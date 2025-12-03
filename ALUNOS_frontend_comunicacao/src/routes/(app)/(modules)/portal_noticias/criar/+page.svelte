<script>
	import { goto } from '$app/navigation';
import Breadcrum from '$lib/components/Breadcrum.svelte';
import { locale, t } from '$lib/translations/translations';
import { onMount } from 'svelte';
import SuccesModal from '../noticia/[id]/modals/SuccesModal.svelte';
import { configurePortalSidebar } from '../sidebar.config.js';
import { sidebarOptions } from '$lib/runes/sidebarOptions.rune.svelte';
import { get } from 'svelte/store';


	



const translate = (key) => get(t)(key);
configurePortalSidebar('criar', translate);
const TRANSLATION_FALLBACK = 'Loading translation...';

/**
 * @param {string} key
 * @param {string} fallbackPt
 * @param {string} [fallbackEn]
 */
function tf(key, fallbackPt, fallbackEn = fallbackPt) {
	const value = translate(key);
	if (!value || value === TRANSLATION_FALLBACK) {
		const currentLocale = get(locale);
		return currentLocale === 'en' ? fallbackEn : fallbackPt;
	}
	return value;
}

const NETWORK_FIELD_MAP = {
	instagram: 'texto_instagram',
	facebook: 'texto_facebook',
	twitter: 'texto_twitter',
	linkedin: 'texto_linkedin',
	tiktok: 'texto_tiktok'
};

	/**
	 * Objeto para armazenar os valores dos campos do formulário.
	 * @type {Object}
	 */
	let formField = $state({
		titulo: '',
		descricao: '',
		texto_rs: '',
		id_categoria_FK: '',
		texto_facebook: '',
		texto_instagram: '',
		texto_twitter: '',
		texto_linkedin: '',
    texto_tiktok: '',
    id_pedido: 0,
	});

	let showModal = $state(false);

	let modalMessage = $state('');


  

	/**
	 * Array para armazenar as redes sociais.
	 * @type {Array}
	 */
let redesSociais = $state([]);
const DEFAULT_TIMEZONE = 'Europe/Lisbon';
let schedulingForm = $state(
	/** @type {{ enabled: boolean; entries: Record<string, { horario: string; fuso_horario: string }> }} */ ({
		enabled: false,
		entries: {}
	})
);
let fileInputRef;
let isDragActive = $state(false);

 


/**
	 * Array para armazenar as redes sociais.
	 * @type {Array}
	 */
   let filescopy = $state([]);


  /**
	 * Array para armazenar as redes sociais.
	 * @type {Array}
	 */
	let codes = $state([]);

  /**
	 * Array para armazenar as redes sociais.
	 * @type {Array}
	 */
	let filesNames = $state([]);


	/**
	 * Array para armazenar as categorias.
	 * @type {Array}
	 */
	let categorias = $state([]);

  /**
	 * Array para armazenar as categorias.
	 * @type {Array}
	 */
	let radio_jornal = $state([]);


	/**
	 * Array para armazenar as tags.
	 * @type {Array}
	 */
	let tags = $state([]);

	/**
	 * String para armazenar a nova tag.
	 * @type {string}
	 */
	let newTag = $state('');

	/**
	 * Array para armazenar as tags selecionadas.
	 * @type {Array}
	 */
let selectedTags = $state([]);

  /**
	 * @type {any[]}
	 */
	let pedidos = $state([]);


 /**
	 * @type {Array}
	 */
	let selectedradiosjornais = $state([]);

  
	/**
	 * Função executada quando o componente é montado.
	 * Esta função é assíncrona para permitir a busca de dados.
	 */
	onMount(async () => {
		redesSociais = await fetch('/ep/portal_noticias/redes')
			.then((d) => d.json())
			.then((lista) =>
				(lista || []).map((rede) => ({
					...rede,
					checked: false,
					customize: false
				}))
			);

		categorias = await fetch('/ep/portal_noticias/categorias').then(d => d.json())

		tags = await fetch('/ep/portal_noticias/tags')
			.then((d) => d.json())
			.then((lista) => (Array.isArray(lista) ? lista : []));
	
    pedidos = await fetch('/ep/portal_noticias/getJson').then(d => d.json())

    radio_jornal = await fetch('/ep/portal_noticias/radio_jornal').then(d => d.json())


  });

  

	/**
	 * @type {any[]}
	 */
	let anexos = $state([]);

	/**
	 * Retorna as redes sociais selecionadas.
	 * @returns {string[]}
	 */

  
   // Estado para o input do novo e-mail
   let newEmail = '';

  function selecionarRadioJornal(event) {
    const selectedId = event.target.value;

    if (!selectedradiosjornais.includes(selectedId)) {
      selectedradiosjornais = [...selectedradiosjornais, selectedId]; // Adiciona ao array
    } else {
      selectedradiosjornais = selectedradiosjornais.filter(id => id !== selectedId); // Remove se já estiver
    }

  }

  function removerRadioJornal(id) {
    selectedradiosjornais = selectedradiosjornais.filter(rj => rj !== id);
  }

  function getNomeById(id) {
    const item = radio_jornal.find(rj => rj.id_radio_jornal === id);
    return item ? item.nome : "Desconhecido";
  }

// Função para adicionar o e-mail ao array
  function adicionarEmail() {
    if (newEmail.trim() !== '' && !selectedradiosjornais.includes(newEmail)) {
      selectedradiosjornais = [...selectedradiosjornais, newEmail.trim()];
      newEmail = ''; // Limpa o campo de entrada

    }
  }

  // Função para remover um e-mail do array
  function removerEmail(email) {
    selectedradiosjornais = selectedradiosjornais.filter(e => e !== email);

  }


	function getSelectedSocialNetworks() {
		return redesSociais.filter((redeSocial) => redeSocial.checked);
	}

	function getSelectedSocialNetworksNames() {
		return redesSociais
			.filter((redeSocial) => redeSocial.checked)
			.map((redeSocial) => redeSocial.nome);
	}

	function getNetworkFieldKey(networkName) {
		if (!networkName) return null;
		const normalized = networkName.toLowerCase();
		return NETWORK_FIELD_MAP[normalized] ?? null;
	}

	function getTextForNetwork(networkName) {
		const fieldKey = getNetworkFieldKey(networkName);
		const rede = redesSociais.find((r) => r.nome === networkName);
		const customValue = fieldKey ? (formField[fieldKey] ?? '').trim() : '';

		if (rede?.customize && customValue) {
			return customValue;
		}

		return formField.descricao;
	}

function toggleScheduling() {
	schedulingForm = {
		...schedulingForm,
		enabled: !schedulingForm.enabled
	};
	if (schedulingForm.enabled) {
		syncSchedulingEntries();
	} else {
		schedulingForm.entries = {};
	}
}

function syncSchedulingEntries() {
	if (!schedulingForm.enabled) return;

	const selected = getSelectedSocialNetworks();
	/** @type {Record<string, { horario: string; fuso_horario: string }>} */
	const nextEntries = {};

	selected.forEach((rede) => {
		const existing = schedulingForm.entries[rede.id_rede_social];
		nextEntries[rede.id_rede_social] = {
			horario: existing?.horario ?? '',
			fuso_horario: existing?.fuso_horario ?? DEFAULT_TIMEZONE
		};
	});

	schedulingForm.entries = nextEntries;
}

/**
 * @param {string} redeId
 * @param {'horario' | 'fuso_horario'} field
 * @param {string} value
 */
function handleScheduleFieldChange(redeId, field, value) {
	const current = schedulingForm.entries[redeId] ?? {
		horario: '',
		fuso_horario: DEFAULT_TIMEZONE
	};

	schedulingForm.entries = {
		...schedulingForm.entries,
		[redeId]: {
			horario: field === 'horario' ? value : current.horario,
			fuso_horario: field === 'fuso_horario' ? value : current.fuso_horario
		}
	};
}

	function toggleRedeSelection(redeSocial) {
		if (redeSocial.nome === 'LinkedIn' || redeSocial.nome === 'Tiktok') {
			alert(`${redeSocial.nome} fora de serviço`);
			return;
		}

		redeSocial.checked = !redeSocial.checked;

		if (!redeSocial.checked) {
			redeSocial.customize = false;
			const fieldKey = getNetworkFieldKey(redeSocial.nome);
			if (fieldKey) {
				formField[fieldKey] = '';
			}
		}

	if (schedulingForm.enabled) {
		syncSchedulingEntries();
	}
	}

	function toggleRedeCustomization(redeSocial) {
		if (!redeSocial.checked) return;
		redeSocial.customize = !redeSocial.customize;
		const fieldKey = getNetworkFieldKey(redeSocial.nome);
		if (!redeSocial.customize && fieldKey) {
			formField[fieldKey] = '';
		}
		if (redeSocial.customize && fieldKey && !formField[fieldKey]) {
			formField[fieldKey] = formField.descricao;
		}
	}

	function listarNoticias() {
		goto('/noticias');
	}

	function getCodeRedeSocial(redes) {
		// We’re hardcoding the order: 0=>Instagram, 1=>Facebook, 2=>Twitter, 3=>LinkedIn, 4=>Tiktok
		const code = ['0', '0', '0', '0', '0'];

		if (redes.includes('Instagram')) code[0] = '1';
		if (redes.includes('Facebook'))  code[1] = '1';
		if (redes.includes('Twitter'))   code[2] = '1';
		if (redes.includes('LinkedIn'))  code[3] = '1';
    if (redes.includes('Tiktok'))    code[4] = '1';
    
		return code.join('');
	
  }


	/**
	 * @param {{ preventDefault: () => void; }} e
	 */
	 async function onHandleSubmit(event) {
    event.preventDefault();

    // Grab your existing fields
    const titulo = formField.titulo;
    const descricao = formField.descricao;
    const estado = 'Pendente';
    const id_categoria_FK = formField.id_categoria_FK;
    const id_pedido =  formField.id_pedido;

    const redesSelecionadasNomes = getSelectedSocialNetworksNames();
    const selectedSocialNetworks = getSelectedSocialNetworks();
    const tags = selectedTags;
    const schedulingPayload = schedulingForm.enabled
      ? selectedSocialNetworks
          .map((rede) => {
            const entry = schedulingForm.entries[rede.id_rede_social];
            if (!entry?.horario) {
              return null;
            }

            const parsedDate = new Date(entry.horario);
            if (Number.isNaN(parsedDate.getTime())) {
              return null;
            }

            return {
              id_rede_social: rede.id_rede_social,
              horario_agendado: parsedDate.toISOString(),
              fuso_horario: entry.fuso_horario || DEFAULT_TIMEZONE,
            };
          })
          .filter((item) => item !== null)
      : [];

    if (schedulingForm.enabled && schedulingPayload.length === 0) {
      toastr.warning(
        'Ativou o agendamento mas não preencheu nenhuma data/hora válida.',
        'Agendamento incompleto',
        { timeOut: 4000, progressBar: true }
      );
      return;
    }
    if (isNaN(id_pedido)) {
      console.log("ID do pedido inválido. Selecione um pedido válido. 1");
   
    }
    if (id_pedido <= 0) {
      console.log("ID do pedido inválido. Selecione um pedido válido. 2");
   
    }
    
    try {
      // 2) FIRST: Generate codeRede for each file
      anexos.forEach((file) => {
        file.codeRede = getCodeRedeSocial(file.redes);
        const code = getCodeRedeSocial(file.redes); 
        codes.push(code);

      });
      
      // 3) Upload the files (POST /ep/portal_noticias/anexos)
      let anexosUploaded = [];
      if (anexos.length > 0) {
        const formDataAnexos = new FormData();

        // a) Append the raw file objects
        anexos.forEach((anexo, index) => {
          formDataAnexos.append('files', anexo);
          
        });
        formDataAnexos.append('codes', JSON.stringify(codes));
        // b) Build an array of { originalName, codeRede } for the server
        const fileInfo = anexos.map((file) => ({
          originalName: file.name,
          codeRede: file.codeRede
        }));
        // Add it as a JSON field
        formDataAnexos.append('fileInfo', JSON.stringify(fileInfo));

        const options = {
          method: 'POST',
          body: formDataAnexos,
          headers: {
            'Accept': 'application/json'
          }
        };
        anexosUploaded = await fetch('/ep/portal_noticias/anexos', options).then(d => d.json());
      }

      // 4) Now build a second FormData for the noticia
      const formData = new FormData();
      formData.append('texto', descricao);
      formData.append('titulo', titulo);
      formData.append('estado', estado);

      redesSelecionadasNomes.forEach((networkName) => {
        const fieldKey = getNetworkFieldKey(networkName);
        if (!fieldKey) return;
        formData.append(fieldKey, getTextForNetwork(networkName));
      });

  
      formData.append('id_pedido',  id_pedido);
			formData.append('id_categoria_FK', id_categoria_FK);
      formData.append('redesSociais', JSON.stringify(selectedSocialNetworks));
      formData.append('tags', JSON.stringify(tags));

      // Include info about the files that were uploaded
      formData.append('anexos', JSON.stringify(anexosUploaded));

      const emailsString = selectedradiosjornais.join(',');

      formData.append('emails', emailsString);
      formData.append('tipo', 0);


      // 5) POST noticia data
      const noticiaResponse = await fetch('/ep/portal_noticias/dados', {
        method: 'POST',
        body: formData
      });

      if (!noticiaResponse.ok) {
        const errorBody = await noticiaResponse.json().catch(() => ({}));
        throw new Error(errorBody?.message ?? 'Não foi possível criar a notícia.');
      }

      const noticiaResult = await noticiaResponse.json();
      const noticiaId = noticiaResult?.id_noticia;

      if (schedulingPayload.length > 0) {
        if (!noticiaId) {
          toastr.warning(
            'Notícia criada, mas não foi possível associar o agendamento.',
            'Aviso',
            { timeOut: 4000, progressBar: true }
          );
        } else {
          const scheduleResponse = await fetch('/ep/portal_noticias/redes/agendamentos', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              id_noticia: noticiaId,
              agendamentos: schedulingPayload
            })
          });

          if (!scheduleResponse.ok) {
            toastr.warning(
              'A notícia foi criada, mas o agendamento não foi guardado.',
              'Aviso',
              { timeOut: 4000, progressBar: true }
            );
          }
        }
      }

      // 6) Clean up & success message
      anexos = [];
      schedulingForm = { enabled: false, entries: {} };
      toastr.success(
        'Adicionou uma noticia com sucesso!',
        'SUCESSO!',
        { timeOut: 5000, progressBar: true }
      );
      goto('/portal_noticias');

    } catch (error) {
      toastr.error(
        'Ocorreu um erro por favor contacte os SI',
        'ERRO!',
        { timeOut: 5000, progressBar: true }
      );
      goto('/portal_noticias');
    }
  }
	/**
	 * @param {{ target: { files: any; }; }} event
	 */

	/*function handleFileChange(event) {
		const files = event.target.files;
		anexos = [...anexos];

		for (let i = 0; i < files.length; i++) {
			const fileUrl = URL.createObjectURL(files[i]);
			files[i].url = fileUrl;
			anexos.push(files[i]);
		}
	}*/

  function handleFileChange(event) {
    addFilesFromList(event.target.files);
    event.target.value = '';
  }

	function addFilesFromList(fileList) {
		if (!fileList || fileList.length === 0) return;

		const incoming = Array.from(fileList).map((file) => {
			return Object.assign(file, {
				url: URL.createObjectURL(file),
				redes: file.redes ?? []
			});
		});

		anexos = [...anexos, ...incoming];
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



  function toggleFileNetwork(file, networkName) {
    if (file.redes.includes(networkName)) {
      file.redes = file.redes.filter(n => n !== networkName);
    } else {
      file.redes.push(networkName);
    }
  }


	function handleSelectTag(tag) {
		const index = selectedTags.findIndex((selectedTag) => selectedTag.id_tag === tag.id_tag);
		if (index === -1) {
			selectedTags = [...selectedTags, tag];
		} else {
			selectedTags.splice(index, 1);
			selectedTags = [...selectedTags];
		}
	}

	function handleCloseModal() {
		showModal = false;
	}


  function checkifcanornot(file, networkName) {
    // Extrair o tipo do arquivo após o último ponto
    const typefile = file.name.split('.').pop().toLowerCase();

    let aux = '';
    // Exibir o tipo do arquivo no console

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

  function selecionarPedido(event) {
    formField.id_pedido = event.target.value; // Atualiza o formField com o ID selecionado
  }

	function handleFileChangeForNetwork(event, redeSocial) {
    	const files = event.target.files;
    

    	formField[`files_${redeSocial.nome.toLowerCase()}`] = files;
	}

	/**
	 * Adiciona uma nova tag à lista de tags.
	 */
	async function handleAddTag() {
		if (newTag.trim() !== '') {
			// Verificar se a nova tag já existe na lista atual de tags
			const existingTag = tags.find((tag) => tag.nome === newTag);
			if (existingTag) {
				// Se a tag já existe, verificar seu estado
				if (existingTag.status === 'Ativo') {
				} else {
					await fetch(`/ep/portal_noticias/tags/activate?id_tag=${existingTag.id_tag}`)
					existingTag.status = 'Ativo';
					tags = [...tags];
				}
			} else {
				// Se a tag não existir, adicione-a normalmente
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

	/**
	 * Remove uma tag da lista de tags.
	 * @param {{ id_tag: number; }} tagToRemove
	 */
	async function handleRemoveTag(tagToRemove) {
		const removed = await fetch(`/ep/portal_noticias/tags?id_tag=${tagToRemove.id_tag}`,{method : 'DELETE'}).then(d => d.json()); // Remover a tag
		if (removed.removido) {
			// Atualizar a lista de tags removendo a tag com o ID especificado
			tags = tags.filter((tag) => tag.id_tag !== tagToRemove.id_tag);
			// Certifique-se de reatribuir a lista de tags para que o Svelte detecte a mudança
			tags = [...tags];
		}
	}

	/**
	 * Remove um arquivo da lista de anexos.
	 * @param {number} index
	 */
	function removeFile(index) {
		anexos.splice(index, 1);
		anexos = [...anexos];
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
	@import "../portal_noticias.css";
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
  flex-wrap: wrap;
  gap: 10%;
  padding-top: 8px;
  justify-content: center;
}


/*titulo part*/
.char-counter {
  font-size: 12px;
  color: rgb(82, 82, 82);
  margin-top: 5px;
  text-align: right;
}



/*texto part*/
.texto-input {
  height: 200px; /* Doubled size */
  resize: vertical; /* Allows manual resizing */
}

	.char-counter {
		font-size: 12px;
		color: gray;
		margin-bottom: 5px;
		text-align: right;
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
		font-size: 18px;
		font-weight: 600;
		margin-bottom: 4px;
		color: #6c7a88;
	}

	.file-drop-zone-subtitle {
		font-size: 14px;
		color: #9aa6b2;
	}

	.module-actions {
		display: flex;
		justify-content: flex-end;
		margin-top: 12px;
	}

	.schedule-section {
		border: 1px solid #dde3ea;
		border-radius: 8px;
		padding: 16px;
		background: #fff;
	}

	.schedule-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}

	.schedule-title {
		font-weight: 600;
		color: #29363d;
	}

	.schedule-hint {
		font-size: 12px;
		color: #7fa0b5;
		margin: 4px 0 0;
	}

	.schedule-grid {
		margin-top: 16px;
		display: flex;
		flex-direction: column;
		gap: 12px;
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
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: 8px;
	}

	.form-card {
		background: #fff;
		border: 1px solid #dce3ea;
		border-radius: 6px;
		box-shadow: 0 8px 20px rgba(15, 23, 42, 0.04);
	}

	.form-card-header {
		background: #f4f5f7;
		padding: 12px 20px;
		font-size: 18px;
		font-weight: 600;
		color: #1f2a37;
		border-bottom: 1px solid #dce3ea;
		line-height: 1.2;
	}

	.form-card-body {
		padding: 24px 24px 32px;
	}

	:global(.form-container .form-group label) {
		color: #000;
	}
</style>

<Breadcrum
	modulo={sidebarOptions.currentModule}
	objeto={sidebarOptions.currentObject}
	menu_items={items_breadcrum}
/>
<div class="container-fluid mt-4">
	<div class="form-card">
		<div class="form-card-header">Notícias: Nova notícia</div>
		<div class="form-card-body">
  <form onsubmit={onHandleSubmit} class="form-container">
    <div class="row">
      <div class="col-md-6">
        <div class="form-group">
          <label for="tituloInput">{$t('divPublicar.Titulo')}:<span style="color: red;">*</span></label>
          <input
            class="form-control"
            type="text"
            id="tituloInput"
            name="tituloInput"
            placeholder={$t('divPublicar.inTitle')}
            required
            bind:value={formField.titulo}
            oninput={(e) => formField.titulo = e.target.value.slice(0, 100)}
            maxlength="100"
          />
          <!-- Character Counter -->
          <p class={`char-counter ${formField.titulo.length >= 90 ? 'warning' : ''}`}>
            {formField.titulo.length} / 100
          </p>          
        </div>
        <div class="form-group">
          <label for="areatext">{$t('divPublicar.Texto')}:<span style="color: red;">*</span></label>
            <textarea
              class="form-control texto-input"
              id="areatext"
              name="textInput"
              placeholder={$t('divPublicar.inText')}
              required
              bind:value={formField.descricao}
              oninput={(e) => formField.descricao = e.target.value.slice(0, 10000)}
              maxlength="10000"
            ></textarea>
            <!-- Character Counter (Above the Textarea) -->
            <p class={`char-counter ${formField.descricao.length >= 9800 ? 'warning' : ''}`}>
              {formField.descricao.length} / 10000
            </p>
          </div>

        <div class="form-group">
          <label>{$t('divPublicar.Categorias')}:<span style="color: red;">*</span></label>
          <select bind:value={formField.id_categoria_FK} class="form-control" required>
            <option value="">{$t('divPublicar.selCategoria')}</option>
            {#each categorias.filter((categoria) => categoria.status === 'Ativo') as categoria}
              <option value={categoria.id_categoria}>{categoria.nome}</option>
            {/each}
          </select>
        </div>



        <div class="form-group">
          <label>{$t('divPublicar.Pedidos')}:<span style="color: red;">*</span></label>
          <select onchange={selecionarPedido} class="form-control" required>
            <option value="" disabled selected>{$t('divPublicar.selPedido')}</option>
            {#each pedidos as pedido}
              <option value={pedido.id}>{pedido.assunto}</option>
            {/each}
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
              bind:this={fileInputRef}
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
              aria-label={tf(
               'divPublicar.dropTitle',
                'Arraste e solte o ficheiro aqui',
                'Drag and drop files here'
              )}
            >
              <i class="fas fa-upload file-drop-zone-icon" aria-hidden="true"></i>
              <p class="file-drop-zone-title">
                {tf(
                  'divPublicar.dropTitle',
                  'Arraste e solte o ficheiro aqui',
                  'Drag and drop files here'
                )}
              </p>
              <span class="file-drop-zone-subtitle">
                {tf(
                  'divPublicar.dropSubtitle',
                  'ou clique para procurar o ficheiro',
                  'or click to browse files'
                )}
              </span>
            </div>
          </div>
  {#if anexos.length > 0}
    <div class="selected-files mt-3">
      <label for="fileInput" class="form-label">{$t('divPublicar.sAnexos')}:</label>

      {#each anexos as file, index}
        <div class="selected-file">
          <!-- Top Bar: File Name & Delete Button -->
          <div class="file-header">
            <a href={file.url} target="_blank" class="file-link">
              <i class="fas fa-file-alt"></i> {file.name}
            </a>
            <button
              type="button"
              class="btn-delete"
              onclick={() => removeFile(index)}
            >
              <i class="fa fa-trash"></i>
            </button>
          </div>

          <!-- Social Networks (Now Below) -->
          <div class="file-networks">
            {#each ['Instagram', 'Facebook', 'Twitter', 'LinkedIn', 'Tiktok'] as network}
              <label>
                <input
                  type="checkbox"
                  checked={file.redes.includes(network)}
                  onchange={(event) => {
                    if (network === "LinkedIn" || network === "Tiktok") {
                      alert(`${network} fora de serviço`);
                      event.target.checked = false; // Garante que não fica selecionado
                      return;
                    }
              
                    const [canToggle, message] = checkifcanornot(file, network);
                    if (canToggle) {
                      toggleFileNetwork(file, network);
                    } else {
                      event.target.checked = file.redes.includes(network); // Mantém o estado correto
                      alert(message);
                    }
                  }}
                />
                {network}
              </label>
            {/each}
          </div>
        </div>
      {/each}
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
                    onchange={() => toggleRedeSelection(redeSocial)}
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
                      bind:value={formField[`texto_${redeSocial.nome.toLowerCase()}`]}
                    ></textarea>
                  </div>
                {/if}
              </div>
            </div>
          {/each}
        </div>

        <div class="schedule-section mt-4">
          <div class="schedule-header">
            <div>
              <label class="schedule-title">Agendamento</label>
              <p class="schedule-hint">
                Ative para definir dia e hora específicos por rede social. Caso contrário, a publicação é imediata.
              </p>
            </div>
            <label class="toggle-switch">
              <input
                type="checkbox"
                checked={schedulingForm.enabled}
                onchange={toggleScheduling}
              />
              <span class="slider round"></span>
            </label>
          </div>

          {#if schedulingForm.enabled}
            {#if getSelectedSocialNetworks().length === 0}
              <p class="text-muted mb-0 small">
                Seleccione pelo menos uma rede social para poder definir o agendamento.
              </p>
            {:else}
              <div class="schedule-grid">
                {#each getSelectedSocialNetworks() as rede}
                  <div class="schedule-row">
                    <div class="schedule-label">
                      <span>{rede.nome}</span>
                    </div>
                    <div class="schedule-inputs">
                      <input
                        type="datetime-local"
                        class="form-control"
                        value={schedulingForm.entries[rede.id_rede_social]?.horario ?? ''}
                        oninput={(event) =>
                          handleScheduleFieldChange(rede.id_rede_social, 'horario', event.currentTarget.value)}
                      />
                      <select
                        class="form-control"
                        value={schedulingForm.entries[rede.id_rede_social]?.fuso_horario ?? DEFAULT_TIMEZONE}
                        onchange={(event) =>
                          handleScheduleFieldChange(rede.id_rede_social, 'fuso_horario', event.currentTarget.value)}
                      >
                        <option value="Europe/Lisbon">Europe/Lisbon</option>
                        <option value="UTC">UTC</option>
                      </select>
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          {/if}
        </div>

        <div class="form-group tags-input" style="margin-top: 20px;">
          <label>{$t('divPublicar.tagsPara')}</label>
          <div class="tags-selector">
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
                        onclick={() => handleSelectTag(tag)}
                      >
                        {tag.nome}
                      </span>
                    </div>
                  {/each}
                </div>
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
                  class="btn btn-sm btn-outline-primary btn-module-secondary-operation"
                  onclick={handleAddTag}
                >
                  <span class="icon mr-1">+</span>
                  {$t('divPublicar.addTag')}
                </button>
          </div>
        </div>

        <div class="col-md-12 text-md-right module-actions">
          <button
            type="submit"
            class="btn btn-sm btn-primary btn-module-save"
            aria-label={$t('divPublicar.btSubmeter')}
          >
            <i class="fas fa-paper-plane mr-1"></i>
            {$t('divPublicar.btSubmeter')}
          </button>
        </div>
      </div>
    </div>
  </form>
		</div>
	</div>
</div>
 


<SuccesModal show={showModal} message={modalMessage} onClose={handleCloseModal} />