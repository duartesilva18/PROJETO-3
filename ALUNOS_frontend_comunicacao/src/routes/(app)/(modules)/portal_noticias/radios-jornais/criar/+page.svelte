<script>
import { goto } from '$app/navigation';
import Breadcrum from '$lib/components/Breadcrum.svelte';
import { onMount } from 'svelte';
import SuccesModal from '../../rede-social/detalhe/[id]/modals/SuccesModal.svelte';
import { locale, t } from '$lib/translations/translations';
import { configurePortalSidebar } from '../../sidebar.config.js';
import { sidebarOptions } from '$lib/runes/sidebarOptions.rune.svelte';
import { get } from 'svelte/store';

	



const translate = (key) => get(t)(key);
configurePortalSidebar('criarMedia', translate);


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
    id_projeto: 0,
	});

	let showModal = $state(false);

	let modalMessage = $state('');



	/**
	 * Array para armazenar as redes sociais.
	 * @type {Array}
	 */
	let redesSociais = $state([]);

 


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
 let projetos = $state([]);

  // ids selecionados no select de rádios/jornais
  let selectedradiosjornais = $state([]);

  // mapa id_radio_jornal -> texto personalizado (frontend apenas)
  let radioTexts = $state({});



	/**
	 * Função executada quando o componente é montado.
	 * Esta função é assíncrona para permitir a busca de dados.
	 */
	onMount(async () => {
		redesSociais = await fetch('/ep/portal_noticias/redes').then((d) => d.json());

		categorias = await fetch('/ep/portal_noticias/categorias').then((d) => d.json());

		tags = await fetch('/ep/portal_noticias/tags').then((d) => d.json());

		projetos = await fetch('/ep/portal_noticias/getJson').then((d) => d.json());

		radio_jornal = await fetch('/ep/portal_noticias/radio_jornal').then((d) => d.json());

		// usar jQuery global apenas se select2 estiver carregado; caso contrário fica como select normal
		const jq = globalThis.$ ?? globalThis.jQuery;
		if (jq?.fn?.select2) {
			jq('#unidinvestigacao').select2();
			jq('#unidinvestigacao').on('change', selecionarRadioJornal);
			jq('.select2-single-multi').select2({
				theme: 'bootstrap',
				language: locale.get() == 'pt' ? 'pt' : 'en'
			});
		}
	});

  

	/**
	 * @type {any[]}
	 */
	let anexos = $state([]);

	/**
	 * Retorna as redes sociais selecionadas.
	 * @returns {string[]}
	 */

  let id_categoria_especial = '';

   // Estado para o input do novo e-mail
   let newEmail = '';

   async function getidcategoriaoutro() {
      return categorias.find(cat => cat.nome === "Outros").id_categoria; // Retorna o ID caso precise usá-lo
  }



  function selecionarRadioJornal(event) {
    const selectEl = event?.target;
    if (!selectEl) return;

    // tenta primeiro pela API normal do <select>
    if (selectEl.selectedOptions && selectEl.selectedOptions.length >= 0) {
      const options = selectEl.selectedOptions;
      selectedradiosjornais = Array.from(options).map((opt) => opt.value);
    } else {
      // fallback caso esteja a ser controlado pelo select2 / jQuery
      const jq = globalThis.$ ?? globalThis.jQuery;
      if (jq) {
        selectedradiosjornais = jq(selectEl).val() || [];
      }
    }

    // Se houver apenas um rádio selecionado, anexar automaticamente todas as imagens a ele
    if (selectedradiosjornais.length === 1) {
      const singleRadioId = selectedradiosjornais[0];
      anexos = anexos.map(file => {
        if (!file.radios.includes(singleRadioId)) {
          return { ...file, radios: [...file.radios, singleRadioId] };
        }
        return file;
      });
    }

    console.log('selectedradiosjornais:', selectedradiosjornais);
  }

  function removerRadioJornal(id) {
    selectedradiosjornais = selectedradiosjornais.filter((rj) => rj !== id);
    // limpar também eventual texto custom associado
    if (radioTexts[id]) {
      const clone = { ...radioTexts };
      delete clone[id];
      radioTexts = clone;
    }
    console.log('selectedradiosjornais:', selectedradiosjornais);
  }

  function getNomeById(id) {
    const item = radio_jornal.find(rj => rj.id_radio_jornal === id);
    return item ? item.nome : "Desconhecido";
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

  // Guarda, na nova tabela, as imagens associadas a cada rádio/jornal (pode haver várias).
  // anexosComRadios = array com .radios por ficheiro; pn_anexos = anexos da notícia criada (com id_anexo real na BD).
  async function saveMidiaAnexos(idNoticiaCreated, anexosComRadios, pn_anexos) {
    const mapa = {};

    const anexosList = Array.isArray(anexosComRadios) ? anexosComRadios : [];
    const anexosCriados = Array.isArray(pn_anexos) ? pn_anexos : [];

    anexosList.forEach((file, idx) => {
      const radios = Array.isArray(file.radios) ? file.radios.map(r => String(r)) : [];
      const anexoCriado = anexosCriados[idx];
      const id_anexo = anexoCriado?.id_anexo;

      if (!id_anexo || radios.length === 0) return;

      radios.forEach((idRadio) => {
        const idRadioStr = String(idRadio);
        if (!mapa[idRadioStr]) mapa[idRadioStr] = [];
        mapa[idRadioStr].push(String(id_anexo));
      });
    });

    const items = Object.entries(mapa).map(([id_radio_jornal, ids_anexos]) => ({
      id_radio_jornal: String(id_radio_jornal),
      // @ts-ignore
      ids_anexos: Array.isArray(ids_anexos) ? ids_anexos.map(id => String(id)) : []
    }));

    const payload = {
      id_noticia: String(idNoticiaCreated),
      items
    };

    console.log('Payload para guardar anexos:', payload);

    try {
      const res = await fetch('/ep/portal_noticias/midia_anexos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errText = await res.text();
        console.error('Erro ao guardar anexos por rádio/jornal:', res.status, errText);
      } else {
        const result = await res.json();
        console.log('Anexos guardados com sucesso:', result);
      }
    } catch (e) {
      console.error('Erro ao guardar anexos por rádio/jornal (ignorado):', e);
    }
  }

  function setRadioTexto(id, value) {
    const trimmed = value ?? '';
    radioTexts = { ...radioTexts, [id]: trimmed };
  }

  function toggleFileRadio(fileIndex, radioId, checked) {
    const file = anexos[fileIndex];
    let radios = Array.isArray(file.radios) ? file.radios : [];

    if (checked) {
      if (!radios.includes(radioId)) {
        radios = [...radios, radioId];
      }
    } else {
      radios = radios.filter((id) => id !== radioId);
    }

    file.radios = radios;
    anexos = [...anexos];
  }


	function getSelectedSocialNetworks() {
		return redesSociais.filter((redeSocial) => redeSocial.checked);
	}

	function getSelectedSocialNetworksNames() {
		return redesSociais
			.filter((redeSocial) => redeSocial.checked)
			.map((redeSocial) => redeSocial.nome);
	}

	function listarNoticias() {
		goto('/portal_noticias/radios-jornais/lista');
	}

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


	/**
	 * @param {{ preventDefault: () => void; }} e
	 */
	 async function onHandleSubmit(event) {
    event.preventDefault();

    // Grab your existing fields
    const titulo = formField.titulo;
    const descricao = formField.descricao;
    const estado = 'Pendente';
    const id_categoria_FK = categorias.find(cat => cat.nome === "Outros").id_categoria;;
    const texto_facebook = formField.texto_facebook;
    const texto_instagram = formField.texto_instagram;
    const texto_twitter = formField.texto_twitter;
    const texto_linkedin = formField.texto_linkedin;
    const texto_tiktok = formField.texto_tiktok;
    const id_projeto =  parseInt(formField.id_projeto, 10);
    const redesSociais = getSelectedSocialNetworksNames();
    const selectedSocialNetworks = getSelectedSocialNetworks();
    const tags = selectedTags;
    console.log("id_categoria_FK:", id_categoria_FK);

    if (isNaN(id_projeto)) {
      console.log("ID do projeto inválido. Selecione um projeto válido. 1");
   
    }
    if (id_projeto <= 0) {
      console.log("ID do projeto inválido. Selecione um projeto válido. 2");
   
    }
    
    try {
      // 2) FIRST: Generate codeRede for each file
      anexos.forEach((file) => {
        file.codeRede = getCodeRedeSocial(file.redes);
        const code = '00000'; 
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
      if (redesSociais.includes('Facebook') && texto_facebook !== '') {
        formData.append('texto_facebook', texto_facebook);
      }
      if (redesSociais.includes('Instagram') && texto_instagram !== '') {
        formData.append('texto_instagram', texto_instagram);
      }
      if (redesSociais.includes('Twitter') && texto_twitter !== '') {
        formData.append('texto_twitter', texto_twitter);
      }
      if (redesSociais.includes('LinkedIn') && texto_linkedin !== '') {
        formData.append('texto_linkedin', texto_linkedin);
      }
      if (redesSociais.includes('Tiktok') && texto_tiktok !== '') {
        formData.append('texto_tiktok', texto_tiktok);
      }

      console.log(typeof id_projeto, id_projeto); // Deve exibir: "number" e um valor inteiro

      formData.append('id_projeto', id_projeto);
			formData.append('id_categoria_FK', id_categoria_FK);
      formData.append('redesSociais', JSON.stringify(selectedSocialNetworks));
      formData.append('tags', JSON.stringify(tags));

      // Include info about the files that were uploaded
      formData.append('anexos', JSON.stringify(anexosUploaded));

      const emailsString = selectedradiosjornais.join(',');
      console.log('Emails enviados:', emailsString, 'Tipo:', typeof emailsString);

      formData.append('emails', emailsString);
      formData.append('tipo', 1);


      // 5) POST noticia data
      const resposta = await fetch('/ep/portal_noticias/dados', {
        method: 'POST',
        body: formData
      });

      const noticiaCriada = await resposta.json();
      const id_noticia = noticiaCriada?.id_noticia;
      const pn_anexos = noticiaCriada?.pn_anexos ?? [];

      if (!id_noticia) {
        console.error('Não foi possível obter a id_noticia para personalizações de mídia.');
      } else {
        await saveMidiaPersonalizada(id_noticia);
        // Usar os id_anexo da notícia criada (existem em pn_anexos), na mesma ordem que anexos
        await saveMidiaAnexos(id_noticia, anexos, pn_anexos);
      }

      // 6) Clean up & success message
      anexos = [];
      toastr.success(
        'Adicionou uma noticia com sucesso!',
        'SUCESSO!',
        { timeOut: 5000, progressBar: true }
      );
      // depois de criar mídia, voltar para a listagem de mídia
      goto('/portal_noticias/radios-jornais/lista');

    } catch (error) {
      toastr.error(
        'Ocorreu um erro por favor contacte os SI',
        'ERRO!',
        { timeOut: 5000, progressBar: true }
      );
      // em caso de erro, mantemos no módulo de mídia
      goto('/portal_noticias/radios-jornais/lista');
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

        const fileUrl = URL.createObjectURL(file);
        file.url = fileUrl;

        // Inicializa arrays para redes sociais e rádios/jornais ligados a este ficheiro
        file.redes = [];
        file.radios = [];

        // Se houver apenas um rádio selecionado, anexar automaticamente este ficheiro a ele
        if (selectedradiosjornais.length === 1) {
          file.radios = [selectedradiosjornais[0]];
        }

        anexos.push(file);
    }

    if (rejectedNames.length > 0 && typeof toastr !== 'undefined') {
      toastr.warning(
        `Alguns ficheiros foram ignorados por não serem suportados (apenas JPG, PNG, GIF, MP4): ${rejectedNames.join(', ')}`,
        'Formato não suportado',
        { timeOut: 5000, progressBar: true }
      );
    }

    // Atualizar a variável filescopy com os arquivos adicionados
    filescopy = [...anexos]; // Faz uma cópia dos arquivos válidos
}


	




	

	function handleCloseModal() {
		showModal = false;
	}


 


	/**
	 * Adiciona uma nova tag à lista de tags.
	 */


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
	@import "../../portal_noticias.css";


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

/* ✅ Ensures the scrollbar does not overlap the email boxes */
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

.file-preview-thumb {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 4px;
  margin-right: 10px;
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
          <label for="tituloInput">{$t('divPublicar.Assunto')}:<span style="color: red;">*</span></label>
          <input
            class="form-control"
            type="text"
            id="tituloInput"
            name="tituloInput"
            placeholder={$t('divPublicar.inAssunto')}
            required
            bind:value={formField.titulo}
            oninput={(e) => formField.titulo = e.target.value.slice(0, 100)}
          />
          <p class="char-counter">{formField.titulo.length} / 100</p>
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
          ></textarea>
          <p class="char-counter">{formField.descricao.length} / 10000</p>
        </div>




        <div class="form-group">
          <label>{$t('divPublicar.Email')}:<span style="color: red;">*</span></label>
          <select 
            name="investigation_unit_id" 
            id="unidinvestigacao" 
            class="form-control select2-single-multi" 
            multiple
            onchange={selecionarRadioJornal}
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
          <label for="fileInput">{$t('divPublicar.Anexos')}:</label>
          <div class="file-upload-wrapper">
            <input
              class="file-input-hidden"
              type="file"
              id="fileInput"
              name="fileInput"
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

          {#if anexos.length > 0}
            <div class="selected-files mt-3">
              <label for="fileInput" class="form-label">{$t('divPublicar.sAnexos')}:</label>

              {#each anexos as file, index (file)}
                <div class="selected-file">
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

                  <div class="file-body">
                    {#if file.type && file.type.startsWith('image/')}
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
                                checked={Array.isArray(file.radios) && file.radios.includes(idRj)}
                                onchange={(e) => toggleFileRadio(index, idRj, e.target.checked)}
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
          {/if}

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
              {$t('divPublicar.btSubmeter')}
            </button>
          </div>


        </div>
      </div>
      
      <div class="col-md-6 form-group" >
        
       
       
        
        
        
      </div>
    </div>
  </form>
</div>
 


<SuccesModal show={showModal} message={modalMessage} onClose={handleCloseModal} />

