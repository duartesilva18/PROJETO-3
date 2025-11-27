<script>
	import { goto } from '$app/navigation';
import Breadcrum from '$lib/components/Breadcrum.svelte';
import { onMount } from 'svelte';
import SuccesModal from '../noticia/[id]/modals/SuccesModal.svelte';
import { locale, t } from "$lib/translations/translations";
import { configurePortalSidebar } from '../sidebar.config.js';
import { get } from 'svelte/store';
  import "select2";

	



const translate = (key) => get(t)(key);
configurePortalSidebar('criarMedia', translate);

const breadcrumModuleName = 'Gestão de Notícias';
const breadcrumPageName = 'Criar Media';


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


    let selectedradiosjornais = [];

  /**
	 * @type {Array}
	 */
   let selectedradiosjornaisnomes = $state([]);



	/**
	 * Função executada quando o componente é montado.
	 * Esta função é assíncrona para permitir a busca de dados.
	 */
	onMount(async () => {
		redesSociais = await fetch('/ep/portal_noticias/redes').then(d => d.json())

		categorias = await fetch('/ep/portal_noticias/categorias').then(d => d.json())

		tags = await fetch('/ep/portal_noticias/tags').then(d => d.json())
	
    pedidos = await fetch('/ep/portal_noticias/getJson').then(d => d.json())

    radio_jornal = await fetch('/ep/portal_noticias/radio_jornal').then(d => d.json())

    jQuery("#unidinvestigacao").select2(); // Usa globalThis.$ para evitar erro
    jQuery("#unidinvestigacao").on("change", selecionarRadioJornal);

    jQuery(".select2-single-multi").select2({ theme: "bootstrap", language: (locale.get() == "pt" ? "pt" : "en") })

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
    console.log("Select2 - Função chamada!");
    selectedradiosjornais = globalThis.$(event.target).val() || [];
    console.log("selectedradiosjornais:", selectedradiosjornais);
  }

  function removerRadioJornal(id) {
    selectedradiosjornais = selectedradiosjornais.filter(rj => rj !== id);
    console.log("selectedradiosjornais:", selectedradiosjornais);
  }

  function getNomeById(id) {
    const item = radio_jornal.find(rj => rj.id_radio_jornal === id);
    return item ? item.nome : "Desconhecido";
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
    const id_categoria_FK = categorias.find(cat => cat.nome === "Outros").id_categoria;;
    const texto_facebook = formField.texto_facebook;
    const texto_instagram = formField.texto_instagram;
    const texto_twitter = formField.texto_twitter;
    const texto_linkedin = formField.texto_linkedin;
    const texto_tiktok = formField.texto_tiktok;
    const id_pedido =  parseInt(formField.id_pedido, 10);
    const redesSociais = getSelectedSocialNetworksNames();
    const selectedSocialNetworks = getSelectedSocialNetworks();
    const tags = selectedTags;
    console.log("id_categoria_FK:", id_categoria_FK);

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

      console.log(typeof id_pedido, id_pedido); // Deve exibir: "number" e um valor inteiro

      formData.append('id_pedido', id_pedido);
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
      const id_noticia = await fetch('/ep/portal_noticias/dados', {
        method: 'POST',
        body: formData
      });

      if (!id_noticia) {
        console.error('Não foi possível obter a id_noticia para enviar os anexos.');
      }

      // 6) Clean up & success message
      anexos = [];
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
    const files = event.target.files;
    anexos = [...anexos];
    console.log('aqui handleFileChange');
    for (let i = 0; i < files.length; i++) {
        const fileUrl = URL.createObjectURL(files[i]);
        files[i].url = fileUrl;

        // STEP 1-A: Initialize an empty array for per-file networks
        files[i].redes = []; // <--- This is new
     

        anexos.push(files[i]);
    }

    // Atualizar a variável filescopy com os arquivos adicionados
    filescopy = [...files]; // Faz uma cópia dos arquivos

    // Exibir no console o estado de filescopy
    console.log('filescopy atualizado:', filescopy);
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
	@import "../portal_noticias.css";


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

</style>

<Breadcrum
	modulo={breadcrumModuleName}
	objeto={breadcrumPageName}
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
          >
            {#each radio_jornal as rj}
              <option value={rj.id_radio_jornal}>{rj.nome}</option>
            {/each}
          </select>
        </div>
        
        


				



        <div class="form-group">
          <label>{$t('divPublicar.Pedidos')}:<span style="color: red;">*</span></label>
          <select bind:value={formField.id_pedido} class="form-control" required>
            <option value="">{$t('divPublicar.selPedido')}</option>
            {#each pedidos as pedido}
              <option value={pedido.id}>{pedido.assunto}</option>
            {/each}
          </select>
        </div>

       



        <div class="form-group">
          <label for="fileInput">{$t('divPublicar.Anexos')}:</label>
          <input
            class="form-control file-input"
            type="file"
            id="fileInput"
            name="fileInput"
            placeholder={$t('divPublicar.inAnexos')}  
            onchange={(event) => handleFileChange(event)}
            multiple
          />
          {#if anexos.length > 0}
          <div class="selected-files mt-3" style="max-width: 600px; margin: 0 auto;">
            <label for="fileInput" class="form-label">{$t('divPublicar.sAnexos')}:</label>

            {#each anexos as file, index (file)}
              <div
                  class="selected-file d-flex justify-content-between align-items-center mt-2 p-2 border rounded"
                  id="sFile-{index}"
                  style="background-color: #f8f9fa; padding: 10px; border: 1px solid #ddd; border-radius: 5px;"
                >
                  <!-- Existing link / remove button -->
                  <a href={file.url} target="_blank" class="file-link d-flex align-items-center text-decoration-none">
                    <i class="fas fa-file-alt me-2 text-primary"
                      style="margin-right: 10px; font-size: 1.2em;"></i>
                    {file.name}
                  </a>
                  <button
                    type="button"
                    onclick={() => removeFile(index)}
                    class="btn btn-sm btn-outline-danger"
                    style="display: flex; align-items: center; justify-content: center;"
                  >
                    <i class="fa fa-trash"></i>
                  </button>

                  


                  <!-- New: Checkboxes for each network -->
                  
                </div>

                

                <!-- Optional: Show selected networks for the file -->
                {#if file.redes.length > 0}
                  <p style="margin-left: 40px;">
                    <strong>Selected networks:</strong> {file.redes.join(', ')}
                  </p>
                {/if}
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

