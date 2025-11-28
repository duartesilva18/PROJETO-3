import { sidebarOptions } from '$lib/runes/sidebarOptions.rune.svelte';
import { sidebarRune } from '$lib/runes/sidebar.rune.svelte';
import { pageIds } from '$lib/js/pageIds.conf.js';

const NAV_ITEMS = [
	{ key: 'dashboard', path: '/portal_noticias', labelKey: 'sidebarPortal.dashboard' },
	{ key: 'categorias', path: '/portal_noticias/categorias', labelKey: 'sidebarPortal.categorias' },
	{ key: 'criar', path: '/portal_noticias/criar', labelKey: 'sidebarPortal.criar' },
	{ key: 'criarMedia', path: '/portal_noticias/criarmedia', labelKey: 'sidebarPortal.criarMedia' },
	{ key: 'radios', path: '/radio_jornal', labelKey: 'sidebarPortal.radios' }
];

/**
 * @param {'dashboard' | 'categorias' | 'criar' | 'criarMedia' | 'radios'} activeKey
 * @param {(key: string) => string} translate
 */
export function configurePortalSidebar(activeKey, translate) {
	if (typeof translate !== 'function' || !pageIds?.portalNoticias) {
		return;
	}

	const moduleName = translate('sidebarPortal.module');
	const areaName = translate('sidebarPortal.area');

	const objetos = NAV_ITEMS.map((item) => ({
		id_objeto: pageIds.portalNoticias[item.key].objectId,
		descricao: translate(item.labelKey),
		ficheiro: item.path,
		ativo: true,
		item_menu: true
	}));

	const current = NAV_ITEMS.find((nav) => nav.key === activeKey) ?? NAV_ITEMS[0];

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

	sidebarRune.areas = [
		{
			id_area: pageIds.portalNoticias.areaId,
			designacao: areaName,
			ativo: true,
			objetos
		}
	];
}

