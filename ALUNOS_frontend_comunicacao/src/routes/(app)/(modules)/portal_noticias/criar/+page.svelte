<script>
	import { goto } from '$app/navigation';
import Breadcrum from '$lib/components/Breadcrum.svelte';
import { t } from '$lib/translations/translations';
import { onMount } from 'svelte';
import SuccesModal from '../noticia/[id]/modals/SuccesModal.svelte';
import { configurePortalSidebar } from '../sidebar.config.js';
import { sidebarOptions } from '$lib/runes/sidebarOptions.rune.svelte';
import { get } from 'svelte/store';


	



const translate = (key) => get(t)(key);
configurePortalSidebar('criar', translate);

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


 /**
	 * @type {Array}
	 */
	let selectedradiosjornais = $state([]);

  
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
    const texto_facebook = formField.texto_facebook;
    const texto_instagram = formField.texto_instagram;
    const texto_twitter = formField.texto_twitter;
    const texto_linkedin = formField.texto_linkedin;
    const texto_tiktok = formField.texto_tiktok;
    const id_pedido =  formField.id_pedido;

    const redesSociais = getSelectedSocialNetworksNames();
    const selectedSocialNetworks = getSelectedSocialNetworks();
    const tags = selectedTags;
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

  function updateSelectedNetworks() {
    // Reset all networks to unchecked
    redesSociais.forEach(network => network.checked = false);

    // Check which networks are selected in uploaded files
    anexos.forEach(file => {
      file.redes.forEach(networkName => {
        let network = redesSociais.find(n => n.nome === networkName);
        if (network) {
          network.checked = true;
        }
      });
    });
  }


  function handleFileChange(event) {
    const files = event.target.files;
    anexos = [...anexos];

    for (let i = 0; i < files.length; i++) {
      const fileUrl = URL.createObjectURL(files[i]);
      files[i].url = fileUrl;
      files[i].redes = []; // Initialize empty social network selection
      anexos.push(files[i]);
    }

    // Call the function to update selected networks
    updateSelectedNetworks();
  }



  function toggleFileNetwork(file, networkName) {
    if (file.redes.includes(networkName)) {
      file.redes = file.redes.filter(n => n !== networkName);
    } else {
      file.redes.push(networkName);
    }

    // Update the selected networks based on file changes
    updateSelectedNetworks();


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
  margin-bottom: 5px; /* Moves counter closer to input */
  text-align: right; /* Aligns counter to the right */
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
      
      <div class="col-md-6 form-group" >
        
        <label for="Rs">{$t('divPublicar.rs')}:</label>

        <div class="social-media-container" style="display: flex; flex-wrap: wrap;">
          {#each redesSociais as redeSocial}
            <div class="social-media-button m-2">
              <button
                class="btn btn-outline-primary"
                class:active={redeSocial.checked}
                type="button"
                onclick={() => {
                  if (redeSocial.nome === "LinkedIn" || redeSocial.nome === "Tiktok") {
                    alert(`${redeSocial.nome} fora de serviço`);
                  } else {
                    redeSocial.checked = !redeSocial.checked;
                  }
                }}
              >
                {redeSocial.nome}
              </button>
            </div>
          {/each}
        </div>
        <div class="form-group">
          {#if redesSociais.some((redeSocial) => redeSocial.checked)}
            <div class="form-group tags-input" style="margin-top: 20px;">
              {#each redesSociais as redeSocial}
                {#if redeSocial.checked}
                  <div class="form-group">
                    <label for={`texto-${redeSocial.id}`}>
                      {$t('divPublicar.textoPara')}
                      {redeSocial.nome}:
                    </label>
                    <textarea
                      class="form-control"
                      id={`texto-${redeSocial.id}`}
                      bind:value={formField[`texto_${redeSocial.nome.toLowerCase()}`]}
                    ></textarea>
                  </div>
                {/if}
              {/each}
              <label for="tagsInput">
                {#if redesSociais.filter((redeSocial) => redeSocial.checked)}
                  {$t('divPublicar.textoPara')}
                  {#each redesSociais.filter((redeSocial) => redeSocial.checked) as redeSocial}
                    {redeSocial.nome}
                    {#if redesSociais.filter((redeSocial) => redeSocial.checked).length > 1}
                      {#if redeSocial !== redesSociais.filter((redeSocial) => redeSocial.checked)[0]}
                        {#if redeSocial !== redesSociais.filter((redeSocial) => redeSocial.checked)[redesSociais.filter((redeSocial) => redeSocial.checked).length - 1]}
                          {', '}
                        {/if}
                      {/if}
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
                      onclick={() => handleSelectTag(tag)}
                    >
                      {tag.nome}
                    </span>
                    <span
                      role="button"
                      aria-label={$t('divPublicar.removerTag')}
                      tabindex="0"
                      class="remove-icon"
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
        <div class="col-md-12 text-md-right">
          <button
            type="submit"
            class="pn-submit-button"
            aria-label={$t('divPublicar.btSubmeter')}
          >
            <span class="pn-submit-icon" aria-hidden="true">
              <i class="fas fa-paper-plane"></i>
            </span>
            <span>{$t('divPublicar.btSubmeter')}</span>
          </button>
        </div>
      </div>
    </div>
  </form>
</div>
 


<SuccesModal show={showModal} message={modalMessage} onClose={handleCloseModal} />