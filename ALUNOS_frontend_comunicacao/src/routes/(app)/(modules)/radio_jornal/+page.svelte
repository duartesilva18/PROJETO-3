<script>
	import { run, preventDefault } from 'svelte/legacy';
	import { modalStore } from '$lib/stores/modalStore';

	import Breadcrum from '$lib/components/Breadcrum.svelte';
	import { locale, t } from '$lib/translations/translations';
import RemoveModal from './RemoverMediaModal.svelte';
import { configurePortalSidebar } from '../portal_noticias/sidebar.config.js';

	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	import { get } from 'svelte/store';
	import * as dt_pt from '$lib/translations/pt/datatables.json';
	import * as dt_en from '$lib/translations/en/datatables.json';

import diacriticless from 'diacriticless';
import { writable, get } from 'svelte/store';

const translate = (key) => get(t)(key);
configurePortalSidebar('radios', translate);
	let newRadio = $state({id_radio_jornal: '', nome: '', email: '' }); // Objeto inicial
	let aviso =  $state("");

	/**
	 * Função para lidar com o fechamento do popup.
	 * @param {any} data - Os dados retornados quando o popup é fechado.
	 */
	// @ts-ignore
	// @ts-ignore


	
	/**
	 * @type {RemoveModal}
	 */
	 let removeModalBind = $state();

	/**
	 * Variável para controlar a visibilidade do loading.
	 * @type {boolean}
	 */
	let loadingData = $state(true);

	/**
	 * Objeto para armazenar os dados do filtro.
	 * @type {Object}
	 */
	let formFilter = $state({
		titulo: '',
		categoria: '',
		data: '',
		estado: ''
	});

	/**
	 * Array para armazenar os dados das notícias.
	 * @type {Array}
	 */
	let noticiasData = [];


	/**
	 * Array para armazenar os dados das notícias.
	 * @type {Array}
	 */
	 let radiosData = [];

	/**
	 * Array para armazenar as categorias das notícias.
	 * @type {Array}
	 */
	let categorias = $state([]);

	/**
	 * Array para armazenar os dados originais das notícias.
	 * @type {Array}
	 */
	let originalNoticiasData = [];

	/**
	 * Array para armazenar os dados originais das notícias.
	 * @type {Array}
	 */
	 let originalradiosjornaisData = [];

	/**
	 * Objeto para armazenar a notícia selecionada.
	 * @type {Object}
	 */
	let noticiaSelecionada = {};

	/**
	 * Objeto para armazenar a notícia selecionada.
	 * @type {Object}
	 */
	 let radioselecao = $state({});

	/**
	 * Array para armazenar as notícias filtradas.
	 * Inicialmente, é igual a noticiasData.
	 * @type {Array}
	 */
	let filteredNoticias = noticiasData;

	/**
	 * Array para armazenar as notícias filtradas.
	 * Inicialmente, é igual a noticiasData.
	 * @type {Array}
	 */
	 let filteredradios = radiosData;



	 let showModal = writable(false); 


	 function updateNome(event) {
		newRadio.nome = event.target.value; // ✅ Keeps newRadio updated
		newRadio.update(r => ({ ...r, nome: event.target.value })); // ✅ Updates the writable store
	}

	function updateEmail(event) {
		newRadio.email = event.target.value; // ✅ Keeps newRadio updated
		newRadio.update(r => ({ ...r, email: event.target.value })); // ✅ Updates the writable store
	}




	function openModal() {
		showModal.set(true); 
		showModal.subscribe(value => console.log("Modal Opened:", value)); 
		
       //console.log("Radio selecionado:", radioselecao);
	}

	function closeModal() {
		showModal.set(false); 
		newRadio = {id_radio_jornal: '', nome: '', email: '' }; // Resetando o objeto ao fechar
		radioselecao = [];
		aviso = "";
		
		refreshTable();
		
	}

	


	/**
	 * Array para armazenar as notícias por página.
	 * @param {Object} noticia
	 */
	function handleSelect(noticia) {
		noticiaSelecionada = noticia;
		goto(`/portal_noticias/editar/${noticia.id_noticia}`);
	}

	/**
	 * Função para excluir uma notícia.
	 * @param {Object} noticia - A notícia a ser excluída.
	 */

	/**
	 * Função para atualizar as notícias.
	 */
	async function updateMedia() {
		originalradiosjornaisData = await fetch('/ep/portal_noticias/radio_jornal').then((d) => d.json());
	
		
		filteredradios = originalradiosjornaisData;
		radiosData = originalradiosjornaisData;
		refreshTable();
	}

	/**
	 * Função para exibir a notícia completa.
	 * @param {Object} noticia - A notícia a ser exibida.
	 */
	function showFullNews(noticia) {
		goto(`/portal_noticias/noticia/${noticia.id_noticia}`);
	}

	/**
	 * @param {{ preventDefault: () => void; }} e
	 */

	// se o POST foi bem sucedido, atualize a página
	function onHandleSubmit(e) {
		e.preventDefault();
		pesquisarNoticia();
		refreshTable();
		return;
	}



	
	async function editarRadio() {
 

    const formData = new FormData();
    formData.append('nome', newRadio.nome);
    formData.append('email', newRadio.email);

    const updateRadioJornal = {
        nome: String(newRadio.nome),
        email: String(newRadio.email)
    };

    try {
        // ✅ Send update request to server
        const response = await fetch(`/ep/portal_noticias/radio_jornal?id_radio_jornal=${newRadio.id_radio_jornal}`, {
            method: 'PUT',
            body: JSON.stringify(updateRadioJornal)
        });

        if (!response.ok) {
            console.error('Não foi possível editar o rádio/jornal:', response.statusText);
            return;
        }

        // ✅ Find and update the radio inside filteredradios
        const index = filteredradios.findIndex(r => r.id_radio_jornal === newRadio.id_radio_jornal);
        if (index !== -1) {
            filteredradios[index] = { ...newRadio }; // ✅ Update in-memory data
        }

        // ✅ Update radiosData as well
        const indexRadiosData = radiosData.findIndex(r => r.id_radio_jornal === newRadio.id_radio_jornal);
        if (indexRadiosData !== -1) {
            radiosData[indexRadiosData] = { ...newRadio };
        }

        // ✅ Instantly update the DataTable
        refreshTable(); // Ensures the table updates immediately

        // ✅ Close modal
        closeModal();
        console.log("Rádio/Jornal editado com sucesso");

    } catch (error) {
        console.error('Erro na requisição:', error);
    }
}


