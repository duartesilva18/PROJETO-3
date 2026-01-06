import { sidebarOptions } from '$lib/runes/sidebarOptions.rune.svelte';
import { sidebarRune } from '$lib/runes/sidebar.rune.svelte';
import { pageIds } from '$lib/js/pageIds.conf.js';

// Dois blocos principais: Gestão de Notícias e Gestão de Mídia
const NAV_SECTIONS = [
	{
		labelKey: 'sidebarPortal.areaNoticias',
		items: [
			{ key: 'dashboard', path: '/portal_noticias', labelKey: 'sidebarPortal.dashboard' },
			{ key: 'categorias', path: '/portal_noticias/categorias', labelKey: 'sidebarPortal.categorias' },
			{ key: 'tags', path: '/portal_noticias/tags', labelKey: 'sidebarPortal.tags' },
			{
				key: 'agendamentos',
				path: '/portal_noticias/agendamentos',
				labelKey: 'sidebarPortal.agendamentos'
			}
		]
	},
	{
		labelKey: 'sidebarPortal.areaMidia',
		items: [
			{
				key: 'midiaList',
				path: '/portal_noticias/midia',
				labelKey: 'sidebarPortal.midiaList'
			},
			{
				key: 'criarMedia',
				path: '/portal_noticias/criarmedia',
				labelKey: 'sidebarPortal.criarMedia'
			},
			{
				key: 'radios',
				path: '/radio_jornal',
				labelKey: 'sidebarPortal.radios'
			}
		]
	},
	{
		labelKey: 'sidebarPortal.areaEstatisticas',
		items: [
			{
				key: 'estatisticas',
				path: '/portal_noticias/estatisticas',
				labelKey: 'sidebarPortal.estatisticas'
			}
		]
	}
];

const ALL_ITEMS = NAV_SECTIONS.flatMap((section) => section.items);

/**
 * @param {'dashboard' | 'categorias' | 'tags' | 'agendamentos' | 'criar' | 'criarMedia' | 'radios' | 'midiaList' | 'estatisticas'} activeKey
 * @param {(key: string) => string} translate
 */
export function configurePortalSidebar(activeKey, translate) {
	if (typeof translate !== 'function' || !pageIds?.portalNoticias) {
		return;
	}

	const moduleName = translate('sidebarPortal.module');

	const current =
		ALL_ITEMS.find((nav) => nav.key === activeKey) ??
		ALL_ITEMS.find((nav) => nav.key === 'dashboard') ??
		ALL_ITEMS[0];

	sidebarOptions.currentModuleId = pageIds.portalNoticias.moduleId;
	sidebarOptions.currentObjectId = pageIds.portalNoticias[current.key].objectId;
	sidebarOptions.currentModule = moduleName;
	sidebarOptions.currentObject = translate(current.labelKey);

	sidebarRune.modules = [
		{
			ativo: true,
			descricao: moduleName,
			id_modulo: pageIds.portalNoticias.moduleId,
			link: '/portal_noticias'
		}
	];

	sidebarRune.areas = NAV_SECTIONS.map((section, index) => {
		const objetos = section.items.map((item) => ({
			id_objeto: pageIds.portalNoticias[item.key].objectId,
			descricao: translate(item.labelKey),
			ficheiro: item.path,
			ativo: true,
			item_menu: true
		}));

		return {
			id_area: pageIds.portalNoticias.areaId + index, // ID único para cada área
			designacao: translate(section.labelKey),
			ativo: true,
			objetos
		};
	});
}

