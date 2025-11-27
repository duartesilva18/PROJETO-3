let modules = {
    exemplos: 1,
    portalNoticias: 2,
}

export let pageIds = {
    exemplos: {
        base: { moduleId: modules.exemplos, objectId: 1 },
        exemplo_2: { moduleId: modules.exemplos, objectId: 5 },
        editoras: { moduleId: modules.exemplos, objectId: 2 },
        editoras_nova: { moduleId: modules.exemplos, objectId: 3 },
        editoras_id: { moduleId: modules.exemplos, objectId: 4 },
    },

    portalNoticias: {
        moduleId: modules.portalNoticias,
        areaId: 1,
        dashboard: { moduleId: modules.portalNoticias, objectId: 1 },
        criar: { moduleId: modules.portalNoticias, objectId: 2 },
        criarMedia: { moduleId: modules.portalNoticias, objectId: 3 },
        radios: { moduleId: modules.portalNoticias, objectId: 4 },
    },
}