async function adicionarRadio() {

    const formData = new FormData();
    formData.append('nome', newRadio.nome);
    formData.append('email', newRadio.email);



	
	try {
		const response = await fetch('/ep/portal_noticias/radio_jornal', {
			method: 'POST',
			body: formData
		});

		if (!response.ok) {
			console.error('Não foi possível adicionar novo rádio/jornal:', response.statusText);
			return;
		}

		// ✅ Get the inserted radio's data from the response
		const addedRadio = await response.json();
		console.log("Novo rádio/jornal adicionado:", addedRadio);

		// ✅ Assign an updated list to force reactivity
		//filteredradios = [...filteredradios, addedRadio];
		//radiosData = [...radiosData, addedRadio];

		console.log("Filtered radios after adding:", filteredradios);

		// ✅ Immediately refresh the table UI
		refreshTable();

		// ✅ Small delay ensures updates before modal closes
		setTimeout(() => {
			updateMedia();
			closeModal();
		}, 50);

		console.log("Novo rádio/jornal adicionado com sucesso");
	} catch (error) {
		console.error('Erro na requisição:', error);
	}
 
}




	/**
	 * Função para formatar a data.
	 * @param {string} dateString - A data a ser formatada.
	 * @returns {string} - A data formatada.
	 */
	function formatDate(dateString) {
		const options = { year: 'numeric', month: 'numeric', day: 'numeric' };
		return new Date(dateString).toLocaleDateString('pt-PT', options);
	}

	/**
	 * Função para pesuqisar aplicando filtros.
	 * @param {string} str - A string a ser modificada.
	 * @returns {string} - A string sem acentos.
	 */
	function pesquisarNoticia() {
		console.log("sim estou aqui")
		// @ts-ignore
		const keyword = diacriticless(formFilter.titulo.toLowerCase().trim());

		// Primeiro, filtre as notícias por palavra-chave
		let filteredByKeyword = radiosData;
		if (keyword !== '') {
			filteredByKeyword = radiosData.filter((radio) => {
				const nomeWithoutAccents = diacriticless(radio.nome.toLowerCase());
				const emailWithoutAccents = diacriticless(radio.email.toLowerCase());

				return nomeWithoutAccents.includes(keyword) || emailWithoutAccents.includes(keyword);
			});
		}

		// Em seguida, filtre as notícias por categoria, data e estado
		filteredradios = filteredByKeyword.filter((radio) => {
			let dataCriacao = new Date(radio.data_criacao).toISOString().split('T')[0];
			return (
			
				// @ts-ignore
				(formFilter.data === '' || dataCriacao === formFilter.data)
				// @ts-ignore
			);
		});
	}

	/**
	 * Mudar para a pagina de criar noticia.
	 */
	function createNoticia() {
		goto('portal_noticias/criar');
	}

	/**
	 * Variável para armazenar a referência ao objeto da tabela.
	 * Esta variável é usada para interagir com a API da tabela.
	 * @type {Object}
	 */
	let table = null;

	/**
	 * Variável para armazenar a referência a um elemento genérico.
	 * O uso específico desta variável pode variar.
	 * @type {HTMLElement}
	 */
	let el = $state();

	/**
	 * Array de objetos que define as colunas da tabela.
	 * Cada objeto contém o título da coluna e, opcionalmente, outras propriedades.
	 * @type {Array}
	 */
	let table_columns = [
		{ title: $t('divNoticias.Nome'), width: '20%' },
		{
			title: $t('divNoticias.Email'),
			width: '20%',
			// @ts-ignore
			render: function (data, type, row, meta) {
				return row[1];
			}
		},
		{ title: $t('divNoticias.dataCriacao'), width: '1%', orderable: false },
		{
			title: '', // No title for edit button column
			orderable: false, // Prevent sorting on this column
			width: '1%',
			render: function (data, type, row, meta) {
				
					return `<div class="d-flex justify-content-center">
                <button
                    data-rowid="${row[4]}"
                    data-rowindex="${meta.row}"
                    class="btn btn-sm btn-outline-primary table_button_edit_projeto_class"
                >
                    <i class="fa fa-edit"></i>
                </button>
            </div>`;
				
			}
		},
		{
			title: '', // No title for delete button column
			orderable: false, // Prevent sorting on this column
			width: '1%',
			render: function (data, type, row, meta) {
				
					return `<div class="d-flex justify-content-center">
                <button
                    data-rowid="${row[4]}"
                    data-rowindex="${meta.row}"
                    class="btn btn-sm btn-outline-danger table_button_delete_projeto_class"
                >
                    <i class="fa fa-trash"></i>
                </button>
            </div>`;
				
				
			}
		}
	];

	/**
	 * Função executada quando o componente é montado.
	 * Esta função é assíncrona para permitir a busca de dados.
	 */
	onMount(async () => {
		
		if (removeModalBind) {
			console.log('RemoveModal está carregado');
		} else {
			console.error('RemoveModal não foi carregado corretamente');
		}

		const [originalradiosjornaisData] = await Promise.all([
			//fetchCategorias(),
	
			fetch('/ep/portal_noticias/radio_jornal').then((d) => d.json()),
		]);
		debugger;
	
		filteredradios = originalradiosjornaisData;
		radiosData = originalradiosjornaisData;



		// @ts-ignore
		table = jQuery(el).DataTable({
			dom: 'Bfrtip',
			columns: table_columns,
			responsive: true,
			buttons: ['pageLength', 'pdf', 'csv', 'excel', 'copy', 'colvis'],
			pageLength: 25,
			/* 'order': [[3, 'desc']],
            'columnDefs': [
                {'visible': true, 'targets': [0, 2]},
                {'orderable': false, targets: []}
            ], */
			drawCallback: function () {
				jQuery('.datatable-on').parent().removeClass('container-fluid');
				jQuery('#modulepage_content').fadeIn(600);
				setTimeout(function () {
					// @ts-ignore
					table.columns.adjust().responsive.recalc();
				}, 100);
			},
			language: locale.get() == 'pt' ? dt_pt : dt_en
		});

		jQuery('#search-input').on('keyup', function () {
			// @ts-ignore
			table.search(this.value).draw();
		});
		loadingData = false;
		refreshTable();
	});

	async function onDeleteRow() {
		const radio_jornal_reponse = await getData();

		filteredradios = radio_jornal_reponse;
		radiosData = radio_jornal_reponse;

		updateMedia();


	}

	function trimTrailingSpaces(str) {
		return str.replace(/\s+$/, '');
	}
		

	function verificarRegistro(nome, email, id) {
	
		nome = trimTrailingSpaces(nome);
		email = trimTrailingSpaces(email);

		for (const item of radiosData) {

			if(!id || id.trim() === '' || item.id_radio_jornal != id){
				if (item.nome === nome) {
					return { codigo: 1, mensagem: "Esse nome já se encontra registado" };
				}
				if (item.email === email) {
					return { codigo: 2, mensagem: "Esse email já se encontra registado" };
				}
			}
			
		}
		return { codigo: 0, mensagem: "" };
	}


	function refreshTable() {
		// @ts-ignore
		table.clear();
		filteredradios.forEach((radio, index) => {
			const rowData = [
				`<div class="clickable-cell" data-rowindex="${index}">${radio.nome}</div>`,
				radio.email,
				formatDate(radio.data_criacao)
			];
			// @ts-ignore
			// @ts-ignore
			table.row.add(rowData).node();

			jQuery(el).on('click', '.clickable-cell', function () {
				const rowIndex = jQuery(this).data('rowindex');
				const noticia = filteredNoticias[rowIndex];
				showFullNews(noticia);
			});

			// @ts-ignore
			// @ts-ignore
			jQuery(document).on('click', '.table_button_details_projeto_class', function (E) {
				const rowIndex = jQuery(this).data('rowindex');
				const noticia = filteredNoticias[rowIndex];
				showFullNews(noticia);
			});

			// @ts-ignore
			// @ts-ignore
			jQuery(document).on('click', '.table_button_edit_projeto_class', function (E) {
				const rowIndex = jQuery(this).data('rowindex');


				filteredradios = [...filteredradios]; // Ensures the array reference updates

				const radio = filteredradios[rowIndex]; 

				// ✅ Ensure radioselecao and newRadio are fully updated
				radioselecao = { ...radio };
				newRadio = { ...radio };


				// ✅ Slight delay to let Svelte recognize the changes
				setTimeout(() => {
					openModal();
				}, 10);
			});


			// @ts-ignore
			// @ts-ignore
			jQuery(document).on('click', '.table_button_delete_projeto_class', function (E) {
				const rowIndex = jQuery(this).data('rowindex');
				const radio = filteredradios[rowIndex];
				const modal = get(modalStore);
				newRadio = { ...radio };
				if (modal && modal.onOpenModal) {
					modal.onOpenModal(newRadio);
				}
			});
		});
		// @ts-ignore
		table.draw();
		loadingData = false;
		
	}

	async function getData() {
		const [originalradiosjornaisData] = await Promise.all([
			//fetchCategorias(),
		
			fetch('/ep/portal_noticias/radio_jornal').then((d) => d.json())
		]);
		debugger;

		filteredradios = originalradiosjornaisData;
		radiosData = originalradiosjornaisData;

	}

	/**
	 * Função reativa executada sempre que a variável table é alterada.
	 * Esta função limpa a tabela e adiciona as notícias filtradas.
	 * Cada notícia é adicionada como uma linha na tabela.
	 * Além disso, vários manipuladores de eventos são adicionados para lidar com cliques em diferentes partes da tabela.
	 */
	// @ts-ignore
	// @ts-ignore
	run(() => {
		if (table) {
			refreshTable();
		}
	});

	let items_breadcrum = $derived([
		{
			icon_class: 'fas fa-plus',
			url: '#',
			designacao: $t('divPublicar.midia'),
			function: openModal
		}
	]);
	
</script>

<Breadcrum modulo={1} objeto={1} menu_items={items_breadcrum} />

<div class="tableNews">
	<div class="row filter">
		<form onsubmit={preventDefault(onHandleSubmit)} class="form-group d-flex align-items-end w-100">
			<div class="col-md-2">
				<label for="dataInput" style="font-size: small;">{$t('divNoticias.data')}</label>
				<input type="date" id="dataInput" bind:value={formFilter.data} class="form-control" />
			</div>
	
			<div class="col-md-1 d-flex align-items-end">
				<button type="submit" class="btn btn-primary btn-sm btn-block get-source">
					<i class="fas fa-search"></i>
				</button>
			</div>
		</form>
	</div>
	
	

    <div>
        <div id="conteudo_carregado">
            <div hidden={loadingData} class="row" id="modulepage_content" style="display: block">
                <div class="table-responsive">
                    <table bind:this={el}
                        class="datatable-on table-striped hover datatable table-sm nowrap no-footer dtr-inline">
                    </table>
                </div>
            </div>
        </div>

        {#if loadingData}
            <div id="loading_area">
                <div id="loading-on">
                    <span class="dot-on">.</span>
                    <span class="dot-on2">.</span>
                    <span class="dot-on3">.</span>
                </div>
            </div>
        {/if}
    </div>

    {#if $showModal}
        <div class="modal-page">
            <div class="modal-content">
                
                <div class="modal-header">
					<h3 class="modal-title">
						<strong>
							{radioselecao && Object.keys(radioselecao).length > 0 ? 'Editar Rádio/Jornal' : 'Adicionar Rádio/Jornal'}
						</strong>
					</h3>
					<button class="close-button" onclick={closeModal}>&times;</button>
				</div>
			
				<div class="modal-body">
				
					<label><strong>Nome:<span class="required">*</span></strong></label>
					<input type="text" bind:value={newRadio.nome} maxlength="100" oninput={updateNome} 	class="form-control"/>
					<p class="char-counter {newRadio.nome.length >= 90 ? 'warning' : ''}">
						{newRadio.nome.length}/100 caracteres
					</p>
					
					<label><strong>Email:<span class="required">*</span></strong></label>
					<input type="email" bind:value={newRadio.email} maxlength="255" oninput={updateEmail} class="form-control"/>
					<p class="char-counter {newRadio.email.length >= 230 ? 'warning' : ''}">
						{newRadio.email.length}/255 caracteres
					</p>
					
				
					
				</div>

				<div class="modal-footer">
					<p style="color: red; text-align: left; margin: 0;">{aviso}</p>
				</div>
				<div class="modal-buttons">
					<button 
						class="btn btn-secondary"
						onclick={closeModal}
					>
						Fechar
					</button>
					<button 
						class="btn btn-primary" 
						onclick={() => {
							const resultado = verificarRegistro(newRadio.nome, newRadio.email, newRadio.id_radio_jornal);
							aviso = resultado.mensagem;
							if (resultado.codigo === 0) {
								radioselecao && Object.keys(radioselecao).length > 0 ? editarRadio() : adicionarRadio();
							}
						}}
					>
						{radioselecao && Object.keys(radioselecao).length > 0 ? 'Editar' : 'Adicionar'}
					</button>
				</div>
				
            </div>
        </div>
    {/if}
</div>
<RemoveModal bind:this={removeModalBind} on:refreshData={onDeleteRow} />










<style>
	@import './radio_jornal.css';
</style>